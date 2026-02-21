
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { z } from 'zod'
import { sendPartnerRejectedEmail } from '@/lib/email/service'
import { safeError } from '@/lib/utils/log-sanitizer'

const rejectSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const { partnerId } = await params

  // Verify admin using centralized helper
  const admin = await requireAdmin()

  const supabase = await createClient()

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
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
    .select('id, email, contact_name, company_name, status')
    .maybeSingle()

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
      rejected_by: admin.email,
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
    safeError('[Partner Rejection] Failed to send email:', emailError)
    // Don't fail the rejection if email fails
  }

  return NextResponse.json({ success: true, partner })
}
