import type { Database } from '../lib/database.types'

export type EmploymentStatus = 'active' | 'inactive' | 'archived'

export type Employee = Database['public']['Tables']['employees']['Row']
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update']

export type EmployeeFormValues = {
  employee_code: string
  full_name: string
  position: string
  department: string
  employment_status: EmploymentStatus
  start_date: string
  contact_number: string
  email: string
  address: string
  emergency_contact_name: string
  emergency_contact_relationship: string
  emergency_contact_number: string
  notes: string
  annual_leave_entitlement: string
}

export type EmployeeStatusFilter = 'all' | 'active' | 'inactive'

export type EmployeeSortKey =
  | 'employee_code'
  | 'full_name'
  | 'position'
  | 'department'
  | 'employment_status'
  | 'start_date'

export const emptyEmployeeFormValues = (): EmployeeFormValues => ({
  employee_code: '',
  full_name: '',
  position: '',
  department: '',
  employment_status: 'active',
  start_date: '',
  contact_number: '',
  email: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_relationship: '',
  emergency_contact_number: '',
  notes: '',
  annual_leave_entitlement: '',
})

export function employeeToFormValues(employee: Employee): EmployeeFormValues {
  return {
    employee_code: employee.employee_code,
    full_name: employee.full_name,
    position: employee.position ?? '',
    department: employee.department ?? '',
    employment_status:
      employee.employment_status === 'archived' ? 'inactive' : employee.employment_status,
    start_date: employee.start_date ?? '',
    contact_number: employee.contact_number ?? '',
    email: employee.email ?? '',
    address: employee.address ?? '',
    emergency_contact_name: employee.emergency_contact_name ?? '',
    emergency_contact_relationship: employee.emergency_contact_relationship ?? '',
    emergency_contact_number: employee.emergency_contact_number ?? '',
    notes: employee.notes ?? '',
    annual_leave_entitlement:
      employee.annual_leave_entitlement != null
        ? String(employee.annual_leave_entitlement)
        : '',
  }
}
