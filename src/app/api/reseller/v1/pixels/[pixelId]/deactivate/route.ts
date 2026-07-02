/**
 * Reseller API — deactivate a pixel
 *   POST /api/reseller/v1/pixels/{pixelId}/deactivate
 * Stops OUTBOUND delivery immediately (reseller_pixels.status=inactive) and marks
 * audiencelab_pixels.is_active=false. CAVEAT: reseller inbound events route by
 * the ?ws= workspace param (not is_active), and the AL SuperPixel keeps posting
 * while the snippet is installed — so identification data may continue to be
 * CAPTURED (never delivered) until the snippet is removed / the AL pixel is
 * deleted. Documented in /reseller/docs; a hard-stop (AL pixel deletion) is a
 * deliberate v2 decision because it is destructive and non-reversible.
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
