import { useEffect, useMemo, useState } from 'react'
import { formatDateLabel, todayDateOnly } from '../attendance/dateUtils'
import { useAuth } from '../auth/useAuth'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DemoDataBadge } from '../components/DemoDataBadge'
import { getStaffDataSource, listEmployees } from '../staff/api'
import type { Employee } from '../staff/types'
import {
  createTask,
  listTaskActivity,
  listTasks,
  reopenTask,
  setTaskStatus,
  summarizeTasks,
  updateTask,
} from '../tasks/api'
import { TaskFormDialog } from '../tasks/components/TaskFormDialog'
import { TaskPriorityBadge } from '../tasks/components/TaskPriorityBadge'
import { TaskStatusBadge } from '../tasks/components/TaskStatusBadge'
import { isDueThisWeek, isDueToday, isTaskOverdue } from '../tasks/overdue'
import type {
  TaskActivity,
  TaskDueFilter,
  TaskFormValues,
  TaskSortField,
  TaskStatus,
  TaskStatusFilter,
  TaskWithEmployee,
} from '../tasks/types'
import {
  emptyTaskForm,
  PRIORITY_WEIGHT,
  taskToFormValues,
} from '../tasks/types'
import { hasTaskFieldErrors, validateTaskForm, type TaskFieldErrors } from '../tasks/validation'

