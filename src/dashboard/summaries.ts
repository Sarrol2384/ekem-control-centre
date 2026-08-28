import { summarizeAttendance } from '../attendance/api'
import type { TodayAttendanceRow } from '../attendance/types'
import type { Employee } from '../staff/types'
import type { DashboardAttendanceSummary, StaffSummary } from './types'

export function getStaffSummary(employees: Employee[]): StaffSummary {
  return {
    activeCount: employees.filter((employee) => employee.employment_status === 'active').length,
  }
}

export function getAttendanceSummary(
  todayRows: TodayAttendanceRow[],
  activeStaffCount: number,
): DashboardAttendanceSummary {
  const mapped = todayRows.map((row) => ({
    status:
      row.scheduledStatus === 'approved_leave'
        ? ('on_leave' as const)
        : (row.record?.status ?? null),
  }))

  const summary = summarizeAttendance(mapped)
  const recordedToday =
    summary.present + summary.late + summary.absent + summary.on_leave

  const attentionEmployees: DashboardAttendanceSummary['attentionEmployees'] = []

  for (const row of todayRows) {
    if (row.scheduledStatus === 'approved_leave') {
      attentionEmployees.push({
        id: row.employee.id,
        name: row.employee.full_name,
        status: 'on_leave',
      })
      continue
    }
    if (row.record?.status === 'absent' || row.record?.status === 'late') {
      attentionEmployees.push({
        id: row.employee.id,
        name: row.employee.full_name,
        status: row.record.status,
      })
    }
  }

  return {
    activeStaff: activeStaffCount,
    recordedToday,
    ...summary,
    attentionEmployees: attentionEmployees.slice(0, 8),
  }
}
