import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Verify webhook signature from email provider
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Handle inbound email webhook (from Resend, SendGrid, etc.)
 */
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  try {
    const payload = await request.text()
    const signature = request.headers.get('x-webhook-signature') || ''
    const webhookSecret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET || ''

    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      if (!verifySignature(payload, signature, webhookSecret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const data = JSON.parse(payload)

    // Handle different email provider formats
    const inboundEmail = parseInboundEmail(data)

    if (!inboundEmail) {
      return NextResponse.json({ error: 'Could not parse email' }, { status: 400 })
    }

    // Find the original email send by looking up the reply-to or message ID
    let emailSend = null
    let lead = null
    let workspaceId = null

    // Try to match by In-Reply-To header
    if (inboundEmail.inReplyTo) {
      const { data: send } = await supabase
        .from('email_sends')
        .select('id, workspace_id, lead_id, campaign_id')
        .eq('provider_message_id', inboundEmail.inReplyTo)
        .single()

      if (send) {
        emailSend = send
        workspaceId = send.workspace_id
      }
    }

    // Try to match by recipient email
    if (!emailSend && inboundEmail.to) {
      // Look for leads with this email address
      const { data: matchedLead } = await supabase
        .from('leads')
        .select('id, workspace_id, email')
        .eq('email', inboundEmail.from)
        .single()

      if (matchedLead) {
        lead = matchedLead
        workspaceId = matchedLead.workspace_id
      }
    }

    // Reject emails we can't attribute to a workspace
    if (!workspaceId) {
      console.warn('Inbound email could not be matched to a workspace:', {
        from: inboundEmail.from,
        to: inboundEmail.to,
        subject: inboundEmail.subject,
      })
      // Return success to the email provider so they don't retry
      // but don't store the message since we can't attribute it
      return NextResponse.json({
        success: true,
        matched: false,
        reason: 'Could not match email to a workspace',
      })
    }

    // Store the inbound message (only if we have a valid workspace)
    const { data: inboundMessage, error: insertError } = await supabase
      .from('inbound_messages')
      .insert({
        workspace_id: workspaceId,
        lead_id: lead?.id || emailSend?.lead_id,
        email_send_id: emailSend?.id,
        message_type: 'email_reply',
        from_email: inboundEmail.from,
        from_name: inboundEmail.fromName,
        subject: inboundEmail.subject,
        body_text: inboundEmail.text,
        body_html: inboundEmail.html,
        raw_payload: data,
        processed: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to store inbound message:', insertError)
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 })
    }

    // If we matched an email send, update it
    if (emailSend) {
      await supabase
        .from('email_sends')
        .update({
          status: 'replied',
          replied_at: new Date().toISOString(),
        })
        .eq('id', emailSend.id)

      // Update campaign stats
      if (emailSend.campaign_id) {
        await supabase.rpc('increment_campaign_replies', {
          p_campaign_id: emailSend.campaign_id,
        }).catch(() => {})
      }
    }

    // Record engagement if we have a lead
    const leadId = lead?.id || emailSend?.lead_id
    if (leadId && workspaceId) {
      await supabase.from('lead_engagements').insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        engagement_type: 'email_reply',
        engagement_source: emailSend ? 'email_campaign' : 'inbound',
        engagement_score: 5, // Replies are high-value engagement
        metadata: {
          subject: inboundEmail.subject,
          inbound_message_id: inboundMessage.id,
        },
      })

      // Update lead as interested (can be overridden by sentiment analysis)
      await supabase
        .from('leads')
        .update({
          is_interested: true,
          last_engagement_at: new Date().toISOString(),
        })
        .eq('id', leadId)
    }

    return NextResponse.json({
      success: true,
      message_id: inboundMessage.id,
      matched: !!emailSend || !!lead,
    })
  } catch (error: any) {
    console.error('Inbound email webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Parse inbound email from different provider formats
 */
function parseInboundEmail(data: any): {
  from: string
  fromName?: string
  to?: string
  subject?: string
  text?: string
  html?: string
  inReplyTo?: string
} | null {
  // Resend format
  if (data.email) {
    return {
      from: data.email.from?.[0]?.address || data.email.from,
      fromName: data.email.from?.[0]?.name,
      to: data.email.to?.[0]?.address,
      subject: data.email.subject,
      text: data.email.text,
      html: data.email.html,
      inReplyTo: data.email.headers?.['in-reply-to'],
    }
  }

  // SendGrid format
  if (data.from) {
    return {
      from: data.from,
      fromName: data.from_name,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
      inReplyTo: data.headers?.['In-Reply-To'],
    }
  }

  // AWS SES format
  if (data.mail) {
    return {
      from: data.mail.source,
      subject: data.mail.commonHeaders?.subject,
      text: data.content?.text,
      html: data.content?.html,
      inReplyTo: data.mail.commonHeaders?.['in-reply-to'],
    }
  }

  // Generic format
  if (data.sender || data.From) {
    return {
      from: data.sender || data.From,
      fromName: data.sender_name || data.FromName,
      to: data.recipient || data.To,
      subject: data.subject || data.Subject,
      text: data.body || data.text || data.Text,
      html: data.html || data.Html,
      inReplyTo: data.in_reply_to || data['In-Reply-To'],
    }
  }

  return null
}
