import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

type SidebarProps = {
  open: boolean
  onNavigate?: () => void
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-[var(--sidebar-width)] border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 lg:static lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Main navigation"
    >
      <div className="flex h-[var(--header-height)] items-center border-b border-[var(--color-border)] px-5">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Ekem Pharmacy</p>
          <p className="text-xs text-[var(--color-muted)]">Manager Control Centre</p>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item ? item.end : false}
            onClick={onNavigate}
            className={({ isActive }) =>
              `px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-[var(--color-primary)] font-medium text-white'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
