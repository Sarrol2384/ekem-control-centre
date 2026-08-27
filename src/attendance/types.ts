import type { Database } from '../lib/database.types'
import type { Employee } from '../staff/types'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'on_leave'

export type AttendanceRecord = Database['public']['Tables']['attendance']['Row']
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert']
export type AttendanceUpdate = Database['public']['Tables']['attendance']['Update']

export type ScheduledStatus = 'scheduled' | 'approved_leave'

export type TodayAttendanceRow = {
  employee: Employee
  scheduledStatus: ScheduledStatus
  record: AttendanceRecord | null
}

export type AttendanceSummary = {
  present: number
  late: number
  absent: number
  on_leave: number
  not_recorded: number
}

export type HistoryRangePreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

export type AttendanceFormValues = {
  status: AttendanceStatus
  arrival_time: string
  departure_time: string
  notes: string
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  on_leave: 'On Leave',
}

export function emptyAttendanceForm(
  defaults?: Partial<AttendanceFormValues>,
): AttendanceFormValues {
  return {
    status: defaults?.status ?? 'present',
    arrival_time: defaults?.arrival_time ?? '',
    departure_time: defaults?.departure_time ?? '',
    notes: defaults?.notes ?? '',
  }
}

export function recordToFormValues(record: AttendanceRecord): AttendanceFormValues {
  return {
    status: record.status,
    arrival_time: record.arrival_time?.slice(0, 5) ?? '',
    departure_time: record.departure_time?.slice(0, 5) ?? '',
    notes: record.notes ?? '',
  }
}
