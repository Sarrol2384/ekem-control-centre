import { getSupabaseClient } from '../lib/supabase'
import { EMPLOYEE_DOCUMENTS_BUCKET } from './types'

const SIGNED_URL_TTL_SECONDS = 120

export function buildDocumentStoragePath(
  employeeId: string,
  documentId: string,
  fileName: string,
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${employeeId}/${documentId}/${safeName}`
}

export async function uploadEmployeeDocumentFile(
  employeeId: string,
  documentId: string,
  file: File,
): Promise<string> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('File upload requires a configured Supabase connection.')
  }

  const path = buildDocumentStoragePath(employeeId, documentId, file.name)
  const { error } = await supabase.storage.from(EMPLOYEE_DOCUMENTS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  })

  if (error) throw new Error(error.message)
  return path
}

export async function getEmployeeDocumentSignedUrl(storagePath: string): Promise<string> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Document retrieval requires a configured Supabase connection.')
  }

  const { data, error } = await supabase.storage
    .from(EMPLOYEE_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (error) throw new Error(error.message)
  if (!data?.signedUrl) throw new Error('Unable to create a secure document link.')
  return data.signedUrl
}

export async function removeEmployeeDocumentFile(storagePath: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.storage.from(EMPLOYEE_DOCUMENTS_BUCKET).remove([storagePath])
  if (error) {
    console.error('Failed to remove storage object', error.message)
  }
}
