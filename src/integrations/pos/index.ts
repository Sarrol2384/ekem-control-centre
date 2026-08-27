/**
 * Future POS adapter surface.
 * Status: Not Connected — do not invent integrations.
 */
export type PosIntegrationAdapter = {
  readonly status: 'not_connected'
}

export const posIntegration: PosIntegrationAdapter = {
  status: 'not_connected',
}
