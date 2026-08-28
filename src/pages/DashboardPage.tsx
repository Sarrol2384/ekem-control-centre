import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDateLabel } from '../attendance/dateUtils'
import { useAuth } from '../auth/useAuth'
import { DemoDataBadge } from '../components/DemoDataBadge'
import { EkemBrand } from '../components/EkemBrand'
import { getStaffDataSource } from '../staff/api'
import { AttendanceStatusBadge } from '../attendance/components/AttendanceStatusBadge'
import { TaskPriorityBadge } from '../tasks/components/TaskPriorityBadge'
import { TaskStatusBadge } from '../tasks/components/TaskStatusBadge'
import { isTaskOverdue } from '../tasks/overdue'
import { DashboardSection } from '../dashboard/components/DashboardSection'
import { DashboardSkeleton } from '../dashboard/components/DashboardSkeleton'
import { SummaryCard } from '../dashboard/components/SummaryCard'
import { formatDashboardDate, formatLastUpdated, getGreeting } from '../dashboard/format'
import { loadDashboardData } from '../dashboard/loadDashboardData'
import type { AttentionItem, DashboardLoadResult, DashboardSectionKey } from '../dashboard/types'

const QUICK_ACTIONS = [
  { label: 'Add Employee', href: '/staff/new' },
  { label: 'Record Attendance', href: '/attendance' },
  { label: 'Create Task', href: '/tasks' },
  { label: 'Add Leave Request', href: '/leave' },
  { label: 'Add Training', href: '/training' },
  { label: 'Add Document', href: '/documents' },
] as const

const INTEGRATIONS = [
  { name: 'POS', status: 'Not Connected' },
  { name: 'Dispensing', status: 'Not Connected' },
  { name: 'Inventory', status: 'Not Connected' },
  { name: 'Accounting', status: 'Not Connected' },
] as const

function sectionErrorMessage(
  errors: DashboardLoadResult['errors'],
  section: DashboardSectionKey,
): string | null {
  return errors.find((entry) => entry.section === section)?.message ?? null
}

function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <p className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm text-[var(--color-muted)]">
        No items require your attention right now.
      </p>
    )
  }

  const urgent = items.filter((item) => item.severity === 'urgent')
  const attention = items.filter((item) => item.severity === 'attention')

  return (
    <div className="space-y-4">
      {urgent.length > 0 ? (
        <AttentionGroup title="Urgent" items={urgent} tone="urgent" />
      ) : null}
      {attention.length > 0 ? (
        <AttentionGroup title="Attention" items={attention} tone="attention" />
      ) : null}
    </div>
  )
}

