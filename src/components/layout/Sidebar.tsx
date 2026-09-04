import { NavLink } from 'react-router-dom'
import { EkemBrand } from '../EkemBrand'
import { NAV_ITEMS } from './navItems'

type SidebarProps = {
  open: boolean
  onNavigate?: () => void
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  return (
    <aside
      className={`no-print fixed inset-y-0 left-0 z-30 flex w-[var(--sidebar-width)] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Main navigation"
    >
      <div className="brand-accent-bar" />
      <div className="border-b border-[var(--color-border)] bg-gradient-to-b from-white to-[var(--color-brand-teal-light)] px-4 py-4">
        <EkemBrand size="sm" showTagline showSubtitle />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item ? item.end : false}
            onClick={onNavigate}
            className={({ isActive }) =>
              `px-3 py-2.5 text-sm ${isActive ? 'nav-link-active font-semibold' : 'nav-link-idle'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-muted)]">
        <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-brand-teal)]" aria-hidden />
        {' '}
        Ekem Pharmacy Control Centre
      </div>
    </aside>
  )
}
