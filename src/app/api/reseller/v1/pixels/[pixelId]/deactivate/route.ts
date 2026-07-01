/**
 * Reseller API — deactivate a pixel
 *   POST /api/reseller/v1/pixels/{pixelId}/deactivate
 * Stops inbound identification (audiencelab_pixels.is_active=false) AND outbound delivery.
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireReseller } from '@/lib/reseller/auth'
import { deactivateResellerPixel } from '@/lib/reseller/pixel.service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pixelId: string }> },
) {
  const auth = await requireReseller(request, 'pixels:write')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { pixelId } = await params
  const ok = await deactivateResellerPixel(auth.reseller.id, pixelId)
  if (!ok) return NextResponse.json({ error: 'Pixel not found' }, { status: 404 })

  return NextResponse.json({ pixel_id: pixelId, status: 'inactive' })
}
