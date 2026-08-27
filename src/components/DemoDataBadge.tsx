type DemoDataBadgeProps = {
  className?: string
  compact?: boolean
}

/** Reusable label for pharmacy metrics that are not connected to live Ekem systems. */
export function DemoDataBadge({ className = '', compact = false }: DemoDataBadgeProps) {
  return (
    <span
      className={`inline-flex items-center border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] font-medium text-[var(--color-warning-text)] ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs tracking-wide'
      } ${className}`}
      title="Demonstration figures only — Ekem systems are not connected"
      role="status"
    >
      {compact ? 'Demo data' : 'DEMO DATA — Ekem systems not yet connected'}
    </span>
  )
}
