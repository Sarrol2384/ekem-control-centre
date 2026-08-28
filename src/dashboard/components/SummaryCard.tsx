type SummaryCardProps = {
  label: string
  value: string | number
  hint?: string
}

export function SummaryCard({ label, value, hint }: SummaryCardProps) {
  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p> : null}
    </div>
  )
}
