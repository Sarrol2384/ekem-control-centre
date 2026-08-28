import { addDays, todayDateOnly } from '../attendance/dateUtils'
import { calculateLeaveDays } from './dateUtils'
import type { LeaveInsert, LeaveRequest, LeaveUpdate } from './types'

const STORAGE_KEY = 'ekem.leave.demo.requests.v2'

const DEMO_EMPLOYEE_IDS = {
  thandi: '11111111-1111-4111-8111-111111111101',
  jason: '11111111-1111-4111-8111-111111111102',
  lerato: '11111111-1111-4111-8111-111111111103',
  michael: '11111111-1111-4111-8111-111111111104',
} as const

function nowIso(): string {
  return new Date().toISOString()
}

function createId(): string {
  return crypto.randomUUID()
}

function createSeedRequests(): LeaveRequest[] {
  const today = todayDateOnly()
  const createdAt = nowIso()
  return [
    {
      id: '33333333-3333-4333-8333-333333333301',
      employee_id: DEMO_EMPLOYEE_IDS.thandi,
      leave_type: 'annual',
      status: 'pending',
      start_date: addDays(today, 14),
      end_date: addDays(today, 18),
      days_count: calculateLeaveDays(addDays(today, 14), addDays(today, 18)),
      notes: 'Demonstration pending annual leave request.',
      reviewed_by: null,
      reviewed_at: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '33333333-3333-4333-8333-333333333302',
      employee_id: DEMO_EMPLOYEE_IDS.jason,
      leave_type: 'sick',
      status: 'approved',
      start_date: today,
      end_date: addDays(today, 1),
      days_count: calculateLeaveDays(today, addDays(today, 1)),
      notes: 'Demonstration approved sick leave covering today.',
      reviewed_by: null,
      reviewed_at: createdAt,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '33333333-3333-4333-8333-333333333303',
      employee_id: DEMO_EMPLOYEE_IDS.lerato,
      leave_type: 'family_responsibility',
      status: 'rejected',
      start_date: addDays(today, -20),
      end_date: addDays(today, -19),
      days_count: calculateLeaveDays(addDays(today, -20), addDays(today, -19)),
      notes: 'Demonstration rejected leave request.',
      reviewed_by: null,
      reviewed_at: createdAt,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '33333333-3333-4333-8333-333333333304',
      employee_id: DEMO_EMPLOYEE_IDS.michael,
      leave_type: 'annual',
      status: 'approved',
      start_date: addDays(today, 30),
      end_date: addDays(today, 34),
      days_count: calculateLeaveDays(addDays(today, 30), addDays(today, 34)),
      notes: 'Demonstration upcoming approved annual leave.',
      reviewed_by: null,
      reviewed_at: createdAt,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
  ]
}

function readStore(): LeaveRequest[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = createSeedRequests()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
  try {
    const parsed = JSON.parse(raw) as LeaveRequest[]
    if (!Array.isArray(parsed)) throw new Error('Invalid store')
    return parsed
  } catch {
    const seed = createSeedRequests()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeStore(rows: LeaveRequest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

export const localLeaveStore = {
  list(): LeaveRequest[] {
    return readStore().sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  getById(id: string): LeaveRequest | null {
    return readStore().find((row) => row.id === id) ?? null
  },

  listApprovedForDate(date: string): LeaveRequest[] {
    return readStore().filter(
      (row) =>
        row.status === 'approved' && row.start_date <= date && row.end_date >= date,
    )
  },

  create(input: LeaveInsert): LeaveRequest {
    const rows = readStore()
    const timestamp = nowIso()
    const created: LeaveRequest = {
      id: createId(),
      employee_id: input.employee_id,
      leave_type: input.leave_type,
      status: input.status ?? 'pending',
      start_date: input.start_date,
      end_date: input.end_date,
      days_count: input.days_count,
      notes: input.notes ?? null,
      reviewed_by: input.reviewed_by ?? null,
      reviewed_at: input.reviewed_at ?? null,
      is_demo: input.is_demo ?? true,
      created_at: timestamp,
      updated_at: timestamp,
    }
    writeStore([created, ...rows])
    return created
  },

  update(id: string, patch: LeaveUpdate): LeaveRequest {
    const rows = readStore()
    const index = rows.findIndex((row) => row.id === id)
    if (index < 0) throw new Error('Leave request not found.')
    const current = rows[index]!
    const updated: LeaveRequest = {
      ...current,
      ...patch,
      id: current.id,
      days_count:
        patch.start_date || patch.end_date
          ? calculateLeaveDays(
              patch.start_date ?? current.start_date,
              patch.end_date ?? current.end_date,
            )
          : (patch.days_count ?? current.days_count),
      updated_at: nowIso(),
    }
    const next = [...rows]
    next[index] = updated
    writeStore(next)
    return updated
  },
}
