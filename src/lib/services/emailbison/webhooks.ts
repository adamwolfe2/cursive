// EmailBison Webhook Types and Handlers
// Handles incoming webhook events from EmailBison

// Edge-compatible crypto helper (no Node.js 'crypto' import)
async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ============================================================================
// WEBHOOK EVENT TYPES
// ============================================================================

export type EmailBisonEventType =
  | 'EMAIL_SENT'
  | 'EMAIL_OPENED'
  | 'EMAIL_CLICKED'
  | 'REPLY_RECEIVED'
  | 'LEAD_INTERESTED'
  | 'LEAD_UNSUBSCRIBED'
  | 'TAG_ATTACHED'
  | 'TAG_REMOVED'
  | 'BOUNCE_RECEIVED'

export interface EmailBisonWebhookEvent {
  event: {
    type: EmailBisonEventType
    name: string
    instance_url: string
    workspace_id: number
    workspace_name: string
  }
  data: Record<string, unknown>
}

export interface EmailSentEvent extends EmailBisonWebhookEvent {
  event: EmailBisonWebhookEvent['event'] & { type: 'EMAIL_SENT' }
  data: {
    message_id: number
    lead_id: number
    campaign_id: number
    to_email: string
    subject: string
    sent_at: string
  }
}

export interface ReplyReceivedEvent extends EmailBisonWebhookEvent {
  event: EmailBisonWebhookEvent['event'] & { type: 'REPLY_RECEIVED' }
  data: {
    reply_id: number
    lead_id: number
    campaign_id: number
    from_email: string
    from_name?: string
    subject: string
    body: string
    body_plain?: string
    received_at: string
    in_reply_to_message_id?: number
  }
}

export interface LeadInterestedEvent extends EmailBisonWebhookEvent {
  event: EmailBisonWebhookEvent['event'] & { type: 'LEAD_INTERESTED' }
  data: {
    lead_id: number
    campaign_id: number
    email: string
    marked_at: string
    marked_by: 'system' | 'user'
  }
}

export interface LeadUnsubscribedEvent extends EmailBisonWebhookEvent {
  event: EmailBisonWebhookEvent['event'] & { type: 'LEAD_UNSUBSCRIBED' }
  data: {
    lead_id: number
    email: string
    unsubscribed_at: string
  }
}

export interface BounceReceivedEvent extends EmailBisonWebhookEvent {
  event: EmailBisonWebhookEvent['event'] & { type: 'BOUNCE_RECEIVED' }
  data: {
    lead_id: number
    campaign_id: number
    email: string
    bounce_type: 'hard' | 'soft'
    bounce_reason: string
    bounced_at: string
  }
}

export interface EmailOpenedEvent extends EmailBisonWebhookEvent {
  event: EmailBisonWebhookEvent['event'] & { type: 'EMAIL_OPENED' }
  data: {
    message_id: number
    lead_id: number
    campaign_id: number
    to_email: string
    opened_at: string
    ip_address?: string
    user_agent?: string
  }
}

export interface EmailClickedEvent extends EmailBisonWebhookEvent {
  event: EmailBisonWebhookEvent['event'] & { type: 'EMAIL_CLICKED' }
  data: {
    message_id: number
    lead_id: number
    campaign_id: number
    to_email: string
    clicked_at: string
    url: string
    ip_address?: string
    user_agent?: string
  }
}

// ============================================================================
// WEBHOOK VERIFICATION
// ============================================================================

export interface WebhookVerificationResult {
  isValid: boolean
  error?: string
}

/**
 * Verify EmailBison webhook signature
 * EmailBison uses HMAC-SHA256 for webhook signature verification
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<WebhookVerificationResult> {
  if (!signature) {
    return { isValid: false, error: 'Missing signature header' }
  }

  if (!secret) {
    return { isValid: false, error: 'Missing webhook secret' }
  }

  try {
    const expectedSignature = await hmacSha256Hex(secret, payload)

    // Signature may be prefixed with 'sha256=' or similar
    const providedSignature = signature.replace(/^sha256=/, '')

    // Constant-time comparison
    if (expectedSignature.length !== providedSignature.length) {
      return { isValid: false, error: 'Signature mismatch' }
    }
    let result = 0
    for (let i = 0; i < expectedSignature.length; i++) {
      result |= expectedSignature.charCodeAt(i) ^ providedSignature.charCodeAt(i)
    }
    const isValid = result === 0

    return { isValid, error: isValid ? undefined : 'Signature mismatch' }
  } catch (error) {
    return {
      isValid: false,
      error: `Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// ============================================================================
// WEBHOOK PARSING
// ============================================================================

export function parseWebhookEvent(payload: unknown): EmailBisonWebhookEvent {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid webhook payload: expected an object')
  }

  const event = payload as EmailBisonWebhookEvent

  if (!event.event?.type) {
    throw new Error('Invalid webhook payload: missing event.type')
  }

  return event
}

export function isReplyReceivedEvent(event: EmailBisonWebhookEvent): event is ReplyReceivedEvent {
  return event.event.type === 'REPLY_RECEIVED'
}

export function isEmailSentEvent(event: EmailBisonWebhookEvent): event is EmailSentEvent {
  return event.event.type === 'EMAIL_SENT'
}

export function isLeadInterestedEvent(event: EmailBisonWebhookEvent): event is LeadInterestedEvent {
  return event.event.type === 'LEAD_INTERESTED'
}

export function isLeadUnsubscribedEvent(event: EmailBisonWebhookEvent): event is LeadUnsubscribedEvent {
  return event.event.type === 'LEAD_UNSUBSCRIBED'
}

export function isBounceReceivedEvent(event: EmailBisonWebhookEvent): event is BounceReceivedEvent {
  return event.event.type === 'BOUNCE_RECEIVED'
}

export function isEmailOpenedEvent(event: EmailBisonWebhookEvent): event is EmailOpenedEvent {
  return event.event.type === 'EMAIL_OPENED'
}

export function isEmailClickedEvent(event: EmailBisonWebhookEvent): event is EmailClickedEvent {
  return event.event.type === 'EMAIL_CLICKED'
}
