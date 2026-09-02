import type { Json } from '../lib/database.types'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import { getEmployee, listEmployees } from '../staff/api'
import type { Employee } from '../staff/types'
import {
  computeEmployeeLeaveSummary,
  currentLeaveYear,
  listEmployeeLeaveHistory,
  type EmployeeLeaveSummary,
} from './balance'
import { calculateLeaveDays, todayDateOnly } from './dateUtils'
import { localLeaveStore } from './localStore'
import type {
  LeaveFormValues,
  LeaveRequest,
  LeaveRequestWithEmployee,
  LeaveStatus,
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
    entity_type: 'leave_request',
    entity_id: input.entityId,
    metadata: input.metadata ?? null,
  })

  if (error) {
    console.error('Failed to write audit log', error.message)
  }
}

function withEmployee(
  leave: LeaveRequest,
  employees: Map<string, Employee>,
): LeaveRequestWithEmployee {
  return { ...leave, employee: employees.get(leave.employee_id) ?? null }
}

export async function listApprovedLeaveEmployeeIds(date: string): Promise<Set<string>> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return new Set(localLeaveStore.listApprovedForDate(date).map((row) => row.employee_id))
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .select('employee_id')
    .eq('status', 'approved')
    .eq('is_demo', false)
    .lte('start_date', date)
    .gte('end_date', date)

  if (error) {
    console.warn('Unable to load approved leave for attendance context', error.message)
    return new Set()
  }

  return new Set((data ?? []).map((row) => row.employee_id))
}

export async function listLeaveRequests(): Promise<LeaveRequestWithEmployee[]> {
  const employees = await listEmployees()
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]))

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localLeaveStore.list().map((row) => withEmployee(row, employeeMap))
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('is_demo', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => withEmployee(row, employeeMap))
}

export async function getLeaveRequest(id: string): Promise<LeaveRequestWithEmployee | null> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    const row = localLeaveStore.getById(id)
    if (!row) return null
    const employee = await getEmployee(row.employee_id)
    return { ...row, employee }
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .eq('is_demo', false)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  const employee = await getEmployee(data.employee_id)
  return { ...data, employee }
}

async function assertActiveEmployee(employeeId: string): Promise<Employee> {
  const employee = await getEmployee(employeeId)
  if (!employee) throw new Error('Employee not found.')
  if (employee.employment_status !== 'active') {
    throw new Error('Inactive employees cannot receive new leave requests.')
  }
  return employee
}

export async function createLeaveRequest(
  values: LeaveFormValues,
  actorId: string | null,
): Promise<LeaveRequest> {
  await assertActiveEmployee(values.employee_id)

  if (values.end_date < values.start_date) {
    throw new Error('End date must be on or after the start date.')
  }

  const days = calculateLeaveDays(values.start_date, values.end_date)
  if (days <= 0) throw new Error('Leave must cover at least one day.')

  const payload = {
    employee_id: values.employee_id,
    leave_type: values.leave_type,
    status: 'pending' as const,
    start_date: values.start_date,
    end_date: values.end_date,
    days_count: days,
    notes: emptyToNull(values.notes),
    is_demo: !isSupabaseConfigured,
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localLeaveStore.create(payload)
  }

  const { data, error } = await supabase.from('leave_requests').insert(payload).select('*').single()
  if (error) throw new Error(error.message)

  await writeAuditLog({
    actorId,
    action: 'leave_created',
    entityId: data.id,
    metadata: {
      employee_id: data.employee_id,
      leave_type: data.leave_type,
      start_date: data.start_date,
      end_date: data.end_date,
    },
  })

  return data
}

