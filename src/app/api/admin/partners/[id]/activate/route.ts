// Admin Partner Activate API
// Activate a partner account

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PartnerRepository } from '@/lib/repositories/partner.repository'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
        activated_by: user.email,
      },
    })

    return NextResponse.json({ partner })
  } catch (error) {
    console.error('Error activating partner:', error)

    return NextResponse.json(
      { error: 'Failed to activate partner' },
      { status: 500 }
    )
  }
}
