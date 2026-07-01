/**
 * Reseller API — usage
 *   GET /api/reseller/v1/usage
 * Reseller-level totals for the current period + a per-pixel breakdown.
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireReseller } from '@/lib/reseller/auth'
import { listResellerPixels } from '@/lib/reseller/pixel.service'
import { currentPeriodStart } from '@/lib/reseller/metering.service'

export async function GET(request: NextRequest) {
  const auth = await requireReseller(request, 'pixels:read')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const r = auth.reseller
  const curPeriod = currentPeriodStart(r.period_kind)
  const periodStale = r.period_start < curPeriod

  const pixels = await listResellerPixels(r.id)

  return NextResponse.json({
    reseller: {
      period_kind: r.period_kind,
      period_start: curPeriod,
      lead_cap_per_period: r.lead_cap_per_period,
      // Effective count resets to 0 when the stored period is stale.
      leads_delivered_period: periodStale ? 0 : r.leads_delivered_period,
      leads_delivered_lifetime: r.leads_delivered_lifetime,
      remaining:
        r.lead_cap_per_period == null
          ? null
          : Math.max(0, r.lead_cap_per_period - (periodStale ? 0 : r.leads_delivered_period)),
    },
    pixels: pixels.map((p) => {
      const pStale = p.period_start < curPeriod
      const used = pStale ? 0 : p.leads_delivered_period
      return {
        pixel_id: p.pixel_id,
        external_customer_ref: p.external_customer_ref,
        status: p.status,
        throttle_mode: p.throttle_mode,
        lead_cap_per_period: p.lead_cap_per_period,
        leads_delivered_period: used,
        leads_delivered_lifetime: p.leads_delivered_lifetime,
        remaining: p.lead_cap_per_period == null ? null : Math.max(0, p.lead_cap_per_period - used),
      }
    }),
  })
}
