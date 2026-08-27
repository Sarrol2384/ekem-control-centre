import type { AttendanceStatus } from '../types'
import { ATTENDANCE_STATUS_LABELS } from '../types'

const STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-50 text-emerald-800',
  late: 'bg-amber-50 text-amber-900',
  absent: 'bg-red-50 text-red-800',
  on_leave: 'bg-sky-50 text-sky-900',
}

export function AttendanceStatusBadge({
  status,
}: {
  status: AttendanceStatus | null | undefined
}) {
  if (!status) {
    return (
      <span className="inline-flex bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
        Not recorded
      </span>
    )
  }

  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {ATTENDANCE_STATUS_LABELS[status]}
    </span>
  )
}
