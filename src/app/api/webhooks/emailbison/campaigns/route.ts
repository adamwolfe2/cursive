// EmailBison Campaign Webhook Handler
// Receives webhook events for campaign emails and processes them

export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import { inngest } from '@/inngest/client'
import {
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

import { verifyHmacSignature, sha256Hex } from '@/lib/utils/crypto'

// Webhook secret from environment
const WEBHOOK_SECRET = process.env.EMAILBISON_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  let idempotencyKey: string | undefined

  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-emailbison-signature') || ''

    // SECURITY: Always require webhook secret for signature verification
    if (!WEBHOOK_SECRET) {
      safeError('[Campaign Webhook] Missing EMAILBISON_WEBHOOK_SECRET')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    // Verify signature - REQUIRED for security (Edge-compatible)
    const isValid = await verifyHmacSignature(rawBody, signature, WEBHOOK_SECRET)
    if (!isValid) {
      safeError('[Campaign Webhook] Signature verification failed')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody)
    const event = parseWebhookEvent(payload)

    // Get supabase admin client
    const supabase = createAdminClient()

    // IDEMPOTENCY: Generate unique key from event data to prevent duplicates
    // Hash event type + key identifying fields
    const eventData = event.data as any
    const idempotencyData = [
      event.event.type,
      eventData.message_id || eventData.reply_id || '',
      eventData.to_email || eventData.from_email || eventData.email || '',
      eventData.tracking_id || '',
      eventData.timestamp || eventData.sent_at || eventData.received_at || new Date().toISOString(),
    ].filter(Boolean).join('|')

    idempotencyKey = await sha256Hex(idempotencyData)

    // Check if this webhook has already been processed
    // Use 'system' as workspace since campaigns don't have workspace_id in payload
    const { data: existingKey } = await supabase
      .from('api_idempotency_keys')
      .select('status, response_data, completed_at')
      .eq('idempotency_key', idempotencyKey)
      .eq('workspace_id', 'system')
      .eq('endpoint', '/api/webhooks/emailbison/campaigns')
      .maybeSingle()

    if (existingKey) {
      // Request already processed successfully - return cached response
      if (existingKey.status === 'completed' && existingKey.response_data) {
        return NextResponse.json(existingKey.response_data)
      }

      // Request currently processing - return conflict
      if (existingKey.status === 'processing') {
        return NextResponse.json(
          { error: 'Webhook already being processed. Please retry later.' },
          { status: 409 }
        )
      }

      // Request failed previously - allow retry (don't return early)
    } else {
      // Create new idempotency key record
      await supabase.from('api_idempotency_keys').insert({
        idempotency_key: idempotencyKey,
        workspace_id: 'system',
        endpoint: '/api/webhooks/emailbison/campaigns',
        status: 'processing',
      })
    }

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
      safeError(`[Campaign Webhook] Unhandled event type: ${event.event.type}`)
    }

    // Prepare successful response
    const response = { success: true }

    // Update idempotency key with successful response
    if (idempotencyKey) {
      await supabase
        .from('api_idempotency_keys')
        .update({
          status: 'completed',
          response_data: response,
          completed_at: new Date().toISOString(),
        })
        .eq('idempotency_key', idempotencyKey)
        .eq('workspace_id', 'system')
    }

    return NextResponse.json(response)
  } catch (error) {
    safeError('[Campaign Webhook] Error:', error)

    // Mark idempotency key as failed to allow retry
    if (idempotencyKey) {
      try {
        const supabase = createAdminClient()
        await supabase
          .from('api_idempotency_keys')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotencyKey)
          .eq('workspace_id', 'system')
      } catch (idempotencyError) {
        safeError('[Campaign Webhook] Failed to update idempotency key:', idempotencyError)
      }
    }

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
      safeError('[Campaign Webhook] Failed to update email send:', error)
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
    .maybeSingle()

  if (!emailSend) {
    safeError(`[Campaign Webhook] No matching sent email found for ${data.from_email}`)
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
    .maybeSingle()

  if (replyError) {
    safeError('[Campaign Webhook] Failed to create reply record:', replyError)
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
  }

  // Fire Inngest event for AI classification and auto-reply
  if (reply?.id) {
    try {
      await inngest.send({
        name: 'emailbison/reply-received',
        data: {
          reply_id: reply.id,
          lead_email: data.from_email,
          from_email: data.from_email,
          subject: data.subject || '',
          body: data.body_plain || data.body || '',
          received_at: data.received_at,
        },
      })
    } catch (inngestError) {
      safeError('[Campaign Webhook] Failed to queue reply for AI processing:', inngestError)
      // Non-fatal: reply data is already saved to DB
    }
  }
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

  }

  // Bounce data saved to leads and campaign_leads tables above — no further async processing needed
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
    .maybeSingle()

  if (findError || !emailSend) {
    safeError(`[Campaign Webhook] No sent email found for open event: ${data.to_email}`)
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
    safeError('[Campaign Webhook] Failed to update email open:', updateError)
    return
  }

  // Update campaign stats (only on first open)
  if (isFirstOpen) {
    const { error: rpcError } = await supabase.rpc('increment_campaign_opens', { p_campaign_id: emailSend.campaign_id })
    if (rpcError) {
      safeError('[Campaign Webhook] increment_campaign_opens RPC failed:', rpcError)
    }
  }

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
    .maybeSingle()

  if (findError || !emailSend) {
    safeError(`[Campaign Webhook] No email found for click event: ${data.to_email}`)
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
    safeError('[Campaign Webhook] Failed to update email click:', updateError)
    return
  }

  // Update campaign stats (only on first click)
  if (isFirstClick) {
    const { error: rpcError } = await supabase.rpc('increment_campaign_clicks', { p_campaign_id: emailSend.campaign_id })
    if (rpcError) {
      safeError('[Campaign Webhook] increment_campaign_clicks RPC failed:', rpcError)
    }
  }

}
