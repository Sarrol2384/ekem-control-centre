import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DemoDataBadge } from '../components/DemoDataBadge'
import {
  getEmployeeLeaveHistoryFromRows,
  getEmployeeLeaveSummary,
  listLeaveRequests,
} from '../leave/api'
import { currentLeaveYear } from '../leave/balance'
import {
  LeaveHistoryTable,
  LeaveSummaryCard,
} from '../leave/components/LeaveSummarySection'
import { getEmployee, setEmployeeActiveState } from './api'
import { EmploymentStatusBadge } from './components/EmploymentStatusBadge'
import { displayValue, formatDisplayDate } from './format'
import type { Employee } from './types'
import type { EmployeeLeaveSummary } from '../leave/balance'
import type { LeaveRequest } from '../leave/types'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[var(--color-text)]">{value}</dd>
    </div>
  )
}

export function EmployeeProfilePage() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [leaveSummary, setLeaveSummary] = useState<EmployeeLeaveSummary | null>(null)
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([])
  const leaveYear = currentLeaveYear()

  useEffect(() => {
    if (!employeeId) return
    let mounted = true

    void getEmployee(employeeId)
      .then((row) => {
        if (!mounted) return
        setEmployee(row)
        if (!row) setError('Employee not found.')
        else setError(null)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unable to load employee.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    void Promise.all([getEmployeeLeaveSummary(employeeId, leaveYear), listLeaveRequests()])
      .then(([summary, allLeave]) => {
        if (!mounted) return
        setLeaveSummary(summary)
        const requestRows = allLeave.map(({ employee: _employee, ...row }) => row)
        setLeaveHistory(getEmployeeLeaveHistoryFromRows(employeeId, requestRows))
      })
      .catch(() => {
        if (!mounted) return
      })

    return () => {
      mounted = false
    }
  }, [employeeId, leaveYear])

  async function handleStatusChange() {
    if (!employee) return
    const nextStatus = employee.employment_status === 'active' ? 'inactive' : 'active'
    setUpdatingStatus(true)
    setActionError(null)
    try {
      const updated = await setEmployeeActiveState(
        employee.id,
        nextStatus,
        user?.id ?? profile?.id ?? null,
      )
      setEmployee(updated)
      setConfirmOpen(false)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Unable to update employment status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading employee…</p>
  }

  if (error || !employee) {
    return (
      <div className="space-y-3">
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error ?? 'Employee not found.'}
        </p>
        <Link to="/staff" className="text-sm text-[var(--color-primary)] underline">
          Back to staff list
        </Link>
      </div>
    )
  }

  const isActive = employee.employment_status === 'active'

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--color-muted)]">
            <Link to="/staff" className="underline">
              Staff
            </Link>{' '}
            / Profile
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-[var(--color-text)]">{employee.full_name}</h1>
            <EmploymentStatusBadge status={employee.employment_status} />
            {employee.is_demo && (
              <DemoDataBadge
                compact
                label="Demonstration record"
                title="Fictional demonstration employee — not a real Ekem employee"
              />
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{employee.employee_code}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/staff/${employee.id}/edit`)}
            className="border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-bg)]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="btn-primary px-3 py-2 text-sm"
          >
            {isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </div>

      {actionError && (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {actionError}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:col-span-1">
          <h2 className="text-base font-semibold">Personal information</h2>
          <dl className="mt-4 space-y-4">
            <InfoRow label="Full name" value={displayValue(employee.full_name)} />
            <InfoRow label="Contact number" value={displayValue(employee.contact_number)} />
            <InfoRow label="Email" value={displayValue(employee.email)} />
            <InfoRow label="Address" value={displayValue(employee.address)} />
          </dl>
        </section>

        <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:col-span-1">
          <h2 className="text-base font-semibold">Employment information</h2>
          <dl className="mt-4 space-y-4">
            <InfoRow label="Employee ID" value={displayValue(employee.employee_code)} />
            <InfoRow label="Position" value={displayValue(employee.position)} />
            <InfoRow label="Department" value={displayValue(employee.department)} />
            <InfoRow label="Start date" value={formatDisplayDate(employee.start_date)} />
            <InfoRow
              label="Employment status"
              value={employee.employment_status === 'active' ? 'Active' : 'Inactive'}
            />
            <InfoRow
              label="Annual leave entitlement"
              value={
                employee.annual_leave_entitlement != null
                  ? `${employee.annual_leave_entitlement} days / year`
                  : 'Not configured'
              }
            />
          </dl>
        </section>

        <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:col-span-1">
          <h2 className="text-base font-semibold">Emergency contact</h2>
          <dl className="mt-4 space-y-4">
            <InfoRow label="Name" value={displayValue(employee.emergency_contact_name)} />
            <InfoRow
              label="Relationship"
              value={displayValue(employee.emergency_contact_relationship)}
            />
            <InfoRow
              label="Contact number"
              value={displayValue(employee.emergency_contact_number)}
            />
          </dl>
          {!employee.emergency_contact_name &&
            !employee.emergency_contact_number &&
            !employee.emergency_contact_relationship && (
              <p className="mt-4 text-sm text-[var(--color-muted)]">
                No emergency contact has been recorded yet.
              </p>
            )}
        </section>
      </div>

      <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-base font-semibold">Notes</h2>
        <p className="mt-3 text-sm text-[var(--color-muted)]">{displayValue(employee.notes)}</p>
      </section>

      <section className="space-y-5 border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Leave</h2>
          <Link to="/leave" className="text-sm text-[var(--color-primary)] underline">
            Manage leave requests
          </Link>
        </div>
        {leaveSummary ? (
          <LeaveSummaryCard summary={leaveSummary} />
        ) : (
          <p className="text-sm text-[var(--color-muted)]">Unable to load leave balance.</p>
        )}
        <LeaveHistoryTable
          rows={leaveHistory}
          title="All leave taken"
          emptyMessage="No leave has been recorded for this employee yet."
        />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={isActive ? 'Deactivate employee?' : 'Reactivate employee?'}
        message={
          isActive
            ? `${employee.full_name} will be marked inactive. Historical records are kept — the employee is not deleted.`
            : `${employee.full_name} will be marked active again.`
        }
        confirmLabel={isActive ? 'Deactivate' : 'Reactivate'}
        confirming={updatingStatus}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void handleStatusChange()}
      />
    </section>
  )
}
