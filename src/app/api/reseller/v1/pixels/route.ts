/**
 * Reseller API — Pixels collection
 *   POST /api/reseller/v1/pixels  — create a pixel for an end-customer (idempotent)
 *   GET  /api/reseller/v1/pixels  — list this reseller's pixels
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireReseller } from '@/lib/reseller/auth'
import { createResellerPixel, listResellerPixels } from '@/lib/reseller/pixel.service'
import { currentPeriodStart } from '@/lib/reseller/metering.service'
import { isSafeDestinationUrl } from '@/lib/reseller/delivery.service'
import { checkRateLimit } from '@/lib/middleware/rate-limiter'
import { safeError } from '@/lib/utils/log-sanitizer'

const createSchema = z.object({
  website_url: z.string().url().refine((u) => {
    try {
      const h = new URL(u).hostname
      if (h === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return false
      return h.includes('.')
    } catch {
      return false
    }
  }, 'Must be a valid public website URL'),
  website_name: z.string().max(200).optional(),
  external_customer_ref: z.string().trim().min(1).max(200),
  destination_url: z.string().url().optional(),
  signing_secret: z.string().min(16).max(200).optional(),
  lead_cap_per_period: z.number().int().min(0).nullable().optional(),
  throttle_mode: z.boolean().nullable().optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireReseller(request, 'pixels:write')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // Rate-limit pixel creation PER API KEY. Each create provisions a real
  // AudienceLab pixel, so a runaway partner key must not hammer that upstream.
  // Distributed (Upstash) with per-instance in-memory fallback. Tier 'write' = 30/min.
  const rl = await checkRateLimit(`reseller-pixels-create:${auth.keyId}`, 'write')
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Slow down pixel creation and retry shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)).toString(),
          'X-RateLimit-Limit': rl.limit.toString(),
          'X-RateLimit-Remaining': rl.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rl.reset / 1000).toString(),
        },
      },
    )
  }

  try {
    const body = await request.json()
    const input = createSchema.parse(body)

    if (input.destination_url && !isSafeDestinationUrl(input.destination_url)) {
      return NextResponse.json(
        { error: 'destination_url must be a public HTTPS URL' },
        { status: 400 },
      )
    }

    const result = await createResellerPixel(auth.reseller, {
      websiteUrl: input.website_url,
      websiteName: input.website_name,
      externalCustomerRef: input.external_customer_ref,
      destinationUrl: input.destination_url,
      signingSecret: input.signing_secret,
      leadCapPerPeriod: input.lead_cap_per_period ?? null,
      throttleMode: input.throttle_mode ?? null,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result.data, { status: result.data.existing ? 200 : 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues.slice(0, 5) }, { status: 400 })
    }
    safeError('[ResellerAPI] create pixel error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireReseller(request, 'pixels:read')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const r = auth.reseller
  const curPeriod = currentPeriodStart(r.period_kind)
  const pixels = await listResellerPixels(r.id)
  return NextResponse.json({
    pixels: pixels.map((p) => {
      // Reset the delivered count to 0 once the stored period is stale, so this
      // list agrees with GET /usage right after a period rollover instead of
      // reporting last period's number as the current one.
      const pStale = p.period_start < curPeriod
      const used = pStale ? 0 : p.leads_delivered_period
      // Effective cap = explicit pixel cap, else the reseller default (what
      // enforcement actually applies). Report both plus its source.
      const effectiveCap = p.lead_cap_per_period ?? r.default_lead_cap_per_period
      const capSource =
        p.lead_cap_per_period != null
          ? 'pixel'
          : r.default_lead_cap_per_period != null
            ? 'reseller_default'
            : null
      return {
        pixel_id: p.pixel_id,
        external_customer_ref: p.external_customer_ref,
        website_url: p.website_url,
        domain: p.domain,
        status: p.status,
        destination_url: p.destination_url,
        throttle_mode: p.throttle_mode,
        lead_cap_per_period: p.lead_cap_per_period,
        effective_lead_cap_per_period: effectiveCap,
        cap_source: capSource,
        leads_delivered_period: used,
        leads_delivered_lifetime: p.leads_delivered_lifetime,
        remaining: effectiveCap == null ? null : Math.max(0, effectiveCap - used),
        last_delivered_at: p.last_delivered_at,
        created_at: p.created_at,
      }
    }),
  })
}
