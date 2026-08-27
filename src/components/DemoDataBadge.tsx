type DemoDataBadgeProps = {
  className?: string
  compact?: boolean
  label?: string
  title?: string
}

/** Reusable label for demonstration data that is not connected to live Ekem systems. */
export function DemoDataBadge({
  className = '',
  compact = false,
  label,
  title = 'Demonstration data only — not connected to live Ekem systems',
}: DemoDataBadgeProps) {
  const text =
    label ??
    (compact ? 'Demo data' : 'DEMO DATA — Ekem systems not yet connected')

  return (
    <span
      className={`inline-flex items-center border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] font-medium text-[var(--color-warning-text)] ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs tracking-wide'
      } ${className}`}
      title={title}
      role="status"
    >
      {text}
    </span>
  )
}
