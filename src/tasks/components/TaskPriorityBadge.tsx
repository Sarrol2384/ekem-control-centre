import type { TaskPriority } from '../types'
import { TASK_PRIORITY_LABELS } from '../types'

const STYLES: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-sky-50 text-sky-800',
  high: 'bg-amber-50 text-amber-900',
  critical: 'bg-red-50 text-red-800',
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium ${STYLES[priority]}`}>
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  )
}
