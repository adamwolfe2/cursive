/**
 * Reseller Admin — update a reseller (PLATFORM ADMIN ONLY)
 *   PATCH /api/reseller/admin/resellers/{resellerId}
 *
 * The kill switch + cap editor for a reseller. Setting status='suspended'
 * immediately stops all outbound PII delivery (reseller_consume_delivery and the
 * decideDelivery pre-check both reject a non-active reseller), which key
 * revocation alone does NOT do — revoking keys only blocks API access, delivery
 * keeps flowing to a churned/rogue partner's endpoint until the reseller itself
 * is suspended. Also lets an admin change reseller-level caps after creation
 * (previously impossible — nothing ever wrote resellers.* after insert).
 *
 * resellerId is the resellers PK (uuid).
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePlatformAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

const patchSchema = z
  .object({
    status: z.enum(['active', 'suspended']).optional(),
    lead_cap_per_period: z.number().int().min(0).nullable().optional(),
    default_lead_cap_per_period: z.number().int().min(0).nullable().optional(),
    default_throttle_mode: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'No fields to update')

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ resellerId: string }> }) {
  try {
    await requirePlatformAdmin()
  } catch {
    return NextResponse.json({ error: 'Platform admin access required' }, { status: 403 })
  }

  try {
    const { resellerId } = await params
    if (!z.string().uuid().safeParse(resellerId).success) {
      return NextResponse.json({ error: 'Invalid reseller id' }, { status: 400 })
    }
    const input = patchSchema.parse(await request.json())

    // Build an immutable patch of only the provided fields.
    const patch: Record<string, unknown> = {}
    if (input.status !== undefined) patch.status = input.status
    if (input.lead_cap_per_period !== undefined) patch.lead_cap_per_period = input.lead_cap_per_period
    if (input.default_lead_cap_per_period !== undefined) {
      patch.default_lead_cap_per_period = input.default_lead_cap_per_period
    }
    if (input.default_throttle_mode !== undefined) patch.default_throttle_mode = input.default_throttle_mode

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('resellers')
      .update(patch)
      .eq('id', resellerId)
      .select('id, name, status, lead_cap_per_period, default_lead_cap_per_period, default_throttle_mode')
      .maybeSingle()

    if (error) {
      safeError('[ResellerAdmin] reseller update failed:', error)
      return NextResponse.json({ error: 'Failed to update reseller' }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Reseller not found' }, { status: 404 })

    return NextResponse.json({ success: true, reseller: data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues.slice(0, 5) }, { status: 400 })
    }
    safeError('[ResellerAdmin] reseller patch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
