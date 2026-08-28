import type { Database } from '../lib/database.types'
import type { Employee } from '../staff/types'

export type TrainingManagementStatus = 'valid' | 'due' | 'expiring_soon' | 'expired'

export type TrainingRecord = Database['public']['Tables']['training_records']['Row']
export type TrainingInsert = Database['public']['Tables']['training_records']['Insert']
export type TrainingUpdate = Database['public']['Tables']['training_records']['Update']

export type TrainingRecordWithEmployee = TrainingRecord & {
  employee: Employee | null
  managementStatus: TrainingManagementStatus
}

export type TrainingFormValues = {
  employee_id: string
  training_name: string
  provider: string
  training_date: string
  expiry_date: string
  certificate_reference: string
  notes: string
}

export type TrainingStatusFilter = 'all' | TrainingManagementStatus
export type TrainingExpiryFilter =
  | 'all'
  | 'has_expiry'
  | 'no_expiry'
  | 'expiring_soon'
  | 'expired'
export type TrainingSortField =
  | 'training_name'
  | 'employee'
  | 'training_date'
  | 'expiry_date'
  | 'status'

export const TRAINING_STATUS_LABELS: Record<TrainingManagementStatus, string> = {
  valid: 'Valid',
  due: 'Due',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
}

export function emptyTrainingForm(): TrainingFormValues {
  return {
    employee_id: '',
    training_name: '',
    provider: '',
    training_date: '',
    expiry_date: '',
    certificate_reference: '',
    notes: '',
  }
}

export function trainingToFormValues(record: TrainingRecord): TrainingFormValues {
  return {
    employee_id: record.employee_id,
    training_name: record.training_name,
    provider: record.provider ?? '',
    training_date: record.training_date ?? '',
    expiry_date: record.expiry_date ?? '',
    certificate_reference: record.certificate_reference ?? '',
    notes: record.notes ?? '',
  }
}
