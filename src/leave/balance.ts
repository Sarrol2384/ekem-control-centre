import type { Employee } from '../staff/types'
import type { LeaveRequest, LeaveType } from './types'

export type LeaveTypeUsage = {
  approved: number
  pending: number
}

export type EmployeeLeaveSummary = {
  employeeId: string
  year: number
  /** Null when the manager has not configured an annual entitlement. */
  annualEntitlement: number | null
  annualUsed: number
  annualPending: number
  /** Null when annual entitlement has not been configured. */
  annualRemaining: number | null
  byType: Record<LeaveType, LeaveTypeUsage>
  yearRequests: LeaveRequest[]
}

function emptyByType(): Record<LeaveType, LeaveTypeUsage> {
  return {
    annual: { approved: 0, pending: 0 },
    sick: { approved: 0, pending: 0 },
    family_responsibility: { approved: 0, pending: 0 },
    other: { approved: 0, pending: 0 },
  }
}

export function currentLeaveYear(referenceDate: Date = new Date()): number {
  return referenceDate.getFullYear()
}

/** Attribute leave to a calendar year by start date. */
export function leaveBelongsToYear(request: LeaveRequest, year: number): boolean {
  const startYear = Number.parseInt(request.start_date.slice(0, 4), 10)
  return startYear === year
}

export function getAnnualEntitlement(employee: Employee): number | null {
  const value = employee.annual_leave_entitlement
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null
  }
  return Number(value)
}

export function computeEmployeeLeaveSummary(
  employee: Employee,
  requests: LeaveRequest[],
  year: number = currentLeaveYear(),
): EmployeeLeaveSummary {
  const employeeRequests = requests.filter((row) => row.employee_id === employee.id)
  const yearRequests = employeeRequests.filter((row) => leaveBelongsToYear(row, year))
  const byType = emptyByType()

  for (const row of yearRequests) {
    if (row.status === 'rejected' || row.status === 'cancelled') continue
    const bucket = byType[row.leave_type]
    const days = Number(row.days_count)
    if (row.status === 'approved') {
      bucket.approved += days
    } else if (row.status === 'pending') {
      bucket.pending += days
    }
  }

  const annualEntitlement = getAnnualEntitlement(employee)
  const annualUsed = byType.annual.approved
  const annualPending = byType.annual.pending
  const annualRemaining =
    annualEntitlement === null ? null : Math.max(0, annualEntitlement - annualUsed)

  return {
    employeeId: employee.id,
    year,
    annualEntitlement,
    annualUsed,
    annualPending,
    annualRemaining,
    byType,
    yearRequests,
  }
}

export function listEmployeeLeaveHistory(
  employeeId: string,
  requests: LeaveRequest[],
): LeaveRequest[] {
  return requests
    .filter((row) => row.employee_id === employeeId)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
}
