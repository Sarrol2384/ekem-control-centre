import type { TrainingManagementStatus } from '../types'
import { TRAINING_STATUS_LABELS } from '../types'

type TrainingStatusBadgeProps = {
  status: TrainingManagementStatus
}

const STATUS_STYLES: Record<TrainingManagementStatus, string> = {
  valid: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  due: 'border-sky-200 bg-sky-50 text-sky-900',
  expiring_soon: 'border-amber-200 bg-amber-50 text-amber-900',
  expired: 'border-red-200 bg-red-50 text-red-900',
}

export function TrainingStatusBadge({ status }: TrainingStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {TRAINING_STATUS_LABELS[status]}
    </span>
  )
}
