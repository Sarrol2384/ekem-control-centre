import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type DashboardSectionProps = {
  title: string
  description?: string
  actionHref?: string
  actionLabel?: string
  error?: string | null
  onRetry?: () => void
  children: ReactNode
}

export function DashboardSection({
  title,
  description,
  actionHref,
  actionLabel,
  error,
  onRetry,
  children,
}: DashboardSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
          ) : null}
        </div>
        {actionHref && actionLabel ? (
          <Link
            to={actionHref}
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>

      {error ? (
        <div
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <p>Unable to load {title.toLowerCase()}.</p>
          <p className="mt-1 text-red-700">{error}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 border border-red-300 bg-white px-3 py-1 text-sm hover:bg-red-50"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : (
        children
      )}
    </section>
  )
}
