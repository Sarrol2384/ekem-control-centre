import type { Employee } from './types'

const STORAGE_KEY = 'ekem.staff.demo.employees.v1'

function nowIso(): string {
  return new Date().toISOString()
}

function createId(): string {
  return crypto.randomUUID()
}

/** Fictional demonstration employees — not real Ekem staff. */
export function createSeedEmployees(): Employee[] {
  const createdAt = nowIso()
  return [
    {
      id: '11111111-1111-4111-8111-111111111101',
      employee_code: 'EMP-1001',
      full_name: 'Thandi Mokoena',
      position: 'Pharmacist',
      department: 'Dispensary',
      employment_status: 'active',
      start_date: '2021-03-15',
      contact_number: '082 555 0101',
      email: 'thandi.mokoena@example.com',
      address: '14 Oak Avenue, Cape Town',
      profile_photo_url: null,
      emergency_contact_name: 'Sipho Mokoena',
      emergency_contact_relationship: 'Spouse',
      emergency_contact_number: '082 555 0102',
      notes: 'Demonstration employee record for Manager Control Centre demos.',
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
      archived_at: null,
    },
    {
      id: '11111111-1111-4111-8111-111111111102',
      employee_code: 'EMP-1002',
      full_name: 'Jason Adams',
      position: 'Pharmacy Assistant',
      department: 'Front Shop',
      employment_status: 'active',
      start_date: '2022-07-01',
      contact_number: '083 555 0202',
      email: 'jason.adams@example.com',
      address: '88 Harbour Road, Cape Town',
      profile_photo_url: null,
      emergency_contact_name: 'Michelle Adams',
      emergency_contact_relationship: 'Sister',
      emergency_contact_number: '083 555 0203',
      notes: 'Demonstration employee — active, with approved sick leave demo covering today.',
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
      archived_at: null,
    },
    {
      id: '11111111-1111-4111-8111-111111111103',
      employee_code: 'EMP-1003',
      full_name: 'Lerato Williams',
      position: 'Dispensary Manager',
      department: 'Dispensary',
      employment_status: 'active',
      start_date: '2019-11-12',
      contact_number: '084 555 0303',
      email: 'lerato.williams@example.com',
      address: '5 Protea Street, Bellville',
      profile_photo_url: null,
      emergency_contact_name: 'Johan Williams',
      emergency_contact_relationship: 'Partner',
      emergency_contact_number: '084 555 0304',
      notes: 'Demonstration employee record for Manager Control Centre demos.',
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
      archived_at: null,
    },
    {
      id: '11111111-1111-4111-8111-111111111104',
      employee_code: 'EMP-1004',
      full_name: 'Michael Jacobs',
      position: 'Stock Controller',
      department: 'Stores',
      employment_status: 'active',
      start_date: '2020-05-20',
      contact_number: '081 555 0404',
      email: 'michael.jacobs@example.com',
      address: '22 Berg Street, Paarl',
      profile_photo_url: null,
      emergency_contact_name: 'Anna Jacobs',
      emergency_contact_relationship: 'Mother',
      emergency_contact_number: '081 555 0405',
      notes: 'Demonstration employee record for Manager Control Centre demos.',
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
      archived_at: null,
    },
    {
      id: '11111111-1111-4111-8111-111111111105',
      employee_code: 'EMP-1005',
      full_name: 'Nadia Petersen',
      position: 'Cashier',
      department: 'Front Shop',
      employment_status: 'inactive',
      start_date: '2023-01-09',
      contact_number: '072 555 0505',
      email: 'nadia.petersen@example.com',
      address: null,
      profile_photo_url: null,
      emergency_contact_name: 'David Petersen',
      emergency_contact_relationship: 'Father',
      emergency_contact_number: '072 555 0506',
      notes: 'Demonstration employee record (inactive) for Manager Control Centre demos.',
      is_demo: true,
      created_at: createdAt,
      updated_at: createdAt,
      archived_at: null,
    },
  ]
}

function readStore(): Employee[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = createSeedEmployees()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }

  try {
    const parsed = JSON.parse(raw) as Employee[]
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid store')
    }
    return parsed
  } catch {
    const seed = createSeedEmployees()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeStore(employees: Employee[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees))
}

export const localEmployeeStore = {
  list(): Employee[] {
    return readStore()
  },

  getById(id: string): Employee | null {
    return readStore().find((employee) => employee.id === id) ?? null
  },

  create(input: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'archived_at'>): Employee {
    const employees = readStore()
    if (employees.some((e) => e.employee_code.toLowerCase() === input.employee_code.toLowerCase())) {
      throw new Error('An employee with this Employee ID already exists.')
    }

    const timestamp = nowIso()
    const employee: Employee = {
      ...input,
      id: createId(),
      created_at: timestamp,
      updated_at: timestamp,
      archived_at: null,
    }
    writeStore([...employees, employee])
    return employee
  },

  update(id: string, patch: Partial<Employee>): Employee {
    const employees = readStore()
    const index = employees.findIndex((employee) => employee.id === id)
    if (index < 0) {
      throw new Error('Employee not found.')
    }

    const current = employees[index]!
    if (
      patch.employee_code &&
      employees.some(
        (e) =>
          e.id !== id && e.employee_code.toLowerCase() === patch.employee_code!.toLowerCase(),
      )
    ) {
      throw new Error('An employee with this Employee ID already exists.')
    }

    const updated: Employee = {
      ...current,
      ...patch,
      id: current.id,
      updated_at: nowIso(),
    }
    const next = [...employees]
    next[index] = updated
    writeStore(next)
    return updated
  },
}
