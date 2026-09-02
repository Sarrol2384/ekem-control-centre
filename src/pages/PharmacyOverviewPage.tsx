import { getStaffDataSource } from '../staff/api'
import { DemoDataBadge } from '../components/DemoDataBadge'
import {
  PHARMACY_INTEGRATIONS,
  PHARMACY_SOURCE_NOTE,
  PHARMACY_SOURCE_SYSTEM,
} from '../pharmacy/integrationStatus'

export function PharmacyOverviewPage() {
  const dataSource = getStaffDataSource()
  const isLocalDemo = dataSource === 'local_demo'

  return (
    <section className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Pharmacy Overview</h1>
          {isLocalDemo ? (
            <DemoDataBadge label="Demonstration data — not connected to live Ekem systems" />
          ) : null}
        </div>
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
          {isLocalDemo
            ? 'Live pharmacy metrics are not available in this application yet. Figures shown on the dashboard in local demo mode are fictional placeholders until a secure integration is in place.'
            : 'Live pharmacy data not connected. Pharmacy operational data unavailable — UNISOLV not connected. The Control Centre is currently managing people, attendance, leave, tasks, training and documents.'}
        </p>
      </div>

      <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Source system</h2>
        <p className="mt-3 text-sm text-[var(--color-text)]">
          <span className="font-medium">{PHARMACY_SOURCE_SYSTEM.product}</span>
          {' — '}
          {PHARMACY_SOURCE_SYSTEM.vendor}
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{PHARMACY_SOURCE_NOTE}</p>
      </div>

      <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Integration status</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {PHARMACY_INTEGRATIONS.map((integration) => (
            <li
              key={integration.name}
              className="flex items-center justify-between gap-3 border border-[var(--color-border)] px-3 py-2 text-sm"
            >
              <span>{integration.name}</span>
              <span className="font-medium uppercase tracking-wide text-[var(--color-muted)]">
                {integration.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-[var(--color-muted)]">
        When UCS or Ekem IT provides a supported export or API path from UNISOLV, pharmacy
        operations can be connected here without replacing the existing till and dispensary system.
      </p>
    </section>
  )
}
