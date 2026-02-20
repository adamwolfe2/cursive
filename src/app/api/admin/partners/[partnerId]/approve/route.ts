
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { sendPartnerApprovedEmail } from '@/lib/email/service'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const supabase = await createClient()
  const { partnerId } = await params

  // SECURITY: Verify platform admin authorization
  const admin = await requireAdmin()

  // Approve partner
  const { data: partner, error } = await supabase
    .from('partners')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', partnerId)
    .eq('status', 'pending')
    .select('id, email, contact_name, company_name, api_key, status')
    .maybeSingle()

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
      approved_by: admin.email,
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
    safeError('[Partner Approval] Failed to send email:', emailError)
    // Don't fail the approval if email fails
  }

  return NextResponse.json({ success: true, partner })
}
