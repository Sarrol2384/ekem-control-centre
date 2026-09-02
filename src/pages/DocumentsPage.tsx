import { useEffect, useMemo, useState } from 'react'
import { formatDateLabel, todayDateOnly } from '../attendance/dateUtils'
import { useAuth } from '../auth/useAuth'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DemoDataBadge } from '../components/DemoDataBadge'
import { isSupabaseConfigured } from '../lib/supabase'
import { getStaffDataSource, listEmployees } from '../staff/api'
import type { Employee } from '../staff/types'
import {
  createEmployeeDocument,
  deleteEmployeeDocument,
  listEmployeeDocuments,
  openEmployeeDocument,
  summarizeDocuments,
  updateEmployeeDocument,
} from '../documents/api'
import { DocumentFormDialog } from '../documents/components/DocumentFormDialog'
import { DocumentStatusBadge } from '../documents/components/DocumentStatusBadge'
import { EXPIRING_SOON_DAYS } from '../documents/status'
import type {
  DocumentExpiryFilter,
  DocumentFormValues,
  DocumentManagementStatus,
  DocumentSortField,
  DocumentStatusFilter,
  DocumentType,
  EmployeeDocumentWithEmployee,
} from '../documents/types'
import {
  DOCUMENT_TYPE_LABELS,
  documentToFormValues,
  emptyDocumentForm,
} from '../documents/types'
import {
  hasDocumentFieldErrors,
  validateDocumentForm,
  type DocumentFieldErrors,
} from '../documents/validation'

