import { useMemo, useState, type FormEvent } from 'react'
import { isSupabaseConfigured } from '../../lib/supabase'
import type { Employee } from '../../staff/types'
import { EXPIRING_SOON_DAYS } from '../status'
import type { DocumentFormValues, DocumentType } from '../types'
import { DOCUMENT_TYPE_LABELS } from '../types'
import type { DocumentFieldErrors } from '../validation'

type DocumentFormDialogProps = {
  open: boolean
  title: string
  employees: Employee[]
  initialValues: DocumentFormValues
  submitting: boolean
  error: string | null
  fieldErrors: DocumentFieldErrors
  mode?: 'create' | 'edit'
  hasExistingFile?: boolean
  onClose: () => void
  onSubmit: (values: DocumentFormValues, file: File | null) => void
}

const inputClassName =
  'w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:opacity-60'

export function DocumentFormDialog({
  open,
  title,
  employees,
  initialValues,
  submitting,
  error,
  fieldErrors,
  mode = 'create',
  hasExistingFile = false,
  onClose,
  onSubmit,
}: DocumentFormDialogProps) {
  const [values, setValues] = useState<DocumentFormValues>(initialValues)
  const [file, setFile] = useState<File | null>(null)

  const selectableEmployees = useMemo(() => {
    const active = employees.filter((employee) => employee.employment_status === 'active')
    if (mode === 'create') return active
    const current = employees.find((employee) => employee.id === values.employee_id)
    if (
      current &&
      current.employment_status !== 'active' &&
      !active.some((employee) => employee.id === current.id)
    ) {
      return [current, ...active]
    }
    return active
  }, [employees, mode, values.employee_id])

  if (!open) return null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(values, file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-form-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg"
      >
        <h2 id="document-form-title" className="text-lg font-semibold text-[var(--color-text)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Expiry status is calculated from dates. Expiring soon uses a {EXPIRING_SOON_DAYS}-day
          threshold.
        </p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Employee *</span>
            <select
              className={inputClassName}
              value={values.employee_id}
              disabled={submitting}
              onChange={(e) =>
                setValues((current) => ({ ...current, employee_id: e.target.value }))
              }
            >
              <option value="">Select employee</option>
              {selectableEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} ({employee.employee_code})
                  {employee.employment_status !== 'active' ? ' — inactive' : ''}
                </option>
              ))}
            </select>
            {fieldErrors.employee_id && (
              <span className="mt-1 block text-xs text-red-700">{fieldErrors.employee_id}</span>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Document name *</span>
            <input
              className={inputClassName}
              value={values.title}
              disabled={submitting}
              onChange={(e) => setValues((current) => ({ ...current, title: e.target.value }))}
            />
            {fieldErrors.title && (
              <span className="mt-1 block text-xs text-red-700">{fieldErrors.title}</span>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Document type *</span>
            <select
              className={inputClassName}
              value={values.document_type}
              disabled={submitting}
              onChange={(e) =>
                setValues((current) => ({
                  ...current,
                  document_type: e.target.value as DocumentType,
                }))
              }
            >
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Document date</span>
              <input
                type="date"
                className={inputClassName}
                value={values.document_date}
                disabled={submitting}
                onChange={(e) =>
                  setValues((current) => ({ ...current, document_date: e.target.value }))
                }
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium">Expiry date</span>
              <input
                type="date"
                className={inputClassName}
                value={values.expiry_date}
                disabled={submitting}
                onChange={(e) =>
                  setValues((current) => ({ ...current, expiry_date: e.target.value }))
                }
              />
              {fieldErrors.expiry_date && (
                <span className="mt-1 block text-xs text-red-700">{fieldErrors.expiry_date}</span>
              )}
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Reference code</span>
            <input
              className={inputClassName}
              value={values.reference_code}
              disabled={submitting}
              onChange={(e) =>
                setValues((current) => ({ ...current, reference_code: e.target.value }))
              }
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Notes</span>
            <textarea
              className={`${inputClassName} min-h-24`}
              value={values.notes}
              disabled={submitting}
              onChange={(e) => setValues((current) => ({ ...current, notes: e.target.value }))}
            />
          </label>

          {isSupabaseConfigured ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">
                {mode === 'edit' && hasExistingFile ? 'Replace file (optional)' : 'Upload file'}
              </span>
              <input
                type="file"
                className={inputClassName}
                disabled={submitting}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <span className="mt-1 block text-xs text-[var(--color-muted)]">
                Files are stored in a private Supabase bucket. Access uses short-lived signed URLs.
              </span>
            </label>
          ) : (
            <p className="rounded border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-2 text-xs text-[var(--color-warning-text)]">
              Local demonstration mode: document metadata only. File upload and viewing require
              Supabase configuration.
            </p>
          )}

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-bg)] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-3 py-2 text-sm disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
