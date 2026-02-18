// Partner Settings API Route
// PATCH /api/partner/settings - Update partner payout settings


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

const updateSettingsSchema = z.object({
  payout_threshold: z.number().min(25, 'Minimum payout threshold is $25'),
})

export async function PATCH(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Check if user is linked to a partner
    if (!user.linked_partner_id) {
      return NextResponse.json(
        { error: 'Not a partner account' },
        { status: 403 }
      )
    }

    // 3. Validate input
    const body = await request.json()
    const parseResult = updateSettingsSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { payout_threshold } = parseResult.data

    // 4. Update partner payout_threshold
    const adminClient = createAdminClient()
    const { data: updatedPartner, error } = await adminClient
      .from('partners')
      .update({
        payout_threshold,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.linked_partner_id)
      .select('id, payout_threshold')
      .single()

    if (error) {
      safeError('Failed to update partner settings:', error)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    // 5. Return updated settings
    return NextResponse.json({
      success: true,
      payout_threshold: updatedPartner.payout_threshold,
    })
  } catch (error) {
    safeError('Error updating partner settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
