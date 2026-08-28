import type { DocumentFormValues } from './types'

export type DocumentFieldErrors = Partial<Record<keyof DocumentFormValues, string>>

export function validateDocumentForm(values: DocumentFormValues): DocumentFieldErrors {
  const errors: DocumentFieldErrors = {}

  if (!values.employee_id.trim()) {
    errors.employee_id = 'Select an employee for this document.'
  }

  if (!values.title.trim()) {
    errors.title = 'Document name is required.'
  } else if (values.title.trim().length > 200) {
    errors.title = 'Document name must be 200 characters or fewer.'
  }

  if (
    values.document_date &&
    values.expiry_date &&
    values.expiry_date < values.document_date
  ) {
    errors.expiry_date = 'Expiry date cannot be before the document date.'
  }

  return errors
}

export function hasDocumentFieldErrors(errors: DocumentFieldErrors): boolean {
  return Object.keys(errors).length > 0
}
