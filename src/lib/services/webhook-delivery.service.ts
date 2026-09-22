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
import { isBlockedHost } from '@/lib/utils/ssrf-guard'

const DELIVERY_TIMEOUT_MS = 10_000
// Callers on the identification hot path get a much shorter ceiling: a customer
// endpoint that needs more than this is treated as failed and swept later,
// rather than holding pixel ingestion open.
const INLINE_TIMEOUT_MS = 3_000

/**
 * The canonical body Cursive POSTs to every customer endpoint. Every delivery
 * path — live events and the "Send test" button — must emit this exact shape,
 * because customers write one verifier against it.
 */
export interface WebhookEnvelope {
  event: string
  workspace_id: string
  timestamp: string
  data: unknown
  /** Present and true only for a "Send test" delivery. */
  test?: boolean
}

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
  payloadString: string,
  timeoutMs: number = DELIVERY_TIMEOUT_MS
): Promise<{ success: boolean; statusCode?: number; responseBody?: string; error?: string }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

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
      // Never follow a redirect: the URL passed the guard, the hop target did not.
      redirect: 'manual',
    })

    clearTimeout(timeoutId)
    const responseBody = await response.text().catch(() => '')

    if (response.status >= 300 && response.status < 400) {
      return {
        success: false,
        statusCode: response.status,
        error: `Endpoint redirected (HTTP ${response.status}); webhook URLs must be final destinations`,
      }
    }

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody: responseBody.substring(0, 1000),
      ...(!response.ok && { error: `HTTP ${response.status}: ${response.statusText}` }),
    }
  } catch (err: unknown) {
    clearTimeout(timeoutId)
    return {
      success: false,
      error:
        err instanceof Error && err.name === 'AbortError'
          ? `Request timed out after ${Math.round(timeoutMs / 1000)}s`
          : err instanceof Error
            ? err.message
            : 'Unknown error',
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
  data: unknown,
  options: { maxAttempts?: number; test?: boolean; timeoutMs?: number } = {}
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

  // Canonical envelope — built once, signed once, stored once.
  const envelope: WebhookEnvelope = {
    event: eventType,
    workspace_id: webhook.workspace_id,
    timestamp: new Date().toISOString(),
    data,
    ...(options.test ? { test: true } : {}),
  }

  /** Record a delivery that was rejected before any HTTP attempt was made. */
  const recordRejected = async (reason: string): Promise<OutboundDeliveryResult> => {
    const { data: delivery } = await supabase
      .from('outbound_webhook_deliveries')
      .insert({
        webhook_id: webhookId,
        workspace_id: webhook.workspace_id,
        event_type: eventType,
        payload: envelope as any,
        status: 'failed',
        error_message: reason,
        attempts: 0,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle()

    return { webhookId, deliveryId: delivery?.id ?? '', success: false, error: reason }
  }

  if (!webhook.is_active) {
    safeLog('[WebhookDelivery] Skipping inactive webhook:', webhookId)
    return recordRejected('Webhook is inactive')
  }

  // SSRF guard on every delivery, not only at creation time: a row can predate
  // the guard, or a hostname can be re-pointed at an internal address later.
  if (isBlockedHost(webhook.url)) {
    safeError('[WebhookDelivery] Blocked internal destination for webhook:', webhookId)
    return recordRejected('Webhook URL targets a blocked internal address')
  }

  // Create pending delivery record
  const { data: delivery, error: insertError } = await supabase
    .from('outbound_webhook_deliveries')
    .insert({
      webhook_id: webhookId,
      workspace_id: webhook.workspace_id,
      event_type: eventType,
      payload: envelope as any,
      status: 'pending',
      attempts: 0,
    })
    .select('id')
    .maybeSingle()

  if (insertError || !delivery) {
    safeError('[WebhookDelivery] Failed to create delivery record:', insertError)
    throw new Error('Failed to create delivery record')
  }

  const payloadString = JSON.stringify(envelope)
  const startMs = Date.now()

  // Attempt delivery (up to 3 times with exponential backoff). A test send uses
  // a single attempt so the user is not left waiting on retries.
  let lastResult: Awaited<ReturnType<typeof attemptDelivery>> = { success: false }
  const maxAttempts = Math.max(1, Math.min(options.maxAttempts ?? 3, 3))
  const backoffMs = [0, 2_000, 6_000] // 0s, 2s, 6s

  let attemptsMade = 0
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (backoffMs[attempt] > 0) {
      await new Promise((r) => setTimeout(r, backoffMs[attempt]))
    }

    attemptsMade++
    lastResult = await attemptDelivery(
      webhook.url, webhook.secret, eventType, payloadString, options.timeoutMs
    )

    if (lastResult.success) break
  }

  const durationMs = Date.now() - startMs

  // Update delivery record
  await supabase
    .from('outbound_webhook_deliveries')
    .update({
      status: lastResult.success ? 'success' : 'failed',
      attempts: attemptsMade,
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
    // Returning [] here would make a database blip indistinguishable from
    // "this workspace has no webhooks" and drop the event with no record.
    safeError('[WebhookDelivery] Failed to fetch webhooks for fan-out:', error)
    throw new Error('Webhook subscriber lookup failed')
  }

  return (data ?? [])
    .filter((w) => (w.events as string[]).includes(eventType))
    .map((w) => w.id)
}

/**
 * Fan out one platform event to every endpoint in the workspace that subscribes
 * to it, and await the result.
 *
 * This is the delivery path in production. The Inngest function that used to own
 * the fan-out is not registered in the production Inngest environment — events
 * fired at it are accepted and produce zero runs — so anything that relied on it
 * delivered nothing at all. Calling the service directly removes that dependency.
 *
 * ponytail: one attempt per endpoint, because callers sit on the identification
 * hot path and a retrying loop would hold the request open for ~28s. Failures are
 * recorded as `failed` deliveries and retried out-of-band by
 * /api/cron/retry-webhook-deliveries.
 */
export async function emitWebhookEvent(
  workspaceId: string,
  eventType: string,
  data: unknown
): Promise<{ delivered: number; failed: number; lookupFailed?: true }> {
  let webhookIds: string[]

  try {
    webhookIds = await getMatchingWebhookIds(workspaceId, eventType)
  } catch {
    // One retry, because the common case is a transient connection blip. If it
    // still fails we cannot write a delivery row (there is no webhook id to
    // attach it to), so make the drop loud rather than silent — this is the
    // one path the retry sweep cannot recover.
    // ponytail: a durable outbox would close it; that is a bigger change than
    // this surface warrants until it is observed happening.
    try {
      await new Promise((r) => setTimeout(r, 250))
      webhookIds = await getMatchingWebhookIds(workspaceId, eventType)
    } catch (retryErr) {
      safeError(
        `[WebhookDelivery] DROPPED event=${eventType} workspace=${workspaceId} — subscriber lookup failed twice:`,
        retryErr
      )
      return { delivered: 0, failed: 0, lookupFailed: true }
    }
  }

  if (webhookIds.length === 0) return { delivered: 0, failed: 0 }

  const results = await Promise.allSettled(
    webhookIds.map((id) =>
      deliverWebhook(id, eventType, data, { maxAttempts: 1, timeoutMs: INLINE_TIMEOUT_MS })
    )
  )

  const delivered = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
  return { delivered, failed: results.length - delivered }
}

/**
 * Re-attempt one delivery that previously failed, updating that same row.
 *
 * Retrying in place is what makes the attempt cap mean anything: inserting a
 * fresh row per sweep would reset the count every time and multiply failed rows
 * for an endpoint that is simply gone. The envelope is rebuilt so the signature
 * carries a current timestamp, and a test send stays flagged as a test.
 */
export async function retryDelivery(
  deliveryId: string,
  // Full ceiling here, not the inline one: this runs in a cron, and the docs
  // promise customers 10 seconds to respond.
  timeoutMs: number = DELIVERY_TIMEOUT_MS
): Promise<{ success: boolean; statusCode?: number }> {
  const supabase = createAdminClient()

  const { data: row, error } = await supabase
    .from('outbound_webhook_deliveries')
    .select('id, webhook_id, event_type, payload, attempts')
    .eq('id', deliveryId)
    .maybeSingle()

  if (error || !row) throw new Error(`Delivery ${deliveryId} not found`)

  const { data: webhook, error: webhookError } = await supabase
    .from('workspace_webhooks')
    .select('url, secret, is_active')
    .eq('id', row.webhook_id)
    .maybeSingle()

  // A failed lookup is not evidence the endpoint is gone. Throw so the sweep
  // counts it as still-failing and tries again without spending an attempt.
  if (webhookError) throw new Error(`Webhook lookup failed for delivery ${deliveryId}`)

  const attempts = (row.attempts ?? 0) + 1

  const fail = async (reason: string) => {
    await supabase
      .from('outbound_webhook_deliveries')
      .update({
        attempts,
        status: 'failed',
        error_message: reason,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', row.id)
    return { success: false }
  }

  if (!webhook || !webhook.is_active) return fail('Webhook is inactive or deleted')
  if (isBlockedHost(webhook.url)) return fail('Webhook URL targets a blocked internal address')

  const stored = (row.payload ?? {}) as { data?: unknown; test?: boolean }
  const envelope: WebhookEnvelope = {
    event: row.event_type,
    workspace_id: (row.payload as { workspace_id?: string })?.workspace_id ?? '',
    timestamp: new Date().toISOString(),
    data: 'data' in stored ? stored.data : row.payload,
    ...(stored.test ? { test: true as const } : {}),
  }

  const result = await attemptDelivery(
    webhook.url,
    webhook.secret,
    row.event_type,
    JSON.stringify(envelope),
    timeoutMs
  )

  const { error: persistError } = await supabase
    .from('outbound_webhook_deliveries')
    .update({
      attempts,
      status: result.success ? 'success' : 'failed',
      response_status: result.statusCode ?? null,
      response_body: result.responseBody ?? null,
      error_message: result.error ?? null,
      last_attempt_at: new Date().toISOString(),
      ...(result.success ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq('id', row.id)

  if (persistError && result.success) {
    // The customer already has this event. The row still reads `failed`, so the
    // next sweep would send it a second time — say so loudly rather than let a
    // duplicate lead appear silently.
    safeError(
      `[WebhookDelivery] DELIVERED BUT NOT RECORDED delivery=${row.id} — next sweep may duplicate it:`,
      persistError
    )
  }

  return { success: result.success, statusCode: result.statusCode }
}
