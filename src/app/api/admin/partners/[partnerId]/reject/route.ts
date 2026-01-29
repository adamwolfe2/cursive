import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendPartnerRejectedEmail } from '@/lib/email/service'

const rejectSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason'),
})

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

  // Parse body
  const body = await req.json()
  const parsed = rejectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  // Reject partner
  const { data: partner, error } = await supabase
    .from('partners')
    .update({
      status: 'rejected',
      suspension_reason: parsed.data.reason,
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
    action: 'partner_rejected',
    entity_type: 'partner',
    entity_id: partner.id,
    metadata: {
      rejected_by: user.email,
      partner_company: partner.company_name,
      reason: parsed.data.reason,
    },
  })

  // Send rejection email to partner
  try {
    await sendPartnerRejectedEmail(
      partner.email,
      partner.contact_name,
      partner.company_name,
      parsed.data.reason
    )
  } catch (emailError) {
    console.error('[Partner Rejection] Failed to send email:', emailError)
    // Don't fail the rejection if email fails
  }

  return NextResponse.json({ success: true, partner })
}
