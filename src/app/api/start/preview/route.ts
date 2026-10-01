/**
 * POST /api/start/preview  body: { icp }  -> PreviewResponse (5 masked leads with a "why" line).
 * Costs up to 5 credits per cache miss. Guarded by: per-IP daily cap (5), the shared row cache
 * keyed by filter hash (delivery later reuses these exact rows, so a preview costs nothing extra
 * for someone who claims), and a global daily cap on misses (FREE_LEADS_DAILY_PREVIEW_CAP).
 * Why lines are cached per (filters, summary): one visitor's summary never sets another's lines.
 */
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { IcpRequestSchema, PREVIEW_LEAD_COUNT, type PreviewResponse } from '@/lib/free-leads/contract'
import { icpToFilters } from '@/lib/free-leads/icp-to-filters'
import { toMaskedLead, usableContacts } from '@/lib/free-leads/rules'
import { cacheGet, cachePut, HOUR_MS, previewRowsKey, previewWhyKey } from '@/lib/free-leads/cache'
import { scoreLeads, type LeadFit } from '@/lib/free-leads/lead-fit'
import { searchContacts, type GetLeadsContact } from '@/lib/getleads/client'
import { recordStep, sessionIdFrom } from '@/lib/free-leads/funnel'
import { claudeUsd } from '@/lib/free-leads/cost'
import { badRequest, clientIp, isLimited, rateLimited, readJson, serverError } from '@/lib/free-leads/http'
import { safeError } from '@/lib/utils/log-sanitizer'

// A billed 5-row search can take 10s+; don't let the platform cut it off.
export const maxDuration = 60
const TTL_MS = 24 * HOUR_MS

interface CachedRows {
  /** Raw upstream rows, in upstream order (delivery offsets past them). */
  contacts: GetLeadsContact[]
  total: number
}

export async function POST(req: NextRequest) {
  const parsed = IcpRequestSchema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest('Invalid profile')
  if (await isLimited('free-leads-preview', `ip:${clientIp(req)}`)) {
    return rateLimited('You have used today\'s previews. Claim your 25 leads to see full details.')
  }

  const icp = parsed.data.icp
  const filters = icpToFilters(icp)
  const sessionId = sessionIdFrom(req)

  let rows = await cacheGet<CachedRows>(previewRowsKey(filters))
  const credits = rows?.contacts ? 0 : PREVIEW_LEAD_COUNT
  if (!rows?.contacts) {
    if (await isLimited('free-leads-preview-global', 'global')) {
      return rateLimited('Previews are busy right now. You can still claim your 25 leads.')
    }
    try {
      const { contacts, totalAvailable } = await searchContacts(filters, { limit: PREVIEW_LEAD_COUNT })
      rows = { contacts, total: totalAvailable }
    } catch (err) {
      safeError('[start/preview] search failed', err)
      return serverError('We could not load a preview just now. Please try again.')
    }
    await cachePut(previewRowsKey(filters), rows, TTL_MS)
  }

  const whyKey = previewWhyKey(filters, icp.summary)
  let fits = (await cacheGet<{ fits: LeadFit[] | null }>(whyKey))?.fits ?? null
  let usd = 0
  if (!fits) {
    // Never throws; null (logged) just means no why lines on this preview.
    fits = await scoreLeads(icp, 'the seller', rows.contacts, { onUsage: ({ usage, model }) => (usd += claudeUsd(model, usage)) })
    if (fits) await cachePut(whyKey, { fits }, TTL_MS)
  }

  await recordStep(sessionId, 'preview', { meta: { cached: credits === 0, credits, usd } })
  const all = rows.contacts
  const leads = usableContacts(all, PREVIEW_LEAD_COUNT).map((c) => toMaskedLead(c, fits?.[all.indexOf(c)]?.why ?? null))
  return NextResponse.json<PreviewResponse>({ leads, total: rows.total })
}
