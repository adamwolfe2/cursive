/**
 * Outbound Webhook Delivery Service
 * Cursive Platform
 *
 * Handles fan-out delivery of platform events to all matching workspace_webhooks
 * endpoints. Each webhook is signed with HMAC-SHA256 and the result is recorded
 * in outbound_webhook_deliveries.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { hmacSha256Hex } from '@/lib/utils/crypto'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const DELIVERY_TIMEOUT_MS = 10_000

export interface OutboundDeliveryResult {
  webhookId: string
  deliveryId: string
  success: boolean
  statusCode?: number
  error?: string
}

/**
 * Generate Stripe-style signed header for an outbound payload.
 * Format: t=<unix>,v1=<hmac-sha256-hex>
 */
async function signPayload(secret: string, payloadString: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await hmacSha256Hex(secret, `${timestamp}.${payloadString}`)
  return `t=${timestamp},v1=${signature}`
}

/**
 * Attempt a single HTTP delivery and return the raw result.
 * Does NOT write to the database — that is the caller's responsibility.
 */
async function attemptDelivery(
  url: string,
  secret: string,
  eventType: string,
  payloadString: string
): Promise<{ success: boolean; statusCode?: number; responseBody?: string; error?: string }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)

  try {
    const signatureHeader = await signPayload(secret, payloadString)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cursive-Event': eventType,
        'X-Cursive-Signature': signatureHeader,
        'X-Cursive-Timestamp': String(Math.floor(Date.now() / 1000)),
        'User-Agent': 'Cursive-Webhook/1.0',
      },
      body: payloadString,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const responseBody = await response.text().catch(() => '')

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody: responseBody.substring(0, 1000),
      ...(!response.ok && { error: `HTTP ${response.status}: ${response.statusText}` }),
    }
  } catch (err: any) {
    clearTimeout(timeoutId)
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Request timed out after 10s' : (err.message ?? 'Unknown error'),
    }
  }
}

/**
 * Deliver a single webhook (identified by webhookId) for the given event.
 * Loads the webhook config from DB, signs the payload, POSTs it, and
 * records the delivery attempt.
 */
export async function deliverWebhook(
  webhookId: string,
  eventType: string,
  payload: unknown
): Promise<OutboundDeliveryResult> {
  const supabase = createAdminClient()

  // Load webhook config
  const { data: webhook, error: loadError } = await supabase
    .from('workspace_webhooks')
    .select('id, workspace_id, url, secret, events, is_active')
    .eq('id', webhookId)
    .maybeSingle()

  if (loadError || !webhook) {
    safeError('[WebhookDelivery] Failed to load webhook:', loadError)
    throw new Error(`Webhook ${webhookId} not found`)
  }

  if (!webhook.is_active) {
    safeLog('[WebhookDelivery] Skipping inactive webhook:', webhookId)
    // Still create a skipped record so the caller knows
    const { data: delivery } = await supabase
      .from('outbound_webhook_deliveries')
      .insert({
        webhook_id: webhookId,
        workspace_id: webhook.workspace_id,
        event_type: eventType,
        payload: payload as any,
        status: 'failed',
        error_message: 'Webhook is inactive',
        attempts: 0,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle()

    return {
      webhookId,
      deliveryId: delivery?.id ?? '',
      success: false,
      error: 'Webhook is inactive',
    }
  }

  // Create pending delivery record
  const { data: delivery, error: insertError } = await supabase
    .from('outbound_webhook_deliveries')
    .insert({
      webhook_id: webhookId,
      workspace_id: webhook.workspace_id,
      event_type: eventType,
      payload: payload as any,
      status: 'pending',
      attempts: 0,
    })
    .select('id')
    .maybeSingle()

  if (insertError || !delivery) {
    safeError('[WebhookDelivery] Failed to create delivery record:', insertError)
    throw new Error('Failed to create delivery record')
  }

  const payloadString = JSON.stringify(payload)
  const startMs = Date.now()

  // Attempt delivery (up to 3 times with exponential backoff)
  let lastResult: Awaited<ReturnType<typeof attemptDelivery>> = { success: false }
  const maxAttempts = 3
  const backoffMs = [0, 2_000, 6_000] // 0s, 2s, 6s

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (backoffMs[attempt] > 0) {
      await new Promise((r) => setTimeout(r, backoffMs[attempt]))
    }

    lastResult = await attemptDelivery(webhook.url, webhook.secret, eventType, payloadString)

    if (lastResult.success) break
  }

  const durationMs = Date.now() - startMs

  // Update delivery record
  await supabase
    .from('outbound_webhook_deliveries')
    .update({
      status: lastResult.success ? 'success' : 'failed',
      attempts: maxAttempts,
      response_status: lastResult.statusCode ?? null,
      response_body: lastResult.responseBody ?? null,
      error_message: lastResult.error ?? null,
      last_attempt_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq('id', delivery.id)

  safeLog(
    `[WebhookDelivery] ${lastResult.success ? 'OK' : 'FAIL'} webhookId=${webhookId} event=${eventType} status=${lastResult.statusCode ?? 'n/a'} ms=${durationMs}`
  )

  return {
    webhookId,
    deliveryId: delivery.id,
    success: lastResult.success,
    statusCode: lastResult.statusCode,
    error: lastResult.error,
  }
}

/**
 * Fan-out: find all active workspace_webhooks for the given workspace that
 * subscribe to this event, and return the list of matching webhookIds.
 * The actual delivery is done by the Inngest function per webhook.
 */
export async function getMatchingWebhookIds(
  workspaceId: string,
  eventType: string
): Promise<string[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('workspace_webhooks')
    .select('id, events')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)

  if (error) {
    safeError('[WebhookDelivery] Failed to fetch webhooks for fan-out:', error)
    return []
  }

  return (data ?? [])
    .filter((w) => (w.events as string[]).includes(eventType))
    .map((w) => w.id)
}