function AttentionGroup({
  title,
  items,
  tone,
}: {
  title: string
  items: AttentionItem[]
  tone: 'urgent' | 'attention'
}) {
  const borderClass =
    tone === 'urgent'
      ? 'border-red-200 bg-red-50'
      : 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]'

  return (
    <div className={`border ${borderClass} px-4 py-3`}>
      <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li
            key={`${item.severity}-${item.label}`}
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span>
              <span className="font-medium">{item.count}</span> {item.label}
            </span>
            <Link
              to={item.href}
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              {item.actionLabel}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DashboardPage() {
  const { profile, user } = useAuth()
  const dataSource = getStaffDataSource()
  const displayName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Manager'

  const [result, setResult] = useState<DashboardLoadResult | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const next = await loadDashboardData()
      setResult(next)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    void loadDashboardData()
      .then((next) => {
        if (!mounted) return
        setResult(next)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const errors = result?.errors ?? []
  const management = result?.management
  const pharmacy = result?.pharmacy
  const loadedAt = result?.loadedAt

  const staffError = sectionErrorMessage(errors, 'staff')
  const attendanceError = sectionErrorMessage(errors, 'attendance')
  const leaveError = sectionErrorMessage(errors, 'leave')
  const tasksError = sectionErrorMessage(errors, 'tasks')
  const trainingError = sectionErrorMessage(errors, 'training')
  const documentsError = sectionErrorMessage(errors, 'documents')

  const attentionItems = useMemo(() => management?.attention ?? [], [management?.attention])

  if (loading && !result) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <EkemBrand size="md" showTagline showSubtitle className="mb-3" />
          <p className="text-base text-[var(--color-text)]">
            {getGreeting()}, {displayName}
          </p>
          <p className="text-sm text-[var(--color-muted)]">{formatDashboardDate()}</p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {dataSource === 'local_demo' ? (
            <DemoDataBadge label="Local demonstration mode — management data stored in this browser only." />
          ) : null}
          <div className="flex items-center gap-2">
            {loadedAt ? (
              <p className="text-xs text-[var(--color-muted)]">
                Last updated: {formatLastUpdated(loadedAt)}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg)] disabled:opacity-60"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <DashboardSection
        title="Today at a Glance"
        description="Staff attendance and leave for today."
        error={staffError || attendanceError ? 'Staff or attendance data could not be loaded.' : null}
        onRetry={() => void refresh()}
      >
        {management?.staff && management.attendance ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <SummaryCard label="Active Staff" value={management.staff.activeCount} />
            <SummaryCard
              label="Not Recorded Today"
              value={management.attendance.not_recorded}
              hint="Still need Present, Late, Absent, or On Leave"
            />
            <SummaryCard label="Present" value={management.attendance.present} />
            <SummaryCard label="Late" value={management.attendance.late} />
            <SummaryCard label="Absent" value={management.attendance.absent} />
            <SummaryCard label="On Leave" value={management.attendance.on_leave} />
          </div>
        ) : null}

        {management?.attendance && management.attendance.not_recorded > 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {management.attendance.not_recorded} active employee
            {management.attendance.not_recorded === 1 ? '' : 's'} still need attendance recorded
            today.{' '}
            <Link to="/attendance" className="font-medium text-[var(--color-primary)] hover:underline">
              Record Attendance
            </Link>
          </p>
        ) : null}
      </DashboardSection>

      <DashboardSection
        title="Your Attention Required"
        description="Actionable items calculated from current management data."
        error={
          management?.attention
            ? null
            : errors.length > 0
              ? 'Some management data could not be loaded to calculate attention items.'
              : null
        }
        onRetry={() => void refresh()}
      >
        <AttentionList items={attentionItems} />
      </DashboardSection>

      <DashboardSection
        title="Staff & Attendance"
        actionHref="/attendance"
        actionLabel="View Attendance"
        error={attendanceError}
        onRetry={() => void refresh()}
      >
        {management?.attendance ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <SummaryCard label="Active Staff" value={management.attendance.activeStaff} />
              <SummaryCard label="Not Recorded" value={management.attendance.not_recorded} />
              <SummaryCard label="Present" value={management.attendance.present} />
              <SummaryCard label="Late" value={management.attendance.late} />
              <SummaryCard label="Absent" value={management.attendance.absent} />
              <SummaryCard label="On Leave" value={management.attendance.on_leave} />
            </div>

            {management.attendance.attentionEmployees.length > 0 ? (
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
                <p className="border-b border-[var(--color-border)] px-4 py-2 text-sm font-medium">
                  Employees requiring attention today
                </p>
                <ul className="divide-y divide-[var(--color-border)]">
                  {management.attendance.attentionEmployees.map((employee) => (
                    <li
                      key={employee.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"
                    >
                      <span>{employee.name}</span>
                      <AttendanceStatusBadge status={employee.status} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </DashboardSection>

      <DashboardSection
        title="Tasks"
        actionHref="/tasks"
        actionLabel="View Tasks"
        error={tasksError}
        onRetry={() => void refresh()}
      >
        {management?.tasks ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard label="Active Tasks" value={management.tasks.active} />
              <SummaryCard label="In Progress" value={management.tasks.in_progress} />
              <SummaryCard label="Overdue" value={management.tasks.overdue} />
              <SummaryCard label="Completed" value={management.tasks.completed} />
            </div>

            {management.tasks.priorityTasks.length > 0 ? (
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
                <p className="border-b border-[var(--color-border)] px-4 py-2 text-sm font-medium">
                  Tasks requiring attention
                </p>
                <ul className="divide-y divide-[var(--color-border)]">
                  {management.tasks.priorityTasks.map((task) => (
                    <li key={task.id} className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-[var(--color-text)]">{task.title}</p>
                          <p className="text-[var(--color-muted)]">
                            {task.employee?.full_name ?? 'Unassigned'}
                            {task.due_date ? ` · Due ${formatDateLabel(task.due_date)}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <TaskPriorityBadge priority={task.priority} />
                          <TaskStatusBadge
                            status={task.status}
                            overdue={isTaskOverdue(task)}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">No active tasks require attention.</p>
            )}
          </div>
        ) : null}
      </DashboardSection>

      <DashboardSection
        title="Training & Documents"
        description="Compliance and employee records overview."
        error={trainingError || documentsError ? 'Training or document data could not be loaded.' : null}
        onRetry={() => void refresh()}
      >
        {management?.training && management.documents ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Training</h3>
                <Link to="/training" className="text-sm text-[var(--color-primary)] hover:underline">
                  View Training
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryCard label="Valid" value={management.training.valid} />
                <SummaryCard label="Due" value={management.training.due} />
                <SummaryCard label="Expiring Soon" value={management.training.expiring_soon} />
                <SummaryCard label="Expired" value={management.training.expired} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Documents</h3>
                <Link to="/documents" className="text-sm text-[var(--color-primary)] hover:underline">
                  View Documents
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard label="Valid" value={management.documents.valid} />
                <SummaryCard label="Expiring Soon" value={management.documents.expiring_soon} />
                <SummaryCard label="Expired" value={management.documents.expired} />
              </div>
            </div>

            <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2">
              <SummaryCard
                label="Training — Employees Requiring Attention"
                value={management.training.employees_requiring_attention}
              />
              <SummaryCard
                label="Documents — Employees Requiring Attention"
                value={management.documents.employees_requiring_attention}
              />
            </div>
          </div>
        ) : null}
      </DashboardSection>

      <section className="space-y-4 border-2 border-dashed border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Pharmacy Operations</h2>
          <DemoDataBadge label="DEMONSTRATION DATA — NOT CONNECTED TO EKEM'S LIVE SYSTEMS" />
        </div>
        <p className="text-sm text-[var(--color-warning-text)]">
          This section is for demonstration purposes only. Figures are fictional and are not live
          Ekem pharmacy performance data.
        </p>

        {pharmacy ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Sales" value={pharmacy.salesDisplay} hint="Demonstration only" />
            <SummaryCard label="Prescriptions" value={pharmacy.prescriptions} hint="Demonstration only" />
            <SummaryCard label="Low Stock" value={pharmacy.lowStock} hint="Demonstration only" />
            <SummaryCard
              label="Suppliers Requiring Attention"
              value={pharmacy.suppliersRequiringAttention}
              hint="Demonstration only"
            />
          </div>
        ) : null}

        <div className="border border-[var(--color-warning-border)] bg-[var(--color-surface)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Integration Status</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {INTEGRATIONS.map((integration) => (
              <li
                key={integration.name}
                className="flex items-center justify-between gap-3 border border-[var(--color-border)] px-3 py-2 text-sm"
              >
                <span>{integration.name}</span>
                <span className="font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  {integration.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <DashboardSection title="Quick Actions" description="Jump to existing manager workflows.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-bg)]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </DashboardSection>

      {leaveError ? (
        <p className="text-xs text-[var(--color-muted)]" role="status">
          Leave summary unavailable: {leaveError}
        </p>
      ) : null}
    </div>
  )
}
