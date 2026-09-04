import type { Employee } from '../staff/types'
import {
  daysInMonth,
  formatMonthLabel,
  rangeForMonthValue,
} from './dateUtils'
import {
  calculateCreditedHours,
  dayGridCellLabel,
  formatHoursDisplay,
  getAttendanceExceptions,
  sumCreditedHours,
  type AttendanceException,
} from './hours'
import type { AttendanceRecord } from './types'

export type MonthlyExceptionRow = {
  employeeId: string
  employeeName: string
  employeeCode: string
  date: string
  status: AttendanceRecord['status']
  exceptions: AttendanceException[]
}

export type MonthlyEmployeeRow = {
  employee: Employee
  totalHours: number
  dayLabels: string[]
  recordCount: number
}

export type MonthlyHoursReport = {
  monthValue: string
  monthLabel: string
  periodStart: string
  periodEnd: string
  dayCount: number
  employees: MonthlyEmployeeRow[]
  totalHours: number
  attendanceRecords: number
  exceptions: MonthlyExceptionRow[]
  recordsRequiringReview: number
}

export function buildMonthlyHoursReport(
  monthValue: string,
  employees: Employee[],
  records: Array<AttendanceRecord & { employee?: Employee | null }>,
): MonthlyHoursReport {
  const { start, end } = rangeForMonthValue(monthValue)
  const dayCount = daysInMonth(monthValue)
  const recordsByEmployee = new Map<string, AttendanceRecord[]>()

  for (const record of records) {
    const list = recordsByEmployee.get(record.employee_id) ?? []
    list.push(record)
    recordsByEmployee.set(record.employee_id, list)
  }

  const employeeIds = new Set<string>()
  for (const employee of employees) {
    if (employee.employment_status === 'active') {
      employeeIds.add(employee.id)
    }
  }
  for (const record of records) {
    employeeIds.add(record.employee_id)
  }

  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]))
  const rows: MonthlyEmployeeRow[] = []

  for (const employeeId of employeeIds) {
    const employee = employeeMap.get(employeeId)
    if (!employee) continue

    const employeeRecords = recordsByEmployee.get(employeeId) ?? []
    const byDate = new Map(employeeRecords.map((record) => [record.attendance_date, record]))
    const dayLabels: string[] = []

    for (let day = 1; day <= dayCount; day += 1) {
      const date = `${monthValue}-${String(day).padStart(2, '0')}`
      dayLabels.push(dayGridCellLabel(byDate.get(date) ?? null))
    }

    rows.push({
      employee,
      totalHours: sumCreditedHours(employeeRecords),
      dayLabels,
      recordCount: employeeRecords.length,
    })
  }

  rows.sort((a, b) => a.employee.full_name.localeCompare(b.employee.full_name))

  const exceptions: MonthlyExceptionRow[] = []
  for (const record of records) {
    const found = getAttendanceExceptions(record)
    if (found.length === 0) continue
    const employee = employeeMap.get(record.employee_id) ?? record.employee
    exceptions.push({
      employeeId: record.employee_id,
      employeeName: employee?.full_name ?? 'Unknown employee',
      employeeCode: employee?.employee_code ?? record.employee_id,
      date: record.attendance_date,
      status: record.status,
      exceptions: found,
    })
  }

  exceptions.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date)
    if (byDate !== 0) return byDate
    return a.employeeName.localeCompare(b.employeeName)
  })

  return {
    monthValue,
    monthLabel: formatMonthLabel(monthValue),
    periodStart: start,
    periodEnd: end,
    dayCount,
    employees: rows,
    totalHours: sumCreditedHours(records),
    attendanceRecords: records.length,
    exceptions,
    recordsRequiringReview: exceptions.length,
  }
}

export { formatHoursDisplay, calculateCreditedHours }
