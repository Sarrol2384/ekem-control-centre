import { addDays, todayDateOnly } from '../attendance/dateUtils'
import { deriveTrainingStatus } from './status'
import type { TrainingInsert, TrainingRecord, TrainingUpdate } from './types'

const STORAGE_KEY = 'ekem.training.demo.records.v1'

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

function createSeedRecords(): TrainingRecord[] {
  const today = todayDateOnly()
  const createdAt = nowIso()

  const seeds: Array<Omit<TrainingRecord, 'id' | 'created_at' | 'updated_at' | 'status'>> = [
    {
      employee_id: DEMO_EMPLOYEE_IDS.thandi,
      training_name: 'First Aid Level 1',
      provider: 'Demo Safety Training',
      training_date: addDays(today, -180),
      expiry_date: addDays(today, 335),
      certificate_reference: 'FA-DEMO-1001',
      notes: 'Demonstration valid training with future expiry.',
      is_demo: true,
    },
    {
      employee_id: DEMO_EMPLOYEE_IDS.jason,
      training_name: 'Cold Chain Compliance',
      provider: 'Demo Pharma Academy',
      training_date: addDays(today, -350),
      expiry_date: addDays(today, 14),
      certificate_reference: 'CCC-DEMO-1002',
      notes: 'Demonstration training expiring within 30 days.',
      is_demo: true,
    },
    {
      employee_id: DEMO_EMPLOYEE_IDS.lerato,
      training_name: 'Good Pharmacy Practice',
      provider: 'Demo Regulatory Institute',
      training_date: addDays(today, -400),
      expiry_date: addDays(today, -45),
      certificate_reference: 'GPP-DEMO-1003',
      notes: 'Demonstration expired training certificate.',
      is_demo: true,
    },
    {
      employee_id: DEMO_EMPLOYEE_IDS.michael,
      training_name: 'Responsible Pharmacist Update',
      provider: 'Demo Professional Board',
      training_date: null,
      expiry_date: addDays(today, 90),
      certificate_reference: null,
      notes: 'Demonstration training not yet completed (no training date).',
      is_demo: true,
    },
    {
      employee_id: DEMO_EMPLOYEE_IDS.jason,
      training_name: 'Pharmacy Induction',
      provider: 'Demo Internal Training',
      training_date: addDays(today, -730),
      expiry_date: null,
      certificate_reference: 'IND-DEMO-1002',
      notes: 'Demonstration completed training with no expiry date.',
      is_demo: true,
    },
    {
      employee_id: DEMO_EMPLOYEE_IDS.nadia,
      training_name: 'Cashier Compliance Refresher',
      provider: 'Demo Retail Academy',
      training_date: addDays(today, -500),
      expiry_date: addDays(today, -120),
      certificate_reference: 'CCR-DEMO-1005',
      notes: 'Demonstration historical training for inactive employee.',
      is_demo: true,
    },
  ]

  return seeds.map((seed, index) => {
    const status = deriveTrainingStatus(seed)
    return {
      id: `55555555-5555-4555-8555-55555555550${index + 1}`,
      ...seed,
      status,
      created_at: createdAt,
      updated_at: createdAt,
    }
  })
}

function readRecords(): TrainingRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = createSeedRecords()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
  try {
    const parsed = JSON.parse(raw) as TrainingRecord[]
    if (!Array.isArray(parsed)) throw new Error('Invalid store')
    return parsed
  } catch {
    const seed = createSeedRecords()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeRecords(rows: TrainingRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

export const localTrainingStore = {
  list(): TrainingRecord[] {
    return readRecords().sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  getById(id: string): TrainingRecord | null {
    return readRecords().find((row) => row.id === id) ?? null
  },

  create(input: TrainingInsert): TrainingRecord {
    const rows = readRecords()
    const timestamp = nowIso()
    const base = {
      employee_id: input.employee_id,
      training_name: input.training_name,
      provider: input.provider ?? null,
      training_date: input.training_date ?? null,
      expiry_date: input.expiry_date ?? null,
      certificate_reference: input.certificate_reference ?? null,
      notes: input.notes ?? null,
      is_demo: input.is_demo ?? true,
    }
    const created: TrainingRecord = {
      id: createId(),
      ...base,
      status: deriveTrainingStatus(base),
      created_at: timestamp,
      updated_at: timestamp,
    }
    writeRecords([created, ...rows])
    return created
  },

  update(id: string, patch: TrainingUpdate): TrainingRecord {
    const rows = readRecords()
    const index = rows.findIndex((row) => row.id === id)
    if (index < 0) throw new Error('Training record not found.')
    const current = rows[index]!
    const merged = {
      ...current,
      ...patch,
      id: current.id,
      updated_at: nowIso(),
    }
    const updated: TrainingRecord = {
      ...merged,
      status: deriveTrainingStatus(merged),
    }
    const next = [...rows]
    next[index] = updated
    writeRecords(next)
    return updated
  },
}
