import type { DocumentManagementStatus } from '../types'
import { DOCUMENT_STATUS_LABELS } from '../types'

type DocumentStatusBadgeProps = {
  status: DocumentManagementStatus
}

const STATUS_STYLES: Record<DocumentManagementStatus, string> = {
  valid: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  expiring_soon: 'border-amber-200 bg-amber-50 text-amber-900',
  expired: 'border-red-200 bg-red-50 text-red-900',
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {DOCUMENT_STATUS_LABELS[status]}
    </span>
  )
}
