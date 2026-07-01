/**
 * Admin — update a reseller pixel (PLATFORM ADMIN ONLY)
 *   PATCH /api/admin/reseller/pixels/{pixelId}
 *
 * Toggle active/inactive, adjust cap/throttle, or set the delivery destination.
 * pixelId is the reseller_pixels PK (uuid), not the AudienceLab pixel_id.
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePlatformAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSafeDestinationUrl } from '@/lib/reseller/delivery.service'
import { safeError } from '@/lib/utils/log-sanitizer'

const patchSchema = z
  .object({
    status: z.enum(['active', 'inactive']).optional(),
    lead_cap_per_period: z.number().int().min(0).nullable().optional(),
    throttle_mode: z.boolean().nullable().optional(),
    destination_url: z.string().url().nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'No fields to update')

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ pixelId: string }> }) {
  try {
    await requirePlatformAdmin()
  } catch {
    return NextResponse.json({ error: 'Platform admin access required' }, { status: 403 })
  }

  try {
    const { pixelId } = await params
    if (!z.string().uuid().safeParse(pixelId).success) {
      return NextResponse.json({ error: 'Invalid pixel id' }, { status: 400 })
    }
    const input = patchSchema.parse(await request.json())

    if (input.destination_url && !isSafeDestinationUrl(input.destination_url)) {
      return NextResponse.json({ error: 'destination_url must be a public HTTPS URL' }, { status: 400 })
    }

    // Build an immutable patch of only provided fields.
    const patch: Record<string, unknown> = {}
    if (input.status !== undefined) patch.status = input.status
    if (input.lead_cap_per_period !== undefined) patch.lead_cap_per_period = input.lead_cap_per_period
    if (input.throttle_mode !== undefined) patch.throttle_mode = input.throttle_mode
    if (input.destination_url !== undefined) patch.destination_url = input.destination_url

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('reseller_pixels')
      .update(patch)
      .eq('id', pixelId)
      .select('id, status, lead_cap_per_period, throttle_mode, destination_url')
      .maybeSingle()

    if (error) {
      safeError('[AdminReseller] pixel update failed:', error)
      return NextResponse.json({ error: 'Failed to update pixel' }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Pixel not found' }, { status: 404 })

    return NextResponse.json({ success: true, pixel: data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues.slice(0, 5) }, { status: 400 })
    }
    safeError('[AdminReseller] pixel patch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
