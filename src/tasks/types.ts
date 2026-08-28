import type { Database } from '../lib/database.types'
import type { Employee } from '../staff/types'

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'todo' | 'in_progress' | 'completed'

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']
export type TaskActivity = Database['public']['Tables']['task_activity']['Row']

export type TaskWithEmployee = Task & {
  employee: Employee | null
}

export type TaskFormValues = {
  title: string
  description: string
  assigned_employee_id: string
  due_date: string
  priority: TaskPriority
  status: TaskStatus
}

export type TaskStatusFilter = 'all' | TaskStatus | 'overdue'
export type TaskDueFilter = 'all' | 'overdue' | 'due_today' | 'due_this_week' | 'no_due_date'
export type TaskSortField = 'due_date' | 'priority' | 'title' | 'status' | 'created_at'

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

export function emptyTaskForm(): TaskFormValues {
  return {
    title: '',
    description: '',
    assigned_employee_id: '',
    due_date: '',
    priority: 'medium',
    status: 'todo',
  }
}

export function taskToFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? '',
    assigned_employee_id: task.assigned_employee_id ?? '',
    due_date: task.due_date ?? '',
    priority: task.priority as TaskPriority,
    status: task.status as TaskStatus,
  }
}
