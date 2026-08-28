import type { TaskStatus } from '../types'
import { TASK_STATUS_LABELS } from '../types'

const STYLES: Record<TaskStatus | 'overdue', string> = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-sky-50 text-sky-800',
  completed: 'bg-emerald-50 text-emerald-800',
  overdue: 'bg-red-50 text-red-800',
}

type TaskStatusBadgeProps = {
  status: TaskStatus
  overdue?: boolean
}

export function TaskStatusBadge({ status, overdue = false }: TaskStatusBadgeProps) {
  if (overdue) {
    return (
      <span className={`inline-flex px-2 py-0.5 text-xs font-medium ${STYLES.overdue}`}>
        Overdue
      </span>
    )
  }

  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {TASK_STATUS_LABELS[status]}
    </span>
  )
}
