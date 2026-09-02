import type { Json } from '../lib/database.types'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import { getEmployee, listEmployees } from '../staff/api'
import type { Employee } from '../staff/types'
import { isTaskOverdue } from './overdue'
import { localTaskStore } from './localStore'
import type {
  Task,
  TaskActivity,
  TaskFormValues,
  TaskStatus,
  TaskWithEmployee,
} from './types'
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from './types'
import { todayDateOnly } from '../attendance/dateUtils'

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function writeAuditLog(input: {
  actorId: string | null
  action: string
  entityId: string
  metadata?: Json
}): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from('audit_logs').insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: 'task',
    entity_id: input.entityId,
    metadata: input.metadata ?? null,
  })

  if (error) {
    console.error('Failed to write audit log', error.message)
  }
}

async function logTaskActivity(input: {
  taskId: string
  actorId: string | null
  action: string
  details: string
}): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    localTaskStore.addActivity({
      task_id: input.taskId,
      actor_id: input.actorId,
      action: input.action,
      details: input.details,
    })
    return
  }

  const { error } = await supabase.from('task_activity').insert({
    task_id: input.taskId,
    actor_id: input.actorId,
    action: input.action,
    details: input.details,
  })

  if (error) {
    console.error('Failed to write task activity', error.message)
  }
}

function withEmployee(task: Task, employees: Map<string, Employee>): TaskWithEmployee {
  return {
    ...task,
    employee: task.assigned_employee_id
      ? (employees.get(task.assigned_employee_id) ?? null)
      : null,
  }
}

async function assertActiveEmployee(employeeId: string): Promise<Employee> {
  const employee = await getEmployee(employeeId)
  if (!employee) throw new Error('Employee not found.')
  if (employee.employment_status !== 'active') {
    throw new Error('Inactive employees cannot be assigned new tasks.')
  }
  return employee
}

export async function listTasks(): Promise<TaskWithEmployee[]> {
  const employees = await listEmployees()
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]))

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localTaskStore.list().map((row) => withEmployee(row, employeeMap))
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_demo', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => withEmployee(row, employeeMap))
}

export async function getTask(id: string): Promise<TaskWithEmployee | null> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    const row = localTaskStore.getById(id)
    if (!row) return null
    const employee = row.assigned_employee_id
      ? await getEmployee(row.assigned_employee_id)
      : null
    return { ...row, employee }
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('is_demo', false)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const employee = data.assigned_employee_id
    ? await getEmployee(data.assigned_employee_id)
    : null
  return { ...data, employee }
}

export async function listTaskActivity(taskId: string): Promise<TaskActivity[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return localTaskStore.listActivity(taskId)
  }

  const { data, error } = await supabase
    .from('task_activity')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createTask(
  values: TaskFormValues,
  actorId: string | null,
): Promise<Task> {
  await assertActiveEmployee(values.assigned_employee_id)

  const payload = {
    title: values.title.trim(),
    description: emptyToNull(values.description),
    assigned_employee_id: values.assigned_employee_id,
    created_by: actorId,
    due_date: emptyToNull(values.due_date),
    priority: values.priority,
    status: 'todo' as const,
    completed_at: null,
    is_demo: !isSupabaseConfigured,
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    const created = localTaskStore.create(payload)
    await logTaskActivity({
      taskId: created.id,
      actorId,
      action: 'task_created',
      details: `Task "${created.title}" created.`,
    })
    return created
  }

  const { data, error } = await supabase.from('tasks').insert(payload).select('*').single()
  if (error) throw new Error(error.message)

  await logTaskActivity({
    taskId: data.id,
    actorId,
    action: 'task_created',
    details: `Task "${data.title}" created.`,
  })

  await writeAuditLog({
    actorId,
    action: 'task_created',
    entityId: data.id,
    metadata: { title: data.title, assigned_employee_id: data.assigned_employee_id },
  })

  return data
}

