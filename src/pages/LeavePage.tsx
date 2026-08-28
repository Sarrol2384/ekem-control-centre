import { useEffect, useMemo, useState } from 'react'
import { formatDateLabel } from '../attendance/dateUtils'
import { useAuth } from '../auth/useAuth'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DemoDataBadge } from '../components/DemoDataBadge'
import { getStaffDataSource, listEmployees } from '../staff/api'
import type { Employee } from '../staff/types'
import {
  createLeaveRequest,
  isLeaveHistory,
  listLeaveRequests,
  setLeaveStatus,
  summarizeLeave,
  updatePendingLeaveRequest,
} from '../leave/api'
import { LeaveFormDialog } from '../leave/components/LeaveFormDialog'
import { LeaveStatusBadge } from '../leave/components/LeaveStatusBadge'
import { todayDateOnly } from '../leave/dateUtils'
import type {
  LeaveFormValues,
  LeaveRequestWithEmployee,
  LeaveStatus,
  LeaveStatusFilter,
} from '../leave/types'
import {
  emptyLeaveForm,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  leaveToFormValues,
} from '../leave/types'
import { hasLeaveFieldErrors, validateLeaveForm, type LeaveFieldErrors } from '../leave/validation'

export function LeavePage() {
  const { profile, user } = useAuth()
  const [rows, setRows] = useState<LeaveRequestWithEmployee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<LeaveStatusFilter>('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LeaveRequestWithEmployee | null>(null)
  const [formValues, setFormValues] = useState<LeaveFormValues>(emptyLeaveForm())
  const [fieldErrors, setFieldErrors] = useState<LeaveFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    id: string
    status: Extract<LeaveStatus, 'approved' | 'rejected' | 'cancelled'>
    label: string
  } | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [detail, setDetail] = useState<LeaveRequestWithEmployee | null>(null)
  const dataSource = getStaffDataSource()
  const today = todayDateOnly()

  async function refresh() {
    const [leaveRows, employeeRows] = await Promise.all([listLeaveRequests(), listEmployees()])
    setRows(leaveRows)
    setEmployees(employeeRows)
  }

  useEffect(() => {
    let mounted = true
    void Promise.all([listLeaveRequests(), listEmployees()])
      .then(([leaveRows, employeeRows]) => {
        if (!mounted) return
        setRows(leaveRows)
        setEmployees(employeeRows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unable to load leave requests.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const summary = useMemo(() => summarizeLeave(rows), [rows])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (employeeFilter !== 'all' && row.employee_id !== employeeFilter) return false
      if (statusFilter === 'all') return true
      if (statusFilter === 'current') {
        return row.status === 'approved' && row.start_date <= today && row.end_date >= today
      }
      if (statusFilter === 'upcoming') {
        return row.status === 'approved' && row.start_date > today
      }
      if (statusFilter === 'history') {
        return isLeaveHistory(row, today)
      }
      return row.status === statusFilter
    })
  }, [rows, statusFilter, employeeFilter, today])

  function openCreate() {
    setEditing(null)
    setFormValues(emptyLeaveForm())
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: LeaveRequestWithEmployee) {
    setEditing(row)
    setFormValues(leaveToFormValues(row))
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSave(values: LeaveFormValues) {
    const nextErrors = validateLeaveForm(values)
    setFieldErrors(nextErrors)
    if (hasLeaveFieldErrors(nextErrors)) {
      setFormError('Please correct the highlighted fields.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      const actorId = user?.id ?? profile?.id ?? null
      if (editing) {
        await updatePendingLeaveRequest(editing.id, values, actorId)
      } else {
        await createLeaveRequest(values, actorId)
      }
      setFormOpen(false)
      await refresh()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Unable to save leave request.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmStatus() {
    if (!confirmAction) return
    setConfirming(true)
    try {
      await setLeaveStatus(
        confirmAction.id,
        confirmAction.status,
        user?.id ?? profile?.id ?? null,
      )
      setConfirmAction(null)
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update leave status.')
      setConfirmAction(null)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Leave</h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--color-muted)]">
            Manage leave requests for pharmacy staff. Approved leave is recognised by Attendance for
            the covered dates.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          Create leave request
        </button>
      </div>

      {dataSource === 'local_demo' && (
        <DemoDataBadge label="Local demonstration leave — browser storage only" />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          ['Pending', summary.pending],
          ['Approved', summary.approved],
          ['Rejected', summary.rejected],
          ['Current', summary.current],
          ['Upcoming', summary.upcoming],
          ['History', summary.history],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
          >
            <p className="text-xs tracking-wide text-[var(--color-muted)] uppercase">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeaveStatusFilter)}
            className="w-full border border-[var(--color-border)] px-3 py-2"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="current">Current leave</option>
            <option value="upcoming">Upcoming leave</option>
            <option value="history">Leave history</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Employee</span>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="w-full border border-[var(--color-border)] px-3 py-2"
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
      </div>

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading leave requests…</p>}

      {error && (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10 text-center text-sm text-[var(--color-muted)]">
          No leave requests match the current filters.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-3 font-medium">Employee</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Dates</th>
                <th className="px-3 py-3 font-medium">Days</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Notes</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3 py-3">
                    <div className="font-medium">
                      {row.employee?.full_name ?? 'Unknown employee'}
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {row.employee?.employee_code ?? row.employee_id}
                      {row.is_demo ? ' · Demo record' : ''}
                    </div>
                  </td>
                  <td className="px-3 py-3">{LEAVE_TYPE_LABELS[row.leave_type]}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatDateLabel(row.start_date)}
                    {row.start_date !== row.end_date ? ` – ${formatDateLabel(row.end_date)}` : ''}
                  </td>
                  <td className="px-3 py-3">{row.days_count}</td>
                  <td className="px-3 py-3">
                    <LeaveStatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-3 max-w-[14rem] text-[var(--color-muted)]">
                    {row.notes?.trim() ? row.notes : '—'}
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
                      {row.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-bg)]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                id: row.id,
                                status: 'approved',
                                label: 'Approve',
                              })
                            }
                            className="border border-emerald-700 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                id: row.id,
                                status: 'rejected',
                                label: 'Reject',
                              })
                            }
                            className="border border-red-700 px-2 py-1 text-xs text-red-800 hover:bg-red-50"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                id: row.id,
                                status: 'cancelled',
                                label: 'Cancel',
                              })
                            }
                            className="border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-bg)]"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {row.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              id: row.id,
                              status: 'cancelled',
                              label: 'Cancel approved leave',
                            })
                          }
                          className="border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-bg)]"
                        >
                          Cancel leave
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <LeaveFormDialog
          key={editing?.id ?? 'new-leave'}
          open
          title={editing ? 'Edit leave request' : 'Create leave request'}
          employees={employees}
          initialValues={formValues}
          submitting={submitting}
          error={formError}
          fieldErrors={fieldErrors}
          lockEmployee={Boolean(editing)}
          onClose={() => setFormOpen(false)}
          onSubmit={(values) => void handleSave(values)}
        />
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-detail-title"
            className="w-full max-w-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg"
          >
            <h2 id="leave-detail-title" className="text-lg font-semibold text-[var(--color-text)]">
              Leave details
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[var(--color-muted)]">Employee</dt>
                <dd className="font-medium">
                  {detail.employee?.full_name ?? 'Unknown'} (
                  {detail.employee?.employee_code ?? detail.employee_id})
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Type</dt>
                <dd>{LEAVE_TYPE_LABELS[detail.leave_type]}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Dates</dt>
                <dd>
                  {formatDateLabel(detail.start_date)}
                  {detail.start_date !== detail.end_date
                    ? ` – ${formatDateLabel(detail.end_date)}`
                    : ''}{' '}
                  ({detail.days_count} day{detail.days_count === 1 ? '' : 's'})
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Status</dt>
                <dd className="mt-1">
                  <LeaveStatusBadge status={detail.status} />
                  <span className="sr-only">{LEAVE_STATUS_LABELS[detail.status]}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Reason / notes</dt>
                <dd>{detail.notes?.trim() ? detail.notes : '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Created</dt>
                <dd>{new Date(detail.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Reviewed</dt>
                <dd>
                  {detail.reviewed_at
                    ? new Date(detail.reviewed_at).toLocaleString()
                    : 'Not reviewed yet'}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex justify-end">
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

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction?.label === 'Cancel approved leave'
            ? 'Cancel approved leave?'
            : `${confirmAction?.label ?? 'Confirm'} leave request?`
        }
        message={
          confirmAction?.status === 'approved'
            ? 'Approving this request will mark the employee as on approved leave in Attendance for the covered dates.'
            : confirmAction?.status === 'cancelled'
              ? 'Cancelling this request will remove approved-leave recognition from Attendance for the covered dates if it was approved.'
              : 'This action will update the leave request status. Historical records are kept.'
        }
        confirmLabel={confirmAction?.label ?? 'Confirm'}
        confirming={confirming}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleConfirmStatus()}
      />
    </section>
  )
}