export async function updatePendingLeaveRequest(
  id: string,
  values: LeaveFormValues,
  actorId: string | null,
): Promise<LeaveRequest> {
  const existing = await getLeaveRequest(id)
  if (!existing) throw new Error('Leave request not found.')
  if (existing.status !== 'pending') {
    throw new Error('Only pending leave requests can be edited.')
  }

  // New leave must be for an active employee; editing an existing pending request
  // for someone who later became inactive remains allowed (employee is locked in UI).
  if (values.employee_id !== existing.employee_id) {
    await assertActiveEmployee(values.employee_id)
  }

  if (values.end_date < values.start_date) {
    throw new Error('End date must be on or after the start date.')
  }

  const days = calculateLeaveDays(values.start_date, values.end_date)
  const payload = {
    employee_id: values.employee_id,
    leave_type: values.leave_type,
    start_date: values.start_date,
    end_date: values.end_date,
    days_count: days,
    notes: emptyToNull(values.notes),
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localLeaveStore.update(id, payload)
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  await writeAuditLog({
    actorId,
    action: 'leave_updated',
    entityId: data.id,
    metadata: {
      employee_id: data.employee_id,
      leave_type: data.leave_type,
      start_date: data.start_date,
      end_date: data.end_date,
    },
  })

  return data
}

export async function setLeaveStatus(
  id: string,
  status: Extract<LeaveStatus, 'approved' | 'rejected' | 'cancelled'>,
  actorId: string | null,
): Promise<LeaveRequest> {
  const existing = await getLeaveRequest(id)
  if (!existing) throw new Error('Leave request not found.')

  if (status === 'approved' || status === 'rejected') {
    if (existing.status !== 'pending') {
      throw new Error('Only pending leave requests can be approved or rejected.')
    }
  }

  if (status === 'cancelled') {
    if (existing.status !== 'pending' && existing.status !== 'approved') {
      throw new Error('Only pending or approved leave requests can be cancelled.')
    }
  }

  const payload = {
    status,
    reviewed_by: actorId,
    reviewed_at: new Date().toISOString(),
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localLeaveStore.update(id, payload)
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  await writeAuditLog({
    actorId,
    action: `leave_${status}`,
    entityId: data.id,
    metadata: {
      employee_id: data.employee_id,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status,
    },
  })

  return data
}

export function isLeaveHistory(
  row: LeaveRequest,
  today: string = todayDateOnly(),
): boolean {
  if (row.status === 'rejected' || row.status === 'cancelled') return true
  return row.status === 'approved' && row.end_date < today
}

export function summarizeLeave(rows: LeaveRequest[]) {
  const today = todayDateOnly()
  return {
    pending: rows.filter((row) => row.status === 'pending').length,
    approved: rows.filter((row) => row.status === 'approved').length,
    rejected: rows.filter((row) => row.status === 'rejected').length,
    current: rows.filter(
      (row) =>
        row.status === 'approved' && row.start_date <= today && row.end_date >= today,
    ).length,
    upcoming: rows.filter((row) => row.status === 'approved' && row.start_date > today)
      .length,
    history: rows.filter((row) => isLeaveHistory(row, today)).length,
  }
}

export async function listLeaveByEmployee(
  employeeId: string,
): Promise<LeaveRequestWithEmployee[]> {
  const rows = await listLeaveRequests()
  return rows.filter((row) => row.employee_id === employeeId)
}

export async function getEmployeeLeaveSummary(
  employeeId: string,
  year: number = currentLeaveYear(),
): Promise<EmployeeLeaveSummary | null> {
  const employee = await getEmployee(employeeId)
  if (!employee) return null

  const supabase = getSupabaseClient()
  let requests: LeaveRequest[]

  if (!supabase) {
    requests = localLeaveStore.list()
  } else {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('is_demo', false)
      .order('start_date', { ascending: false })

    if (error) throw new Error(error.message)
    requests = data ?? []
  }

  return computeEmployeeLeaveSummary(employee, requests, year)
}

export type EmployeeLeaveSummaryWithEmployee = EmployeeLeaveSummary & {
  employee: Employee
}

export async function listAllLeaveSummaries(
  year: number = currentLeaveYear(),
): Promise<EmployeeLeaveSummaryWithEmployee[]> {
  const [employees, allRequests] = await Promise.all([listEmployees(), listLeaveRequests()])
  const requestRows = allRequests.map(({ employee: _employee, ...row }) => row)

  return employees.map((employee) => ({
    ...computeEmployeeLeaveSummary(employee, requestRows, year),
    employee,
  }))
}

export function getEmployeeLeaveHistoryFromRows(
  employeeId: string,
  rows: LeaveRequest[],
): LeaveRequest[] {
  return listEmployeeLeaveHistory(employeeId, rows)
}
