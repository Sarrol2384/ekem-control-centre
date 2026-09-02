import type { Json } from '../lib/database.types'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import { localEmployeeStore } from './localStore'
import type { Employee, EmployeeFormValues } from './types'

export type StaffDataSource = 'supabase' | 'local_demo'

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function formToPayload(values: EmployeeFormValues, isDemoDefault: boolean) {
  return {
    employee_code: values.employee_code.trim(),
    full_name: values.full_name.trim(),
    position: emptyToNull(values.position),
    department: emptyToNull(values.department),
    employment_status: values.employment_status,
    start_date: emptyToNull(values.start_date),
    contact_number: emptyToNull(values.contact_number),
    email: emptyToNull(values.email),
    address: emptyToNull(values.address),
    emergency_contact_name: emptyToNull(values.emergency_contact_name),
    emergency_contact_relationship: emptyToNull(values.emergency_contact_relationship),
    emergency_contact_number: emptyToNull(values.emergency_contact_number),
    notes: emptyToNull(values.notes),
    annual_leave_entitlement: values.annual_leave_entitlement.trim()
      ? Number.parseFloat(values.annual_leave_entitlement)
      : null,
    is_demo: isDemoDefault,
  }
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
    entity_type: 'employee',
    entity_id: input.entityId,
    metadata: input.metadata ?? null,
  })

  if (error) {
    console.error('Failed to write audit log', error.message)
  }
}

export function getStaffDataSource(): StaffDataSource {
  return isSupabaseConfigured ? 'supabase' : 'local_demo'
}

export async function listEmployees(): Promise<Employee[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return localEmployeeStore.list()
  }

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('is_demo', false)
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return localEmployeeStore.getById(id)
  }

  const { data, error } = await supabase.from('employees').select('*').eq('id', id).maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (data?.is_demo) {
    return null
  }

  return data
}

export async function createEmployee(
  values: EmployeeFormValues,
  actorId: string | null,
): Promise<Employee> {
  const payload = formToPayload(values, !isSupabaseConfigured)
  const supabase = getSupabaseClient()

  if (!supabase) {
    const created = localEmployeeStore.create({
      ...payload,
      profile_photo_url: null,
    })
    return created
  }

  const { data, error } = await supabase.from('employees').insert(payload).select('*').single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('An employee with this Employee ID already exists.')
    }
    throw new Error(error.message)
  }

  await writeAuditLog({
    actorId,
    action: 'employee_created',
    entityId: data.id,
    metadata: { employee_code: data.employee_code, full_name: data.full_name },
  })

  return data
}

export async function updateEmployee(
  id: string,
  values: EmployeeFormValues,
  actorId: string | null,
): Promise<Employee> {
  const existing = await getEmployee(id)
  if (!existing) {
    throw new Error('Employee not found.')
  }

  const payload = {
    ...formToPayload(values, existing.is_demo),
    is_demo: existing.is_demo,
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localEmployeeStore.update(id, payload)
  }

  const { data, error } = await supabase
    .from('employees')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('An employee with this Employee ID already exists.')
    }
    throw new Error(error.message)
  }

  await writeAuditLog({
    actorId,
    action: 'employee_updated',
    entityId: data.id,
    metadata: { employee_code: data.employee_code, full_name: data.full_name },
  })

  return data
}

export async function setEmployeeActiveState(
  id: string,
  nextStatus: 'active' | 'inactive',
  actorId: string | null,
): Promise<Employee> {
  const existing = await getEmployee(id)
  if (!existing) {
    throw new Error('Employee not found.')
  }

  const patch = {
    employment_status: nextStatus,
    archived_at: nextStatus === 'inactive' ? new Date().toISOString() : null,
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localEmployeeStore.update(id, patch)
  }

  const { data, error } = await supabase
    .from('employees')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await writeAuditLog({
    actorId,
    action: nextStatus === 'active' ? 'employee_activated' : 'employee_deactivated',
    entityId: data.id,
    metadata: {
      employee_code: data.employee_code,
      full_name: data.full_name,
      employment_status: data.employment_status,
    },
  })

  return data
}
