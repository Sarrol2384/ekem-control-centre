import { isLiveSupabaseData } from '../lib/liveData'
import { getSupabaseClient } from '../lib/supabase'
import type { PharmacyDashboardState, PharmacyDemoMetrics } from './types'

const STATIC_DEMO: PharmacyDemoMetrics = {
  salesDisplay: 'R42,680',
  prescriptions: 184,
  lowStock: 23,
  suppliersRequiringAttention: 3,
  source: 'static',
}

function formatZar(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount)
}

async function loadLocalDemoPharmacyMetrics(): Promise<PharmacyDemoMetrics> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return STATIC_DEMO
  }

  try {
    const [salesRes, rxRes, inventoryRes, suppliersRes] = await Promise.all([
      supabase
        .from('demo_sales')
        .select('amount')
        .order('metric_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('demo_prescriptions')
        .select('processed_count')
        .order('metric_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('demo_inventory').select('quantity_on_hand, minimum_level'),
      supabase
        .from('demo_suppliers')
        .select('outstanding_orders, pending_deliveries, outstanding_invoices'),
    ])

    const hasSales = salesRes.data?.amount != null
    const hasRx = rxRes.data?.processed_count != null
    const hasInventory = (inventoryRes.data?.length ?? 0) > 0
    const hasSuppliers = (suppliersRes.data?.length ?? 0) > 0

    if (!hasSales && !hasRx && !hasInventory && !hasSuppliers) {
      return STATIC_DEMO
    }

    const lowStock = hasInventory
      ? (inventoryRes.data ?? []).filter(
          (row) => row.quantity_on_hand <= row.minimum_level,
        ).length
      : STATIC_DEMO.lowStock

    const suppliersRequiringAttention = hasSuppliers
      ? (suppliersRes.data ?? []).filter(
          (row) =>
            row.outstanding_orders > 0 ||
            row.pending_deliveries > 0 ||
            row.outstanding_invoices > 0,
        ).length
      : STATIC_DEMO.suppliersRequiringAttention

    return {
      salesDisplay: hasSales
        ? formatZar(Number(salesRes.data!.amount))
        : STATIC_DEMO.salesDisplay,
      prescriptions: hasRx
        ? Number(rxRes.data!.processed_count)
        : STATIC_DEMO.prescriptions,
      lowStock,
      suppliersRequiringAttention,
      source: 'database',
    }
  } catch {
    return STATIC_DEMO
  }
}

/** Pharmacy section for the dashboard — live Ekem mode never shows fictional figures. */
export async function getPharmacyDashboardState(): Promise<PharmacyDashboardState> {
  if (isLiveSupabaseData()) {
    return { mode: 'disconnected' }
  }

  return {
    mode: 'demo',
    metrics: await loadLocalDemoPharmacyMetrics(),
  }
}

/** @deprecated Use getPharmacyDashboardState. Kept for local demo tooling only. */
export async function getPharmacyDemoMetrics(): Promise<PharmacyDemoMetrics> {
  const state = await getPharmacyDashboardState()
  if (state.mode === 'disconnected') {
    throw new Error('Pharmacy demo metrics are not available in live Ekem mode.')
  }
  return state.metrics
}
