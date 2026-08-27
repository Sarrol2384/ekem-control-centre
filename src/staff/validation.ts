import type { EmployeeFormValues } from './types'

export type FieldErrors = Partial<Record<keyof EmployeeFormValues, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function required(value: string, label: string): string | undefined {
  if (!value.trim()) return `${label} is required.`
  return undefined
}

export function validateEmployeeForm(values: EmployeeFormValues): FieldErrors {
  const errors: FieldErrors = {}

  const codeError = required(values.employee_code, 'Employee ID')
  if (codeError) errors.employee_code = codeError
  else if (values.employee_code.trim().length < 3) {
    errors.employee_code = 'Employee ID must be at least 3 characters.'
  }

  const nameError = required(values.full_name, 'Full name')
  if (nameError) errors.full_name = nameError

  const positionError = required(values.position, 'Position')
  if (positionError) errors.position = positionError

  const departmentError = required(values.department, 'Department')
  if (departmentError) errors.department = departmentError

  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (values.start_date && Number.isNaN(Date.parse(values.start_date))) {
    errors.start_date = 'Enter a valid start date.'
  }

  if (
    values.emergency_contact_name.trim() &&
    !values.emergency_contact_number.trim()
  ) {
    errors.emergency_contact_number = 'Provide a contact number for the emergency contact.'
  }

  if (
    values.emergency_contact_number.trim() &&
    !values.emergency_contact_name.trim()
  ) {
    errors.emergency_contact_name = 'Provide a name for the emergency contact.'
  }

  return errors
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}
