import { addDays, todayDateOnly } from '../attendance/dateUtils'
import { LOCAL_DEMO_PROFILE } from '../auth/AuthContext'
import type { Task, TaskActivity, TaskInsert, TaskUpdate } from './types'

const TASKS_KEY = 'ekem.tasks.demo.tasks.v2'
const ACTIVITY_KEY = 'ekem.tasks.demo.activity.v2'

const DEMO_EMPLOYEE_IDS = {
  thandi: '11111111-1111-4111-8111-111111111101',
  jason: '11111111-1111-4111-8111-111111111102',
  lerato: '11111111-1111-4111-8111-111111111103',
  michael: '11111111-1111-4111-8111-111111111104',
  nadia: '11111111-1111-4111-8111-111111111105',
} as const

function nowIso(): string {
  return new Date().toISOString()
}

function createId(): string {
  return crypto.randomUUID()
}

function createSeedTasks(): Task[] {
  const today = todayDateOnly()
  const createdAt = nowIso()
  const completedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  return [
    {
      id: '44444444-4444-4444-8444-444444444401',
      title: 'Complete weekly stock count',
      description: 'Demonstration task: reconcile store inventory with system counts.',
      assigned_employee_id: DEMO_EMPLOYEE_IDS.michael,
      created_by: LOCAL_DEMO_PROFILE.id,
      due_date: addDays(today, 2),
      priority: 'medium',
      status: 'in_progress',
      completed_at: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '44444444-4444-4444-8444-444444444402',
      title: 'Check refrigerator temperature records',
      description: 'Demonstration task: verify cold-chain temperature logs for the past week.',
      assigned_employee_id: DEMO_EMPLOYEE_IDS.jason,
      created_by: LOCAL_DEMO_PROFILE.id,
      due_date: addDays(today, -1),
      priority: 'high',
      status: 'todo',
      completed_at: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '44444444-4444-4444-8444-444444444403',
      title: 'Review outstanding supplier documentation',
      description: 'Demonstration task: follow up on missing delivery notes and invoices.',
      assigned_employee_id: DEMO_EMPLOYEE_IDS.lerato,
      created_by: LOCAL_DEMO_PROFILE.id,
      due_date: addDays(today, -3),
      priority: 'critical',
      status: 'todo',
      completed_at: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '44444444-4444-4444-8444-444444444404',
      title: 'Prepare weekend roster',
      description: 'Demonstration task: draft Saturday staffing coverage.',
      assigned_employee_id: DEMO_EMPLOYEE_IDS.jason,
      created_by: LOCAL_DEMO_PROFILE.id,
      due_date: addDays(today, -7),
      priority: 'low',
      status: 'completed',
      completed_at: completedAt,
      is_demo: true,
      created_at: createdAt,
      updated_at: completedAt,
    },
    {
      id: '44444444-4444-4444-8444-444444444405',
      title: 'Update staff training records',
      description: 'Demonstration task: confirm training expiry dates are current.',
      assigned_employee_id: DEMO_EMPLOYEE_IDS.thandi,
      created_by: LOCAL_DEMO_PROFILE.id,
      due_date: addDays(today, 7),
      priority: 'medium',
      status: 'todo',
      completed_at: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '44444444-4444-4444-8444-444444444406',
      title: 'Archive front-shop promotional materials',
      description:
        'Demonstration task: historical record assigned before employee became inactive.',
      assigned_employee_id: DEMO_EMPLOYEE_IDS.nadia,
      created_by: LOCAL_DEMO_PROFILE.id,
      due_date: addDays(today, -14),
      priority: 'low',
      status: 'completed',
      completed_at: completedAt,
      is_demo: true,
      created_at: createdAt,
      updated_at: completedAt,
    },
  ]
}

function createSeedActivity(tasks: Task[]): TaskActivity[] {
  const createdAt = nowIso()
  return tasks.map((task) => ({
    id: createId(),
    task_id: task.id,
    actor_id: LOCAL_DEMO_PROFILE.id,
    action: 'task_created',
    details: `Demonstration task "${task.title}" created.`,
    created_at: createdAt,
  }))
}

function readTasks(): Task[] {
  const raw = localStorage.getItem(TASKS_KEY)
  if (!raw) {
    const seed = createSeedTasks()
    localStorage.setItem(TASKS_KEY, JSON.stringify(seed))
    const activity = createSeedActivity(seed)
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity))
    return seed
  }
  try {
    const parsed = JSON.parse(raw) as Task[]
    if (!Array.isArray(parsed)) throw new Error('Invalid store')
    return parsed
  } catch {
    const seed = createSeedTasks()
    localStorage.setItem(TASKS_KEY, JSON.stringify(seed))
    const activity = createSeedActivity(seed)
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity))
    return seed
  }
}

function writeTasks(rows: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(rows))
}

function readActivity(): TaskActivity[] {
  const raw = localStorage.getItem(ACTIVITY_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as TaskActivity[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeActivity(rows: TaskActivity[]): void {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(rows))
}

export const localTaskStore = {
  list(): Task[] {
    return readTasks().sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  getById(id: string): Task | null {
    return readTasks().find((row) => row.id === id) ?? null
  },

  create(input: TaskInsert): Task {
    const rows = readTasks()
    const timestamp = nowIso()
    const created: Task = {
      id: createId(),
      title: input.title,
      description: input.description ?? null,
      assigned_employee_id: input.assigned_employee_id ?? null,
      created_by: input.created_by ?? null,
      due_date: input.due_date ?? null,
      priority: input.priority ?? 'medium',
      status: input.status ?? 'todo',
      completed_at: input.completed_at ?? null,
      is_demo: input.is_demo ?? true,
      created_at: timestamp,
      updated_at: timestamp,
    }
    writeTasks([created, ...rows])
    return created
  },

  update(id: string, patch: TaskUpdate): Task {
    const rows = readTasks()
    const index = rows.findIndex((row) => row.id === id)
    if (index < 0) throw new Error('Task not found.')
    const current = rows[index]!
    const updated: Task = {
      ...current,
      ...patch,
      id: current.id,
      updated_at: nowIso(),
    }
    const next = [...rows]
    next[index] = updated
    writeTasks(next)
    return updated
  },

  listActivity(taskId: string): TaskActivity[] {
    return readActivity()
      .filter((row) => row.task_id === taskId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  addActivity(input: Omit<TaskActivity, 'id' | 'created_at'>): TaskActivity {
    const rows = readActivity()
    const created: TaskActivity = {
      id: createId(),
      task_id: input.task_id,
      actor_id: input.actor_id,
      action: input.action,
      details: input.details,
      created_at: nowIso(),
    }
    writeActivity([created, ...rows])
    return created
  },
}
