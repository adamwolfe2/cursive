// Admin Partner Commission API
// Update partner commission rate

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { PartnerRepository } from '@/lib/repositories/partner.repository'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

const commissionSchema = z.object({
  payoutRate: z.number().min(0).max(1),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin using centralized helper
    await requireAdmin()

    const { id } = await params
    const supabase = await createClient()

    // Get user for audit log
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const validated = commissionSchema.parse(body)

    // Get current partner
    const repo = new PartnerRepository()
    const currentPartner = await repo.findById(id)

    if (!currentPartner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Update commission rate
    const partner = await repo.update(id, {
      payoutRate: validated.payoutRate,
    })

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'partner.commission_updated',
      resource_type: 'partner',
      resource_id: id,
      metadata: {
        old_rate: currentPartner.payout_rate,
        new_rate: validated.payoutRate,
        updated_by: user.email,
      },
    })

    return NextResponse.json({ partner })
  } catch (error) {
    safeError('Error updating commission:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update commission' },
      { status: 500 }
    )
  }
}
