/**
 * Bland.ai Webhook Handler
 * Cursive Platform
 *
 * Receives voice call status updates and transcripts from Bland.ai.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// Types for Bland.ai webhook payload
interface BlandTranscriptEntry {
  text: string
  user: 'assistant' | 'user'
  created_at: number
}

interface BlandWebhookPayload {
  call_id: string
  status: 'completed' | 'failed' | 'no-answer' | 'busy' | 'voicemail' | 'transferred'
  duration_seconds?: number
  from_number?: string
  to_number?: string
  recording_url?: string
  transcript?: BlandTranscriptEntry[]
  summary?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  answered?: boolean
  voicemail_detected?: boolean
  transferred?: boolean
  transfer_number?: string
  error_message?: string
  metadata?: {
    workspace_id?: string
    lead_id?: string
    campaign_id?: string
    [key: string]: any
  }
  created_at?: string
  ended_at?: string
}

/**
 * Verify Bland.ai webhook signature
 */
function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  // SECURITY: Always require signature and secret - no dev mode bypass
  if (!signature) {
    return false
  }

  if (!secret) {
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}


/**
 * Map Bland status to our internal status
 */
function mapCallStatus(
  blandStatus: string
): 'completed' | 'failed' | 'no_answer' | 'busy' | 'voicemail' {
  switch (blandStatus) {
    case 'completed':
      return 'completed'
    case 'no-answer':
      return 'no_answer'
    case 'busy':
      return 'busy'
    case 'voicemail':
      return 'voicemail'
    default:
      return 'failed'
  }
}

/**
 * Calculate call outcome based on transcript analysis
 */
function analyzeCallOutcome(payload: BlandWebhookPayload): {
  outcome: string
  interested: boolean
  callbackRequested: boolean
} {
  const transcript = payload.transcript || []
  const fullText = transcript.map((t) => t.text.toLowerCase()).join(' ')

  // Simple keyword analysis
  const positiveKeywords = ['yes', 'interested', 'sure', 'tell me more', 'sounds good', 'great']
  const negativeKeywords = ['no', 'not interested', 'stop', 'remove', 'do not call']
  const callbackKeywords = ['call back', 'callback', 'later', 'busy right now', 'not a good time']

  const hasPositive = positiveKeywords.some((kw) => fullText.includes(kw))
  const hasNegative = negativeKeywords.some((kw) => fullText.includes(kw))
  const hasCallback = callbackKeywords.some((kw) => fullText.includes(kw))

  let outcome = 'neutral'
  if (hasPositive && !hasNegative) {
    outcome = 'interested'
  } else if (hasNegative) {
    outcome = 'not_interested'
  } else if (hasCallback) {
    outcome = 'callback_requested'
  }

  return {
    outcome,
    interested: hasPositive && !hasNegative,
    callbackRequested: hasCallback,
  }
}

