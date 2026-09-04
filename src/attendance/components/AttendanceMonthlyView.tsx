import { useEffect, useMemo, useState } from 'react'
import { DemoDataBadge } from '../../components/DemoDataBadge'
import { PrintPreviewModal } from '../../print/PrintPreviewModal'
import { PrintReportLayout } from '../../print/PrintReportLayout'
import { getStaffDataSource, listEmployees } from '../../staff/api'
import { listAttendanceHistory } from '../api'
import {
  formatDateLabel,
  rangeForMonthValue,
  toMonthValue,
} from '../dateUtils'
import { formatHoursDisplay } from '../hours'
import { ATTENDANCE_STATUS_LABELS } from '../types'
import { buildMonthlyHoursReport, type MonthlyHoursReport } from '../monthly'

type PrintMode = 'summary' | 'register' | null

export function AttendanceMonthlyView() {
  const [monthValue, setMonthValue] = useState(() => toMonthValue())
  const [report, setReport] = useState<MonthlyHoursReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printMode, setPrintMode] = useState<PrintMode>(null)
  const [generatedAt, setGeneratedAt] = useState(() => new Date())
  const dataSource = getStaffDataSource()

  useEffect(() => {
    let mounted = true
    const { start, end } = rangeForMonthValue(monthValue)

    void Promise.all([listEmployees(), listAttendanceHistory({ start, end })])
      .then(([employees, records]) => {
        if (!mounted) return
        setReport(buildMonthlyHoursReport(monthValue, employees, records))
        setError(null)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unable to load monthly hours.')
        setReport(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [monthValue])

  const periodLabel = useMemo(() => {
    if (!report) return ''
    return `${formatDateLabel(report.periodStart)} – ${formatDateLabel(report.periodEnd)}`
  }, [report])

  const printTitle = useMemo(() => {
    if (!report || !printMode) return ''
    return printMode === 'summary'
      ? `Ekem Pharmacy — Monthly Hours Report — ${report.monthLabel}`
      : `Ekem Pharmacy — Attendance Register — ${report.monthLabel}`
  }, [report, printMode])

  function openPreview(mode: 'summary' | 'register') {
    if (!report) return
    setGeneratedAt(new Date())
    setPrintMode(mode)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Monthly hours</h2>
          <p className="text-sm text-[var(--color-muted)]">
            Review calculated hours for a calendar month, then print a report for the accountant.
          </p>
        </div>
        {dataSource === 'local_demo' && (
          <DemoDataBadge
            className="no-print"
            label="Local demonstration attendance — browser storage only"
          />
        )}
      </div>

      <div className="no-print filter-panel flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[var(--color-text)]">Month</span>
          <input
            type="month"
            value={monthValue}
            onChange={(e) => setMonthValue(e.target.value)}
            className="px-3 py-2.5"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!report || loading}
            onClick={() => openPreview('summary')}
            className="btn-primary disabled:opacity-60"
          >
            Preview monthly hours
          </button>
          <button
            type="button"
            disabled={!report || loading}
            onClick={() => openPreview('register')}
            className="btn-secondary disabled:opacity-60"
          >
            Preview attendance register
          </button>
        </div>
      </div>

      {loading && (
        <p className="no-print text-sm text-[var(--color-muted)]">Loading monthly hours…</p>
      )}

      {error && (
        <p
          className="no-print border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}

      {!loading && !error && report && (
        <>
          <div className="no-print">
            <h3 className="text-base font-semibold text-[var(--color-text)]">
              Ekem Pharmacy — {report.monthLabel} Monthly Hours
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Employees', report.employees.length],
                ['Total Hours', formatHoursDisplay(report.totalHours)],
                ['Attendance Records', report.attendanceRecords],
                ['Records Requiring Review', report.recordsRequiringReview],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                >
                  <p className="text-xs tracking-wide text-[var(--color-muted)] uppercase">
                    {label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="no-print space-y-3">
            <h3 className="text-base font-semibold text-[var(--color-text)]">Employee totals</h3>
            {report.employees.length === 0 ? (
              <div className="empty-state text-sm">
                No employees or attendance records for this month.
              </div>
            ) : (
              <div className="table-shell">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
                    <tr>
                      <th className="px-3 py-3 font-medium">Employee</th>
                      <th className="px-3 py-3 font-medium">Position</th>
                      <th className="px-3 py-3 font-medium text-right">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.employees.map((row) => (
                      <tr
                        key={row.employee.id}
                        className="border-b border-[var(--color-border)] last:border-b-0"
                      >
                        <td className="px-3 py-3">
                          <div className="font-medium">{row.employee.full_name}</div>
                          <div className="text-xs text-[var(--color-muted)]">
                            {row.employee.employee_code}
                          </div>
                        </td>
                        <td className="px-3 py-3">{row.employee.position ?? '—'}</td>
                        <td className="px-3 py-3 text-right font-medium">
                          {formatHoursDisplay(row.totalHours)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-[var(--color-border)] bg-[var(--color-brand-teal-light)]">
                      <td className="px-3 py-3 font-semibold" colSpan={2}>
                        TOTAL
                      </td>
                      <td className="px-3 py-3 text-right font-semibold">
                        {formatHoursDisplay(report.totalHours)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="no-print space-y-3">
            <h3 className="text-base font-semibold text-[var(--color-text)]">Daily breakdown</h3>
            <p className="text-xs text-[var(--color-muted)]">
              Hours are credited only when Present/Late has both arrival and departure. A = Absent,
              L = On leave. Blank days are not recorded as absent.
            </p>
            {report.employees.length === 0 ? (
              <div className="empty-state text-sm">No daily attendance to show for this month.</div>
            ) : (
              <div className="table-shell">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
                    <tr>
                      <th className="sticky left-0 bg-[var(--color-brand-teal-light)] px-2 py-2 font-medium">
                        Employee
                      </th>
                      <th className="px-2 py-2 font-medium">Position</th>
                      {Array.from({ length: report.dayCount }, (_, index) => (
                        <th key={index + 1} className="px-1 py-2 text-center font-medium">
                          {index + 1}
                        </th>
                      ))}
                      <th className="px-2 py-2 text-right font-medium">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.employees.map((row) => (
                      <tr
                        key={row.employee.id}
                        className="border-b border-[var(--color-border)] last:border-b-0"
                      >
                        <td className="sticky left-0 bg-[var(--color-surface)] px-2 py-2 whitespace-nowrap font-medium">
                          {row.employee.full_name}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {row.employee.position ?? '—'}
                        </td>
                        {row.dayLabels.map((label, index) => (
                          <td key={index} className="px-1 py-2 text-center tabular-nums">
                            {label || '·'}
                          </td>
                        ))}
                        <td className="px-2 py-2 text-right font-medium tabular-nums">
                          {formatHoursDisplay(row.totalHours)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="no-print space-y-3">
            <h3 className="text-base font-semibold text-[var(--color-text)]">
              Records requiring review
            </h3>
            {report.exceptions.length === 0 ? (
              <p className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm text-[var(--color-muted)]">
                No attendance records require review for this month.
              </p>
            ) : (
              <div className="table-shell">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
                    <tr>
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Employee</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.exceptions.map((row) => (
                      <tr
                        key={`${row.employeeId}-${row.date}-${row.exceptions.map((item) => item.kind).join('-')}`}
                        className="border-b border-[var(--color-border)] last:border-b-0"
                      >
                        <td className="px-3 py-3 whitespace-nowrap">
                          {formatDateLabel(row.date)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium">{row.employeeName}</div>
                          <div className="text-xs text-[var(--color-muted)]">
                            {row.employeeCode}
                          </div>
                        </td>
                        <td className="px-3 py-3">{ATTENDANCE_STATUS_LABELS[row.status]}</td>
                        <td className="px-3 py-3 text-[var(--color-warning-text)]">
                          {row.exceptions.map((item) => item.label).join('; ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <PrintPreviewModal
            open={printMode !== null && report !== null}
            title={printTitle}
            landscape={printMode === 'register'}
            onClose={() => setPrintMode(null)}
          >
            {printMode === 'summary' && report ? (
              <PrintReportLayout
                reportTitle="MONTHLY HOURS REPORT"
                periodLabel={periodLabel}
                generatedAt={generatedAt}
                orientation="portrait"
                footerNote="Hours credited from Present/Late records with both arrival and departure times."
              >
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Position</th>
                      <th className="text-right">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.employees.map((row) => (
                      <tr key={row.employee.id}>
                        <td>{row.employee.full_name}</td>
                        <td>{row.employee.position ?? '—'}</td>
                        <td className="text-right">{formatHoursDisplay(row.totalHours)}</td>
                      </tr>
                    ))}
                    <tr className="print-total-row">
                      <td colSpan={2}>
                        <strong>TOTAL</strong>
                      </td>
                      <td className="text-right">
                        <strong>{formatHoursDisplay(report.totalHours)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </PrintReportLayout>
            ) : null}

            {printMode === 'register' && report ? (
              <PrintReportLayout
                reportTitle={`ATTENDANCE REGISTER — ${report.monthLabel.toUpperCase()}`}
                periodLabel={periodLabel}
                generatedAt={generatedAt}
                orientation="landscape"
                footerNote="A = Absent, L = On leave. Blank = no attendance record for that day (not assumed absent)."
              >
                <table className="print-table print-table-compact">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Position</th>
                      {Array.from({ length: report.dayCount }, (_, index) => (
                        <th key={index + 1} className="text-center">
                          {index + 1}
                        </th>
                      ))}
                      <th className="text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.employees.map((row) => (
                      <tr key={row.employee.id}>
                        <td>{row.employee.full_name}</td>
                        <td>{row.employee.position ?? '—'}</td>
                        {row.dayLabels.map((label, index) => (
                          <td key={index} className="text-center">
                            {label}
                          </td>
                        ))}
                        <td className="text-right">{formatHoursDisplay(row.totalHours)}</td>
                      </tr>
                    ))}
                    <tr className="print-total-row">
                      <td colSpan={2}>
                        <strong>TOTAL</strong>
                      </td>
                      <td colSpan={report.dayCount} />
                      <td className="text-right">
                        <strong>{formatHoursDisplay(report.totalHours)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </PrintReportLayout>
            ) : null}
          </PrintPreviewModal>
        </>
      )}
    </div>
  )
}
