// EmailBison Webhook Handler
// Receives webhook events from EmailBison and processes them

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  verifyWebhookSignature,
  parseWebhookEvent,
  isReplyReceivedEvent,
  isLeadUnsubscribedEvent,
  isBounceReceivedEvent,
  type ReplyReceivedEvent,
} from '@/lib/services/emailbison'

interface RouteContext {
  params: Promise<{ agentId: string }>
}

// Webhook secret from environment
const WEBHOOK_SECRET = process.env.EMAILBISON_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest, context: RouteContext) {
  const { agentId } = await context.params

  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-emailbison-signature') || ''

    // Verify signature if webhook secret is configured
    if (WEBHOOK_SECRET) {
      const verification = verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)
      if (!verification.isValid) {
        console.error('[EmailBison Webhook] Signature verification failed:', verification.error)
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody)
    const event = parseWebhookEvent(payload)

    console.log(`[EmailBison Webhook] Received ${event.event.type} for agent ${agentId}`)

    // Get supabase admin client
    const supabase = createAdminClient()

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, workspace_id, name')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      console.error('[EmailBison Webhook] Agent not found:', agentId)
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Handle different event types
    if (isReplyReceivedEvent(event)) {
      await handleReplyReceived(supabase, agent, event)
    } else if (isLeadUnsubscribedEvent(event)) {
      await handleUnsubscribe(supabase, agent, event)
    } else if (isBounceReceivedEvent(event)) {
      await handleBounce(supabase, agent, event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[EmailBison Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle reply received event
 * Creates or updates email thread and adds the message
 */
async function handleReplyReceived(
  supabase: ReturnType<typeof createAdminClient>,
  agent: { id: string; workspace_id: string; name: string },
  event: ReplyReceivedEvent
) {
  const { data } = event

  // Try to find existing thread by sender email and campaign
  const { data: existingThread } = await supabase
    .from('email_threads')
    .select('id')
    .eq('agent_id', agent.id)
    .eq('sender_email', data.from_email)
    .eq('campaign_id', String(data.campaign_id))
    .single()

  let threadId: string

  if (existingThread) {
    // Update existing thread with new intent score
    threadId = existingThread.id

    // Update thread status to indicate new reply
    await supabase
      .from('email_threads')
      .update({ status: 'new' })
      .eq('id', threadId)
  } else {
    // Try to find matching lead by email
    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('workspace_id', agent.workspace_id)
      .eq('email', data.from_email)
      .single()

    // Create new thread
    const { data: newThread, error: threadError } = await supabase
      .from('email_threads')
      .insert({
        agent_id: agent.id,
        lead_id: lead?.id || null,
        campaign_id: String(data.campaign_id),
        sender_email: data.from_email,
        sender_name: data.from_name || null,
        subject: data.subject,
        intent_score: 5, // Default, will be updated by AI classification
        status: 'new',
      })
      .select('id')
      .single()

    if (threadError || !newThread) {
      console.error('[EmailBison Webhook] Failed to create thread:', threadError)
      throw new Error('Failed to create email thread')
    }

    threadId = newThread.id
  }

  // Add the message to the thread
  const { error: messageError } = await supabase
    .from('email_messages')
    .insert({
      thread_id: threadId,
      direction: 'inbound',
      content: data.body_plain || data.body,
      generated_by: null, // Human message
      confidence: null,
    })

  if (messageError) {
    console.error('[EmailBison Webhook] Failed to create message:', messageError)
    throw new Error('Failed to create email message')
  }

  console.log(`[EmailBison Webhook] Created message for thread ${threadId}`)

  // TODO: Trigger AI classification and response generation via Inngest
  // await inngest.send({
  //   name: 'email/reply-received',
  //   data: { thread_id: threadId, agent_id: agent.id }
  // })
}

/**
 * Handle unsubscribe event
 * Updates thread status to 'ignored'
 */
async function handleUnsubscribe(
  supabase: ReturnType<typeof createAdminClient>,
  agent: { id: string; workspace_id: string; name: string },
  event: { data: { lead_id: number; email: string } }
) {
  const { data } = event

  // Find and update any threads from this sender
  await supabase
    .from('email_threads')
    .update({
      status: 'ignored',
      intent_score: 0,
    })
    .eq('agent_id', agent.id)
    .eq('sender_email', data.email)

  console.log(`[EmailBison Webhook] Marked threads as ignored for ${data.email}`)
}

/**
 * Handle bounce event
 * Updates thread status and logs the bounce
 */
async function handleBounce(
  supabase: ReturnType<typeof createAdminClient>,
  agent: { id: string; workspace_id: string; name: string },
  event: { data: { email: string; bounce_type: string; bounce_reason: string } }
) {
  const { data } = event

  // Find and update any threads from this sender
  await supabase
    .from('email_threads')
    .update({
      status: 'ignored',
      intent_score: 0,
    })
    .eq('agent_id', agent.id)
    .eq('sender_email', data.email)

  console.log(`[EmailBison Webhook] Handled bounce for ${data.email}: ${data.bounce_reason}`)
}
