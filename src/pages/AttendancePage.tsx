import { useState } from 'react'
import { AttendanceHistoryView } from '../attendance/components/AttendanceHistoryView'
import { AttendanceTodayView } from '../attendance/components/AttendanceTodayView'

type AttendanceTab = 'today' | 'history'

export function AttendancePage() {
  const [tab, setTab] = useState<AttendanceTab>('today')

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Attendance</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--color-muted)]">
          Manager-controlled daily attendance. Inactive employees are excluded from today&apos;s
          roster. This module is not connected to biometric or external time-clock systems.
        </p>
      </div>

      <div className="flex gap-2 border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => setTab('today')}
          className={`px-3 py-2 text-sm ${
            tab === 'today'
              ? 'border-b-2 border-[var(--color-primary)] font-medium text-[var(--color-primary)]'
              : 'text-[var(--color-muted)]'
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`px-3 py-2 text-sm ${
            tab === 'history'
              ? 'border-b-2 border-[var(--color-primary)] font-medium text-[var(--color-primary)]'
              : 'text-[var(--color-muted)]'
          }`}
        >
          History
        </button>
      </div>

      {tab === 'today' ? <AttendanceTodayView /> : <AttendanceHistoryView />}
    </section>
  )
}
