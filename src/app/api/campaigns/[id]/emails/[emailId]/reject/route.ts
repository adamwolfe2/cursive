// Campaign Email Reject API Route
// POST /api/campaigns/[id]/emails/[emailId]/reject - Reject an email


import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { safeError } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ id: string; emailId: string }>
}

const rejectSchema = z.object({
  reason: z.string().max(500).optional(),
})

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId, emailId } = await context.params

    let reason: string | undefined
    try {
      const body = await request.json()
      const parsed = rejectSchema.parse(body)
      reason = parsed.reason
    } catch {
      // Body is optional
    }

    const supabase = await createClient()

    // Verify campaign belongs to user's workspace
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Verify email exists and is pending approval
    const { data: existingEmail, error: emailError } = await supabase
      .from('email_sends')
      .select('id, status')
      .eq('id', emailId)
      .eq('campaign_id', campaignId)
      .single()

    if (emailError || !existingEmail) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    if (existingEmail.status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'Only pending emails can be rejected' },
        { status: 400 }
      )
    }

    // Update email status to rejected
    const { error: updateError } = await supabase
      .from('email_sends')
      .update({
        status: 'rejected',
        rejection_reason: reason || null,
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
      })
      .eq('id', emailId)

    if (updateError) {
      safeError('Failed to reject email:', updateError)
      return NextResponse.json({ error: 'Failed to reject email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('Reject email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
