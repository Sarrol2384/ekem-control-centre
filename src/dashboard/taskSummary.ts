import { isDueToday, isTaskOverdue } from '../tasks/overdue'
import type { TaskWithEmployee } from '../tasks/types'
import { PRIORITY_WEIGHT } from '../tasks/types'
import { summarizeTasks } from '../tasks/api'
import { todayDateOnly } from '../attendance/dateUtils'
import type { TaskDashboardSummary } from './types'

export function getTaskSummary(
  tasks: TaskWithEmployee[],
  today: string = todayDateOnly(),
): TaskDashboardSummary {
  const counts = summarizeTasks(tasks, today)
  const active = tasks.filter((task) => task.status !== 'completed').length

  const priorityTasks = tasks
    .filter((task) => task.status !== 'completed')
    .sort((a, b) => {
      const overdueDiff = Number(isTaskOverdue(b, today)) - Number(isTaskOverdue(a, today))
      if (overdueDiff !== 0) return overdueDiff

      const dueTodayDiff = Number(isDueToday(b, today)) - Number(isDueToday(a, today))
      if (dueTodayDiff !== 0) return dueTodayDiff

      const priorityDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
      if (priorityDiff !== 0) return priorityDiff

      return (a.due_date ?? '9999-99-99').localeCompare(b.due_date ?? '9999-99-99')
    })
    .slice(0, 5)

  return {
    active,
    todo: counts.todo,
    in_progress: counts.in_progress,
    overdue: counts.overdue,
    completed: counts.completed,
    priorityTasks,
  }
}