export async function POST(req: NextRequest) {
  let call_id: string | undefined
  let workspace_id: string | undefined

  try {
    // Get raw body for signature verification
    const rawBody = await req.text()

    // Verify webhook signature - REQUIRED for security
    const webhookSecret = process.env.BLAND_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Bland Webhook] Missing BLAND_WEBHOOK_SECRET')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    const signature = req.headers.get('x-bland-signature') ||
                      req.headers.get('x-webhook-signature')

    if (!verifySignature(rawBody, signature, webhookSecret)) {
      console.error('[Bland Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse payload
    let payload: BlandWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const { status, metadata } = payload
    call_id = payload.call_id
    workspace_id = metadata?.workspace_id

    if (!call_id) {
      return NextResponse.json(
        { error: 'Missing call_id' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // IDEMPOTENCY: Check if this call webhook has already been processed
    if (call_id) {
      // Use workspace_id from metadata or a default for non-workspace calls
      const idempWorkspaceId = workspace_id || 'system'

      const { data: existingKey } = await supabase
        .from('api_idempotency_keys')
        .select('status, response_data, completed_at')
        .eq('idempotency_key', call_id)
        .eq('workspace_id', idempWorkspaceId)
        .eq('endpoint', '/api/webhooks/bland')
        .single()

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
          idempotency_key: call_id,
          workspace_id: idempWorkspaceId,
          endpoint: '/api/webhooks/bland',
          status: 'processing',
        })
      }
    }

    // Analyze call outcome
    const { outcome, interested, callbackRequested } = analyzeCallOutcome(payload)

    // Store call record
    const callRecord = {
      external_call_id: call_id,
      workspace_id: metadata?.workspace_id || null,
      lead_id: metadata?.lead_id || null,
      campaign_id: metadata?.campaign_id || null,
      status: mapCallStatus(status),
      duration_seconds: payload.duration_seconds || 0,
      from_number: payload.from_number || null,
      to_number: payload.to_number || null,
      recording_url: payload.recording_url || null,
      transcript: payload.transcript || null,
      summary: payload.summary || null,
      sentiment: payload.sentiment || null,
      outcome,
      interested,
      callback_requested: callbackRequested,
      answered: payload.answered ?? false,
      voicemail_detected: payload.voicemail_detected ?? false,
      transferred: payload.transferred ?? false,
      transfer_number: payload.transfer_number || null,
      error_message: payload.error_message || null,
      raw_payload: payload,
      started_at: payload.created_at || null,
      ended_at: payload.ended_at || new Date().toISOString(),
    }

    // Upsert call record (in case of duplicate webhooks)
    const { data: savedCall, error: callError } = await supabase
      .from('voice_calls')
      .upsert(callRecord, {
        onConflict: 'external_call_id',
      })
      .select('id')
      .single()

    if (callError) {
      console.error('[Bland Webhook] Failed to save call:', callError)
      // Try inserting into a fallback table or log
      await supabase.from('webhook_logs').insert({
        source: 'bland',
        event_type: 'call.' + status,
        payload: payload,
        error: callError.message,
      })
    }

    // Update lead if provided
    if (metadata?.lead_id) {
      const leadUpdate: Record<string, any> = {
        last_contact_at: new Date().toISOString(),
        last_contact_method: 'voice',
        voice_call_status: mapCallStatus(status),
      }

      // Update lead status based on outcome
      if (interested) {
        leadUpdate.lead_score = 80 // Boost score for interested leads
        leadUpdate.status = 'hot'
      } else if (outcome === 'not_interested') {
        leadUpdate.status = 'disqualified'
        leadUpdate.disqualification_reason = 'Not interested (voice call)'
      } else if (callbackRequested) {
        leadUpdate.status = 'callback_scheduled'
      }

      await supabase
        .from('leads')
        .update(leadUpdate)
        .eq('id', metadata.lead_id)
    }

    // Update campaign stats if provided
    if (metadata?.campaign_id) {
      const statsUpdate: Record<string, any> = {
        total_calls: supabase.rpc('increment', { amount: 1 }),
      }

      if (status === 'completed' && payload.answered) {
        statsUpdate.answered_calls = supabase.rpc('increment', { amount: 1 })
      }
      if (interested) {
        statsUpdate.interested_leads = supabase.rpc('increment', { amount: 1 })
      }

      // Simple increment instead of RPC if not available
      await supabase
        .from('voice_campaigns')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', metadata.campaign_id)
    }

    // Log activity
    if (metadata?.workspace_id && metadata?.lead_id) {
      await supabase.from('audit_logs').insert({
        workspace_id: metadata.workspace_id,
        action: 'voice_call',
        resource_type: 'lead',
        severity: 'info',
        metadata: {
          lead_id: metadata.lead_id,
          description: `Voice call ${status}: ${outcome}`,
          call_id,
          duration: payload.duration_seconds,
          sentiment: payload.sentiment,
          outcome,
        },
      })
    }

    // Prepare successful response
    const response = {
      success: true,
      call_id,
      status: mapCallStatus(status),
      outcome,
      saved_id: savedCall?.id,
    }

    // Update idempotency key with successful response
    if (call_id) {
      const idempWorkspaceId = workspace_id || 'system'
      await supabase
        .from('api_idempotency_keys')
        .update({
          status: 'completed',
          response_data: response,
          completed_at: new Date().toISOString(),
        })
        .eq('idempotency_key', call_id)
        .eq('workspace_id', idempWorkspaceId)
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Bland Webhook] Error:', error)

    // Mark idempotency key as failed to allow retry
    if (call_id) {
      try {
        const supabase = createAdminClient()
        const idempWorkspaceId = workspace_id || 'system'
        await supabase
          .from('api_idempotency_keys')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', call_id)
          .eq('workspace_id', idempWorkspaceId)
      } catch (idempotencyError) {
        console.error('[Bland Webhook] Failed to update idempotency key:', idempotencyError)
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
