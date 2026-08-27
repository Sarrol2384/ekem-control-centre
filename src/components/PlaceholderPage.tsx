import type { ReactNode } from 'react'
import { DemoDataBadge } from './DemoDataBadge'

type PlaceholderPageProps = {
  title: string
  description: string
  showDemoBadge?: boolean
  children?: ReactNode
}

export function PlaceholderPage({
  title,
  description,
  showDemoBadge = false,
  children,
}: PlaceholderPageProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">{description}</p>
        </div>
        {showDemoBadge && <DemoDataBadge />}
      </div>

      <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-8 text-sm text-[var(--color-muted)]">
        {children ?? (
          <p>
            This module is a navigation placeholder for Phase 1 Foundation. Functionality will be
            added in a later phase.
          </p>
        )}
      </div>
    </section>
  )
}
