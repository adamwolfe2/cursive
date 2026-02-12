// Reply Response API Route
// POST /api/campaigns/[id]/replies/[replyId]/respond - Send a response to a reply

export const runtime = 'edge'

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { EmailBisonClient } from '@/lib/services/emailbison'
import { logger } from '@/lib/monitoring/logger'

interface RouteContext {
  params: Promise<{ id: string; replyId: string }>
}

// Mock flag for development
const USE_MOCKS = !process.env.EMAILBISON_API_KEY

const respondSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  body_text: z.string().min(1),
  body_html: z.string().optional(),
})

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId, replyId } = await context.params
    const body = await request.json()
    const { subject, body_text, body_html } = respondSchema.parse(body)

    const supabase = await createClient()

    // Verify campaign belongs to user's workspace
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('id, workspace_id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Fetch the reply with lead and original email info
    const { data: reply, error: replyError } = await supabase
      .from('email_replies')
      .select(`
        *,
        lead:leads!lead_id(
          id,
          email,
          first_name,
          last_name
        ),
        email_send:email_sends!email_send_id(
          id,
          subject,
          emailbison_message_id
        )
      `)
      .eq('id', replyId)
      .eq('campaign_id', campaignId)
      .single()

    if (replyError || !reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    if (reply.status === 'responded') {
      return NextResponse.json(
        { error: 'This reply has already been responded to' },
        { status: 400 }
      )
    }

    // Determine response subject
    const responseSubject = subject || `Re: ${reply.subject}`

    // Generate HTML from text if not provided
    const responseHtml = body_html || `<p>${body_text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`

    // Send response via EmailBison or mock
    let sendResult: { success: boolean; message_id: string; sent_at: string }

    if (USE_MOCKS) {
      sendResult = {
        success: true,
        message_id: `mock-response-${Date.now()}`,
        sent_at: new Date().toISOString(),
      }
    } else {
      const apiKey = process.env.EMAILBISON_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Email sending not configured' },
          { status: 500 }
        )
      }

      const client = new EmailBisonClient({
        apiKey,
        baseUrl: process.env.EMAILBISON_API_URL,
      })

      const lead = reply.lead as { email: string; first_name: string; last_name: string }

      sendResult = await client.sendEmail({
        to_email: reply.from_email,
        to_name: reply.from_name || undefined,
        subject: responseSubject,
        body_html: responseHtml,
        body_text: body_text,
        reply_to: reply.emailbison_reply_id ? undefined : undefined,
      })
    }

    // Create email_sends record for the response
    const lead = reply.lead as { id: string }
    const { data: responseSend, error: sendError } = await supabase
      .from('email_sends')
      .insert({
        workspace_id: campaign.workspace_id,
        campaign_id: campaignId,
        lead_id: lead.id,
        recipient_email: reply.from_email,
        recipient_name: reply.from_name,
        subject: responseSubject,
        body_text: body_text,
        body_html: responseHtml,
        status: 'sent',
        sent_at: sendResult.sent_at,
        emailbison_message_id: sendResult.message_id,
        send_metadata: {
          is_response: true,
          response_to_reply_id: replyId,
          sent_by: user.id,
        },
      })
      .select('id')
      .single()

    if (sendError) {
      logger.error('Failed to create response record', { error: sendError instanceof Error ? sendError.message : String(sendError), replyId, campaignId })
    }

    // Update reply status
    const { error: updateError } = await supabase
      .from('email_replies')
      .update({
        status: 'responded',
        response_sent_at: sendResult.sent_at,
        response_email_send_id: responseSend?.id,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', replyId)

    if (updateError) {
      logger.error('Failed to update reply status', { error: updateError instanceof Error ? updateError.message : String(updateError), replyId })
    }

    return NextResponse.json({
      success: true,
      message_id: sendResult.message_id,
      sent_at: sendResult.sent_at,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    logger.error('Send response error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
