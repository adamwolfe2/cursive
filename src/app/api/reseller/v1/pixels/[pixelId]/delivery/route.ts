/**
 * Reseller API — set/update lead-delivery config for a pixel
 *   PUT /api/reseller/v1/pixels/{pixelId}/delivery
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireReseller } from '@/lib/reseller/auth'
import { updateResellerPixelDelivery } from '@/lib/reseller/pixel.service'
import { isSafeDestinationUrl } from '@/lib/reseller/delivery.service'
import { safeError } from '@/lib/utils/log-sanitizer'

const updateSchema = z
  .object({
    destination_url: z.string().url().optional(),
    signing_secret: z.string().min(16).max(200).optional(),
    lead_cap_per_period: z.number().int().min(0).nullable().optional(),
    throttle_mode: z.boolean().nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'At least one field is required')

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pixelId: string }> },
) {
  const auth = await requireReseller(request, 'pixels:write')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { pixelId } = await params

  try {
    const body = await request.json()
    const input = updateSchema.parse(body)

    if (input.destination_url && !isSafeDestinationUrl(input.destination_url)) {
      return NextResponse.json({ error: 'destination_url must be a public HTTPS URL' }, { status: 400 })
    }

    const updated = await updateResellerPixelDelivery(auth.reseller.id, pixelId, {
      destinationUrl: input.destination_url,
      signingSecret: input.signing_secret,
      leadCapPerPeriod: input.lead_cap_per_period,
      throttleMode: input.throttle_mode,
    })

    if (!updated) return NextResponse.json({ error: 'Pixel not found' }, { status: 404 })

    return NextResponse.json({
      pixel_id: updated.pixel_id,
      destination_url: updated.destination_url,
      throttle_mode: updated.throttle_mode,
      lead_cap_per_period: updated.lead_cap_per_period,
      // Echo whether a signing secret is set, never the value.
      signing_secret_set: !!updated.signing_secret,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues.slice(0, 5) }, { status: 400 })
    }
    safeError('[ResellerAPI] update delivery error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
