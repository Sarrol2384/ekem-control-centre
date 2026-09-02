import { useMemo, useState, type FormEvent } from 'react'
import type { Employee } from '../../staff/types'
import { calculateLeaveDays } from '../dateUtils'
import type { LeaveFormValues, LeaveType } from '../types'
import { LEAVE_TYPE_LABELS } from '../types'
import type { LeaveFieldErrors } from '../validation'

type LeaveFormDialogProps = {
  open: boolean
  title: string
  employees: Employee[]
  initialValues: LeaveFormValues
  submitting: boolean
  error: string | null
  fieldErrors: LeaveFieldErrors
  lockEmployee?: boolean
  onClose: () => void
  onSubmit: (values: LeaveFormValues) => void
}

const inputClassName =
  'w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:opacity-60'

export function LeaveFormDialog({
  open,
  title,
  employees,
  initialValues,
  submitting,
  error,
  fieldErrors,
  lockEmployee = false,
  onClose,
  onSubmit,
}: LeaveFormDialogProps) {
  const [values, setValues] = useState<LeaveFormValues>(initialValues)

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.employment_status === 'active'),
    [employees],
  )

  const daysPreview =
    values.start_date && values.end_date && values.end_date >= values.start_date
      ? calculateLeaveDays(values.start_date, values.end_date)
      : 0

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
        aria-labelledby="leave-form-title"
        className="w-full max-w-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg"
      >
        <h2 id="leave-form-title" className="text-lg font-semibold text-[var(--color-text)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Days are calculated as inclusive calendar days for this phase.
        </p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Employee *</span>
            <select
              className={inputClassName}
              value={values.employee_id}
              disabled={submitting || lockEmployee}
              onChange={(e) => setValues((current) => ({ ...current, employee_id: e.target.value }))}
            >
              <option value="">Select employee</option>
              {activeEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} ({employee.employee_code})
                </option>
              ))}
            </select>
            {fieldErrors.employee_id && (
              <span className="mt-1 block text-xs text-red-700">{fieldErrors.employee_id}</span>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Leave type *</span>
            <select
              className={inputClassName}
              value={values.leave_type}
              disabled={submitting}
              onChange={(e) =>
                setValues((current) => ({
                  ...current,
                  leave_type: e.target.value as LeaveType,
                }))
              }
            >
              {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((type) => (
                <option key={type} value={type}>
                  {LEAVE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Start date *</span>
              <input
                type="date"
                className={inputClassName}
                value={values.start_date}
                disabled={submitting}
                onChange={(e) =>
                  setValues((current) => ({ ...current, start_date: e.target.value }))
                }
              />
              {fieldErrors.start_date && (
                <span className="mt-1 block text-xs text-red-700">{fieldErrors.start_date}</span>
              )}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">End date *</span>
              <input
                type="date"
                className={inputClassName}
                value={values.end_date}
                disabled={submitting}
                onChange={(e) =>
                  setValues((current) => ({ ...current, end_date: e.target.value }))
                }
              />
              {fieldErrors.end_date && (
                <span className="mt-1 block text-xs text-red-700">{fieldErrors.end_date}</span>
              )}
            </label>
          </div>

          <p className="text-sm text-[var(--color-muted)]">
            Number of days: <span className="font-medium text-[var(--color-text)]">{daysPreview}</span>
          </p>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Reason / notes</span>
            <textarea
              className={`${inputClassName} min-h-24`}
              value={values.notes}
              disabled={submitting}
              onChange={(e) => setValues((current) => ({ ...current, notes: e.target.value }))}
            />
          </label>

          {error && (
            <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          )}

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
              {submitting ? 'Saving…' : 'Save leave request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
