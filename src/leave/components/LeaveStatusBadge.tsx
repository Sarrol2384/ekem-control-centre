import type { LeaveStatus } from '../types'
import { LEAVE_STATUS_LABELS } from '../types'

const STYLES: Record<LeaveStatus, string> = {
  pending: 'bg-amber-50 text-amber-900',
  approved: 'bg-emerald-50 text-emerald-800',
  rejected: 'bg-red-50 text-red-800',
  cancelled: 'bg-slate-100 text-slate-700',
}

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LEAVE_STATUS_LABELS[status]}
    </span>
  )
}
