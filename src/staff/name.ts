/** Split a stored full name into given name (first word) and surname (remainder). */
export function splitFullName(fullName: string): { first_name: string; surname: string } {
  const trimmed = fullName.trim()
  if (!trimmed) return { first_name: '', surname: '' }

  const space = trimmed.indexOf(' ')
  if (space === -1) return { first_name: trimmed, surname: '' }

  return {
    first_name: trimmed.slice(0, space),
    surname: trimmed.slice(space + 1).trim(),
  }
}

export function joinFullName(firstName: string, surname: string): string {
  return [firstName.trim(), surname.trim()].filter(Boolean).join(' ')
}
