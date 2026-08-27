/**
 * Future inventory adapter surface.
 * Status: Not Connected — do not invent integrations.
 */
export type InventoryIntegrationAdapter = {
  readonly status: 'not_connected'
}

export const inventoryIntegration: InventoryIntegrationAdapter = {
  status: 'not_connected',
}
