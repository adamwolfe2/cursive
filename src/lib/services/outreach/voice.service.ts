/**
 * Voice Outreach Service
 * Cursive Platform
 *
 * Handles AI voice calls and ringless voicemails:
 * - Bland.ai integration for AI voice calls
 * - Slybroadcast/Drop.co for ringless voicemails
 */

import { createClient } from '@/lib/supabase/server'

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceCallRequest {
  toPhone: string
  fromPhone?: string
  script?: string
  voiceId?: string
  transferNumber?: string
  maxDurationSeconds?: number
  metadata?: Record<string, any>
}

export interface VoiceCallResult {
  success: boolean
  callId?: string
  error?: string
  status?: string
}

export interface RinglessVoicemailRequest {
  toPhone: string
  audioUrl?: string
  audioBase64?: string
  fromPhone?: string
}

export interface RinglessVoicemailResult {
  success: boolean
  dropId?: string
  error?: string
}

export interface CallTranscript {
  text: string
  speaker: 'ai' | 'human'
  timestamp: number
}

// ============================================================================
// BLAND.AI - AI VOICE CALLS
// ============================================================================

const BLAND_API_URL = 'https://api.bland.ai/v1'

/**
 * Make an AI voice call using Bland.ai
 */
export async function makeAiVoiceCall(
  request: VoiceCallRequest,
  workspaceId: string,
  leadId?: string,
  campaignId?: string
): Promise<VoiceCallResult> {
  const apiKey = process.env.BLAND_AI_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: 'Bland.ai API key not configured',
    }
  }

  try {
    const response = await fetch(`${BLAND_API_URL}/calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        phone_number: normalizePhoneNumber(request.toPhone),
        from: request.fromPhone,
        task: request.script || 'Have a friendly conversation and gather information.',
        voice_id: request.voiceId || 'nat', // Natural voice
        transfer_phone_number: request.transferNumber,
        max_duration: request.maxDurationSeconds || 300,
        record: true,
        webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/bland`,
        metadata: {
          workspace_id: workspaceId,
          lead_id: leadId,
          campaign_id: campaignId,
          ...request.metadata,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.message || `Bland.ai error: ${response.status}`,
      }
    }

    const data = await response.json()

    // Log the call
    await logVoiceCall({
      workspaceId,
      leadId,
      campaignId,
      toPhone: request.toPhone,
      fromPhone: request.fromPhone,
      type: 'ai_voice',
      status: 'queued',
      externalId: data.call_id,
    })

    return {
      success: true,
      callId: data.call_id,
      status: 'queued',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to initiate AI call',
    }
  }
}

/**
 * Get call status and transcript from Bland.ai
 */
