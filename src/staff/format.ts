export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function displayValue(value: string | null | undefined): string {
  if (!value || !value.trim()) return 'Not provided'
  return value
}
