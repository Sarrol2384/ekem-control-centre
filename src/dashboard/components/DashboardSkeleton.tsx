export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-[var(--color-border)]" />
        <div className="h-8 w-64 bg-[var(--color-border)]" />
        <div className="h-4 w-48 bg-[var(--color-border)]" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-24 border border-[var(--color-border)] bg-[var(--color-surface)]" />
        ))}
      </div>

      <div className="h-40 border border-[var(--color-border)] bg-[var(--color-surface)]" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-56 border border-[var(--color-border)] bg-[var(--color-surface)]" />
        <div className="h-56 border border-[var(--color-border)] bg-[var(--color-surface)]" />
      </div>
    </div>
  )
}
