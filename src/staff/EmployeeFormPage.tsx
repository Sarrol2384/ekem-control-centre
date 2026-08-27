import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { createEmployee, getEmployee, updateEmployee } from './api'
import { EmployeeForm } from './components/EmployeeForm'
import {
  emptyEmployeeFormValues,
  employeeToFormValues,
  type EmployeeFormValues,
} from './types'
import { hasFieldErrors, validateEmployeeForm, type FieldErrors } from './validation'

type Mode = 'create' | 'edit'

export function EmployeeFormPage({ mode }: { mode: Mode }) {
  const { employeeId } = useParams<{ employeeId: string }>()
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const [values, setValues] = useState<EmployeeFormValues>(emptyEmployeeFormValues())
  const [initialValues, setInitialValues] = useState<EmployeeFormValues>(emptyEmployeeFormValues())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(mode === 'edit')
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues)

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || submitting) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty, submitting])

  useEffect(() => {
    if (mode !== 'edit' || !employeeId) return
    let mounted = true

    void getEmployee(employeeId)
      .then((employee) => {
        if (!mounted) return
        if (!employee) {
          setLoadError('Employee not found.')
          return
        }
        const formValues = employeeToFormValues(employee)
        setValues(formValues)
        setInitialValues(formValues)
        setLoadError(null)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setLoadError(err instanceof Error ? err.message : 'Unable to load employee.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [mode, employeeId])

  async function handleSubmit() {
    const nextErrors = validateEmployeeForm(values)
    setErrors(nextErrors)
    if (hasFieldErrors(nextErrors)) {
      setSubmitError('Please correct the highlighted fields.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    setSuccessMessage(null)

    try {
      const actorId = user?.id ?? profile?.id ?? null
      if (mode === 'create') {
        const created = await createEmployee(values, actorId)
        setSuccessMessage('Employee created successfully.')
        navigate(`/staff/${created.id}`, { replace: true })
        return
      }

      if (!employeeId) {
        throw new Error('Missing employee id.')
      }

      const updated = await updateEmployee(employeeId, values, actorId)
      setInitialValues(employeeToFormValues(updated))
      setValues(employeeToFormValues(updated))
      setSuccessMessage('Employee updated successfully.')
      navigate(`/staff/${updated.id}`, { replace: true })
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to save employee.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    if (isDirty && !window.confirm('Discard unsaved changes?')) {
      return
    }
    if (mode === 'edit' && employeeId) {
      navigate(`/staff/${employeeId}`)
      return
    }
    navigate('/staff')
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading form…</p>
  }

  if (loadError) {
    return (
      <div className="space-y-3">
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {loadError}
        </p>
        <Link to="/staff" className="text-sm text-[var(--color-primary)] underline">
          Back to staff list
        </Link>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm text-[var(--color-muted)]">
          <Link to="/staff" className="underline">
            Staff
          </Link>{' '}
          / {mode === 'create' ? 'Add employee' : 'Edit employee'}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
          {mode === 'create' ? 'Add employee' : 'Edit employee'}
        </h1>
      </div>

      {successMessage && (
        <p className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {successMessage}
        </p>
      )}

      {submitError && (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {submitError}
        </p>
      )}

      <EmployeeForm
        values={values}
        errors={errors}
        submitting={submitting}
        submitLabel={mode === 'create' ? 'Create employee' : 'Save changes'}
        onChange={(next) => {
          setValues(next)
          setSuccessMessage(null)
        }}
        onSubmit={() => void handleSubmit()}
        onCancel={handleCancel}
      />
    </section>
  )
}
