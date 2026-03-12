/**
 * Intelligence Cache Layer
 *
 * Generic database-backed caching for intelligence API results.
 * Workspace-agnostic: same person/company = same cached data regardless of who looks them up.
 * Uses admin client (no RLS) since this is a service-level cache.
 */

import { createAdminClient } from '@/lib/supabase/admin'

/** TTL constants per provider (in days) */
export const CACHE_TTL_DAYS: Record<string, number> = {
  perplexity: 14,   // research changes slowly
  proxycurl: 7,     // LinkedIn profiles update
  fullcontact: 14,  // social profiles are fairly stable
  emailrep: 30,     // reputation is stable
  builtwith: 30,    // tech stacks change slowly
  serper: 3,        // news is time-sensitive
}

/**
 * Build a deterministic cache key from sorted identifiers.
 * e.g. buildCacheKey('perplexity', { name: 'Jane', company: 'Acme' })
 *   => 'company=acme|name=jane'
 */
export function buildCacheKey(
  _provider: string,
  identifiers: Record<string, string>,
): string {
  return Object.keys(identifiers)
    .sort()
    .filter((k) => identifiers[k]) // skip empty values
    .map((k) => `${k}=${identifiers[k].toLowerCase().trim()}`)
    .join('|')
}

/**
 * Retrieve a cached result for a given provider + cache key.
 * Returns null on miss or if the entry has expired.
 */
export async function getCachedResult<T>(
  provider: string,
  cacheKey: string,
): Promise<T | null> {
  try {
    const supabase = createAdminClient()

    const { data } = await supabase
      .from('intelligence_cache')
      .select('result, expires_at')
      .eq('provider', provider)
      .eq('cache_key', cacheKey)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle()

    if (!data?.result) return null
    return data.result as T
  } catch {
    // Cache read failure should never block the caller
    return null
  }
}

/**
 * Store a result in the cache. Uses upsert so re-enrichments overwrite stale entries.
 * This is designed to be called fire-and-forget (non-blocking).
 */
export async function setCachedResult<T>(
  provider: string,
  cacheKey: string,
  data: T,
  ttlDays: number,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000)

    await supabase
      .from('intelligence_cache')
      .upsert(
        {
          provider,
          cache_key: cacheKey,
          result: data as unknown as Record<string, unknown>,
          expires_at: expiresAt.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'provider,cache_key' },
      )
  } catch {
    // Cache write failure should never block the caller
  }
}
