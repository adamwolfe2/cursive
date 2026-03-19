// Admin Partner Commission API
// Update partner commission rate

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { PartnerRepository } from '@/lib/repositories/partner.repository'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import { handleApiError } from '@/lib/utils/api-error-handler'

const commissionSchema = z.object({
  payoutRate: z.number().min(0).max(1),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin using centralized helper
    const admin = await requireAdmin()

    const { id } = await params
    const supabase = await createClient()

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
      user_id: admin.id,
      action: 'partner.commission_updated',
      resource_type: 'partner',
      resource_id: id,
      metadata: {
        old_rate: currentPartner.payout_rate,
        new_rate: validated.payoutRate,
        updated_by: admin.email,
      },
    })

    return NextResponse.json({ partner })
  } catch (error) {
    safeError('Error updating commission:', error)
    return handleApiError(error)
  }
}
