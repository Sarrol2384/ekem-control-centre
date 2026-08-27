/**
 * Future accounting adapter surface.
 * Status: Not Connected — do not invent integrations.
 */
export type AccountingIntegrationAdapter = {
  readonly status: 'not_connected'
}

export const accountingIntegration: AccountingIntegrationAdapter = {
  status: 'not_connected',
}
