export function toDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year!, month! - 1, day)
}

export function todayDateOnly(): string {
  return toDateOnly(new Date())
}

export function addDays(dateOnly: string, days: number): string {
  const date = parseDateOnly(dateOnly)
  date.setDate(date.getDate() + days)
  return toDateOnly(date)
}

export function startOfWeek(dateOnly: string): string {
  const date = parseDateOnly(dateOnly)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return toDateOnly(date)
}

export function startOfMonth(dateOnly: string): string {
  const date = parseDateOnly(dateOnly)
  date.setDate(1)
  return toDateOnly(date)
}

export function formatDateLabel(dateOnly: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parseDateOnly(dateOnly))
}

export function formatTimeDisplay(value: string | null | undefined): string {
  if (!value) return '—'
  return value.slice(0, 5)
}

export type DateRange = { start: string; end: string }

export function rangeForPreset(
  preset: 'today' | 'yesterday' | 'week' | 'month',
  reference = todayDateOnly(),
): DateRange {
  switch (preset) {
    case 'today':
      return { start: reference, end: reference }
    case 'yesterday': {
      const yesterday = addDays(reference, -1)
      return { start: yesterday, end: yesterday }
    }
    case 'week':
      return { start: startOfWeek(reference), end: reference }
    case 'month':
      return { start: startOfMonth(reference), end: reference }
  }
}
