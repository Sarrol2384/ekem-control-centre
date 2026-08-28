import { calculateLeaveDays } from './dateUtils'
import type { LeaveFormValues } from './types'

export type LeaveFieldErrors = Partial<Record<keyof LeaveFormValues | 'days_count', string>>

export function validateLeaveForm(values: LeaveFormValues): LeaveFieldErrors {
  const errors: LeaveFieldErrors = {}

  if (!values.employee_id.trim()) {
    errors.employee_id = 'Select an employee.'
  }
  if (!values.start_date) {
    errors.start_date = 'Start date is required.'
  }
  if (!values.end_date) {
    errors.end_date = 'End date is required.'
  }
  if (values.start_date && values.end_date && values.end_date < values.start_date) {
    errors.end_date = 'End date must be on or after the start date.'
  }
  if (values.start_date && values.end_date && values.end_date >= values.start_date) {
    const days = calculateLeaveDays(values.start_date, values.end_date)
    if (days <= 0) {
      errors.days_count = 'Leave must cover at least one day.'
    }
  }

  return errors
}

export function hasLeaveFieldErrors(errors: LeaveFieldErrors): boolean {
  return Object.keys(errors).length > 0
}
