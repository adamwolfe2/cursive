import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPartnerApprovedEmail } from '@/lib/email/service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const supabase = await createClient()
  const { partnerId } = await params

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
    .eq('id', partnerId)
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

  // Send approval email to partner
  try {
    await sendPartnerApprovedEmail(
      partner.email,
      partner.contact_name,
      partner.company_name,
      partner.api_key
    )
  } catch (emailError) {
    console.error('[Partner Approval] Failed to send email:', emailError)
    // Don't fail the approval if email fails
  }

  return NextResponse.json({ success: true, partner })
}
