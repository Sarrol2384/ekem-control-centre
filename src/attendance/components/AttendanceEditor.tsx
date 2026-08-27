import { useState, type FormEvent } from 'react'
import type { AttendanceFormValues, AttendanceStatus } from '../types'
import { ATTENDANCE_STATUS_LABELS } from '../types'

type AttendanceEditorProps = {
  open: boolean
  title: string
  initialValues: AttendanceFormValues
  submitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (values: AttendanceFormValues) => void
}

const inputClassName =
  'w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:opacity-60'

export function AttendanceEditor({
  open,
  title,
  initialValues,
  submitting,
  error,
  onClose,
  onSubmit,
}: AttendanceEditorProps) {
  const [values, setValues] = useState<AttendanceFormValues>(initialValues)

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
        aria-labelledby="attendance-editor-title"
        className="w-full max-w-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg"
      >
        <h2
          id="attendance-editor-title"
          className="text-lg font-semibold text-[var(--color-text)]"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Manager-controlled attendance. This is not connected to a biometric or time-clock system.
        </p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Status</span>
            <select
              className={inputClassName}
              value={values.status}
              disabled={submitting}
              onChange={(e) =>
                setValues((current) => ({
                  ...current,
                  status: e.target.value as AttendanceStatus,
                }))
              }
            >
              {(Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[]).map((status) => (
                <option key={status} value={status}>
                  {ATTENDANCE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Arrival time</span>
              <input
                type="time"
                className={inputClassName}
                value={values.arrival_time}
                disabled={submitting || values.status === 'absent' || values.status === 'on_leave'}
                onChange={(e) =>
                  setValues((current) => ({ ...current, arrival_time: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Departure time</span>
              <input
                type="time"
                className={inputClassName}
                value={values.departure_time}
                disabled={submitting || values.status === 'absent' || values.status === 'on_leave'}
                onChange={(e) =>
                  setValues((current) => ({ ...current, departure_time: e.target.value }))
                }
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Notes</span>
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
              className="bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
