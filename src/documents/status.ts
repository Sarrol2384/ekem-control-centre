import { addDays, todayDateOnly } from '../attendance/dateUtils'
import { EXPIRING_SOON_DAYS } from '../training/status'
import type { DocumentManagementStatus, EmployeeDocument } from './types'

/** Reuses the same 30-day threshold as Training Management. */
export { EXPIRING_SOON_DAYS }

export function deriveDocumentStatus(
  record: Pick<EmployeeDocument, 'expiry_date'>,
  today: string = todayDateOnly(),
): DocumentManagementStatus {
  if (!record.expiry_date) {
    return 'valid'
  }
  if (record.expiry_date < today) {
    return 'expired'
  }
  const soonLimit = addDays(today, EXPIRING_SOON_DAYS)
  if (record.expiry_date <= soonLimit) {
    return 'expiring_soon'
  }
  return 'valid'
}

export function needsDocumentAttention(
  record: Pick<EmployeeDocument, 'expiry_date'>,
  today: string = todayDateOnly(),
): boolean {
  const status = deriveDocumentStatus(record, today)
  return status === 'expiring_soon' || status === 'expired'
}
