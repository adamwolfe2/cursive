/**
 * Webhook Delivery Service
 * Cursive Platform
 *
 * Handles webhook delivery to workspace endpoints with retry logic.
 */

import crypto from 'crypto'

export interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, any>
}

export interface WebhookDeliveryResult {
  success: boolean
  statusCode?: number
  responseBody?: string
  error?: string
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signaturePayload = `${timestamp}.${payload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex')

  return `t=${timestamp},v1=${signature}`
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance: number = 300 // 5 minutes
): boolean {
  const parts = signature.split(',')
  const timestamp = parts.find((p) => p.startsWith('t='))?.split('=')[1]
  const v1 = parts.find((p) => p.startsWith('v1='))?.split('=')[1]

  if (!timestamp || !v1) {
    return false
  }

  // Check timestamp is within tolerance
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp)) > tolerance) {
    return false
  }

  // Verify signature
  const signaturePayload = `${timestamp}.${payload}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(v1),
    Buffer.from(expectedSignature)
  )
}

/**
 * Deliver webhook to endpoint
 */
export async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string,
  timeoutMs: number = 10000
): Promise<WebhookDeliveryResult> {
  try {
    const payloadString = JSON.stringify(payload)
    const signature = generateWebhookSignature(payloadString, secret)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cursive-Signature': signature,
        'X-Cursive-Event': payload.event,
        'User-Agent': 'Cursive-Webhook/1.0',
      },
      body: payloadString,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const responseBody = await response.text().catch(() => '')

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        responseBody,
      }
    }

    return {
      success: false,
      statusCode: response.status,
      responseBody,
      error: `HTTP ${response.status}: ${response.statusText}`,
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout',
      }
    }

    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Format lead data for webhook payload
 */
export function formatLeadPayload(lead: any): WebhookPayload {
  return {
    event: 'lead.created',
    timestamp: new Date().toISOString(),
    data: {
      id: lead.id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      company_name: lead.company_name,
      company_industry: lead.company_industry,
      company_location: lead.company_location,
      intent_signal: lead.intent_signal,
      lead_score: lead.lead_score,
      source: lead.source,
      created_at: lead.created_at,
      // Enriched data if available
      enrichment_data: lead.enrichment_data,
    },
  }
}

/**
 * Calculate next retry time with exponential backoff
 */
export function calculateNextRetry(attempt: number): Date {
  // Exponential backoff: 1min, 5min, 15min, 30min, 1hr
  const delays = [60, 300, 900, 1800, 3600]
  const delaySeconds = delays[Math.min(attempt, delays.length - 1)]
  return new Date(Date.now() + delaySeconds * 1000)
}
