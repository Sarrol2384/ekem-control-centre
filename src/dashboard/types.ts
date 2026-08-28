import type { EmployeeDocumentWithEmployee } from '../documents/types'
import type { LeaveRequestWithEmployee } from '../leave/types'
import type { Employee } from '../staff/types'
import type { TrainingRecordWithEmployee } from '../training/types'
import type { TaskWithEmployee } from '../tasks/types'
import type { TodayAttendanceRow } from '../attendance/types'
import type { DocumentSummary } from '../documents/api'
import type { TrainingSummary } from '../training/api'
import type { AttendanceStatus } from '../attendance/types'

export type DashboardSectionKey =
  | 'staff'
  | 'attendance'
  | 'leave'
  | 'tasks'
  | 'training'
  | 'documents'

export type DashboardSectionError = {
  section: DashboardSectionKey
  message: string
}

export type StaffSummary = {
  activeCount: number
}

export type DashboardAttendanceSummary = {
  activeStaff: number
  recordedToday: number
  present: number
  late: number
  absent: number
  on_leave: number
  not_recorded: number
  attentionEmployees: Array<{
    id: string
    name: string
    status: AttendanceStatus
  }>
}

export type TaskDashboardSummary = {
  active: number
  todo: number
  in_progress: number
  overdue: number
  completed: number
  priorityTasks: TaskWithEmployee[]
}

export type AttentionSeverity = 'urgent' | 'attention'

export type AttentionItem = {
  severity: AttentionSeverity
  label: string
  count: number
  href: string
  actionLabel: string
}

export type PharmacyDemoMetrics = {
  salesDisplay: string
  prescriptions: number
  lowStock: number
  suppliersRequiringAttention: number
  source: 'database' | 'static'
}

export type DashboardManagementData = {
  staff: StaffSummary
  attendance: DashboardAttendanceSummary
  leave: {
    pending: number
    approved: number
    rejected: number
    current: number
    upcoming: number
    history: number
  }
  tasks: TaskDashboardSummary
  training: TrainingSummary
  documents: DocumentSummary
  attention: AttentionItem[]
}

export type DashboardLoadResult = {
  management: Partial<DashboardManagementData>
  pharmacy: PharmacyDemoMetrics
  errors: DashboardSectionError[]
  loadedAt: Date
}

export type RawDashboardDatasets = {
  employees: Employee[] | null
  todayAttendance: TodayAttendanceRow[] | null
  leave: LeaveRequestWithEmployee[] | null
  tasks: TaskWithEmployee[] | null
  training: TrainingRecordWithEmployee[] | null
  documents: EmployeeDocumentWithEmployee[] | null
}
