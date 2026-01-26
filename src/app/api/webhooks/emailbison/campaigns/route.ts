// EmailBison Campaign Webhook Handler
// Receives webhook events for campaign emails and processes them

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'
import {
  verifyWebhookSignature,
  parseWebhookEvent,
  isEmailSentEvent,
  isReplyReceivedEvent,
  isLeadUnsubscribedEvent,
  isBounceReceivedEvent,
  isEmailOpenedEvent,
  isEmailClickedEvent,
  type EmailBisonWebhookEvent,
  type ReplyReceivedEvent,
  type BounceReceivedEvent,
  type EmailOpenedEvent,
  type EmailClickedEvent,
} from '@/lib/services/emailbison'

// Webhook secret from environment
const WEBHOOK_SECRET = process.env.EMAILBISON_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-emailbison-signature') || ''

    // Verify signature if webhook secret is configured
    if (WEBHOOK_SECRET) {
      const verification = verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)
      if (!verification.isValid) {
        console.error('[Campaign Webhook] Signature verification failed:', verification.error)
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody)
    const event = parseWebhookEvent(payload)

    console.log(`[Campaign Webhook] Received ${event.event.type}`)

    // Get supabase admin client
    const supabase = createAdminClient()

    // Handle different event types
    if (isEmailSentEvent(event)) {
      await handleEmailSent(supabase, event)
    } else if (isEmailOpenedEvent(event)) {
      await handleEmailOpened(supabase, event)
    } else if (isEmailClickedEvent(event)) {
      await handleEmailClicked(supabase, event)
    } else if (isReplyReceivedEvent(event)) {
      await handleReplyReceived(supabase, event)
    } else if (isLeadUnsubscribedEvent(event)) {
      await handleUnsubscribe(supabase, event)
    } else if (isBounceReceivedEvent(event)) {
      await handleBounce(supabase, event)
    } else {
      console.log(`[Campaign Webhook] Unhandled event type: ${event.event.type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Campaign Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle email sent confirmation
 * Updates email_sends record with send confirmation
 */
async function handleEmailSent(
  supabase: ReturnType<typeof createAdminClient>,
  event: EmailBisonWebhookEvent
) {
  const data = event.data as {
    message_id: string
    tracking_id?: string
    to_email: string
    sent_at: string
  }

  // Find email_sends record by tracking_id (which we set as email_send_id)
  if (data.tracking_id) {
    const { error } = await supabase
      .from('email_sends')
      .update({
        status: 'sent',
        sent_at: data.sent_at,
        emailbison_message_id: data.message_id,
        send_metadata: {
          confirmed_by_webhook: true,
          confirmed_at: new Date().toISOString(),
        },
      })
      .eq('id', data.tracking_id)

    if (error) {
      console.error('[Campaign Webhook] Failed to update email send:', error)
    } else {
      console.log(`[Campaign Webhook] Confirmed send for email ${data.tracking_id}`)
    }
  }
}

/**
 * Handle reply received event
 * Updates campaign_lead status and creates reply record
 */
async function handleReplyReceived(
  supabase: ReturnType<typeof createAdminClient>,
  event: ReplyReceivedEvent
) {
  const { data } = event

  // Find the email_sends record by emailbison_message_id or recipient email
  const { data: emailSend } = await supabase
    .from('email_sends')
    .select(`
      id,
      campaign_id,
      lead_id,
      workspace_id,
      campaign_lead:campaign_leads!inner(id)
    `)
    .eq('recipient_email', data.from_email)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)
    .single()

  if (!emailSend) {
    console.log(`[Campaign Webhook] No matching sent email found for ${data.from_email}`)
    return
  }

  // Create reply record
  const { data: reply, error: replyError } = await supabase
    .from('email_replies')
    .insert({
      email_send_id: emailSend.id,
      campaign_id: emailSend.campaign_id,
      lead_id: emailSend.lead_id,
      workspace_id: emailSend.workspace_id,
      from_email: data.from_email,
      from_name: data.from_name || null,
      subject: data.subject,
      body_text: data.body_plain || data.body,
      body_html: data.body,
      received_at: data.received_at,
      emailbison_reply_id: String(data.reply_id),
    })
    .select('id')
    .single()

  if (replyError) {
    console.error('[Campaign Webhook] Failed to create reply record:', replyError)
  } else {
    console.log(`[Campaign Webhook] Created reply record ${reply?.id}`)
  }

  // Update campaign_lead status
  const campaignLeadId = (emailSend.campaign_lead as { id: string }[])?.[0]?.id
  if (campaignLeadId) {
    await supabase
      .from('campaign_leads')
      .update({
        status: 'replied',
        replied_at: data.received_at,
      })
      .eq('id', campaignLeadId)

    console.log(`[Campaign Webhook] Updated campaign lead ${campaignLeadId} to replied`)
  }

  // Trigger reply handling flow via Inngest
  await inngest.send({
    name: 'emailbison/reply-received',
    data: {
      reply_id: reply?.id || String(data.reply_id),
      lead_email: data.from_email,
      from_email: data.from_email,
      subject: data.subject,
      body: data.body_plain || data.body,
      received_at: data.received_at,
    },
  })
}

/**
 * Handle unsubscribe event
 * Updates lead and campaign_lead status
 */
async function handleUnsubscribe(
  supabase: ReturnType<typeof createAdminClient>,
  event: EmailBisonWebhookEvent
) {
  const data = event.data as {
    lead_id: number
    email: string
    unsubscribed_at: string
  }

  // Find leads by email and mark as unsubscribed
  const { data: leads } = await supabase
    .from('leads')
    .select('id, workspace_id')
    .eq('email', data.email)

  if (leads && leads.length > 0) {
    const leadIds = leads.map((l) => l.id)

    // Update leads
    await supabase
      .from('leads')
      .update({
        email_status: 'unsubscribed',
        updated_at: new Date().toISOString(),
      })
      .in('id', leadIds)

    // Update campaign_leads
    await supabase
      .from('campaign_leads')
      .update({
        status: 'unsubscribed',
      })
      .in('lead_id', leadIds)

    console.log(`[Campaign Webhook] Marked ${data.email} as unsubscribed`)
  }
}

/**
 * Handle bounce event
 * Updates lead email status and campaign_lead status
 */
async function handleBounce(
  supabase: ReturnType<typeof createAdminClient>,
  event: BounceReceivedEvent
) {
  const { data } = event

  // Find leads by email
  const { data: leads } = await supabase
    .from('leads')
    .select('id')
    .eq('email', data.email)

  if (leads && leads.length > 0) {
    const leadIds = leads.map((l) => l.id)
    const bounceStatus = data.bounce_type === 'hard' ? 'invalid' : 'soft_bounce'

    // Update leads
    await supabase
      .from('leads')
      .update({
        email_status: bounceStatus,
        updated_at: new Date().toISOString(),
      })
      .in('id', leadIds)

    // Update campaign_leads
    await supabase
      .from('campaign_leads')
      .update({
        status: 'bounced',
        bounce_reason: data.bounce_reason,
      })
      .in('lead_id', leadIds)

    console.log(`[Campaign Webhook] Handled ${data.bounce_type} bounce for ${data.email}`)
  }

  // Trigger bounce handling via Inngest
  await inngest.send({
    name: 'emailbison/bounce-received',
    data: {
      lead_email: data.email,
      bounce_type: data.bounce_type,
      bounce_reason: data.bounce_reason,
      bounced_at: data.bounced_at,
    },
  })
}

/**
 * Handle email opened event
 * Updates email_sends with open tracking and campaign stats
 */
async function handleEmailOpened(
  supabase: ReturnType<typeof createAdminClient>,
  event: EmailOpenedEvent
) {
  const { data } = event

  // Find email by message_id or to_email
  const { data: emailSend, error: findError } = await supabase
    .from('email_sends')
    .select('id, campaign_id, lead_id, opened_at, open_count')
    .eq('recipient_email', data.to_email)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)
    .single()

  if (findError || !emailSend) {
    console.log(`[Campaign Webhook] No sent email found for open event: ${data.to_email}`)
    return
  }

  const isFirstOpen = !emailSend.opened_at

  // Update email_sends record
  const { error: updateError } = await supabase
    .from('email_sends')
    .update({
      opened_at: emailSend.opened_at || data.opened_at, // Keep first open time
      open_count: (emailSend.open_count || 0) + 1,
      status: 'opened', // Update status
    })
    .eq('id', emailSend.id)

  if (updateError) {
    console.error('[Campaign Webhook] Failed to update email open:', updateError)
    return
  }

  // Update campaign stats (only on first open)
  if (isFirstOpen) {
    await supabase.rpc('increment_campaign_opens', { campaign_id: emailSend.campaign_id })
      .catch(() => {
        // Fallback if RPC doesn't exist
        supabase
          .from('email_campaigns')
          .update({
            emails_opened: supabase.raw('COALESCE(emails_opened, 0) + 1'),
          })
          .eq('id', emailSend.campaign_id)
      })

    // Update campaign_lead engagement tracking
    await supabase
      .from('campaign_leads')
      .update({
        emails_opened: supabase.raw('COALESCE(emails_opened, 0) + 1'),
      })
      .eq('campaign_id', emailSend.campaign_id)
      .eq('lead_id', emailSend.lead_id)
  }

  console.log(`[Campaign Webhook] Recorded open for email ${emailSend.id} (first: ${isFirstOpen})`)
}

/**
 * Handle email clicked event
 * Updates email_sends with click tracking and campaign stats
 */
async function handleEmailClicked(
  supabase: ReturnType<typeof createAdminClient>,
  event: EmailClickedEvent
) {
  const { data } = event

  // Find email by to_email
  const { data: emailSend, error: findError } = await supabase
    .from('email_sends')
    .select('id, campaign_id, lead_id, clicked_at, click_count, clicked_links')
    .eq('recipient_email', data.to_email)
    .in('status', ['sent', 'opened'])
    .order('sent_at', { ascending: false })
    .limit(1)
    .single()

  if (findError || !emailSend) {
    console.log(`[Campaign Webhook] No email found for click event: ${data.to_email}`)
    return
  }

  const isFirstClick = !emailSend.clicked_at
  const existingLinks = (emailSend.clicked_links as Array<{ url: string; clicked_at: string }>) || []

  // Add new link click
  const updatedLinks = [
    ...existingLinks,
    { url: data.url, clicked_at: data.clicked_at },
  ]

  // Update email_sends record
  const { error: updateError } = await supabase
    .from('email_sends')
    .update({
      clicked_at: emailSend.clicked_at || data.clicked_at, // Keep first click time
      click_count: (emailSend.click_count || 0) + 1,
      clicked_links: updatedLinks,
      status: 'clicked', // Update status
    })
    .eq('id', emailSend.id)

  if (updateError) {
    console.error('[Campaign Webhook] Failed to update email click:', updateError)
    return
  }

  // Update campaign stats (only on first click)
  if (isFirstClick) {
    await supabase.rpc('increment_campaign_clicks', { campaign_id: emailSend.campaign_id })
      .catch(() => {
        // Fallback if RPC doesn't exist
        supabase
          .from('email_campaigns')
          .update({
            emails_clicked: supabase.raw('COALESCE(emails_clicked, 0) + 1'),
          })
          .eq('id', emailSend.campaign_id)
      })

    // Update campaign_lead engagement tracking
    await supabase
      .from('campaign_leads')
      .update({
        emails_clicked: supabase.raw('COALESCE(emails_clicked, 0) + 1'),
      })
      .eq('campaign_id', emailSend.campaign_id)
      .eq('lead_id', emailSend.lead_id)
  }

  console.log(`[Campaign Webhook] Recorded click for email ${emailSend.id} on ${data.url}`)
}
