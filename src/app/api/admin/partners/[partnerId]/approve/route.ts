import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { partnerId: string } }
) {
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
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Approve partner
  const { data: partner, error } = await supabase
    .from('partners')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.partnerId)
    .eq('status', 'pending')
    .select()
    .single()

  if (error || !partner) {
    return NextResponse.json(
      { error: 'Partner not found or already processed' },
      { status: 404 }
    )
  }

  // Audit log
  await supabase.from('marketplace_audit_log').insert({
    action: 'partner_approved',
    entity_type: 'partner',
    entity_id: partner.id,
    metadata: {
      approved_by: user.email,
      partner_company: partner.company_name,
    },
  })

  // TODO: Send approval email to partner

  return NextResponse.json({ success: true, partner })
}
