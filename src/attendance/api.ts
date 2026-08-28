import type { Json } from '../lib/database.types'
import { listApprovedLeaveEmployeeIds } from '../leave/api'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import { listEmployees } from '../staff/api'
import type { Employee } from '../staff/types'
import { localAttendanceStore } from './localStore'
import type {
  AttendanceFormValues,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummary,
  ScheduledStatus,
  TodayAttendanceRow,
} from './types'

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeTimeForDb(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed
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
    entity_type: 'attendance',
    entity_id: input.entityId,
    metadata: input.metadata ?? null,
  })

  if (error) {
    console.error('Failed to write audit log', error.message)
  }
}

export function summarizeAttendance(
  rows: Array<{ status: AttendanceStatus | null }>,
): AttendanceSummary {
  const summary: AttendanceSummary = {
    present: 0,
    late: 0,
    absent: 0,
    on_leave: 0,
    not_recorded: 0,
  }

  for (const row of rows) {
    if (!row.status) {
      summary.not_recorded += 1
      continue
    }
    summary[row.status] += 1
  }

  return summary
}

export async function getTodayAttendance(date: string): Promise<TodayAttendanceRow[]> {
  const [employees, leaveIds] = await Promise.all([
    listEmployees(),
    listApprovedLeaveEmployeeIds(date),
  ])

  const activeEmployees = employees
    .filter((employee) => employee.employment_status === 'active')
    .sort((a, b) => a.full_name.localeCompare(b.full_name))

  const records = await listAttendanceForDate(date)
  const byEmployee = new Map(records.map((record) => [record.employee_id, record]))

  return activeEmployees.map((employee) => {
    const scheduledStatus: ScheduledStatus = leaveIds.has(employee.id)
      ? 'approved_leave'
      : 'scheduled'
    return {
      employee,
      scheduledStatus,
      record: byEmployee.get(employee.id) ?? null,
    }
  })
}

export async function listAttendanceForDate(date: string): Promise<AttendanceRecord[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return localAttendanceStore.listByDate(date)
  }

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('attendance_date', date)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function listAttendanceHistory(input: {
  start: string
  end: string
  employeeId?: string | null
}): Promise<Array<AttendanceRecord & { employee: Employee | null }>> {
  const employees = await listEmployees()
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]))

  const supabase = getSupabaseClient()
  if (!supabase) {
    let records = localAttendanceStore.listByRange(input.start, input.end)
    if (input.employeeId) {
      records = records.filter((record) => record.employee_id === input.employeeId)
    }
    return records.map((record) => ({
      ...record,
      employee: employeeMap.get(record.employee_id) ?? null,
    }))
  }

  let query = supabase
    .from('attendance')
    .select('*')
    .gte('attendance_date', input.start)
    .lte('attendance_date', input.end)
    .order('attendance_date', { ascending: false })

  if (input.employeeId) {
    query = query.eq('employee_id', input.employeeId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data ?? []).map((record) => ({
    ...record,
    employee: employeeMap.get(record.employee_id) ?? null,
  }))
}

export async function saveAttendanceRecord(input: {
  employeeId: string
  date: string
  values: AttendanceFormValues
  actorId: string | null
  existingId?: string | null
}): Promise<AttendanceRecord> {
  const approvedLeaveIds = await listApprovedLeaveEmployeeIds(input.date)
  if (
    approvedLeaveIds.has(input.employeeId) &&
    input.values.status !== 'on_leave'
  ) {
    throw new Error(
      'This employee is on approved leave for this date. Present, Late, or Absent cannot override approved leave.',
    )
  }

  const payload = {
    employee_id: input.employeeId,
    attendance_date: input.date,
    status: input.values.status,
    arrival_time: normalizeTimeForDb(input.values.arrival_time),
    departure_time: normalizeTimeForDb(input.values.departure_time),
    notes: emptyToNull(input.values.notes),
    recorded_by: input.actorId,
    is_demo: !isSupabaseConfigured,
  }

  if (
    payload.arrival_time &&
    payload.departure_time &&
    payload.arrival_time > payload.departure_time
  ) {
    throw new Error('Departure time must be after arrival time.')
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return localAttendanceStore.upsert(payload)
  }

  const existing = input.existingId
    ? { id: input.existingId }
    : (
        await supabase
          .from('attendance')
          .select('id')
          .eq('employee_id', input.employeeId)
          .eq('attendance_date', input.date)
          .maybeSingle()
      ).data

  if (existing?.id) {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        status: payload.status,
        arrival_time: payload.arrival_time,
        departure_time: payload.departure_time,
        notes: payload.notes,
        recorded_by: payload.recorded_by,
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    await writeAuditLog({
      actorId: input.actorId,
      action: 'attendance_updated',
      entityId: data.id,
      metadata: {
        employee_id: data.employee_id,
        attendance_date: data.attendance_date,
        status: data.status,
      },
    })
    return data
  }

  const { data, error } = await supabase.from('attendance').insert(payload).select('*').single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('An attendance record already exists for this employee on this date.')
    }
    throw new Error(error.message)
  }

  await writeAuditLog({
    actorId: input.actorId,
    action: 'attendance_recorded',
    entityId: data.id,
    metadata: {
      employee_id: data.employee_id,
      attendance_date: data.attendance_date,
      status: data.status,
    },
  })

  return data
}

export async function quickMarkAttendance(input: {
  employeeId: string
  date: string
  status: AttendanceStatus
  actorId: string | null
  existing?: AttendanceRecord | null
}): Promise<AttendanceRecord> {
  const defaults: AttendanceFormValues = {
    status: input.status,
    arrival_time:
      input.status === 'present'
        ? '09:00'
        : input.status === 'late'
          ? '09:30'
          : input.existing?.arrival_time?.slice(0, 5) ?? '',
    departure_time:
      input.status === 'absent' || input.status === 'on_leave'
        ? ''
        : input.existing?.departure_time?.slice(0, 5) ?? '',
    notes: input.existing?.notes ?? '',
  }

  return saveAttendanceRecord({
    employeeId: input.employeeId,
    date: input.date,
    values: defaults,
    actorId: input.actorId,
    existingId: input.existing?.id,
  })
}
