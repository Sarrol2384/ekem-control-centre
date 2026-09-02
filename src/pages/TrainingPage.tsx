import { useEffect, useMemo, useState } from 'react'
import { formatDateLabel, todayDateOnly } from '../attendance/dateUtils'
import { useAuth } from '../auth/useAuth'
import { DemoDataBadge } from '../components/DemoDataBadge'
import { getStaffDataSource, listEmployees } from '../staff/api'
import type { Employee } from '../staff/types'
import {
  createTrainingRecord,
  listTrainingRecords,
  summarizeTraining,
  updateTrainingRecord,
} from '../training/api'
import { TrainingFormDialog } from '../training/components/TrainingFormDialog'
import { TrainingStatusBadge } from '../training/components/TrainingStatusBadge'
import { EXPIRING_SOON_DAYS } from '../training/status'
import type {
  TrainingExpiryFilter,
  TrainingFormValues,
  TrainingManagementStatus,
  TrainingRecordWithEmployee,
  TrainingSortField,
  TrainingStatusFilter,
} from '../training/types'
import {
  emptyTrainingForm,
  trainingToFormValues,
} from '../training/types'
import {
  hasTrainingFieldErrors,
  validateTrainingForm,
  type TrainingFieldErrors,
} from '../training/validation'

export function TrainingPage() {
  const { profile, user } = useAuth()
  const [rows, setRows] = useState<TrainingRecordWithEmployee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TrainingStatusFilter>('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [expiryFilter, setExpiryFilter] = useState<TrainingExpiryFilter>('all')
  const [sortField, setSortField] = useState<TrainingSortField>('expiry_date')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TrainingRecordWithEmployee | null>(null)
  const [formValues, setFormValues] = useState<TrainingFormValues>(emptyTrainingForm())
  const [fieldErrors, setFieldErrors] = useState<TrainingFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [detail, setDetail] = useState<TrainingRecordWithEmployee | null>(null)
  const dataSource = getStaffDataSource()
  const today = todayDateOnly()
  const actorId = user?.id ?? profile?.id ?? null

  async function refresh() {
    const [trainingRows, employeeRows] = await Promise.all([
      listTrainingRecords(),
      listEmployees(),
    ])
    setRows(trainingRows)
    setEmployees(employeeRows)
  }

  useEffect(() => {
    let mounted = true
    void Promise.all([listTrainingRecords(), listEmployees()])
      .then(([trainingRows, employeeRows]) => {
        if (!mounted) return
        setRows(trainingRows)
        setEmployees(employeeRows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unable to load training records.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const summary = useMemo(() => summarizeTraining(rows, today), [rows, today])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    let result = rows.filter((row) => {
      if (query) {
        const haystack = [
          row.training_name,
          row.provider ?? '',
          row.certificate_reference ?? '',
          row.notes ?? '',
          row.employee?.full_name ?? '',
          row.employee?.employee_code ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }
      if (employeeFilter !== 'all' && row.employee_id !== employeeFilter) return false
      if (statusFilter !== 'all' && row.managementStatus !== statusFilter) return false
      if (expiryFilter === 'has_expiry' && !row.expiry_date) return false
      if (expiryFilter === 'no_expiry' && row.expiry_date) return false
      if (expiryFilter === 'expiring_soon' && row.managementStatus !== 'expiring_soon') {
        return false
      }
      if (expiryFilter === 'expired' && row.managementStatus !== 'expired') return false
      return true
    })

    result = [...result].sort((a, b) => {
      if (sortField === 'training_name') return a.training_name.localeCompare(b.training_name)
      if (sortField === 'employee') {
        return (a.employee?.full_name ?? '').localeCompare(b.employee?.full_name ?? '')
      }
      if (sortField === 'training_date') {
        const aDate = a.training_date ?? '9999-12-31'
        const bDate = b.training_date ?? '9999-12-31'
        return aDate.localeCompare(bDate)
      }
      if (sortField === 'status') {
        return a.managementStatus.localeCompare(b.managementStatus)
      }
      const aExpiry = a.expiry_date ?? '9999-12-31'
      const bExpiry = b.expiry_date ?? '9999-12-31'
      return aExpiry.localeCompare(bExpiry)
    })

    return result
  }, [rows, search, employeeFilter, statusFilter, expiryFilter, sortField])

  function openCreate() {
    setEditing(null)
    setFormValues(emptyTrainingForm())
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: TrainingRecordWithEmployee) {
    setEditing(row)
    setFormValues(trainingToFormValues(row))
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSave(values: TrainingFormValues) {
    const nextErrors = validateTrainingForm(values)
    setFieldErrors(nextErrors)
    if (hasTrainingFieldErrors(nextErrors)) {
      setFormError('Please correct the highlighted fields.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      if (editing) {
        await updateTrainingRecord(editing.id, values, actorId)
      } else {
        await createTrainingRecord(values, actorId)
      }
      setFormOpen(false)
      await refresh()
      if (detail?.id === editing?.id) {
        const updated = await listTrainingRecords()
        const match = updated.find((row) => row.id === editing?.id)
        if (match) setDetail(match)
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Unable to save training record.')
    } finally {
      setSubmitting(false)
    }
  }

  function rowHighlight(status: TrainingManagementStatus): string {
    if (status === 'expired') return 'bg-red-50/60'
    if (status === 'expiring_soon') return 'bg-amber-50/60'
    if (status === 'due') return 'bg-sky-50/40'
    return ''
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Training</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Track employee training and certificate expiry. Status is derived from dates;
            expiring soon uses a {EXPIRING_SOON_DAYS}-day threshold.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90"
        >
          Add training record
        </button>
      </div>

      {dataSource === 'local_demo' && (
        <DemoDataBadge label="Local demonstration training records — browser storage only." />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Valid', value: summary.valid },
          { label: 'Due', value: summary.due },
          { label: 'Expiring Soon', value: summary.expiring_soon },
          { label: 'Expired', value: summary.expired },
          { label: 'Needs Attention', value: summary.employees_requiring_attention },
        ].map((card) => (
          <div
            key={card.label}
            className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:grid-cols-2 lg:grid-cols-5">
        <label className="block text-sm lg:col-span-2">
          <span className="mb-1 block font-medium">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Training, provider, certificate, employee…"
            className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TrainingStatusFilter)}
            className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="all">All</option>
            <option value="valid">Valid</option>
            <option value="due">Due</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Employee</span>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="all">All employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name} ({employee.employee_code})
                {employee.employment_status !== 'active' ? ' — inactive' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Expiry</span>
          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value as TrainingExpiryFilter)}
            className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="all">All</option>
            <option value="has_expiry">Has expiry date</option>
            <option value="no_expiry">No expiry date</option>
            <option value="expiring_soon">Expiring soon</option>
            <option value="expired">Expired</option>
          </select>
        </label>
        <label className="block text-sm md:col-span-2 lg:col-span-5">
          <span className="mb-1 block font-medium">Sort by</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as TrainingSortField)}
            className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="expiry_date">Expiry date</option>
            <option value="training_date">Training date</option>
            <option value="training_name">Training</option>
            <option value="employee">Employee</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>

      {loading && (
        <p className="text-sm text-[var(--color-muted)]">Loading training records…</p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
          {rows.length === 0
            ? 'No training records have been added.'
            : 'No training records match your filters.'}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Employee</th>
                <th className="px-3 py-2 font-medium">Training</th>
                <th className="px-3 py-2 font-medium">Provider</th>
                <th className="px-3 py-2 font-medium">Training date</th>
                <th className="px-3 py-2 font-medium">Expiry date</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-[var(--color-border)] last:border-b-0 ${rowHighlight(row.managementStatus)}`}
                >
                  <td className="px-3 py-3">
                    <div>{row.employee?.full_name ?? 'Unknown'}</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {row.employee?.employee_code ?? '—'}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{row.training_name}</div>
                    {row.is_demo && (
                      <div className="text-xs text-[var(--color-muted)]">Demo record</div>
                    )}
                  </td>
                  <td className="px-3 py-3">{row.provider ?? '—'}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {row.training_date ? formatDateLabel(row.training_date) : '—'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {row.expiry_date ? (
                      <span
                        className={
                          row.managementStatus === 'expired' ||
                          row.managementStatus === 'expiring_soon'
                            ? 'font-medium text-red-800'
                            : ''
                        }
                      >
                        {formatDateLabel(row.expiry_date)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <TrainingStatusBadge status={row.managementStatus} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setDetail(row)}
                        className="border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-bg)]"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-bg)]"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <TrainingFormDialog
          key={editing?.id ?? 'new-training'}
          open
          title={editing ? 'Edit training record' : 'Add training record'}
          employees={employees}
          initialValues={formValues}
          submitting={submitting}
          error={formError}
          fieldErrors={fieldErrors}
          mode={editing ? 'edit' : 'create'}
          onClose={() => setFormOpen(false)}
          onSubmit={(values) => void handleSave(values)}
        />
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="training-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg"
          >
            <h2
              id="training-detail-title"
              className="text-lg font-semibold text-[var(--color-text)]"
            >
              {detail.training_name}
            </h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--color-muted)]">Employee</dt>
                <dd>
                  {detail.employee?.full_name ?? 'Unknown'} ({detail.employee?.employee_code ?? '—'}
                  )
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Status</dt>
                <dd className="mt-1">
                  <TrainingStatusBadge status={detail.managementStatus} />
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Provider</dt>
                <dd>{detail.provider ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Certificate / reference</dt>
                <dd>{detail.certificate_reference ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Training date</dt>
                <dd>{detail.training_date ? formatDateLabel(detail.training_date) : '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Expiry date</dt>
                <dd>{detail.expiry_date ? formatDateLabel(detail.expiry_date) : '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--color-muted)]">Notes</dt>
                <dd>{detail.notes?.trim() ? detail.notes : '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Created</dt>
                <dd>{new Date(detail.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Updated</dt>
                <dd>{new Date(detail.updated_at).toLocaleString()}</dd>
              </div>
            </dl>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => openEdit(detail)}
                className="border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-bg)]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-bg)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