export async function getCallStatus(callId: string): Promise<{
  status: string
  duration?: number
  transcript?: CallTranscript[]
  recordingUrl?: string
  outcome?: string
}> {
  const apiKey = process.env.BLAND_AI_API_KEY

  if (!apiKey) {
    throw new Error('Bland.ai API key not configured')
  }

  const response = await fetch(`${BLAND_API_URL}/calls/${callId}`, {
    headers: {
      'Authorization': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get call status: ${response.status}`)
  }

  const data = await response.json()

  return {
    status: data.status,
    duration: data.call_length,
    transcript: data.transcript,
    recordingUrl: data.recording_url,
    outcome: data.analysis?.outcome,
  }
}

// ============================================================================
// RINGLESS VOICEMAIL
// ============================================================================

/**
 * Send ringless voicemail via Slybroadcast
 */
export async function sendRinglessVoicemail(
  request: RinglessVoicemailRequest,
  workspaceId: string,
  leadId?: string,
  campaignId?: string
): Promise<RinglessVoicemailResult> {
  const apiKey = process.env.SLYBROADCAST_API_KEY
  const userId = process.env.SLYBROADCAST_USER_ID

  if (!apiKey || !userId) {
    return {
      success: false,
      error: 'Slybroadcast credentials not configured',
    }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('c_uid', userId)
    formData.append('c_password', apiKey)
    formData.append('c_phone', normalizePhoneNumber(request.toPhone))

    if (request.audioUrl) {
      formData.append('c_url', request.audioUrl)
    } else if (request.audioBase64) {
      formData.append('c_audio', request.audioBase64)
    } else {
      return {
        success: false,
        error: 'Either audioUrl or audioBase64 is required',
      }
    }

    if (request.fromPhone) {
      formData.append('c_callerid', request.fromPhone)
    }

    const response = await fetch('https://www.mobile-sphere.com/gateway/vmb.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const text = await response.text()

    // Slybroadcast returns OK or ERROR
    if (text.includes('OK')) {
      const dropId = text.split(':')[1]?.trim()

      await logVoiceCall({
        workspaceId,
        leadId,
        campaignId,
        toPhone: request.toPhone,
        fromPhone: request.fromPhone,
        type: 'ringless_voicemail',
        status: 'queued',
        externalId: dropId,
      })

      return {
        success: true,
        dropId,
      }
    }

    return {
      success: false,
      error: text,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send ringless voicemail',
    }
  }
}

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

/**
 * Start a voice campaign
 */
export async function startVoiceCampaign(
  campaignId: string,
  leadIds: string[],
  workspaceId: string
): Promise<{ queued: number; failed: number }> {
  const supabase = await createClient()

  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('voice_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('workspace_id', workspaceId)
    .single()

  if (campaignError || !campaign) {
    throw new Error('Campaign not found')
  }

  let queued = 0
  let failed = 0

  // Get leads with phone numbers
  const { data: leads } = await supabase
    .from('leads')
    .select('id, contact_data')
    .in('id', leadIds)
    .eq('workspace_id', workspaceId)

  if (!leads) {
    return { queued: 0, failed: leadIds.length }
  }

  for (const lead of leads) {
    const contactData = lead.contact_data as any
    const phone = contactData?.contacts?.[0]?.phone

    if (!phone) {
      failed++
      continue
    }

    let result

    if (campaign.type === 'ai_voice') {
      result = await makeAiVoiceCall(
        {
          toPhone: phone,
          script: campaign.script_template,
          voiceId: campaign.voice_id,
        },
        workspaceId,
        lead.id,
        campaignId
      )
    } else if (campaign.type === 'ringless_voicemail') {
      // Assume script_template contains the audio URL for RVM
      result = await sendRinglessVoicemail(
        {
          toPhone: phone,
          audioUrl: campaign.script_template,
        },
        workspaceId,
        lead.id,
        campaignId
      )
    }

    if (result?.success) {
      queued++
    } else {
      failed++
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return { queued, failed }
}

// ============================================================================
// LOGGING
// ============================================================================

async function logVoiceCall(data: {
  workspaceId: string
  leadId?: string
  campaignId?: string
  toPhone: string
  fromPhone?: string
  type: 'ai_voice' | 'ringless_voicemail'
  status: string
  externalId?: string
}): Promise<string | null> {
  const supabase = await createClient()

  const { data: call, error } = await supabase
    .from('voice_calls')
    .insert({
      workspace_id: data.workspaceId,
      lead_id: data.leadId,
      campaign_id: data.campaignId,
      to_phone: data.toPhone,
      from_phone: data.fromPhone,
      type: data.type,
      status: data.status,
      external_id: data.externalId,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to log voice call:', error)
    return null
  }

  // Log activity
  if (data.leadId) {
    await supabase.from('lead_activities').insert({
      lead_id: data.leadId,
      workspace_id: data.workspaceId,
      activity_type: data.type === 'ai_voice' ? 'call_made' : 'voicemail_sent',
      description: `${data.type === 'ai_voice' ? 'AI call' : 'Voicemail'} initiated to ${data.toPhone}`,
      metadata: {
        call_id: call.id,
        type: data.type,
      },
    })
  }

  return call.id
}

/**
 * Update call status from webhook
 */
export async function updateCallStatus(
  externalId: string,
  status: string,
  data: {
    duration?: number
    recordingUrl?: string
    transcript?: string
    outcome?: string
    cost?: number
  }
): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('voice_calls')
    .update({
      status,
      duration_seconds: data.duration,
      recording_url: data.recordingUrl,
      transcript: data.transcript,
      outcome: data.outcome,
      cost: data.cost,
      ended_at: status === 'completed' ? new Date().toISOString() : undefined,
    })
    .eq('external_id', externalId)
}

// ============================================================================
// HELPERS
// ============================================================================

function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 10) {
    return `+1${digits}`
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }

  if (phone.startsWith('+')) {
    return phone
  }

  return `+${digits}`
}
