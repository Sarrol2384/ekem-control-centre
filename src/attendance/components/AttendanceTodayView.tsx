import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { DemoDataBadge } from '../../components/DemoDataBadge'
import { getStaffDataSource } from '../../staff/api'
import {
  getTodayAttendance,
  quickMarkAttendance,
  saveAttendanceRecord,
  summarizeAttendance,
} from '../api'
import { formatDateLabel, formatTimeDisplay, todayDateOnly } from '../dateUtils'
import { calculateCreditedHours, formatHoursDisplay } from '../hours'
import type {
  AttendanceFormValues,
  AttendanceStatus,
  TodayAttendanceRow,
} from '../types'
import { emptyAttendanceForm, recordToFormValues } from '../types'
import { AttendanceEditor } from './AttendanceEditor'
import { AttendanceStatusBadge } from './AttendanceStatusBadge'

const QUICK_STATUSES: AttendanceStatus[] = ['present', 'late', 'absent', 'on_leave']

export function AttendanceTodayView() {
  const { profile, user } = useAuth()
  const [date] = useState(todayDateOnly())
  const [rows, setRows] = useState<TodayAttendanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyEmployeeId, setBusyEmployeeId] = useState<string | null>(null)
  const [editorRow, setEditorRow] = useState<TodayAttendanceRow | null>(null)
  const [editorSubmitting, setEditorSubmitting] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const dataSource = getStaffDataSource()

  const refresh = useCallback(async () => {
    try {
      const next = await getTodayAttendance(date)
      setRows(next)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load attendance.')
    }
  }, [date])

  useEffect(() => {
    let mounted = true
    void getTodayAttendance(date)
      .then((next) => {
        if (!mounted) return
        setRows(next)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unable to load attendance.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [date])

  const summary = useMemo(
    () =>
      summarizeAttendance(
        rows.map((row) => ({
          status:
            row.scheduledStatus === 'approved_leave'
              ? 'on_leave'
              : (row.record?.status ?? null),
        })),
      ),
    [rows],
  )

  const attention = useMemo(
    () =>
      rows.filter((row) => {
        if (row.scheduledStatus === 'approved_leave') return false
        return (
          !row.record || row.record.status === 'late' || row.record.status === 'absent'
        )
      }),
    [rows],
  )

  async function handleQuickMark(row: TodayAttendanceRow, status: AttendanceStatus) {
    setBusyEmployeeId(row.employee.id)
    setActionError(null)
    try {
      await quickMarkAttendance({
        employeeId: row.employee.id,
        date,
        status,
        actorId: user?.id ?? profile?.id ?? null,
        existing: row.record,
      })
      await refresh()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Unable to update attendance.')
    } finally {
      setBusyEmployeeId(null)
    }
  }

  async function handleEditorSave(values: AttendanceFormValues) {
    if (!editorRow) return
    setEditorSubmitting(true)
    setEditorError(null)
    try {
      await saveAttendanceRecord({
        employeeId: editorRow.employee.id,
        date,
        values,
        actorId: user?.id ?? profile?.id ?? null,
        existingId: editorRow.record?.id,
      })
      setEditorRow(null)
      await refresh()
    } catch (err: unknown) {
      setEditorError(err instanceof Error ? err.message : 'Unable to save attendance.')
    } finally {
      setEditorSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Today</h2>
          <p className="text-sm text-[var(--color-muted)]">{formatDateLabel(date)}</p>
        </div>
        {dataSource === 'local_demo' && (
          <DemoDataBadge label="Local demonstration attendance — browser storage only" />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Present', summary.present],
          ['Late', summary.late],
          ['Absent', summary.absent],
          ['On Leave', summary.on_leave],
          ['Not recorded', summary.not_recorded],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
          >
            <p className="text-xs tracking-wide text-[var(--color-muted)] uppercase">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
          </div>
        ))}
      </div>

      {attention.length > 0 && (
        <div className="border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning-text)]">
          <p className="font-medium">Needs attention</p>
          <p className="mt-1">
            {attention.length} employee{attention.length === 1 ? '' : 's'} still need a clear
            attendance outcome (not recorded, late, or absent).
          </p>
        </div>
      )}

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading today&apos;s attendance…</p>}

      {error && (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {actionError && (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {actionError}
        </p>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10 text-center text-sm text-[var(--color-muted)]">
          No active employees are available for attendance today. Add employees or reactivate
          inactive staff to begin recording attendance.
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-3 font-medium">Employee</th>
                <th className="px-3 py-3 font-medium">Position</th>
                <th className="px-3 py-3 font-medium">Scheduled</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Arrival</th>
                <th className="px-3 py-3 font-medium">Departure</th>
                <th className="px-3 py-3 font-medium">Hours</th>
                <th className="px-3 py-3 font-medium">Notes</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const busy = busyEmployeeId === row.employee.id
                const onApprovedLeave = row.scheduledStatus === 'approved_leave'
                const displayStatus = onApprovedLeave
                  ? 'on_leave'
                  : (row.record?.status ?? null)
                return (
                  <tr
                    key={row.employee.id}
                    className="border-b border-[var(--color-border)] last:border-b-0 align-top"
                  >
                    <td className="px-3 py-3">
                      <div className="font-medium text-[var(--color-text)]">
                        {row.employee.full_name}
                      </div>
                      <div className="text-xs text-[var(--color-muted)]">
                        {row.employee.employee_code}
                        {row.employee.is_demo ? ' · Demo record' : ''}
                      </div>
                    </td>
                    <td className="px-3 py-3">{row.employee.position ?? '—'}</td>
                    <td className="px-3 py-3">
                      {onApprovedLeave ? 'Approved leave' : 'Scheduled'}
                    </td>
                    <td className="px-3 py-3">
                      <AttendanceStatusBadge status={displayStatus} />
                      {onApprovedLeave && (
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          From approved leave request
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {onApprovedLeave ? '—' : formatTimeDisplay(row.record?.arrival_time)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {onApprovedLeave ? '—' : formatTimeDisplay(row.record?.departure_time)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {onApprovedLeave
                        ? '—'
                        : formatHoursDisplay(
                            row.record
                              ? calculateCreditedHours(row.record)
                              : null,
                          )}
                    </td>
                    <td className="px-3 py-3 max-w-[14rem]">
                      <span className="line-clamp-2 text-[var(--color-muted)]">
                        {onApprovedLeave
                          ? 'Covered by approved leave'
                          : row.record?.notes?.trim()
                            ? row.record.notes
                            : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {onApprovedLeave ? (
                        <p className="text-xs text-[var(--color-muted)]">
                          Attendance overrides are blocked while on approved leave.
                        </p>
                      ) : (
                        <div className="flex min-w-[12rem] flex-wrap gap-1">
                          {QUICK_STATUSES.map((status) => (
                            <button
                              key={status}
                              type="button"
                              disabled={busy}
                              onClick={() => void handleQuickMark(row, status)}
                              className="border border-[var(--color-border)] px-2 py-1 text-xs capitalize hover:bg-[var(--color-bg)] disabled:opacity-60"
                            >
                              {status.replace('_', ' ')}
                            </button>
                          ))}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditorError(null)
                              setEditorRow(row)
                            }}
                            className="border border-[var(--color-primary)] px-2 py-1 text-xs text-[var(--color-primary)] hover:bg-[var(--color-bg)] disabled:opacity-60"
                          >
                            {row.record ? 'Correct / edit' : 'Record details'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editorRow && (
        <AttendanceEditor
          key={`${editorRow.employee.id}-${editorRow.record?.id ?? 'new'}`}
          open
          title={`${editorRow.record ? 'Correct' : 'Record'} attendance — ${editorRow.employee.full_name}`}
          initialValues={
            editorRow.record
              ? recordToFormValues(editorRow.record)
              : emptyAttendanceForm({
                  status:
                    editorRow.scheduledStatus === 'approved_leave' ? 'on_leave' : 'present',
                })
          }
          submitting={editorSubmitting}
          error={editorError}
          onClose={() => setEditorRow(null)}
          onSubmit={(values) => void handleEditorSave(values)}
        />
      )}
    </div>
  )
}
