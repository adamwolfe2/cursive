/**
 * Quick Send Email API
 * Sends a one-off email directly to a lead without creating a full sequence.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

const quickSendSchema = z.object({
  lead_id: z.string().uuid(),
  to_email: z.string().email(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
})

// POST /api/email-sequences/quick-send
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const rawBody = await req.json()
    const { lead_id, to_email, subject, body } = quickSendSchema.parse(rawBody)

    const supabase = await createClient()

    // Verify lead belongs to workspace
    const { data: lead } = await supabase
      .from('leads')
      .select('id, email, first_name, last_name, workspace_id')
      .eq('id', lead_id)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Get workspace name for the from display name
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', user.workspace_id)
      .maybeSingle()

    const fromEmail = process.env.EMAIL_FROM || 'noreply@meetcursive.com'
    const fromName = workspace?.name || 'Cursive'

    // Send via Resend SDK
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
    }

    const resend = new Resend(RESEND_API_KEY)

    const { error: resendError } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: to_email,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    })

    if (resendError) {
      safeError('Quick send email failed:', resendError)
      return NextResponse.json(
        { error: `Send failed: ${resendError.message}` },
        { status: 500 }
      )
    }

    // Log the activity on the lead (non-fatal)
    try {
      await supabase.from('lead_activities').insert({
        workspace_id: user.workspace_id,
        lead_id,
        activity_type: 'email_sent',
        title: `Quick email sent: "${subject}"`,
        description: `Sent to ${to_email}`,
        performed_by: user.id,
        metadata: { subject, to: to_email, sent_by: user.id },
      })
    } catch (activityErr) {
      safeError('Failed to log quick-send activity (non-fatal):', activityErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
