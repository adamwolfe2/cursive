// Admin Lead Reject API
// Reject a lead with reason code and notify partner


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

const rejectSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  reasonCode: z.enum([
    'invalid_data',
    'duplicate',
    'low_quality',
    'incorrect_format',
    'missing_information',
    'outside_coverage',
    'other',
  ]),
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

    // Get user for audit log
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const validated = rejectSchema.parse(body)

    // Get lead with partner info and workspace context
    // Note: Platform admins can access leads from any workspace
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select(
        `
        id,
        workspace_id,
        partner_id,
        verification_status_admin,
        first_name,
        last_name,
        email,
        partners:partner_id (
          id,
          company_name,
          contact_email
        )
      `
      )
      .eq('id', id)
      .maybeSingle()

    if (fetchError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Platform admins have access to all workspaces
    // Future enhancement: Could add workspace-scoped admin roles here

    // Update lead verification status
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        verification_status_admin: 'rejected',
        rejection_reason: validated.reason,
        rejection_code: validated.reasonCode,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('id', id)
      .select()
      .maybeSingle()

    if (updateError) {
      safeError('Error rejecting lead:', updateError)
      return NextResponse.json(
        { error: 'Failed to reject lead' },
        { status: 500 }
      )
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'lead.rejected',
      resource_type: 'lead',
      resource_id: id,
      metadata: {
        partner_id: lead.partner_id,
        reason: validated.reason,
        reason_code: validated.reasonCode,
        rejected_by: admin.email,
        previous_status: lead.verification_status_admin,
      },
    })

    // Send email notification to partner
    const partnerData = lead.partners as unknown as { id: string; company_name: string; contact_email: string } | null
    if (partnerData && partnerData.contact_email) {
      try {
        const leadName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email || 'Unknown'

        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: partnerData.contact_email,
            subject: 'Lead Rejected - Action Required',
            template: 'lead_rejected',
            data: {
              partnerName: partnerData.company_name,
              leadName,
              reason: validated.reason,
              reasonCode: validated.reasonCode,
            },
          }),
        })
      } catch (emailError) {
        safeError('Failed to send rejection email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ lead: updatedLead })
  } catch (error) {
    safeError('Error rejecting lead:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to reject lead' },
      { status: 500 }
    )
  }
}
