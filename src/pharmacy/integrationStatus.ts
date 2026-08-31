/** Ekem's live pharmacy operations platform — not yet integrated with the Manager Control Centre. */
export const PHARMACY_SOURCE_SYSTEM = {
  product: 'UNISOLV',
  vendor: 'UCS Technology Services',
  summary:
    "Ekem's on-premises pharmacy operations platform (terminal access, POS, dispensing, inventory).",
} as const

export const PHARMACY_INTEGRATIONS = [
  { name: 'POS', status: 'Not Connected' },
  { name: 'Dispensing', status: 'Not Connected' },
  { name: 'Inventory', status: 'Not Connected' },
  { name: 'Accounting', status: 'Not Connected' },
] as const

export const PHARMACY_SOURCE_NOTE = `Planned source system: ${PHARMACY_SOURCE_SYSTEM.product} (${PHARMACY_SOURCE_SYSTEM.vendor}) — ${PHARMACY_SOURCE_SYSTEM.summary} Not connected to this application.`
