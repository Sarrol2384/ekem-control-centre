import { parseDateOnly, toDateOnly } from '../attendance/dateUtils'

/** Inclusive calendar-day count between two YYYY-MM-DD dates. */
export function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = parseDateOnly(startDate)
  const end = parseDateOnly(endDate)
  const ms = end.getTime() - start.getTime()
  if (Number.isNaN(ms)) return 0
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}

export function isCurrentLeave(leave: { status: string; start_date: string; end_date: string }, today: string): boolean {
  return leave.status === 'approved' && isDateInRange(today, leave.start_date, leave.end_date)
}

export function isUpcomingLeave(leave: { status: string; start_date: string }, today: string): boolean {
  return leave.status === 'approved' && leave.start_date > today
}

export function todayDateOnly(): string {
  return toDateOnly(new Date())
}