export async function updateTask(
  id: string,
  values: TaskFormValues,
  actorId: string | null,
): Promise<Task> {
  const existing = await getTask(id)
  if (!existing) throw new Error('Task not found.')

  if (
    values.assigned_employee_id !== existing.assigned_employee_id &&
    values.assigned_employee_id
  ) {
    await assertActiveEmployee(values.assigned_employee_id)
  }

  const nextStatus = values.status
  const completedAt =
    nextStatus === 'completed'
      ? (existing.completed_at ?? new Date().toISOString())
      : nextStatus === 'todo' || nextStatus === 'in_progress'
        ? null
        : existing.completed_at

  const payload = {
    title: values.title.trim(),
    description: emptyToNull(values.description),
    assigned_employee_id: values.assigned_employee_id || null,
    due_date: emptyToNull(values.due_date),
    priority: values.priority,
    status: nextStatus,
    completed_at: completedAt,
  }

  const supabase = getSupabaseClient()
  let updated: Task

  if (!supabase) {
    updated = localTaskStore.update(id, payload)
  } else {
    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    updated = data
  }

  await logTaskChanges(existing, updated, actorId)

  await writeAuditLog({
    actorId,
    action: 'task_updated',
    entityId: updated.id,
    metadata: { title: updated.title },
  })

  return updated
}

async function logTaskChanges(
  before: Task,
  after: Task,
  actorId: string | null,
): Promise<void> {
  if (before.assigned_employee_id !== after.assigned_employee_id) {
    await logTaskActivity({
      taskId: after.id,
      actorId,
      action: 'assignment_changed',
      details: 'Task assignment updated.',
    })
  }
  if (before.status !== after.status) {
    await logTaskActivity({
      taskId: after.id,
      actorId,
      action: after.status === 'completed' ? 'task_completed' : 'status_changed',
      details: `Status changed to ${TASK_STATUS_LABELS[after.status as TaskStatus]}.`,
    })
  }
  if (before.priority !== after.priority) {
    await logTaskActivity({
      taskId: after.id,
      actorId,
      action: 'priority_changed',
      details: `Priority changed to ${TASK_PRIORITY_LABELS[after.priority as keyof typeof TASK_PRIORITY_LABELS]}.`,
    })
  }
  if (before.due_date !== after.due_date) {
    await logTaskActivity({
      taskId: after.id,
      actorId,
      action: 'due_date_changed',
      details: after.due_date
        ? `Due date set to ${after.due_date}.`
        : 'Due date cleared.',
    })
  }
  if (before.title !== after.title || before.description !== after.description) {
    await logTaskActivity({
      taskId: after.id,
      actorId,
      action: 'task_updated',
      details: 'Task details updated.',
    })
  }
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus,
  actorId: string | null,
): Promise<Task> {
  const existing = await getTask(id)
  if (!existing) throw new Error('Task not found.')

  const payload = {
    status,
    completed_at:
      status === 'completed'
        ? new Date().toISOString()
        : status === 'todo' || status === 'in_progress'
          ? null
          : existing.completed_at,
  }

  const supabase = getSupabaseClient()
  let updated: Task

  if (!supabase) {
    updated = localTaskStore.update(id, payload)
  } else {
    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    updated = data
  }

  if (existing.status !== status) {
    await logTaskActivity({
      taskId: id,
      actorId,
      action: status === 'completed' ? 'task_completed' : 'status_changed',
      details: `Status changed to ${TASK_STATUS_LABELS[status]}.`,
    })
  }

  return updated
}

export async function reopenTask(id: string, actorId: string | null): Promise<Task> {
  const existing = await getTask(id)
  if (!existing) throw new Error('Task not found.')
  if (existing.status !== 'completed') {
    throw new Error('Only completed tasks can be reopened.')
  }

  const updated = await setTaskStatus(id, 'todo', actorId)
  await logTaskActivity({
    taskId: id,
    actorId,
    action: 'task_reopened',
    details: 'Task reopened and set to To Do.',
  })
  return updated
}

export function summarizeTasks(rows: Task[], today: string = todayDateOnly()) {
  return {
    todo: rows.filter((row) => row.status === 'todo' && !isTaskOverdue(row, today)).length,
    in_progress: rows.filter((row) => row.status === 'in_progress').length,
    completed: rows.filter((row) => row.status === 'completed').length,
    overdue: rows.filter((row) => isTaskOverdue(row, today)).length,
  }
}
