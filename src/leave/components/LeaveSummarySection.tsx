import { formatDateLabel } from '../../attendance/dateUtils'
import type { EmployeeLeaveSummary } from '../balance'
import { LEAVE_TYPE_LABELS, type LeaveRequest, type LeaveType } from '../types'
import { LeaveStatusBadge } from './LeaveStatusBadge'

const LEAVE_TYPES: LeaveType[] = ['annual', 'sick', 'family_responsibility', 'other']

function formatDays(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatOptionalDays(value: number | null): string {
  return value === null ? 'Not set' : formatDays(value)
}

type LeaveSummaryCardProps = {
  summary: EmployeeLeaveSummary
  employeeName?: string
}

export function LeaveSummaryCard({ summary, employeeName }: LeaveSummaryCardProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text)]">
          {employeeName ? `${employeeName} — ` : ''}Leave balance ({summary.year})
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Calendar year totals. Annual leave remaining is shown only when an entitlement has been
          configured for the employee.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
          <p className="text-xs tracking-wide text-[var(--color-muted)] uppercase">Annual entitlement</p>
          <p className="mt-1 text-2xl font-semibold">{formatOptionalDays(summary.annualEntitlement)}</p>
        </div>
        <div className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
          <p className="text-xs tracking-wide text-[var(--color-muted)] uppercase">Annual used</p>
          <p className="mt-1 text-2xl font-semibold">{formatDays(summary.annualUsed)}</p>
        </div>
        <div className="border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
          <p className="text-xs tracking-wide text-[var(--color-muted)] uppercase">Annual pending</p>
          <p className="mt-1 text-2xl font-semibold">{formatDays(summary.annualPending)}</p>
        </div>
        <div className="border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs tracking-wide text-emerald-800 uppercase">Annual remaining</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-900">
            {formatOptionalDays(summary.annualRemaining)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border border-[var(--color-border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Leave type</th>
              <th className="px-3 py-2 font-medium">Approved (days)</th>
              <th className="px-3 py-2 font-medium">Pending (days)</th>
            </tr>
          </thead>
          <tbody>
            {LEAVE_TYPES.map((type) => (
              <tr key={type} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="px-3 py-2">{LEAVE_TYPE_LABELS[type]}</td>
                <td className="px-3 py-2">{formatDays(summary.byType[type].approved)}</td>
                <td className="px-3 py-2">{formatDays(summary.byType[type].pending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type LeaveHistoryTableProps = {
  rows: LeaveRequest[]
  title?: string
  emptyMessage?: string
}

export function LeaveHistoryTable({
  rows,
  title = 'Leave history',
  emptyMessage = 'No leave records yet.',
}: LeaveHistoryTableProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto border border-[var(--color-border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Dates</th>
                <th className="px-3 py-2 font-medium">Days</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3 py-2">{LEAVE_TYPE_LABELS[row.leave_type]}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDateLabel(row.start_date)}
                    {row.start_date !== row.end_date ? ` – ${formatDateLabel(row.end_date)}` : ''}
                  </td>
                  <td className="px-3 py-2">{row.days_count}</td>
                  <td className="px-3 py-2">
                    <LeaveStatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2 max-w-[14rem] text-[var(--color-muted)]">
                    {row.notes?.trim() ? row.notes : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

type LeaveBalancesOverviewProps = {
  summaries: Array<EmployeeLeaveSummary & { employeeName: string; employeeCode: string }>
  year: number
}

export function LeaveBalancesOverview({ summaries, year }: LeaveBalancesOverviewProps) {
  if (summaries.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">No employees to show leave balances for.</p>
    )
  }

  return (
    <div className="overflow-x-auto border border-[var(--color-border)]">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)]">
          <tr>
            <th className="px-3 py-3 font-medium">Employee</th>
            <th className="px-3 py-3 font-medium">Annual entitlement</th>
            <th className="px-3 py-3 font-medium">Annual used</th>
            <th className="px-3 py-3 font-medium">Annual remaining</th>
            <th className="px-3 py-3 font-medium">Sick taken</th>
            <th className="px-3 py-3 font-medium">Family taken</th>
            <th className="px-3 py-3 font-medium">Other taken</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((row) => (
            <tr key={row.employeeId} className="border-b border-[var(--color-border)] last:border-b-0">
              <td className="px-3 py-3">
                <div className="font-medium">{row.employeeName}</div>
                <div className="text-xs text-[var(--color-muted)]">{row.employeeCode}</div>
              </td>
              <td className="px-3 py-3">{formatOptionalDays(row.annualEntitlement)}</td>
              <td className="px-3 py-3">{formatDays(row.annualUsed)}</td>
              <td className="px-3 py-3 font-medium text-emerald-800">
                {formatOptionalDays(row.annualRemaining)}
              </td>
              <td className="px-3 py-3">{formatDays(row.byType.sick.approved)}</td>
              <td className="px-3 py-3">{formatDays(row.byType.family_responsibility.approved)}</td>
              <td className="px-3 py-3">{formatDays(row.byType.other.approved)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)]">
        {year} calendar year. &quot;Taken&quot; counts approved leave only. Pending annual leave is
        shown in the detailed balance when you filter by employee.
      </p>
    </div>
  )
}
