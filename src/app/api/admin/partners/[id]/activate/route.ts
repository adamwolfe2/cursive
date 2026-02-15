// Admin Partner Activate API
// Activate a partner account

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { PartnerRepository } from '@/lib/repositories/partner.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify admin using centralized helper
    const admin = await requireAdmin()

    const supabase = await createClient()

    // Get user for audit log
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update partner status
    const repo = new PartnerRepository()
    const partner = await repo.update(id, {
      status: 'approved',
      isActive: true,
      suspensionReason: '',
    })

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'partner.activated',
      resource_type: 'partner',
      resource_id: id,
      metadata: {
        activated_by: admin.email,
      },
    })

    return NextResponse.json({ partner })
  } catch (error) {
    safeError('Error activating partner:', error)

    return NextResponse.json(
      { error: 'Failed to activate partner' },
      { status: 500 }
    )
  }
}
