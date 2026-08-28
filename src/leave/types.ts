import type { Database } from '../lib/database.types'
import type { Employee } from '../staff/types'

export type LeaveType = 'annual' | 'sick' | 'family_responsibility' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type LeaveRequest = Database['public']['Tables']['leave_requests']['Row']
export type LeaveInsert = Database['public']['Tables']['leave_requests']['Insert']
export type LeaveUpdate = Database['public']['Tables']['leave_requests']['Update']

export type LeaveRequestWithEmployee = LeaveRequest & {
  employee: Employee | null
}

export type LeaveFormValues = {
  employee_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  notes: string
}

export type LeaveStatusFilter = 'all' | LeaveStatus | 'upcoming' | 'current' | 'history'

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual',
  sick: 'Sick',
  family_responsibility: 'Family Responsibility',
  other: 'Other',
}

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export function emptyLeaveForm(employeeId = ''): LeaveFormValues {
  return {
    employee_id: employeeId,
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    notes: '',
  }
}

export function leaveToFormValues(leave: LeaveRequest): LeaveFormValues {
  return {
    employee_id: leave.employee_id,
    leave_type: leave.leave_type,
    start_date: leave.start_date,
    end_date: leave.end_date,
    notes: leave.notes ?? '',
  }
}
