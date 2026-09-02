import type { Json } from '../lib/database.types'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import { getEmployee, listEmployees } from '../staff/api'
import type { Employee } from '../staff/types'
import { todayDateOnly } from '../attendance/dateUtils'
import { localDocumentStore } from './localStore'
import {
  getEmployeeDocumentSignedUrl,
  removeEmployeeDocumentFile,
  uploadEmployeeDocumentFile,
} from './storage'
import { deriveDocumentStatus, needsDocumentAttention } from './status'
import type {
  DocumentFormValues,
  DocumentManagementStatus,
  EmployeeDocument,
  EmployeeDocumentWithEmployee,
} from './types'

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function createId(): string {
  return crypto.randomUUID()
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
    entity_type: 'employee_document',
    entity_id: input.entityId,
    metadata: input.metadata ?? null,
  })

  if (error) {
    console.error('Failed to write audit log', error.message)
  }
}

function withEmployee(
  document: EmployeeDocument,
  employees: Map<string, Employee>,
  today: string = todayDateOnly(),
): EmployeeDocumentWithEmployee {
  return {
    ...document,
    employee: employees.get(document.employee_id) ?? null,
    managementStatus: deriveDocumentStatus(document, today),
  }
}

async function assertActiveEmployee(employeeId: string): Promise<Employee> {
  const employee = await getEmployee(employeeId)
  if (!employee) throw new Error('Employee not found.')
  if (employee.employment_status !== 'active') {
    throw new Error('Inactive employees cannot be assigned new documents.')
  }
  return employee
}

function formToPayload(values: DocumentFormValues, isDemoDefault: boolean) {
  return {
    employee_id: values.employee_id,
    title: values.title.trim(),
    document_type: values.document_type,
    document_date: emptyToNull(values.document_date),
    expiry_date: emptyToNull(values.expiry_date),
    reference_code: emptyToNull(values.reference_code),
    notes: emptyToNull(values.notes),
    is_demo: isDemoDefault,
  }
}

export async function listEmployeeDocuments(): Promise<EmployeeDocumentWithEmployee[]> {
  const employees = await listEmployees()
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]))
  const today = todayDateOnly()

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localDocumentStore.list().map((row) => withEmployee(row, employeeMap, today))
  }

  const { data, error } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('is_demo', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => withEmployee(row, employeeMap, today))
}

export async function getEmployeeDocument(
  id: string,
): Promise<EmployeeDocumentWithEmployee | null> {
  const supabase = getSupabaseClient()
  const today = todayDateOnly()

  if (!supabase) {
    const row = localDocumentStore.getById(id)
    if (!row) return null
    const employee = await getEmployee(row.employee_id)
    return {
      ...row,
      employee,
      managementStatus: deriveDocumentStatus(row, today),
    }
  }

  const { data, error } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('id', id)
    .eq('is_demo', false)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  const employee = await getEmployee(data.employee_id)
  return {
    ...data,
    employee,
    managementStatus: deriveDocumentStatus(data, today),
  }
}

export async function createEmployeeDocument(
  values: DocumentFormValues,
  actorId: string | null,
  file?: File | null,
): Promise<EmployeeDocument> {
  await assertActiveEmployee(values.employee_id)
  const documentId = createId()
  const payload = formToPayload(values, !isSupabaseConfigured)

  let storagePath: string | null = null
  if (file && isSupabaseConfigured) {
    storagePath = await uploadEmployeeDocumentFile(values.employee_id, documentId, file)
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localDocumentStore.create({
      id: documentId,
      ...payload,
      storage_path: storagePath,
      uploaded_by: actorId,
    })
  }

  const { data, error } = await supabase
    .from('employee_documents')
    .insert({
      id: documentId,
      ...payload,
      storage_path: storagePath,
      uploaded_by: actorId,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  await writeAuditLog({
    actorId,
    action: 'employee_document_created',
    entityId: data.id,
    metadata: { title: data.title, employee_id: data.employee_id },
  })

  return data
}

export async function updateEmployeeDocument(
  id: string,
  values: DocumentFormValues,
  actorId: string | null,
  file?: File | null,
): Promise<EmployeeDocument> {
  const existing = await getEmployeeDocument(id)
  if (!existing) throw new Error('Document not found.')

  if (values.employee_id !== existing.employee_id) {
    await assertActiveEmployee(values.employee_id)
  }

  const payload = formToPayload(values, existing.is_demo)
  let storagePath = existing.storage_path

  if (file && isSupabaseConfigured) {
    storagePath = await uploadEmployeeDocumentFile(values.employee_id, id, file)
  }

  const supabase = getSupabaseClient()
  let updated: EmployeeDocument

  if (!supabase) {
    updated = localDocumentStore.update(id, {
      ...payload,
      storage_path: storagePath,
    })
  } else {
    const { data, error } = await supabase
      .from('employee_documents')
      .update({
        ...payload,
        storage_path: storagePath,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    updated = data
  }

  await writeAuditLog({
    actorId,
    action: 'employee_document_updated',
    entityId: updated.id,
    metadata: { title: updated.title },
  })

  return updated
}

export async function openEmployeeDocument(document: EmployeeDocument): Promise<void> {
  if (!document.storage_path) {
    throw new Error('No file is attached to this document record.')
  }
  if (!isSupabaseConfigured) {
    throw new Error(
      'File viewing is unavailable in local demonstration mode. Reference code is shown instead.',
    )
  }
  const signedUrl = await getEmployeeDocumentSignedUrl(document.storage_path)
  window.open(signedUrl, '_blank', 'noopener,noreferrer')
}

export async function deleteEmployeeDocument(
  id: string,
  actorId: string | null,
): Promise<void> {
  const existing = await getEmployeeDocument(id)
  if (!existing) throw new Error('Document not found.')

  if (existing.storage_path && isSupabaseConfigured) {
    await removeEmployeeDocumentFile(existing.storage_path)
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    localDocumentStore.remove(id)
    return
  }

  const { error } = await supabase.from('employee_documents').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await writeAuditLog({
    actorId,
    action: 'employee_document_deleted',
    entityId: id,
    metadata: { title: existing.title },
  })
}

export type DocumentSummary = {
  total: number
  valid: number
  expiring_soon: number
  expired: number
  employees_requiring_attention: number
}

export function summarizeDocuments(
  rows: Array<Pick<EmployeeDocument, 'employee_id' | 'expiry_date'>>,
  today: string = todayDateOnly(),
): DocumentSummary {
  const statuses = rows.map((row) => deriveDocumentStatus(row, today))
  const attentionEmployeeIds = new Set<string>()

  rows.forEach((row) => {
    if (needsDocumentAttention(row, today)) {
      attentionEmployeeIds.add(row.employee_id)
    }
  })

  return {
    total: rows.length,
    valid: statuses.filter((status) => status === 'valid').length,
    expiring_soon: statuses.filter((status) => status === 'expiring_soon').length,
    expired: statuses.filter((status) => status === 'expired').length,
    employees_requiring_attention: attentionEmployeeIds.size,
  }
}

export function getDocumentStatusForRecord(
  record: Pick<EmployeeDocument, 'expiry_date'>,
  today: string = todayDateOnly(),
): DocumentManagementStatus {
  return deriveDocumentStatus(record, today)
}
