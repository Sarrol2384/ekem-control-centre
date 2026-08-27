import type { EmploymentStatus } from '../types'

const LABELS: Record<EmploymentStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  archived: 'Archived',
}

export function EmploymentStatusBadge({ status }: { status: EmploymentStatus }) {
  const isActive = status === 'active'
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-medium ${
        isActive
          ? 'bg-emerald-50 text-emerald-800'
          : 'bg-slate-100 text-slate-700'
      }`}
    >
      {LABELS[status]}
    </span>
  )
}
