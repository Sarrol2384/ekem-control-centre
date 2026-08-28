import { useMemo, useState, type FormEvent } from 'react'
import type { Employee } from '../../staff/types'
import type { TrainingFormValues } from '../types'
import type { TrainingFieldErrors } from '../validation'

type TrainingFormDialogProps = {
  open: boolean
  title: string
  employees: Employee[]
  initialValues: TrainingFormValues
  submitting: boolean
  error: string | null
  fieldErrors: TrainingFieldErrors
  mode?: 'create' | 'edit'
  onClose: () => void
  onSubmit: (values: TrainingFormValues) => void
}

const inputClassName =
  'w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:opacity-60'

export function TrainingFormDialog({
  open,
  title,
  employees,
  initialValues,
  submitting,
  error,
  fieldErrors,
  mode = 'create',
  onClose,
  onSubmit,
}: TrainingFormDialogProps) {
  const [values, setValues] = useState<TrainingFormValues>(initialValues)

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
    onSubmit(values)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="training-form-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg"
      >
        <h2 id="training-form-title" className="text-lg font-semibold text-[var(--color-text)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Status is calculated from training and expiry dates. Expiring soon uses a 30-day
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
            <span className="mb-1 block font-medium">Training name *</span>
            <input
              className={inputClassName}
              value={values.training_name}
              disabled={submitting}
              onChange={(e) =>
                setValues((current) => ({ ...current, training_name: e.target.value }))
              }
            />
            {fieldErrors.training_name && (
              <span className="mt-1 block text-xs text-red-700">{fieldErrors.training_name}</span>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Provider</span>
            <input
              className={inputClassName}
              value={values.provider}
              disabled={submitting}
              onChange={(e) => setValues((current) => ({ ...current, provider: e.target.value }))}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Training date</span>
              <input
                type="date"
                className={inputClassName}
                value={values.training_date}
                disabled={submitting}
                onChange={(e) =>
                  setValues((current) => ({ ...current, training_date: e.target.value }))
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
            <span className="mb-1 block font-medium">Certificate / reference</span>
            <input
              className={inputClassName}
              value={values.certificate_reference}
              disabled={submitting}
              onChange={(e) =>
                setValues((current) => ({ ...current, certificate_reference: e.target.value }))
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
              className="bg-[var(--color-primary)] px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
