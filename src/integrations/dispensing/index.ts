/**
 * Future dispensing adapter surface.
 * Status: Not Connected — do not invent integrations.
 */
export type DispensingIntegrationAdapter = {
  readonly status: 'not_connected'
}

export const dispensingIntegration: DispensingIntegrationAdapter = {
  status: 'not_connected',
}
