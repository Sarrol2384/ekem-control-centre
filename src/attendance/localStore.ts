import type { AttendanceInsert, AttendanceRecord, AttendanceUpdate } from './types'
import { addDays, todayDateOnly } from './dateUtils'

const STORAGE_KEY = 'ekem.attendance.demo.records.v1'

/** Stable demo employee ids from staff local seed. */
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

function createSeedRecords(): AttendanceRecord[] {
  const yesterday = addDays(todayDateOnly(), -1)
  const createdAt = nowIso()
  return [
    {
      id: '22222222-2222-4222-8222-222222222201',
      employee_id: DEMO_EMPLOYEE_IDS.thandi,
      attendance_date: yesterday,
      status: 'present',
      arrival_time: '08:55:00',
      departure_time: '17:05:00',
      notes: 'Demonstration attendance record — not from a live time-clock system.',
      recorded_by: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '22222222-2222-4222-8222-222222222202',
      employee_id: DEMO_EMPLOYEE_IDS.jason,
      attendance_date: yesterday,
      status: 'late',
      arrival_time: '09:40:00',
      departure_time: '17:10:00',
      notes: 'Demonstration attendance record — arrived after opening.',
      recorded_by: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '22222222-2222-4222-8222-222222222203',
      employee_id: DEMO_EMPLOYEE_IDS.michael,
      attendance_date: yesterday,
      status: 'absent',
      arrival_time: null,
      departure_time: null,
      notes: 'Demonstration attendance record — marked absent by manager.',
      recorded_by: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '22222222-2222-4222-8222-222222222204',
      employee_id: DEMO_EMPLOYEE_IDS.lerato,
      attendance_date: yesterday,
      status: 'on_leave',
      arrival_time: null,
      departure_time: null,
      notes: 'Demonstration attendance record — manager marked on leave.',
      recorded_by: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
  ]
}

function readStore(): AttendanceRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = createSeedRecords()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }

  try {
    const parsed = JSON.parse(raw) as AttendanceRecord[]
    if (!Array.isArray(parsed)) throw new Error('Invalid store')
    return parsed
  } catch {
    const seed = createSeedRecords()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeStore(records: AttendanceRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function normalizeTime(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null
  const trimmed = value.trim()
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed
}

export const localAttendanceStore = {
  listByDate(date: string): AttendanceRecord[] {
    return readStore().filter((record) => record.attendance_date === date)
  },

  listByRange(start: string, end: string): AttendanceRecord[] {
    return readStore()
      .filter((record) => record.attendance_date >= start && record.attendance_date <= end)
      .sort((a, b) => {
        const byDate = b.attendance_date.localeCompare(a.attendance_date)
        if (byDate !== 0) return byDate
        return a.employee_id.localeCompare(b.employee_id)
      })
  },

  getByEmployeeAndDate(employeeId: string, date: string): AttendanceRecord | null {
    return (
      readStore().find(
        (record) => record.employee_id === employeeId && record.attendance_date === date,
      ) ?? null
    )
  },

  upsert(
    input: AttendanceInsert & { employee_id: string; attendance_date: string },
  ): AttendanceRecord {
    const records = readStore()
    const existingIndex = records.findIndex(
      (record) =>
        record.employee_id === input.employee_id &&
        record.attendance_date === input.attendance_date,
    )

    const timestamp = nowIso()
    const payload = {
      employee_id: input.employee_id,
      attendance_date: input.attendance_date,
      status: input.status,
      arrival_time: normalizeTime(input.arrival_time),
      departure_time: normalizeTime(input.departure_time),
      notes: input.notes?.trim() ? input.notes.trim() : null,
      recorded_by: input.recorded_by ?? null,
      is_demo: input.is_demo ?? true,
    }

    if (existingIndex >= 0) {
      const current = records[existingIndex]!
      const updated: AttendanceRecord = {
        ...current,
        ...payload,
        id: current.id,
        updated_at: timestamp,
      }
      const next = [...records]
      next[existingIndex] = updated
      writeStore(next)
      return updated
    }

    const created: AttendanceRecord = {
      id: createId(),
      ...payload,
      created_at: timestamp,
      updated_at: timestamp,
    }
    writeStore([...records, created])
    return created
  },

  update(id: string, patch: AttendanceUpdate): AttendanceRecord {
    const records = readStore()
    const index = records.findIndex((record) => record.id === id)
    if (index < 0) throw new Error('Attendance record not found.')

    const current = records[index]!
    const updated: AttendanceRecord = {
      ...current,
      ...patch,
      arrival_time:
        patch.arrival_time !== undefined
          ? normalizeTime(patch.arrival_time)
          : current.arrival_time,
      departure_time:
        patch.departure_time !== undefined
          ? normalizeTime(patch.departure_time)
          : current.departure_time,
      id: current.id,
      updated_at: nowIso(),
    }
    const next = [...records]
    next[index] = updated
    writeStore(next)
    return updated
  },
}
