import type { Database } from '../lib/database.types'
import type { Employee } from '../staff/types'

export type DocumentManagementStatus = 'valid' | 'expiring_soon' | 'expired'

export type DocumentType =
  | 'employment_contract'
  | 'identification'
  | 'qualification'
  | 'professional_registration'
  | 'training_certificate'
  | 'other'

export type EmployeeDocument = Database['public']['Tables']['employee_documents']['Row']
export type EmployeeDocumentInsert =
  Database['public']['Tables']['employee_documents']['Insert']
export type EmployeeDocumentUpdate =
  Database['public']['Tables']['employee_documents']['Update']

export type EmployeeDocumentWithEmployee = EmployeeDocument & {
  employee: Employee | null
  managementStatus: DocumentManagementStatus
}

export type DocumentFormValues = {
  employee_id: string
  title: string
  document_type: DocumentType
  document_date: string
  expiry_date: string
  reference_code: string
  notes: string
}

export type DocumentStatusFilter = 'all' | DocumentManagementStatus
export type DocumentExpiryFilter =
  | 'all'
  | 'has_expiry'
  | 'no_expiry'
  | 'expiring_soon'
  | 'expired'
export type DocumentSortField =
  | 'title'
  | 'employee'
  | 'document_date'
  | 'expiry_date'
  | 'upload_date'
  | 'status'

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  employment_contract: 'Employment Contract',
  identification: 'Identification',
  qualification: 'Qualification',
  professional_registration: 'Professional Registration',
  training_certificate: 'Training Certificate',
  other: 'Other',
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentManagementStatus, string> = {
  valid: 'Valid',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
}

export const EMPLOYEE_DOCUMENTS_BUCKET = 'employee-documents'

export function emptyDocumentForm(): DocumentFormValues {
  return {
    employee_id: '',
    title: '',
    document_type: 'other',
    document_date: '',
    expiry_date: '',
    reference_code: '',
    notes: '',
  }
}

export function documentToFormValues(document: EmployeeDocument): DocumentFormValues {
  return {
    employee_id: document.employee_id,
    title: document.title,
    document_type: document.document_type as DocumentType,
    document_date: document.document_date ?? '',
    expiry_date: document.expiry_date ?? '',
    reference_code: document.reference_code ?? '',
    notes: document.notes ?? '',
  }
}
