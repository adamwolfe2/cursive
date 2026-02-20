// EmailBison Webhook Handler
// Receives webhook events from EmailBison and processes them


import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  parseWebhookEvent,
  isReplyReceivedEvent,
  isLeadUnsubscribedEvent,
  isBounceReceivedEvent,
  type ReplyReceivedEvent,
} from '@/lib/services/emailbison'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { inngest } from '@/inngest/client'
import { verifyHmacSignature, sha256Hex } from '@/lib/utils/crypto'

interface RouteContext {
  params: Promise<{ agentId: string }>
}

// Webhook secret from environment
const WEBHOOK_SECRET = process.env.EMAILBISON_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest, context: RouteContext) {
  const { agentId } = await context.params
  let idempotencyKey: string | undefined
  let workspaceId: string | undefined

  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-emailbison-signature') || ''

    // SECURITY: Always require webhook secret for signature verification
    if (!WEBHOOK_SECRET) {
      safeError('[EmailBison Webhook] Missing EMAILBISON_WEBHOOK_SECRET')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    // Verify signature - REQUIRED for security (Edge-compatible)
    const isValid = await verifyHmacSignature(rawBody, signature, WEBHOOK_SECRET)
    if (!isValid) {
      safeError('[EmailBison Webhook] Signature verification failed')
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

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, workspace_id, name')
      .eq('id', agentId)
      .maybeSingle()

    if (agentError || !agent) {
      safeError('[EmailBison Webhook] Agent not found:', agentId)
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    workspaceId = agent.workspace_id

    // IDEMPOTENCY: Generate unique key from event data to prevent duplicates
    // Hash agentId + event type + key identifying fields
    const eventData = event.data as any
    const idempotencyData = [
      agentId,
      event.event.type,
      eventData.from_email || eventData.email || '',
      eventData.campaign_id || '',
      eventData.timestamp || new Date().toISOString(),
    ].filter(Boolean).join('|')

    idempotencyKey = await sha256Hex(idempotencyData)

    // Check if this webhook has already been processed
    const { data: existingKey } = await supabase
      .from('api_idempotency_keys')
      .select('status, response_data, completed_at')
      .eq('idempotency_key', idempotencyKey)
      .eq('workspace_id', workspaceId)
      .eq('endpoint', '/api/webhooks/emailbison')
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
        workspace_id: workspaceId,
        endpoint: '/api/webhooks/emailbison',
        status: 'processing',
      })
    }

    // Handle different event types
    if (isReplyReceivedEvent(event)) {
      await handleReplyReceived(supabase, agent, event)
    } else if (isLeadUnsubscribedEvent(event)) {
      await handleUnsubscribe(supabase, agent, event)
    } else if (isBounceReceivedEvent(event)) {
      await handleBounce(supabase, agent, event)
    }

    // Prepare successful response
    const response = { success: true }

    // Update idempotency key with successful response
    if (idempotencyKey && workspaceId) {
      await supabase
        .from('api_idempotency_keys')
        .update({
          status: 'completed',
          response_data: response,
          completed_at: new Date().toISOString(),
        })
        .eq('idempotency_key', idempotencyKey)
        .eq('workspace_id', workspaceId)
    }

    return NextResponse.json(response)
  } catch (error) {
    safeError('[EmailBison Webhook] Error:', error)

    // Mark idempotency key as failed to allow retry
    if (idempotencyKey && workspaceId) {
      try {
        const supabase = createAdminClient()
        await supabase
          .from('api_idempotency_keys')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotencyKey)
          .eq('workspace_id', workspaceId)
      } catch (idempotencyError) {
        safeError('[EmailBison Webhook] Failed to update idempotency key:', idempotencyError)
      }
    }

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
    .maybeSingle()

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
      .maybeSingle()

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
      .maybeSingle()

    if (threadError || !newThread) {
      safeError('[EmailBison Webhook] Failed to create thread:', threadError)
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
    safeError('[EmailBison Webhook] Failed to create message:', messageError)
    throw new Error('Failed to create email message')
  }

  // Trigger AI classification and response generation via Inngest
  await inngest.send({
    name: 'email/reply-received',
    data: { thread_id: threadId, agent_id: agent.id }
  } as any)
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

}
