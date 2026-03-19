// Admin Partner Suspend API
// Suspend a partner account

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { PartnerRepository } from '@/lib/repositories/partner.repository'
import { safeError } from '@/lib/utils/log-sanitizer'
import { handleApiError } from '@/lib/utils/api-error-handler'

const suspendSchema = z.object({
  reason: z.string().min(10, 'Suspension reason must be at least 10 characters'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify admin using centralized helper
    const admin = await requireAdmin()

    const supabase = await createClient()

    // Parse request body
    const body = await request.json()
    const validated = suspendSchema.parse(body)

    // Update partner status
    const repo = new PartnerRepository()
    const partner = await repo.update(id, {
      status: 'suspended',
      isActive: false,
      suspensionReason: validated.reason,
    })

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: admin.id,
      action: 'partner.suspended',
      resource_type: 'partner',
      resource_id: id,
      metadata: {
        reason: validated.reason,
        suspended_by: admin.email,
      },
    })

    return NextResponse.json({ partner })
  } catch (error) {
    safeError('Error suspending partner:', error)
    return handleApiError(error)
  }
}
