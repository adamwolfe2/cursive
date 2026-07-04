/**
 * Reseller API — single pixel
 *   GET /api/reseller/v1/pixels/{pixelId}
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireReseller } from '@/lib/reseller/auth'
import { getResellerPixel } from '@/lib/reseller/pixel.service'
import { currentPeriodStart } from '@/lib/reseller/metering.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pixelId: string }> },
) {
  const auth = await requireReseller(request, 'pixels:read')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const r = auth.reseller
  const { pixelId } = await params
  const pixel = await getResellerPixel(r.id, pixelId)
  if (!pixel) return NextResponse.json({ error: 'Pixel not found' }, { status: 404 })

  // Mirror the list serializer: reset delivered count after a period rollover
  // and report the effective cap (pixel cap ?? reseller default) that
  // enforcement actually applies, so this agrees with GET /usage.
  const curPeriod = currentPeriodStart(r.period_kind)
  const used = pixel.period_start < curPeriod ? 0 : pixel.leads_delivered_period
  const effectiveCap = pixel.lead_cap_per_period ?? r.default_lead_cap_per_period
  const capSource =
    pixel.lead_cap_per_period != null
      ? 'pixel'
      : r.default_lead_cap_per_period != null
        ? 'reseller_default'
        : null

  return NextResponse.json({
    pixel_id: pixel.pixel_id,
    external_customer_ref: pixel.external_customer_ref,
    website_url: pixel.website_url,
    domain: pixel.domain,
    status: pixel.status,
    destination_url: pixel.destination_url,
    throttle_mode: pixel.throttle_mode,
    lead_cap_per_period: pixel.lead_cap_per_period,
    effective_lead_cap_per_period: effectiveCap,
    cap_source: capSource,
    leads_delivered_period: used,
    leads_delivered_lifetime: pixel.leads_delivered_lifetime,
    remaining: effectiveCap == null ? null : Math.max(0, effectiveCap - used),
    last_delivered_at: pixel.last_delivered_at,
    created_at: pixel.created_at,
  })
}
