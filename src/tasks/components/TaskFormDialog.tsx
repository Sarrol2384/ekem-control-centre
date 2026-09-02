import { useMemo, useState, type FormEvent } from 'react'
import type { Employee } from '../../staff/types'
import type { TaskFormValues, TaskPriority, TaskStatus } from '../types'
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../types'
import type { TaskFieldErrors } from '../validation'

type TaskFormDialogProps = {
  open: boolean
  title: string
  employees: Employee[]
  initialValues: TaskFormValues
  submitting: boolean
  error: string | null
  fieldErrors: TaskFieldErrors
  allowStatusEdit?: boolean
  mode?: 'create' | 'edit'
  onClose: () => void
  onSubmit: (values: TaskFormValues) => void
}

const inputClassName =
  'w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:opacity-60'

export function TaskFormDialog({
  open,
  title,
  employees,
  initialValues,
  submitting,
  error,
  fieldErrors,
  allowStatusEdit = false,
  mode = 'create',
  onClose,
  onSubmit,
}: TaskFormDialogProps) {
  const [values, setValues] = useState<TaskFormValues>(initialValues)

  const selectableEmployees = useMemo(() => {
    const active = employees.filter((employee) => employee.employment_status === 'active')
    if (mode === 'create') return active
    const current = employees.find((employee) => employee.id === values.assigned_employee_id)
    if (
      current &&
      current.employment_status !== 'active' &&
      !active.some((employee) => employee.id === current.id)
    ) {
      return [current, ...active]
    }
    return active
  }, [employees, mode, values.assigned_employee_id])

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
        aria-labelledby="task-form-title"
        className="w-full max-w-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg"
      >
        <h2 id="task-form-title" className="text-lg font-semibold text-[var(--color-text)]">
          {title}
        </h2>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Task title *</span>
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
            <span className="mb-1 block font-medium">Description</span>
            <textarea
              className={`${inputClassName} min-h-24`}
              value={values.description}
              disabled={submitting}
              onChange={(e) =>
                setValues((current) => ({ ...current, description: e.target.value }))
              }
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Assigned employee *</span>
            <select
              className={inputClassName}
              value={values.assigned_employee_id}
              disabled={submitting}
              onChange={(e) =>
                setValues((current) => ({ ...current, assigned_employee_id: e.target.value }))
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
            {fieldErrors.assigned_employee_id && (
              <span className="mt-1 block text-xs text-red-700">
                {fieldErrors.assigned_employee_id}
              </span>
            )}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Due date</span>
              <input
                type="date"
                className={inputClassName}
                value={values.due_date}
                disabled={submitting}
                onChange={(e) =>
                  setValues((current) => ({ ...current, due_date: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Priority</span>
              <select
                className={inputClassName}
                value={values.priority}
                disabled={submitting}
                onChange={(e) =>
                  setValues((current) => ({
                    ...current,
                    priority: e.target.value as TaskPriority,
                  }))
                }
              >
                {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {TASK_PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {allowStatusEdit && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Status</span>
              <select
                className={inputClassName}
                value={values.status}
                disabled={submitting}
                onChange={(e) =>
                  setValues((current) => ({
                    ...current,
                    status: e.target.value as TaskStatus,
                  }))
                }
              >
                {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          )}

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
              {submitting ? 'Saving…' : 'Save task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
