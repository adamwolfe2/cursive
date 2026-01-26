/**
 * SMS Sender Service
 * Cursive Platform
 *
 * Handles SMS/text messaging through Twilio
 */

import { createClient } from '@/lib/supabase/server'

// ============================================================================
// TYPES
// ============================================================================

export interface SmsSendRequest {
  to: string
  body: string
  mediaUrl?: string
}

export interface SmsSendResult {
  success: boolean
  messageId?: string
  error?: string
  status?: string
}

// ============================================================================
// TWILIO CLIENT
// ============================================================================

async function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured')
  }

  const twilio = await import('twilio')
  return twilio.default(accountSid, authToken)
}

// ============================================================================
// SMS SENDING
// ============================================================================

/**
 * Send SMS via Twilio
 */
export async function sendSms(
  request: SmsSendRequest,
  accountId?: string,
  workspaceId?: string
): Promise<SmsSendResult> {
  try {
    // Get sending phone number
    let fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (accountId && workspaceId) {
      const supabase = await createClient()
      const { data: account } = await supabase
        .from('sms_accounts')
        .select('phone_number, sends_today, daily_send_limit')
        .eq('id', accountId)
        .eq('workspace_id', workspaceId)
        .single()

      if (account) {
        // Check daily limit
        if (account.sends_today >= account.daily_send_limit) {
          return {
            success: false,
            error: 'Daily SMS send limit reached',
          }
        }
        fromNumber = account.phone_number
      }
    }

    if (!fromNumber) {
      return {
        success: false,
        error: 'No sending phone number configured',
      }
    }

    const client = await getTwilioClient()

    const messageOptions: any = {
      to: normalizePhoneNumber(request.to),
      from: fromNumber,
      body: request.body,
    }

    if (request.mediaUrl) {
      messageOptions.mediaUrl = [request.mediaUrl]
    }

    const message = await client.messages.create(messageOptions)

    // Increment send count if using account
    if (accountId) {
      const supabase = await createClient()
      await supabase.rpc('increment_sms_sends', { account_id: accountId })
    }

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    }
  }
}

/**
 * Log sent SMS
 */
export async function logSentSms(
  workspaceId: string,
  leadId: string | null,
  accountId: string | null,
  request: SmsSendRequest,
  result: SmsSendResult,
  fromPhone: string
): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sent_sms')
    .insert({
      workspace_id: workspaceId,
      lead_id: leadId,
      sms_account_id: accountId,
      to_phone: request.to,
      from_phone: fromPhone,
      body: request.body,
      status: result.success ? 'sent' : 'failed',
      external_id: result.messageId,
      sent_at: result.success ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to log SMS:', error)
    return null
  }

  // Log activity
  if (leadId) {
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      workspace_id: workspaceId,
      activity_type: 'sms_sent',
      description: `SMS sent: ${request.body.slice(0, 50)}...`,
      metadata: {
        sms_id: data.id,
        to: request.to,
      },
    })
  }

  return data.id
}

/**
 * Send bulk SMS
 */
export async function sendBulkSms(
  requests: Array<SmsSendRequest & { leadId?: string }>,
  workspaceId: string,
  accountId?: string,
  options: {
    delayBetweenMs?: number
  } = {}
): Promise<{
  sent: number
  failed: number
  results: Array<{ index: number; result: SmsSendResult }>
}> {
  const { delayBetweenMs = 500 } = options

  const results: Array<{ index: number; result: SmsSendResult }> = []
  let sent = 0
  let failed = 0

  const fromPhone = process.env.TWILIO_PHONE_NUMBER || ''

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i]
    const result = await sendSms(request, accountId, workspaceId)

    await logSentSms(
      workspaceId,
      request.leadId || null,
      accountId || null,
      request,
      result,
      fromPhone
    )

    results.push({ index: i, result })

    if (result.success) {
      sent++
    } else {
      failed++
    }

    // Rate limiting
    if (i < requests.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs))
    }
  }

  return { sent, failed, results }
}

/**
 * Handle incoming SMS (for two-way conversations)
 */
export async function handleIncomingSms(
  from: string,
  to: string,
  body: string,
  messageId: string
): Promise<void> {
  const supabase = await createClient()

  // Find the lead by phone number
  const { data: lead } = await supabase
    .from('leads')
    .select('id, workspace_id, contact_data')
    .filter('contact_data->contacts', 'cs', JSON.stringify([{ phone: from }]))
    .single()

  if (!lead) {
    console.log(`Incoming SMS from unknown number: ${from}`)
    return
  }

  // Log the incoming message
  await supabase.from('lead_activities').insert({
    lead_id: lead.id,
    workspace_id: lead.workspace_id,
    activity_type: 'sms_received',
    description: `SMS received: ${body.slice(0, 100)}...`,
    metadata: {
      from,
      to,
      body,
      message_id: messageId,
    },
  })

  // Check for opt-out keywords
  const optOutKeywords = ['stop', 'unsubscribe', 'quit', 'cancel']
  if (optOutKeywords.some((kw) => body.toLowerCase().includes(kw))) {
    // Mark lead as opted out
    await supabase
      .from('leads')
      .update({
        contact_data: {
          ...(lead.contact_data as any),
          sms_opted_out: true,
          sms_opted_out_at: new Date().toISOString(),
        },
      })
      .eq('id', lead.id)

    // Send confirmation
    await sendSms(
      { to: from, body: 'You have been unsubscribed from SMS messages.' },
      undefined,
      lead.workspace_id
    )
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, '')

  // If it's a US number without country code, add +1
  if (digits.length === 10) {
    return `+1${digits}`
  }

  // If it already has country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }

  // Assume it's already formatted correctly if it has +
  if (phone.startsWith('+')) {
    return phone
  }

  // Default: add + prefix
  return `+${digits}`
}

/**
 * Validate phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone)
  // Basic E.164 validation
  return /^\+[1-9]\d{10,14}$/.test(normalized)
}
