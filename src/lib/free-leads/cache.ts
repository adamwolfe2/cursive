/**
 * Shared cache for the public free-leads flow (table free_leads_cache). Keys:
 *   scan:<version>:<domain>   replayable scan result
 *   count:<filter hash>       match count
 *   preview:<filter hash>     the raw preview contacts (reused by delivery, saving credits)
 *
 * Service role: the table is server-only (RLS on, no policies); values are written only by
 * our routes from upstream responses, never from request bodies.
 * A cache failure is logged and treated as a miss; it never fails the request.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { safeWarn } from '@/lib/utils/log-sanitizer'
import { countContacts, type GetLeadsFilters } from '@/lib/getleads/client'
import { filtersHash } from './icp-to-filters'

type Admin = ReturnType<typeof createAdminClient>

export const HOUR_MS = 60 * 60 * 1000

export async function cacheGet<T>(key: string, admin: Admin = createAdminClient()): Promise<T | null> {
  const { data, error } = await admin
    .from('free_leads_cache')
    .select('value')
    .eq('key', key)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (error) {
    safeWarn('[free-leads/cache] read failed; treating as miss', { key: key.split(':')[0], error: error.message })
    return null
  }
  return ((data as { value: T } | null)?.value ?? null) as T | null
}

// ponytail: expired rows are never swept; the table stays small (one row per domain / filter set).
// Add a daily delete where expires_at < now() if it grows past ~100k rows.
export async function cachePut(key: string, value: unknown, ttlMs: number, admin: Admin = createAdminClient()): Promise<void> {
  const { error } = await admin
    .from('free_leads_cache')
    .upsert({ key, value, expires_at: new Date(Date.now() + ttlMs).toISOString() }, { onConflict: 'key' })
  if (error) safeWarn('[free-leads/cache] write failed', { key: key.split(':')[0], error: error.message })
}

/** Free upstream count, shared across instances for a day (counts with city/title filters take 5-20s). */
export async function cachedCount(filters: GetLeadsFilters, admin?: Admin): Promise<number> {
  const key = `count:${filtersHash(filters)}`
  const hit = await cacheGet<{ total: number }>(key, admin)
  if (hit && typeof hit.total === 'number') return hit.total
  const total = await countContacts(filters)
  await cachePut(key, { total }, 24 * HOUR_MS, admin)
  return total
}
