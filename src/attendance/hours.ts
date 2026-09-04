import type { AttendanceRecord, AttendanceStatus } from './types'

export type HoursInput = {
  status: AttendanceStatus | null | undefined
  arrival_time: string | null | undefined
  departure_time: string | null | undefined
}

export type AttendanceExceptionKind =
  | 'missing_arrival'
  | 'missing_departure'
  | 'invalid_time_range'

export type AttendanceException = {
  kind: AttendanceExceptionKind
  label: string
}

function timeToMinutes(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/** Credit hours only for present/late with both valid times (departure after arrival). */
export function calculateCreditedHours(input: HoursInput): number | null {
  if (input.status !== 'present' && input.status !== 'late') return null
  if (!input.arrival_time || !input.departure_time) return null

  const start = timeToMinutes(input.arrival_time)
  const end = timeToMinutes(input.departure_time)
  if (start === null || end === null) return null
  if (end <= start) return null

  const hours = (end - start) / 60
  return Math.round(hours * 10) / 10
}

export function formatHoursDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function sumCreditedHours(records: HoursInput[]): number {
  let total = 0
  for (const record of records) {
    const hours = calculateCreditedHours(record)
    if (hours !== null) total += hours
  }
  return Math.round(total * 10) / 10
}

export function getAttendanceExceptions(input: HoursInput): AttendanceException[] {
  if (input.status !== 'present' && input.status !== 'late') return []

  const exceptions: AttendanceException[] = []
  const hasArrival = Boolean(input.arrival_time?.trim())
  const hasDeparture = Boolean(input.departure_time?.trim())

  if (!hasArrival) {
    exceptions.push({ kind: 'missing_arrival', label: 'Missing arrival time' })
  }
  if (!hasDeparture) {
    exceptions.push({ kind: 'missing_departure', label: 'Missing departure time' })
  }

  if (hasArrival && hasDeparture) {
    const start = timeToMinutes(input.arrival_time!)
    const end = timeToMinutes(input.departure_time!)
    if (start === null || end === null || end <= start) {
      exceptions.push({ kind: 'invalid_time_range', label: 'Invalid time range' })
    }
  }

  return exceptions
}

/** Day-grid cell: credited hours, or A/L for recorded absent/leave — never invent Absent for blank days. */
export function dayGridCellLabel(
  record: Pick<AttendanceRecord, 'status' | 'arrival_time' | 'departure_time'> | null | undefined,
): string {
  if (!record) return ''
  const hours = calculateCreditedHours(record)
  if (hours !== null) return formatHoursDisplay(hours)
  if (record.status === 'absent') return 'A'
  if (record.status === 'on_leave') return 'L'
  return ''
}
