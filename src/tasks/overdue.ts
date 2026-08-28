import { addDays, todayDateOnly } from '../attendance/dateUtils'
import type { Task, TaskStatus } from './types'

/** Overdue when due date has passed and the task is not completed. */
export function isTaskOverdue(
  task: Pick<Task, 'due_date' | 'status'>,
  today: string = todayDateOnly(),
): boolean {
  if (task.status === 'completed') return false
  if (!task.due_date) return false
  return task.due_date < today
}

export function isDueToday(
  task: Pick<Task, 'due_date'>,
  today: string = todayDateOnly(),
): boolean {
  return Boolean(task.due_date && task.due_date === today)
}

export function isDueThisWeek(
  task: Pick<Task, 'due_date'>,
  today: string = todayDateOnly(),
): boolean {
  if (!task.due_date) return false
  const weekEnd = addDays(today, 6)
  return task.due_date >= today && task.due_date <= weekEnd
}

export function effectiveTaskStatus(
  task: Pick<Task, 'status' | 'due_date'>,
  today: string = todayDateOnly(),
): TaskStatus | 'overdue' {
  if (isTaskOverdue(task, today)) return 'overdue'
  return task.status as TaskStatus
}
