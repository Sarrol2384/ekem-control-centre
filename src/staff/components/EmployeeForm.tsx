import type { FormEvent, ReactNode } from 'react'
import type { EmployeeFormValues, EmploymentStatus } from '../types'
import type { FieldErrors } from '../validation'

type EmployeeFormProps = {
  values: EmployeeFormValues
  errors: FieldErrors
  submitting: boolean
  submitLabel: string
  onChange: (values: EmployeeFormValues) => void
  onSubmit: () => void
  onCancel: () => void
}

function Field({
  label,
  error,
  children,
  required,
}: {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[var(--color-text)]">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-700" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}

const inputClassName =
  'w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:opacity-60'

export function EmployeeForm({
  values,
  errors,
  submitting,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  function update<K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) {
    onChange({ ...values, [key]: value })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <section className="space-y-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-base font-semibold">Employment information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee ID" required error={errors.employee_code}>
            <input
              className={inputClassName}
              value={values.employee_code}
              disabled={submitting}
              onChange={(e) => update('employee_code', e.target.value)}
            />
          </Field>
          <Field label="Employment status" required>
            <select
              className={inputClassName}
              value={values.employment_status}
              disabled={submitting}
              onChange={(e) =>
                update('employment_status', e.target.value as EmploymentStatus)
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Position" required error={errors.position}>
            <input
              className={inputClassName}
              value={values.position}
              disabled={submitting}
              onChange={(e) => update('position', e.target.value)}
            />
          </Field>
          <Field label="Department" required error={errors.department}>
            <input
              className={inputClassName}
              value={values.department}
              disabled={submitting}
              onChange={(e) => update('department', e.target.value)}
            />
          </Field>
          <Field label="Start date" error={errors.start_date}>
            <input
              type="date"
              className={inputClassName}
              value={values.start_date}
              disabled={submitting}
              onChange={(e) => update('start_date', e.target.value)}
            />
          </Field>
          <Field
            label="Annual leave entitlement (days/year, optional)"
            error={errors.annual_leave_entitlement}
          >
            <input
              type="number"
              min={0}
              max={365}
              step={0.5}
              className={inputClassName}
              value={values.annual_leave_entitlement}
              disabled={submitting}
              onChange={(e) => update('annual_leave_entitlement', e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-base font-semibold">Personal information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.full_name}>
            <input
              className={inputClassName}
              value={values.full_name}
              disabled={submitting}
              onChange={(e) => update('full_name', e.target.value)}
            />
          </Field>
          <Field label="Contact number" error={errors.contact_number}>
            <input
              className={inputClassName}
              value={values.contact_number}
              disabled={submitting}
              onChange={(e) => update('contact_number', e.target.value)}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              className={inputClassName}
              value={values.email}
              disabled={submitting}
              onChange={(e) => update('email', e.target.value)}
            />
          </Field>
          <Field label="Address" error={errors.address}>
            <input
              className={inputClassName}
              value={values.address}
              disabled={submitting}
              onChange={(e) => update('address', e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-base font-semibold">Emergency contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.emergency_contact_name}>
            <input
              className={inputClassName}
              value={values.emergency_contact_name}
              disabled={submitting}
              onChange={(e) => update('emergency_contact_name', e.target.value)}
            />
          </Field>
          <Field label="Relationship" error={errors.emergency_contact_relationship}>
            <input
              className={inputClassName}
              value={values.emergency_contact_relationship}
              disabled={submitting}
              onChange={(e) => update('emergency_contact_relationship', e.target.value)}
            />
          </Field>
          <Field label="Contact number" error={errors.emergency_contact_number}>
            <input
              className={inputClassName}
              value={values.emergency_contact_number}
              disabled={submitting}
              onChange={(e) => update('emergency_contact_number', e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-base font-semibold">Notes</h2>
        <textarea
          className={`${inputClassName} min-h-24`}
          value={values.notes}
          disabled={submitting}
          onChange={(e) => update('notes', e.target.value)}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary disabled:opacity-60"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={onCancel}
          className="border border-[var(--color-border)] px-4 py-2.5 text-sm hover:bg-[var(--color-bg)] disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
