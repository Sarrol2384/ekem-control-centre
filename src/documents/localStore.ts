import { addDays, todayDateOnly } from '../attendance/dateUtils'
import type { EmployeeDocument, EmployeeDocumentInsert, EmployeeDocumentUpdate } from './types'

const STORAGE_KEY = 'ekem.documents.demo.records.v1'

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

function createSeedRecords(): EmployeeDocument[] {
  const today = todayDateOnly()
  const createdAt = nowIso()

  return [
    {
      id: '66666666-6666-4666-8666-666666666601',
      employee_id: DEMO_EMPLOYEE_IDS.thandi,
      title: 'Employment Contract',
      document_type: 'employment_contract',
      document_date: '2022-03-14',
      expiry_date: null,
      storage_path: null,
      reference_code: 'DEMO-CONTRACT-1001',
      notes: 'Demonstration employment contract metadata (no file uploaded).',
      uploaded_by: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '66666666-6666-4666-8666-666666666602',
      employee_id: DEMO_EMPLOYEE_IDS.jason,
      title: 'First Aid Certificate',
      document_type: 'training_certificate',
      document_date: addDays(today, -365),
      expiry_date: addDays(today, 14),
      storage_path: null,
      reference_code: 'DEMO-FA-CERT-1002',
      notes: 'Demonstration training certificate expiring within 30 days.',
      uploaded_by: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '66666666-6666-4666-8666-666666666603',
      employee_id: DEMO_EMPLOYEE_IDS.lerato,
      title: 'B.Pharm Qualification',
      document_type: 'qualification',
      document_date: addDays(today, -2000),
      expiry_date: addDays(today, -60),
      storage_path: null,
      reference_code: 'DEMO-QUAL-1003',
      notes: 'Demonstration expired qualification record.',
      uploaded_by: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '66666666-6666-4666-8666-666666666604',
      employee_id: DEMO_EMPLOYEE_IDS.michael,
      title: 'SAPC Registration',
      document_type: 'professional_registration',
      document_date: addDays(today, -400),
      expiry_date: addDays(today, 200),
      storage_path: null,
      reference_code: 'DEMO-REG-1004',
      notes: 'Demonstration valid professional registration.',
      uploaded_by: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '66666666-6666-4666-8666-666666666605',
      employee_id: DEMO_EMPLOYEE_IDS.thandi,
      title: 'National ID Copy',
      document_type: 'identification',
      document_date: addDays(today, -100),
      expiry_date: null,
      storage_path: null,
      reference_code: 'DEMO-ID-1001',
      notes: 'Demonstration identification record with no expiry date.',
      uploaded_by: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: '66666666-6666-4666-8666-666666666606',
      employee_id: DEMO_EMPLOYEE_IDS.nadia,
      title: 'Employment Contract (Archived)',
      document_type: 'employment_contract',
      document_date: addDays(today, -900),
      expiry_date: addDays(today, -200),
      storage_path: null,
      reference_code: 'DEMO-CONTRACT-1005',
      notes: 'Demonstration historical document for inactive employee.',
      uploaded_by: null,
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
  ]
}

function readRecords(): EmployeeDocument[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = createSeedRecords()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
  try {
    const parsed = JSON.parse(raw) as EmployeeDocument[]
    if (!Array.isArray(parsed)) throw new Error('Invalid store')
    return parsed
  } catch {
    const seed = createSeedRecords()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeRecords(rows: EmployeeDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

export const localDocumentStore = {
  list(): EmployeeDocument[] {
    return readRecords().sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  getById(id: string): EmployeeDocument | null {
    return readRecords().find((row) => row.id === id) ?? null
  },

  create(input: EmployeeDocumentInsert): EmployeeDocument {
    const rows = readRecords()
    const timestamp = nowIso()
    const created: EmployeeDocument = {
      id: input.id ?? createId(),
      employee_id: input.employee_id,
      title: input.title,
      document_type: input.document_type,
      document_date: input.document_date ?? null,
      expiry_date: input.expiry_date ?? null,
      storage_path: input.storage_path ?? null,
      reference_code: input.reference_code ?? null,
      notes: input.notes ?? null,
      uploaded_by: input.uploaded_by ?? null,
      is_demo: input.is_demo ?? true,
      created_at: timestamp,
      updated_at: timestamp,
    }
    writeRecords([created, ...rows])
    return created
  },

  update(id: string, patch: EmployeeDocumentUpdate): EmployeeDocument {
    const rows = readRecords()
    const index = rows.findIndex((row) => row.id === id)
    if (index < 0) throw new Error('Document not found.')
    const current = rows[index]!
    const updated: EmployeeDocument = {
      ...current,
      ...patch,
      id: current.id,
      updated_at: nowIso(),
    }
    const next = [...rows]
    next[index] = updated
    writeRecords(next)
    return updated
  },

  remove(id: string): void {
    const rows = readRecords().filter((row) => row.id !== id)
    writeRecords(rows)
  },
}