export function TasksPage() {
  const { profile, user } = useAuth()
  const [rows, setRows] = useState<TaskWithEmployee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [dueFilter, setDueFilter] = useState<TaskDueFilter>('all')
  const [sortField, setSortField] = useState<TaskSortField>('due_date')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TaskWithEmployee | null>(null)
  const [formValues, setFormValues] = useState<TaskFormValues>(emptyTaskForm())
  const [fieldErrors, setFieldErrors] = useState<TaskFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [detail, setDetail] = useState<TaskWithEmployee | null>(null)
  const [activity, setActivity] = useState<TaskActivity[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    id: string
    type: 'complete' | 'reopen'
    label: string
  } | null>(null)
  const [confirming, setConfirming] = useState(false)
  const dataSource = getStaffDataSource()
  const today = todayDateOnly()
  const actorId = user?.id ?? profile?.id ?? null

  async function refresh() {
    const [taskRows, employeeRows] = await Promise.all([listTasks(), listEmployees()])
    setRows(taskRows)
    setEmployees(employeeRows)
  }

  useEffect(() => {
    let mounted = true
    void Promise.all([listTasks(), listEmployees()])
      .then(([taskRows, employeeRows]) => {
        if (!mounted) return
        setRows(taskRows)
        setEmployees(employeeRows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unable to load tasks.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  async function openDetail(row: TaskWithEmployee) {
    setDetail(row)
    setActivityLoading(true)
    setActivity([])
    try {
      const rows = await listTaskActivity(row.id)
      setActivity(rows)
    } catch {
      setActivity([])
    } finally {
      setActivityLoading(false)
    }
  }

  const summary = useMemo(() => summarizeTasks(rows, today), [rows, today])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    let result = rows.filter((row) => {
      if (query) {
        const haystack = [
          row.title,
          row.description ?? '',
          row.employee?.full_name ?? '',
          row.employee?.employee_code ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }
      if (employeeFilter !== 'all' && row.assigned_employee_id !== employeeFilter) return false
      if (priorityFilter !== 'all' && row.priority !== priorityFilter) return false
      if (statusFilter === 'overdue') {
        if (!isTaskOverdue(row, today)) return false
      } else if (statusFilter !== 'all' && row.status !== statusFilter) {
        return false
      }
      if (dueFilter === 'overdue' && !isTaskOverdue(row, today)) return false
      if (dueFilter === 'due_today' && !isDueToday(row, today)) return false
      if (dueFilter === 'due_this_week' && !isDueThisWeek(row, today)) return false
      if (dueFilter === 'no_due_date' && row.due_date) return false
      return true
    })

    result = [...result].sort((a, b) => {
      if (sortField === 'title') return a.title.localeCompare(b.title)
      if (sortField === 'status') return a.status.localeCompare(b.status)
      if (sortField === 'priority') {
        return PRIORITY_WEIGHT[b.priority as keyof typeof PRIORITY_WEIGHT] -
          PRIORITY_WEIGHT[a.priority as keyof typeof PRIORITY_WEIGHT]
      }
      if (sortField === 'created_at') {
        return b.created_at.localeCompare(a.created_at)
      }
      const aDue = a.due_date ?? '9999-12-31'
      const bDue = b.due_date ?? '9999-12-31'
      return aDue.localeCompare(bDue)
    })

    return result
  }, [
    rows,
    search,
    employeeFilter,
    priorityFilter,
    statusFilter,
    dueFilter,
    sortField,
    today,
  ])

  function openCreate() {
    setEditing(null)
    setFormValues(emptyTaskForm())
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: TaskWithEmployee) {
    setEditing(row)
    setFormValues(taskToFormValues(row))
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSave(values: TaskFormValues) {
    const nextErrors = validateTaskForm(values)
    setFieldErrors(nextErrors)
    if (hasTaskFieldErrors(nextErrors)) {
      setFormError('Please correct the highlighted fields.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      if (editing) {
        await updateTask(editing.id, values, actorId)
      } else {
        await createTask(values, actorId)
      }
      setFormOpen(false)
      await refresh()
      if (detail?.id === editing?.id) {
        const updated = await listTasks()
        const match = updated.find((row) => row.id === editing?.id)
        if (match) setDetail(match)
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Unable to save task.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return
    setConfirming(true)
    try {
      if (confirmAction.type === 'complete') {
        await setTaskStatus(confirmAction.id, 'completed', actorId)
      } else {
        await reopenTask(confirmAction.id, actorId)
      }
      setConfirmAction(null)
      await refresh()
      if (detail?.id === confirmAction.id) {
        const updated = await listTasks()
        const match = updated.find((row) => row.id === confirmAction.id)
        if (match) setDetail(match)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update task.')
      setConfirmAction(null)
    } finally {
      setConfirming(false)
    }
  }

  async function handleQuickStatus(id: string, status: TaskStatus) {
    try {
      await setTaskStatus(id, status, actorId)
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update task status.')
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Tasks</h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--color-muted)]">
            Assign and monitor operational tasks. Overdue items are calculated automatically from
            due dates.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          Create task
        </button>
      </div>

      {dataSource === 'local_demo' && (
        <DemoDataBadge label="Local demonstration tasks — browser storage only" />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['To Do', summary.todo],
          ['In Progress', summary.in_progress],
          ['Overdue', summary.overdue],
          ['Completed', summary.completed],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
          >
            <p className="text-xs tracking-wide text-[var(--color-muted)] uppercase">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm sm:col-span-2 lg:col-span-3">
          <span className="mb-1 block font-medium">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, or employee…"
            className="w-full border border-[var(--color-border)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatusFilter)}
            className="w-full border border-[var(--color-border)] px-3 py-2"
          >
            <option value="all">All</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Priority</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full border border-[var(--color-border)] px-3 py-2"
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Employee</span>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="w-full border border-[var(--color-border)] px-3 py-2"
          >
            <option value="all">All employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name} ({employee.employee_code})
                {employee.employment_status !== 'active' ? ' — inactive' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Due date</span>
          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value as TaskDueFilter)}
            className="w-full border border-[var(--color-border)] px-3 py-2"
          >
            <option value="all">All</option>
            <option value="overdue">Overdue</option>
            <option value="due_today">Due today</option>
            <option value="due_this_week">Due this week</option>
            <option value="no_due_date">No due date</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Sort by</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as TaskSortField)}
            className="w-full border border-[var(--color-border)] px-3 py-2"
          >
            <option value="due_date">Due date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
            <option value="created_at">Created date</option>
          </select>
        </label>
      </div>

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading tasks…</p>}

      {error && (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10 text-center text-sm text-[var(--color-muted)]">
          No tasks match the current filters.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-3 font-medium">Task</th>
                <th className="px-3 py-3 font-medium">Assigned to</th>
                <th className="px-3 py-3 font-medium">Priority</th>
                <th className="px-3 py-3 font-medium">Due date</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const overdue = isTaskOverdue(row, today)
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-[var(--color-border)] last:border-b-0 ${
                      overdue ? 'bg-red-50/60' : ''
                    }`}
                  >
                    <td className="px-3 py-3">
                      <div className="font-medium">{row.title}</div>
                      {row.is_demo && (
                        <div className="text-xs text-[var(--color-muted)]">Demo record</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div>{row.employee?.full_name ?? 'Unassigned'}</div>
                      <div className="text-xs text-[var(--color-muted)]">
                        {row.employee?.employee_code ?? '—'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <TaskPriorityBadge priority={row.priority} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {row.due_date ? (
                        <span className={overdue ? 'font-medium text-red-800' : ''}>
                          {formatDateLabel(row.due_date)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <TaskStatusBadge status={row.status as TaskStatus} />
                        {overdue && <TaskStatusBadge status={row.status as TaskStatus} overdue />}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => void openDetail(row)}
                          className="border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-bg)]"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-bg)]"
                        >
                          Edit
                        </button>
                        {row.status !== 'completed' && (
                          <>
                            {row.status === 'todo' && (
                              <button
                                type="button"
                                onClick={() => void handleQuickStatus(row.id, 'in_progress')}
                                className="border border-sky-700 px-2 py-1 text-xs text-sky-800 hover:bg-sky-50"
                              >
                                Start
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction({
                                  id: row.id,
                                  type: 'complete',
                                  label: 'Complete',
                                })
                              }
                              className="border border-emerald-700 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-50"
                            >
                              Complete
                            </button>
                          </>
                        )}
                        {row.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                id: row.id,
                                type: 'reopen',
                                label: 'Reopen',
                              })
                            }
                            className="border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-bg)]"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <TaskFormDialog
          key={editing?.id ?? 'new-task'}
          open
          title={editing ? 'Edit task' : 'Create task'}
          employees={employees}
          initialValues={formValues}
          submitting={submitting}
          error={formError}
          fieldErrors={fieldErrors}
          allowStatusEdit={Boolean(editing)}
          mode={editing ? 'edit' : 'create'}
          onClose={() => setFormOpen(false)}
          onSubmit={(values) => void handleSave(values)}
        />
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg"
          >
            <h2 id="task-detail-title" className="text-lg font-semibold text-[var(--color-text)]">
              {detail.title}
            </h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-[var(--color-muted)]">Description</dt>
                <dd>{detail.description?.trim() ? detail.description : '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Assigned to</dt>
                <dd>
                  {detail.employee?.full_name ?? 'Unassigned'} (
                  {detail.employee?.employee_code ?? '—'})
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Priority</dt>
                <dd className="mt-1">
                  <TaskPriorityBadge priority={detail.priority} />
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Due date</dt>
                <dd>
                  {detail.due_date ? formatDateLabel(detail.due_date) : '—'}
                  {isTaskOverdue(detail, today) && (
                    <span className="ml-2 text-red-800">(Overdue)</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Status</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  <TaskStatusBadge status={detail.status as TaskStatus} />
                  {isTaskOverdue(detail, today) && (
                    <TaskStatusBadge status={detail.status as TaskStatus} overdue />
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Created</dt>
                <dd>{new Date(detail.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Completed</dt>
                <dd>
                  {detail.completed_at
                    ? new Date(detail.completed_at).toLocaleString()
                    : 'Not completed'}
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Activity</h3>
              {activityLoading && (
                <p className="mt-2 text-sm text-[var(--color-muted)]">Loading activity…</p>
              )}
              {!activityLoading && activity.length === 0 && (
                <p className="mt-2 text-sm text-[var(--color-muted)]">No activity recorded yet.</p>
              )}
              {!activityLoading && activity.length > 0 && (
                <ul className="mt-2 space-y-2 border-t border-[var(--color-border)] pt-2">
                  {activity.map((entry) => (
                    <li key={entry.id} className="text-sm">
                      <p className="font-medium">{entry.details ?? entry.action}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-bg)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={`${confirmAction?.label ?? 'Confirm'} task?`}
        message={
          confirmAction?.type === 'complete'
            ? 'This will mark the task as completed and record the completion time.'
            : 'This will reopen the task and set its status back to To Do.'
        }
        confirmLabel={confirmAction?.label ?? 'Confirm'}
        confirming={confirming}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleConfirmAction()}
      />
    </section>
  )
}
