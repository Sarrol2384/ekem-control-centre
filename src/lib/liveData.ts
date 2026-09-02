import { getSupabaseClient } from './supabase'

/** True when the app reads/writes the configured Supabase project (live Ekem data path). */
export function isLiveSupabaseData(): boolean {
  return getSupabaseClient() !== null
}

export type DemoFlagged = { is_demo: boolean }

/** In live Supabase mode, exclude fictional demonstration rows. Local demo keeps all rows. */
export function isVisibleBusinessRecord<T extends DemoFlagged>(row: T): boolean {
  if (!isLiveSupabaseData()) return true
  return !row.is_demo
}

export function filterVisibleBusinessRecords<T extends DemoFlagged>(rows: T[]): T[] {
  return rows.filter(isVisibleBusinessRecord)
}
