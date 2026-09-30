/**
 * POST /api/start/preview  body: { icp }  -> PreviewResponse (5 masked leads with a "why" line).
 * Costs up to 5 credits per cache miss. Guarded by: per-IP daily cap (5), the shared cache keyed
 * by filter hash (delivery later reuses these exact rows, so a preview costs nothing extra for
 * someone who claims), and a global daily cap on misses (FREE_LEADS_DAILY_PREVIEW_CAP).
 */
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { IcpRequestSchema, PREVIEW_LEAD_COUNT, type Icp, type PreviewResponse } from '@/lib/free-leads/contract'
import { filtersHash, icpToFilters } from '@/lib/free-leads/icp-to-filters'
import { toMaskedLead, usableContacts } from '@/lib/free-leads/rules'
import { cacheGet, cachePut, HOUR_MS } from '@/lib/free-leads/cache'
import { scoreLeads, type LeadFit } from '@/lib/free-leads/lead-fit'
import { searchContacts, type GetLeadsContact } from '@/lib/getleads/client'
import { badRequest, clientIp, isLimited, rateLimited, readJson, serverError } from '@/lib/free-leads/http'
import { safeError } from '@/lib/utils/log-sanitizer'

// A billed 5-row search can take 10s+; don't let the platform cut it off.
export const maxDuration = 60

interface CachedPreview {
  /** Raw upstream rows, in upstream order (delivery offsets past them). */
  contacts: GetLeadsContact[]
  total: number
  fits?: LeadFit[] | null
}

function respond(icp: Icp, value: CachedPreview) {
  const usable = usableContacts(value.contacts, PREVIEW_LEAD_COUNT)
  const whyFor = (c: GetLeadsContact) => value.fits?.[value.contacts.indexOf(c)]?.why ?? null
  return NextResponse.json<PreviewResponse>({ leads: usable.map((c) => toMaskedLead(c, whyFor(c))), total: value.total })
}

export async function POST(req: NextRequest) {
  const parsed = IcpRequestSchema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest('Invalid profile')
  if (await isLimited('free-leads-preview', `ip:${clientIp(req)}`)) {
    return rateLimited('You have used today\'s previews. Claim your 25 leads to see full details.')
  }

  const icp = parsed.data.icp
  const filters = icpToFilters(icp)
  const key = `preview:${filtersHash(filters)}`
  const hit = await cacheGet<CachedPreview>(key)
  if (hit?.contacts) return respond(icp, hit)

  if (await isLimited('free-leads-preview-global', 'global')) {
    return rateLimited('Previews are busy right now. You can still claim your 25 leads.')
  }

  let value: CachedPreview
  try {
    const { contacts, totalAvailable } = await searchContacts(filters, { limit: PREVIEW_LEAD_COUNT })
    value = { contacts, total: totalAvailable }
  } catch (err) {
    safeError('[start/preview] search failed', err)
    return serverError('We could not load a preview just now. Please try again.')
  }
  // Never throws; null (logged) just means no "why" lines on this preview.
  value.fits = await scoreLeads(icp, 'the seller', value.contacts)
  await cachePut(key, value, 24 * HOUR_MS)
  return respond(icp, value)
}
