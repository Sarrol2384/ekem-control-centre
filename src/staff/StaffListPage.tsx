import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DemoDataBadge } from '../components/DemoDataBadge'
import { getStaffDataSource, listEmployees } from './api'
import { formatDisplayDate } from './format'
import type { Employee, EmployeeSortKey, EmployeeStatusFilter } from './types'
import { EmploymentStatusBadge } from './components/EmploymentStatusBadge'

function compareEmployees(a: Employee, b: Employee, sortKey: EmployeeSortKey): number {
  const left = a[sortKey] ?? ''
  const right = b[sortKey] ?? ''
  return String(left).localeCompare(String(right), undefined, { sensitivity: 'base' })
}

export function StaffListPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [sortKey, setSortKey] = useState<EmployeeSortKey>('full_name')
  const dataSource = getStaffDataSource()

  useEffect(() => {
    let mounted = true

    void listEmployees()
      .then((rows: Employee[]) => {
        if (!mounted) return
        setEmployees(rows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unable to load employees.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const departments = useMemo(() => {
    const values = new Set(
      employees
        .map((employee) => employee.department)
        .filter((value): value is string => Boolean(value && value.trim())),
    )
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [employees])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return employees
      .filter((employee) => {
        if (statusFilter !== 'all' && employee.employment_status !== statusFilter) {
          return false
        }
        if (departmentFilter !== 'all' && employee.department !== departmentFilter) {
          return false
        }
        if (!query) return true
        const haystack = [
          employee.employee_code,
          employee.full_name,
          employee.position,
          employee.department,
          employee.email,
          employee.contact_number,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
      .sort((a, b) => compareEmployees(a, b, sortKey))
  }, [employees, search, statusFilter, departmentFilter, sortKey])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Staff</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">
            Manage pharmacy employees. Demonstration records are labelled and are not real Ekem
            employees.
          </p>
        </div>
        <Link to="/staff/new" className="btn-primary">
          Add employee
        </Link>
      </div>

      {dataSource === 'local_demo' && (
        <DemoDataBadge label="Local demonstration mode — records are stored in this browser only" />
      )}

      <div className="filter-panel grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-[var(--color-text)]">Search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, ID, position, email…"
            className="w-full px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[var(--color-text)]">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EmployeeStatusFilter)}
            className="w-full px-3 py-2.5"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[var(--color-text)]">Department</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2.5"
          >
            <option value="all">All</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2 lg:col-span-4">
          <span className="mb-1 block font-medium text-[var(--color-text)]">Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as EmployeeSortKey)}
            className="w-full max-w-xs px-3 py-2.5"
          >
            <option value="full_name">Full name</option>
            <option value="employee_code">Employee ID</option>
            <option value="position">Position</option>
            <option value="department">Department</option>
            <option value="employment_status">Status</option>
            <option value="start_date">Start date</option>
          </select>
        </label>
      </div>

      {loading && (
        <p className="text-sm text-[var(--color-muted)]" role="status">
          Loading employees…
        </p>
      )}

      {error && (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && employees.length === 0 && (
        <div className="empty-state text-sm">
          <p>No employees have been added yet.</p>
          <Link to="/staff/new" className="btn-primary mt-4 inline-flex">
            Add the first employee
          </Link>
        </div>
      )}

      {!loading && !error && employees.length > 0 && filtered.length === 0 && (
        <div className="empty-state text-sm">
          <p>No employees match your current filters.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="table-shell">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-3 font-medium">Employee ID</th>
                <th className="px-3 py-3 font-medium">Full name</th>
                <th className="px-3 py-3 font-medium">Position</th>
                <th className="px-3 py-3 font-medium">Department</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Start date</th>
                <th className="px-3 py-3 font-medium">Contact</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr key={employee.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3 py-3 whitespace-nowrap">{employee.employee_code}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{employee.full_name}</span>
                      {employee.is_demo && (
                        <DemoDataBadge
                          compact
                          label="Demo record"
                          title="Fictional demonstration employee — not a real Ekem employee"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">{employee.position ?? '—'}</td>
                  <td className="px-3 py-3">{employee.department ?? '—'}</td>
                  <td className="px-3 py-3">
                    <EmploymentStatusBadge status={employee.employment_status} />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatDisplayDate(employee.start_date)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{employee.contact_number ?? '—'}</td>
                  <td className="px-3 py-3">{employee.email ?? '—'}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Link
                        to={`/staff/${employee.id}`}
                        className="text-[var(--color-primary)] underline"
                      >
                        View
                      </Link>
                      <Link
                        to={`/staff/${employee.id}/edit`}
                        className="text-[var(--color-primary)] underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
