import { addDays, todayDateOnly } from '../attendance/dateUtils'
import type { TrainingManagementStatus, TrainingRecord } from './types'

/**
 * Training records with an expiry date within this many days (inclusive) of today
 * are shown as "Expiring Soon". Threshold: 30 calendar days.
 */
export const EXPIRING_SOON_DAYS = 30

export function deriveTrainingStatus(
  record: Pick<TrainingRecord, 'training_date' | 'expiry_date'>,
  today: string = todayDateOnly(),
): TrainingManagementStatus {
  if (record.expiry_date && record.expiry_date < today) {
    return 'expired'
  }

  if (record.expiry_date) {
    const soonLimit = addDays(today, EXPIRING_SOON_DAYS)
    if (record.expiry_date <= soonLimit) {
      return 'expiring_soon'
    }
  }

  if (!record.training_date || record.training_date > today) {
    return 'due'
  }

  return 'valid'
}

export function needsTrainingAttention(
  record: Pick<TrainingRecord, 'training_date' | 'expiry_date'>,
  today: string = todayDateOnly(),
): boolean {
  const status = deriveTrainingStatus(record, today)
  return status === 'due' || status === 'expiring_soon' || status === 'expired'
}
