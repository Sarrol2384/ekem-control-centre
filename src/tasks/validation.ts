import type { TaskFormValues } from './types'

export type TaskFieldErrors = Partial<Record<keyof TaskFormValues, string>>

export function validateTaskForm(values: TaskFormValues): TaskFieldErrors {
  const errors: TaskFieldErrors = {}

  if (!values.title.trim()) {
    errors.title = 'Task title is required.'
  } else if (values.title.trim().length > 200) {
    errors.title = 'Title must be 200 characters or fewer.'
  }

  if (!values.assigned_employee_id.trim()) {
    errors.assigned_employee_id = 'Select an employee to assign this task.'
  }

  return errors
}

export function hasTaskFieldErrors(errors: TaskFieldErrors): boolean {
  return Object.keys(errors).length > 0
}
