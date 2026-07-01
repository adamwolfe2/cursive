/**
 * Reseller Admin Service (server-only)
 *
 * Read + mutation helpers for the platform-admin reseller tracking UI. Reseller
 * tables have RLS ENABLED with no client policy (deny-all; service-role bypass),
 * so ALL access here goes through the admin (service-role) client. These helpers
 * must never be imported into a client component.
 */

import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { Reseller, ResellerPixel, ResellerApiKey, DeliveryOutcome } from './types'

export interface ResellerWithUsage extends Reseller {
  pixel_count: number
  active_pixel_count: number
}

export interface DeliveryRow {
  id: string
  reseller_id: string
  reseller_pixel_id: string
  lead_id: string | null
  status: DeliveryOutcome
  throttled: boolean
  response_status: number | null
  error_message: string | null
  attempts: number
  created_at: string
}

export interface ResellerDetail {
  reseller: Reseller
  pixels: ResellerPixel[]
  keys: Array<Pick<ResellerApiKey, 'id' | 'key_prefix' | 'name' | 'scopes' | 'last_used_at' | 'revoked' | 'created_at'>>
  deliveries: DeliveryRow[]
}

/** All resellers with pixel counts, newest first. */
export async function listResellersWithUsage(): Promise<ResellerWithUsage[]> {
  const supabase = createAdminClient()
  const [{ data: resellers, error: rErr }, { data: pixels, error: pErr }] = await Promise.all([
    supabase.from('resellers').select('*').order('created_at', { ascending: false }),
    supabase.from('reseller_pixels').select('reseller_id, status'),
  ])
  if (rErr) {
    safeError('[ResellerAdmin] list resellers failed:', rErr)
    return []
  }
  if (pErr) safeError('[ResellerAdmin] list pixels for counts failed:', pErr)

  const counts = new Map<string, { total: number; active: number }>()
  for (const p of (pixels as Array<{ reseller_id: string; status: string }> | null) ?? []) {
    const c = counts.get(p.reseller_id) ?? { total: 0, active: 0 }
    counts.set(p.reseller_id, { total: c.total + 1, active: c.active + (p.status === 'active' ? 1 : 0) })
  }

  return ((resellers as Reseller[] | null) ?? []).map((r) => {
    const c = counts.get(r.id) ?? { total: 0, active: 0 }
    return { ...r, pixel_count: c.total, active_pixel_count: c.active }
  })
}

/** One reseller with pixels, keys (safe fields), and recent deliveries. */
export async function getResellerDetail(resellerId: string): Promise<ResellerDetail | null> {
  const supabase = createAdminClient()
  const { data: reseller, error } = await supabase
    .from('resellers')
    .select('*')
    .eq('id', resellerId)
    .maybeSingle()
  if (error || !reseller) {
    if (error) safeError('[ResellerAdmin] get reseller failed:', error)
    return null
  }

  const [{ data: pixels }, { data: keys }, { data: deliveries }] = await Promise.all([
    supabase.from('reseller_pixels').select('*').eq('reseller_id', resellerId).order('created_at', { ascending: false }),
    supabase
      .from('reseller_api_keys')
      .select('id, key_prefix, name, scopes, last_used_at, revoked, created_at')
      .eq('reseller_id', resellerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('reseller_lead_deliveries')
      .select('id, reseller_id, reseller_pixel_id, lead_id, status, throttled, response_status, error_message, attempts, created_at')
      .eq('reseller_id', resellerId)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return {
    reseller: reseller as Reseller,
    pixels: (pixels as ResellerPixel[] | null) ?? [],
    keys: (keys as ResellerDetail['keys'] | null) ?? [],
    deliveries: (deliveries as DeliveryRow[] | null) ?? [],
  }
}

/** Platform-wide reseller summary counters for the list header. */
export async function getResellerSummary(): Promise<{
  resellers: number
  activeResellers: number
  pixels: number
  activePixels: number
  deliveredToday: number
}> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const [resellers, activeResellers, pixels, activePixels, usageToday] = await Promise.all([
    supabase.from('resellers').select('id', { count: 'exact', head: true }),
    supabase.from('resellers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('reseller_pixels').select('id', { count: 'exact', head: true }),
    supabase.from('reseller_pixels').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('reseller_usage_daily').select('leads_delivered').eq('usage_date', today),
  ])
  const deliveredToday = ((usageToday.data as Array<{ leads_delivered: number }> | null) ?? []).reduce(
    (sum, r) => sum + (r.leads_delivered ?? 0),
    0,
  )
  return {
    resellers: resellers.count ?? 0,
    activeResellers: activeResellers.count ?? 0,
    pixels: pixels.count ?? 0,
    activePixels: activePixels.count ?? 0,
    deliveredToday,
  }
}
