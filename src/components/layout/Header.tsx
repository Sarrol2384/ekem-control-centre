import { useAuth } from '../../auth/useAuth'

type HeaderProps = {
  onMenuClick: () => void
}

function formatToday() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, user, signOut } = useAuth()
  const displayName = profile?.full_name ?? user?.email ?? 'Manager'

  return (
    <header className="sticky top-0 z-20 flex h-[var(--header-height)] items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="border border-[var(--color-border)] px-2.5 py-1.5 text-sm lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          Menu
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-text)] sm:text-base">
            Manager Control Centre
          </p>
          <p className="truncate text-xs text-[var(--color-muted)]">{formatToday()}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-[var(--color-text)]">{displayName}</p>
          <p className="text-xs text-[var(--color-muted)] capitalize">
            {profile?.role ?? 'manager'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg)]"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