export function DocumentsPage() {
  const { profile, user } = useAuth()
  const [rows, setRows] = useState<EmployeeDocumentWithEmployee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DocumentStatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [expiryFilter, setExpiryFilter] = useState<DocumentExpiryFilter>('all')
  const [sortField, setSortField] = useState<DocumentSortField>('expiry_date')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeeDocumentWithEmployee | null>(null)
  const [formValues, setFormValues] = useState<DocumentFormValues>(emptyDocumentForm())
  const [fieldErrors, setFieldErrors] = useState<DocumentFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [detail, setDetail] = useState<EmployeeDocumentWithEmployee | null>(null)
  const [viewing, setViewing] = useState(false)
  const [viewError, setViewError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDocumentWithEmployee | null>(null)
  const [deleting, setDeleting] = useState(false)
  const dataSource = getStaffDataSource()
  const today = todayDateOnly()
  const actorId = user?.id ?? profile?.id ?? null

  async function refresh() {
    const [documentRows, employeeRows] = await Promise.all([
      listEmployeeDocuments(),
      listEmployees(),
    ])
    setRows(documentRows)
    setEmployees(employeeRows)
  }

  useEffect(() => {
    let mounted = true
    void Promise.all([listEmployeeDocuments(), listEmployees()])
      .then(([documentRows, employeeRows]) => {
        if (!mounted) return
        setRows(documentRows)
        setEmployees(employeeRows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unable to load documents.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const summary = useMemo(() => summarizeDocuments(rows, today), [rows, today])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    let result = rows.filter((row) => {
      if (query) {
        const haystack = [
          row.title,
          row.reference_code ?? '',
          row.notes ?? '',
          DOCUMENT_TYPE_LABELS[row.document_type as DocumentType] ?? row.document_type,
          row.employee?.full_name ?? '',
          row.employee?.employee_code ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }
      if (employeeFilter !== 'all' && row.employee_id !== employeeFilter) return false
      if (typeFilter !== 'all' && row.document_type !== typeFilter) return false
      if (statusFilter !== 'all' && row.managementStatus !== statusFilter) return false
      if (expiryFilter === 'has_expiry' && !row.expiry_date) return false
      if (expiryFilter === 'no_expiry' && row.expiry_date) return false
      if (expiryFilter === 'expiring_soon' && row.managementStatus !== 'expiring_soon') {
        return false
      }
      if (expiryFilter === 'expired' && row.managementStatus !== 'expired') return false
      return true
    })

    result = [...result].sort((a, b) => {
      if (sortField === 'title') return a.title.localeCompare(b.title)
      if (sortField === 'employee') {
        return (a.employee?.full_name ?? '').localeCompare(b.employee?.full_name ?? '')
      }
      if (sortField === 'document_date') {
        const aDate = a.document_date ?? '9999-12-31'
        const bDate = b.document_date ?? '9999-12-31'
        return aDate.localeCompare(bDate)
      }
      if (sortField === 'upload_date') {
        return b.created_at.localeCompare(a.created_at)
      }
      if (sortField === 'status') {
        return a.managementStatus.localeCompare(b.managementStatus)
      }
      const aExpiry = a.expiry_date ?? '9999-12-31'
      const bExpiry = b.expiry_date ?? '9999-12-31'
      return aExpiry.localeCompare(bExpiry)
    })

    return result
  }, [rows, search, employeeFilter, typeFilter, statusFilter, expiryFilter, sortField])

  function openCreate() {
    setEditing(null)
    setFormValues(emptyDocumentForm())
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: EmployeeDocumentWithEmployee) {
    setEditing(row)
    setFormValues(documentToFormValues(row))
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSave(values: DocumentFormValues, file: File | null) {
    const nextErrors = validateDocumentForm(values)
    setFieldErrors(nextErrors)
    if (hasDocumentFieldErrors(nextErrors)) {
      setFormError('Please correct the highlighted fields.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      if (editing) {
        await updateEmployeeDocument(editing.id, values, actorId, file)
      } else {
        await createEmployeeDocument(values, actorId, file)
      }
      setFormOpen(false)
      await refresh()
      if (detail?.id === editing?.id) {
        const updated = await listEmployeeDocuments()
        const match = updated.find((row) => row.id === editing?.id)
        if (match) setDetail(match)
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Unable to save document.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleViewFile(row: EmployeeDocumentWithEmployee) {
    setViewError(null)
    setViewing(true)
    try {
      await openEmployeeDocument(row)
    } catch (err: unknown) {
      setViewError(err instanceof Error ? err.message : 'Unable to open document.')
    } finally {
      setViewing(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteEmployeeDocument(deleteTarget.id, actorId)
      setDeleteTarget(null)
      if (detail?.id === deleteTarget.id) setDetail(null)
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to delete document.')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  function rowHighlight(status: DocumentManagementStatus): string {
    if (status === 'expired') return 'bg-red-50/60'
    if (status === 'expiring_soon') return 'bg-amber-50/60'
    return ''
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Documents</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Manage employee document metadata and secure file storage. Expiring soon uses a{' '}
            {EXPIRING_SOON_DAYS}-day threshold.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
        >
          Add document
        </button>
      </div>

      {dataSource === 'local_demo' && (
        <DemoDataBadge label="Local demonstration documents — metadata only, browser storage." />
      )}

      {viewError && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {viewError}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: summary.total },
          { label: 'Valid', value: summary.valid },
          { label: 'Expiring Soon', value: summary.expiring_soon },
          { label: 'Expired', value: summary.expired },
        ].map((card) => (
          <div
            key={card.label}
            className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:grid-cols-2 lg:grid-cols-6">
        <label className="block text-sm lg:col-span-2">
          <span className="mb-1 block font-medium">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Document, reference, employee…"
            className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Employee</span>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]"
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
          <span className="mb-1 block font-medium">Document type</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="all">All types</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DocumentStatusFilter)}
            className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="all">All</option>
            <option value="valid">Valid</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Expiry</span>
          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value as DocumentExpiryFilter)}
            className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="all">All</option>
            <option value="has_expiry">Has expiry date</option>
            <option value="no_expiry">No expiry date</option>
            <option value="expiring_soon">Expiring soon</option>
            <option value="expired">Expired</option>
          </select>
        </label>
        <label className="block text-sm md:col-span-2 lg:col-span-6">
          <span className="mb-1 block font-medium">Sort by</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as DocumentSortField)}
            className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="expiry_date">Expiry date</option>
            <option value="document_date">Document date</option>
            <option value="upload_date">Upload date</option>
            <option value="title">Document name</option>
            <option value="employee">Employee</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading documents…</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
          {rows.length === 0
            ? 'No employee documents have been added.'
            : 'No documents match your filters.'}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Employee</th>
                <th className="px-3 py-2 font-medium">Document</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Document date</th>
                <th className="px-3 py-2 font-medium">Expiry date</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-[var(--color-border)] last:border-b-0 ${rowHighlight(row.managementStatus)}`}
                >
                  <td className="px-3 py-3">
                    <div>{row.employee?.full_name ?? 'Unknown'}</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {row.employee?.employee_code ?? '—'}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{row.title}</div>
                    {row.is_demo && (
                      <div className="text-xs text-[var(--color-muted)]">Demo record</div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {DOCUMENT_TYPE_LABELS[row.document_type as DocumentType]}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {row.document_date ? formatDateLabel(row.document_date) : '—'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {row.expiry_date ? (
                      <span
                        className={
                          row.managementStatus === 'expired' ||
                          row.managementStatus === 'expiring_soon'
                            ? 'font-medium text-red-800'
                            : ''
                        }
                      >
                        {formatDateLabel(row.expiry_date)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <DocumentStatusBadge status={row.managementStatus} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setDetail(row)}
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
                      {row.storage_path && isSupabaseConfigured && (
                        <button
                          type="button"
                          disabled={viewing}
                          onClick={() => void handleViewFile(row)}
                          className="border border-sky-700 px-2 py-1 text-xs text-sky-800 hover:bg-sky-50 disabled:opacity-60"
                        >
                          {viewing ? 'Opening…' : 'View file'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="border border-red-300 px-2 py-1 text-xs text-red-800 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <DocumentFormDialog
          key={editing?.id ?? 'new-document'}
          open
          title={editing ? 'Edit document' : 'Add document'}
          employees={employees}
          initialValues={formValues}
          submitting={submitting}
          error={formError}
          fieldErrors={fieldErrors}
          mode={editing ? 'edit' : 'create'}
          hasExistingFile={Boolean(editing?.storage_path)}
          onClose={() => setFormOpen(false)}
          onSubmit={(values, file) => void handleSave(values, file)}
        />
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg"
          >
            <h2
              id="document-detail-title"
              className="text-lg font-semibold text-[var(--color-text)]"
            >
              {detail.title}
            </h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--color-muted)]">Employee</dt>
                <dd>
                  {detail.employee?.full_name ?? 'Unknown'} ({detail.employee?.employee_code ?? '—'}
                  )
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Type</dt>
                <dd>{DOCUMENT_TYPE_LABELS[detail.document_type as DocumentType]}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Status</dt>
                <dd className="mt-1">
                  <DocumentStatusBadge status={detail.managementStatus} />
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Reference</dt>
                <dd>{detail.reference_code ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Document date</dt>
                <dd>{detail.document_date ? formatDateLabel(detail.document_date) : '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Expiry date</dt>
                <dd>{detail.expiry_date ? formatDateLabel(detail.expiry_date) : '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Uploaded</dt>
                <dd>{new Date(detail.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">File</dt>
                <dd>
                  {detail.storage_path
                    ? isSupabaseConfigured
                      ? 'Stored in private Supabase bucket'
                      : 'Demonstration metadata only'
                    : 'No file attached'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--color-muted)]">Notes</dt>
                <dd>{detail.notes?.trim() ? detail.notes : '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Created</dt>
                <dd>{new Date(detail.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Updated</dt>
                <dd>{new Date(detail.updated_at).toLocaleString()}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {detail.storage_path && isSupabaseConfigured && (
                <button
                  type="button"
                  disabled={viewing}
                  onClick={() => void handleViewFile(detail)}
                  className="border border-sky-700 px-3 py-2 text-sm text-sky-800 hover:bg-sky-50 disabled:opacity-60"
                >
                  {viewing ? 'Opening…' : 'View file'}
                </button>
              )}
              <button
                type="button"
                onClick={() => openEdit(detail)}
                className="border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-bg)]"
              >
                Edit
              </button>
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
        open={Boolean(deleteTarget)}
        title="Delete document record?"
        message="This will permanently remove the document metadata and any stored file. This action cannot be undone."
        confirmLabel="Delete"
        confirming={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </section>
  )
}
