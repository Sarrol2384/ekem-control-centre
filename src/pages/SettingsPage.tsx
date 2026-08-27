import { PlaceholderPage } from '../components/PlaceholderPage'

export function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Pharmacy profile, users, roles, and integration status will be implemented in a later phase."
    >
      <div className="space-y-3">
        <p>
          This module is a navigation placeholder for Phase 1 Foundation. Functionality will be
          added in a later phase.
        </p>
        <div className="text-sm text-[var(--color-text)]">
          <p className="font-medium">Integration status (preview)</p>
          <ul className="mt-2 space-y-1 text-[var(--color-muted)]">
            <li>POS — Not Connected</li>
            <li>Dispensing — Not Connected</li>
            <li>Inventory — Not Connected</li>
            <li>Accounting — Not Connected</li>
          </ul>
        </div>
      </div>
    </PlaceholderPage>
  )
}
