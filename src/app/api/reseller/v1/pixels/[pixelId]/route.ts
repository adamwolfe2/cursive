/**
 * Reseller API — single pixel
 *   GET /api/reseller/v1/pixels/{pixelId}
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireReseller } from '@/lib/reseller/auth'
import { getResellerPixel } from '@/lib/reseller/pixel.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pixelId: string }> },
) {
  const auth = await requireReseller(request, 'pixels:read')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { pixelId } = await params
  const pixel = await getResellerPixel(auth.reseller.id, pixelId)
  if (!pixel) return NextResponse.json({ error: 'Pixel not found' }, { status: 404 })

  return NextResponse.json({
    pixel_id: pixel.pixel_id,
    external_customer_ref: pixel.external_customer_ref,
    website_url: pixel.website_url,
    domain: pixel.domain,
    status: pixel.status,
    destination_url: pixel.destination_url,
    throttle_mode: pixel.throttle_mode,
    lead_cap_per_period: pixel.lead_cap_per_period,
    leads_delivered_period: pixel.leads_delivered_period,
    leads_delivered_lifetime: pixel.leads_delivered_lifetime,
    last_delivered_at: pixel.last_delivered_at,
    created_at: pixel.created_at,
  })
}
