import type { Json } from '../lib/database.types'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import { getEmployee, listEmployees } from '../staff/api'
import type { Employee } from '../staff/types'
import { todayDateOnly } from '../attendance/dateUtils'
import { localTrainingStore } from './localStore'
import { deriveTrainingStatus, needsTrainingAttention } from './status'
import type {
  TrainingFormValues,
  TrainingManagementStatus,
  TrainingRecord,
  TrainingRecordWithEmployee,
} from './types'

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
    entity_type: 'training_record',
    entity_id: input.entityId,
    metadata: input.metadata ?? null,
  })

  if (error) {
    console.error('Failed to write audit log', error.message)
  }
}

function withEmployee(
  record: TrainingRecord,
  employees: Map<string, Employee>,
  today: string = todayDateOnly(),
): TrainingRecordWithEmployee {
  return {
    ...record,
    employee: employees.get(record.employee_id) ?? null,
    managementStatus: deriveTrainingStatus(record, today),
  }
}

async function assertActiveEmployee(employeeId: string): Promise<Employee> {
  const employee = await getEmployee(employeeId)
  if (!employee) throw new Error('Employee not found.')
  if (employee.employment_status !== 'active') {
    throw new Error('Inactive employees cannot be assigned new training records.')
  }
  return employee
}

function formToPayload(values: TrainingFormValues, isDemoDefault: boolean) {
  const training_date = emptyToNull(values.training_date)
  const expiry_date = emptyToNull(values.expiry_date)
  const base = {
    employee_id: values.employee_id,
    training_name: values.training_name.trim(),
    provider: emptyToNull(values.provider),
    training_date,
    expiry_date,
    certificate_reference: emptyToNull(values.certificate_reference),
    notes: emptyToNull(values.notes),
    is_demo: isDemoDefault,
  }
  return {
    ...base,
    status: deriveTrainingStatus(base),
  }
}

export async function listTrainingRecords(): Promise<TrainingRecordWithEmployee[]> {
  const employees = await listEmployees()
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]))
  const today = todayDateOnly()

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localTrainingStore.list().map((row) => withEmployee(row, employeeMap, today))
  }

  const { data, error } = await supabase
    .from('training_records')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => withEmployee(row, employeeMap, today))
}

export async function getTrainingRecord(id: string): Promise<TrainingRecordWithEmployee | null> {
  const supabase = getSupabaseClient()
  const today = todayDateOnly()

  if (!supabase) {
    const row = localTrainingStore.getById(id)
    if (!row) return null
    const employee = await getEmployee(row.employee_id)
    return {
      ...row,
      employee,
      managementStatus: deriveTrainingStatus(row, today),
    }
  }

  const { data, error } = await supabase
    .from('training_records')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  const employee = await getEmployee(data.employee_id)
  return {
    ...data,
    employee,
    managementStatus: deriveTrainingStatus(data, today),
  }
}

export async function createTrainingRecord(
  values: TrainingFormValues,
  actorId: string | null,
): Promise<TrainingRecord> {
  await assertActiveEmployee(values.employee_id)
  const payload = formToPayload(values, !isSupabaseConfigured)

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localTrainingStore.create(payload)
  }

  const { data, error } = await supabase
    .from('training_records')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  await writeAuditLog({
    actorId,
    action: 'training_record_created',
    entityId: data.id,
    metadata: {
      training_name: data.training_name,
      employee_id: data.employee_id,
    },
  })

  return data
}

export async function updateTrainingRecord(
  id: string,
  values: TrainingFormValues,
  actorId: string | null,
): Promise<TrainingRecord> {
  const existing = await getTrainingRecord(id)
  if (!existing) throw new Error('Training record not found.')

  if (values.employee_id !== existing.employee_id) {
    await assertActiveEmployee(values.employee_id)
  }

  const payload = formToPayload(values, existing.is_demo)

  const supabase = getSupabaseClient()
  let updated: TrainingRecord

  if (!supabase) {
    updated = localTrainingStore.update(id, payload)
  } else {
    const { data, error } = await supabase
      .from('training_records')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    updated = data
  }

  await writeAuditLog({
    actorId,
    action: 'training_record_updated',
    entityId: updated.id,
    metadata: { training_name: updated.training_name },
  })

  return updated
}

export type TrainingSummary = {
  total: number
  valid: number
  due: number
  expiring_soon: number
  expired: number
  needs_attention: number
  employees_requiring_attention: number
}

export function summarizeTraining(
  rows: Array<Pick<TrainingRecord, 'employee_id' | 'training_date' | 'expiry_date'>>,
  today: string = todayDateOnly(),
): TrainingSummary {
  const statuses = rows.map((row) => deriveTrainingStatus(row, today))
  const attentionEmployeeIds = new Set<string>()

  rows.forEach((row) => {
    if (needsTrainingAttention(row, today)) {
      attentionEmployeeIds.add(row.employee_id)
    }
  })

  return {
    total: rows.length,
    valid: statuses.filter((status) => status === 'valid').length,
    due: statuses.filter((status) => status === 'due').length,
    expiring_soon: statuses.filter((status) => status === 'expiring_soon').length,
    expired: statuses.filter((status) => status === 'expired').length,
    needs_attention: statuses.filter(
      (status) => status === 'due' || status === 'expiring_soon' || status === 'expired',
    ).length,
    employees_requiring_attention: attentionEmployeeIds.size,
  }
}

export function getTrainingStatusForRecord(
  record: Pick<TrainingRecord, 'training_date' | 'expiry_date'>,
  today: string = todayDateOnly(),
): TrainingManagementStatus {
  return deriveTrainingStatus(record, today)
}
