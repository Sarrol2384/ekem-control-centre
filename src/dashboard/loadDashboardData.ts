import { getTodayAttendance } from '../attendance/api'
import { todayDateOnly } from '../attendance/dateUtils'
import { listEmployeeDocuments, summarizeDocuments } from '../documents/api'
import { listLeaveRequests, summarizeLeave } from '../leave/api'
import { listEmployees } from '../staff/api'
import { listTasks } from '../tasks/api'
import { listTrainingRecords, summarizeTraining } from '../training/api'
import { getAttentionItems } from './attention'
import { getPharmacyDemoMetrics } from './pharmacyDemo'
import { getAttendanceSummary, getStaffSummary } from './summaries'
import { getTaskSummary } from './taskSummary'
import type {
  DashboardLoadResult,
  DashboardManagementData,
  DashboardSectionError,
  DashboardSectionKey,
  RawDashboardDatasets,
} from './types'

function sectionError(
  section: DashboardSectionKey,
  reason: unknown,
): DashboardSectionError {
  return {
    section,
    message: reason instanceof Error ? reason.message : 'Unable to load this section.',
  }
}

function buildManagementData(raw: RawDashboardDatasets): Partial<DashboardManagementData> {
  const management: Partial<DashboardManagementData> = {}
  const today = todayDateOnly()

  if (raw.employees) {
    management.staff = getStaffSummary(raw.employees)
  }

  if (raw.employees && raw.todayAttendance) {
    management.attendance = getAttendanceSummary(
      raw.todayAttendance,
      management.staff?.activeCount ??
        raw.employees.filter((employee) => employee.employment_status === 'active').length,
    )
  }

  if (raw.leave) {
    management.leave = summarizeLeave(raw.leave)
  }

  if (raw.tasks) {
    management.tasks = getTaskSummary(raw.tasks, today)
  }

  if (raw.training) {
    management.training = summarizeTraining(raw.training, today)
  }

  if (raw.documents) {
    management.documents = summarizeDocuments(raw.documents, today)
  }

  if (
    management.attendance &&
    management.leave &&
    management.tasks &&
    management.training &&
    management.documents
  ) {
    management.attention = getAttentionItems({
      overdueTasks: management.tasks.overdue,
      absentEmployees: management.attendance.absent,
      expiredTraining: management.training.expired,
      expiredDocuments: management.documents.expired,
      pendingLeave: management.leave.pending,
      trainingExpiringSoon: management.training.expiring_soon,
      documentsExpiringSoon: management.documents.expiring_soon,
      lateEmployees: management.attendance.late,
    })
  }

  return management
}

export async function loadDashboardData(): Promise<DashboardLoadResult> {
  const today = todayDateOnly()
  const loadedAt = new Date()
  const errors: DashboardSectionError[] = []
  const raw: RawDashboardDatasets = {
    employees: null,
    todayAttendance: null,
    leave: null,
    tasks: null,
    training: null,
    documents: null,
  }

  const settled = await Promise.allSettled([
    listEmployees(),
    getTodayAttendance(today),
    listLeaveRequests(),
    listTasks(),
    listTrainingRecords(),
    listEmployeeDocuments(),
    getPharmacyDemoMetrics(),
  ])

  const sectionKeys: DashboardSectionKey[] = [
    'staff',
    'attendance',
    'leave',
    'tasks',
    'training',
    'documents',
  ]

  for (let index = 0; index < sectionKeys.length; index += 1) {
    const result = settled[index]
    if (result.status === 'rejected') {
      errors.push(sectionError(sectionKeys[index]!, result.reason))
      continue
    }

    switch (sectionKeys[index]) {
      case 'staff':
        raw.employees = result.value as RawDashboardDatasets['employees']
        break
      case 'attendance':
        raw.todayAttendance = result.value as RawDashboardDatasets['todayAttendance']
        break
      case 'leave':
        raw.leave = result.value as RawDashboardDatasets['leave']
        break
      case 'tasks':
        raw.tasks = result.value as RawDashboardDatasets['tasks']
        break
      case 'training':
        raw.training = result.value as RawDashboardDatasets['training']
        break
      case 'documents':
        raw.documents = result.value as RawDashboardDatasets['documents']
        break
      default:
        break
    }
  }

  const pharmacyResult = settled[6]
  const pharmacy =
    pharmacyResult.status === 'fulfilled'
      ? pharmacyResult.value
      : await getPharmacyDemoMetrics()

  return {
    management: buildManagementData(raw),
    pharmacy,
    errors,
    loadedAt,
  }
}
