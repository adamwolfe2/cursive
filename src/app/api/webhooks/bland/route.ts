/**
 * Bland.ai Webhook Handler
 * Cursive Platform
 *
 * Receives voice call status updates and transcripts from Bland.ai.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
  if (!signature || !secret) {
    // If no secret configured, skip verification (dev mode)
    return !secret
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
 * Create admin Supabase client for webhook operations
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, serviceRoleKey)
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
  try {
    // Get raw body for signature verification
    const rawBody = await req.text()

    // Verify webhook signature (optional - depends on Bland.ai configuration)
    const webhookSecret = process.env.BLAND_WEBHOOK_SECRET
    const signature = req.headers.get('x-bland-signature') ||
                      req.headers.get('x-webhook-signature')

    if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
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

    const { call_id, status, metadata } = payload

    if (!call_id) {
      return NextResponse.json(
        { error: 'Missing call_id' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

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
      await supabase.from('activity_logs').insert({
        workspace_id: metadata.workspace_id,
        lead_id: metadata.lead_id,
        activity_type: 'voice_call',
        description: `Voice call ${status}: ${outcome}`,
        metadata: {
          call_id,
          duration: payload.duration_seconds,
          sentiment: payload.sentiment,
          outcome,
        },
      })
    }

    return NextResponse.json({
      success: true,
      call_id,
      status: mapCallStatus(status),
      outcome,
      saved_id: savedCall?.id,
    })
  } catch (error: any) {
    console.error('[Bland Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
