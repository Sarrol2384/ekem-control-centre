import { useEffect, useMemo, useState } from 'react'
import { DemoDataBadge } from '../../components/DemoDataBadge'
import { getStaffDataSource, listEmployees } from '../../staff/api'
import type { Employee } from '../../staff/types'
import { listAttendanceHistory, summarizeAttendance } from '../api'
import {
  formatDateLabel,
  formatTimeDisplay,
  rangeForPreset,
  todayDateOnly,
  type DateRange,
} from '../dateUtils'
import { calculateCreditedHours, formatHoursDisplay } from '../hours'
import type { AttendanceRecord, HistoryRangePreset } from '../types'
import { AttendanceStatusBadge } from './AttendanceStatusBadge'

type HistoryRow = AttendanceRecord & { employee: Employee | null }

export function AttendanceHistoryView() {
  const [preset, setPreset] = useState<HistoryRangePreset>('week')
  const [customRange, setCustomRange] = useState<DateRange>(() => rangeForPreset('week'))
  const [employeeId, setEmployeeId] = useState('all')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataSource = getStaffDataSource()

  const activeRange = useMemo(() => {
    if (preset === 'custom') return customRange
    return rangeForPreset(preset)
  }, [preset, customRange])

  useEffect(() => {
    let mounted = true
    void listEmployees()
      .then((list) => {
        if (!mounted) return
        setEmployees(list.sort((a, b) => a.full_name.localeCompare(b.full_name)))
      })
      .catch(() => {
        if (mounted) setEmployees([])
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    void listAttendanceHistory({
      start: activeRange.start,
      end: activeRange.end,
      employeeId: employeeId === 'all' ? null : employeeId,
    })
      .then((next) => {
        if (!mounted) return
        setRows(next)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unable to load attendance history.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [activeRange, employeeId])

  const summary = useMemo(
    () => summarizeAttendance(rows.map((row) => ({ status: row.status }))),
    [rows],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">History</h2>
          <p className="text-sm text-[var(--color-muted)]">
            {formatDateLabel(activeRange.start)}
            {activeRange.start !== activeRange.end ? ` – ${formatDateLabel(activeRange.end)}` : ''}
          </p>
        </div>
        {dataSource === 'local_demo' && (
          <DemoDataBadge label="Local demonstration attendance — browser storage only" />
        )}
      </div>

      <div className="grid gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Period</span>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as HistoryRangePreset)}
            className="w-full border border-[var(--color-border)] px-3 py-2"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="custom">Custom date range</option>
          </select>
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Employee</span>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
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

        {preset === 'custom' && (
          <>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">From</span>
              <input
                type="date"
                value={customRange.start}
                max={todayDateOnly()}
                onChange={(e) =>
                  setCustomRange((current) => ({ ...current, start: e.target.value }))
                }
                className="w-full border border-[var(--color-border)] px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">To</span>
              <input
                type="date"
                value={customRange.end}
                max={todayDateOnly()}
                onChange={(e) =>
                  setCustomRange((current) => ({ ...current, end: e.target.value }))
                }
                className="w-full border border-[var(--color-border)] px-3 py-2"
              />
            </label>
          </>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Present', summary.present],
          ['Late', summary.late],
          ['Absent', summary.absent],
          ['On Leave', summary.on_leave],
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

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading history…</p>}

      {error && (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10 text-center text-sm text-[var(--color-muted)]">
          No attendance records found for this period.
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Employee</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Arrival</th>
                <th className="px-3 py-3 font-medium">Departure</th>
                <th className="px-3 py-3 font-medium">Hours</th>
                <th className="px-3 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatDateLabel(row.attendance_date)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">
                      {row.employee?.full_name ?? 'Unknown employee'}
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {row.employee?.employee_code ?? row.employee_id}
                      {row.is_demo ? ' · Demo record' : ''}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <AttendanceStatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatTimeDisplay(row.arrival_time)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatTimeDisplay(row.departure_time)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatHoursDisplay(calculateCreditedHours(row))}
                  </td>
                  <td className="px-3 py-3 max-w-[16rem] text-[var(--color-muted)]">
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
