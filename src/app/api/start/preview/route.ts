/**
 * POST /api/start/preview  body: { icp }  -> PreviewResponse (5 masked leads).
 * Costs up to 5 credits per cache miss. Guarded by: per-IP daily cap (5), a
 * filter-hash cache, and a global daily cap on misses (FREE_LEADS_DAILY_PREVIEW_CAP).
 */
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { IcpRequestSchema, PREVIEW_LEAD_COUNT, type PreviewResponse } from '@/lib/free-leads/contract'
import { filtersHash, icpToFilters } from '@/lib/free-leads/icp-to-filters'
import { toMaskedLead, usableContacts } from '@/lib/free-leads/rules'
import { searchContacts } from '@/lib/getleads/client'
import { badRequest, clientIp, isLimited, rateLimited, readJson, serverError } from '@/lib/free-leads/http'
import { safeError } from '@/lib/utils/log-sanitizer'

// A billed 5-row search can take 10s+; don't let the platform cut it off.
export const maxDuration = 60

// ponytail: per-instance cache; misses on a cold instance are still bounded by the global daily cap.
// Move to a table keyed by filter hash if preview spend shows up in credit reports.
const TTL_MS = 24 * 60 * 60 * 1000
const cache = new Map<string, { value: PreviewResponse; expires: number }>()

function cached(key: string): PreviewResponse | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (hit.expires > Date.now()) return hit.value
  cache.delete(key)
  return null
}

export async function POST(req: NextRequest) {
  const parsed = IcpRequestSchema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest('Invalid profile')
  if (await isLimited('free-leads-preview', `ip:${clientIp(req)}`)) {
    return rateLimited('You have used today\'s previews. Claim your 25 leads to see full details.')
  }

  const filters = icpToFilters(parsed.data.icp)
  const key = filtersHash(filters)
  const hit = cached(key)
  if (hit) return NextResponse.json<PreviewResponse>(hit)

  if (await isLimited('free-leads-preview-global', 'global')) {
    return rateLimited('Previews are busy right now. You can still claim your 25 leads.')
  }

  try {
    const { contacts, totalAvailable } = await searchContacts(filters, { limit: PREVIEW_LEAD_COUNT })
    const value: PreviewResponse = {
      leads: usableContacts(contacts, PREVIEW_LEAD_COUNT).map(toMaskedLead),
      total: totalAvailable,
    }
    cache.set(key, { value, expires: Date.now() + TTL_MS })
    return NextResponse.json<PreviewResponse>(value)
  } catch (err) {
    safeError('[start/preview] search failed', err)
    return serverError('We could not load a preview just now. Please try again.')
  }
}
