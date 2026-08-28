import type { TrainingFormValues } from './types'

export type TrainingFieldErrors = Partial<Record<keyof TrainingFormValues, string>>

export function validateTrainingForm(values: TrainingFormValues): TrainingFieldErrors {
  const errors: TrainingFieldErrors = {}

  if (!values.employee_id.trim()) {
    errors.employee_id = 'Select an employee for this training record.'
  }

  if (!values.training_name.trim()) {
    errors.training_name = 'Training name is required.'
  } else if (values.training_name.trim().length > 200) {
    errors.training_name = 'Training name must be 200 characters or fewer.'
  }

  if (
    values.training_date &&
    values.expiry_date &&
    values.expiry_date < values.training_date
  ) {
    errors.expiry_date = 'Expiry date cannot be before the training date.'
  }

  return errors
}

export function hasTrainingFieldErrors(errors: TrainingFieldErrors): boolean {
  return Object.keys(errors).length > 0
}
