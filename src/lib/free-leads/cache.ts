/**
 * Shared cache for the public free-leads flow (table free_leads_cache). Keys:
 *   scan:<version>:<domain>   replayable scan result
 *   count:<filter hash>       match count
 *   preview-rows:<filter hash>        raw preview contacts (reused by delivery, saving credits)
 *   preview-why:<filter hash>:<sum>   preview why lines for one ICP summary
 *
 * Service role: the table is server-only (RLS on, no policies); values are written only by
 * our routes from upstream responses, never from request bodies.
 * A cache failure is logged and treated as a miss; it never fails the request.
 */
import { createHash } from 'node:crypto'
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

/** Share of writes that also delete expired rows (preview rows hold contact data; don't keep them). */
const SWEEP_RATE = 0.05

export async function cachePut(key: string, value: unknown, ttlMs: number, admin: Admin = createAdminClient()): Promise<void> {
  const { error } = await admin
    .from('free_leads_cache')
    .upsert({ key, value, expires_at: new Date(Date.now() + ttlMs).toISOString() }, { onConflict: 'key' })
  if (error) safeWarn('[free-leads/cache] write failed', { key: key.split(':')[0], error: error.message })
  if (Math.random() < SWEEP_RATE) {
    const swept = await admin.from('free_leads_cache').delete().lt('expires_at', new Date().toISOString())
    if (swept.error) safeWarn('[free-leads/cache] sweep failed', swept.error.message)
  }
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

/** Raw preview rows for a filter set: written only from upstream responses; delivery reuses them. */
export const previewRowsKey = (filters: GetLeadsFilters) => `preview-rows:${filtersHash(filters)}`
/** Why lines depend on the ICP summary too, so one visitor's summary cannot set another's lines. */
export const previewWhyKey = (filters: GetLeadsFilters, summary: string) =>
  `preview-why:${filtersHash(filters)}:${createHash('sha256').update(summary).digest('hex').slice(0, 16)}`
