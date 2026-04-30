// Shared Shopify webhook handler scaffold.
//
// Shopify webhooks all carry:
//   X-Shopify-Hmac-Sha256        — HMAC of raw body with API secret
//   X-Shopify-Topic              — e.g. 'customers/redact'
//   X-Shopify-Shop-Domain        — *.myshopify.com
//   X-Shopify-Webhook-Id         — used for idempotency
//
// This helper:
//   1. Reads raw body
//   2. Verifies HMAC
//   3. Persists event in marketplace_webhook_events (idempotent)
//   4. Hands off to a topic-specific handler
//
// Always returns 200 within the 5s SLA. Heavy work fires Inngest events.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyShopifyWebhookSignature } from '@/lib/marketplace/signature-verify'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

export interface ShopifyWebhookContext {
  topic: string
  shopDomain: string
  webhookId: string
  payload: unknown
  rawBody: string
}

export type ShopifyWebhookHandler = (
  ctx: ShopifyWebhookContext,
) => Promise<{ status: 'processed' | 'failed' | 'skipped'; error?: string }>

/**
 * Wrap a topic-specific handler with HMAC verification, event logging,
 * and idempotency. Use as the route's POST export.
 */
export function makeShopifyWebhookRoute(handler: ShopifyWebhookHandler) {
  return async function POST(req: NextRequest): Promise<NextResponse> {
    const rawBody = await req.text()
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256')
    const topic = req.headers.get('x-shopify-topic') ?? 'unknown'
    const shopDomain = req.headers.get('x-shopify-shop-domain') ?? ''
    const webhookId = req.headers.get('x-shopify-webhook-id') ?? ''

    const apiSecret = process.env.SHOPIFY_API_SECRET
    let verified = false
    if (apiSecret) {
      verified = verifyShopifyWebhookSignature(rawBody, hmacHeader, apiSecret)
    } else {
      safeError('[shopify-webhook] SHOPIFY_API_SECRET not configured')
    }

    let payload: unknown = null
    try {
      payload = JSON.parse(rawBody)
    } catch {
      // keep null — payload was unparseable
    }

    const admin = createAdminClient()

    // Idempotency — dedupe on (source, external_event_id)
    const { data: install } = await admin
      .from('app_installs')
      .select('id')
      .eq('source', 'shopify')
      .eq('external_id', shopDomain)
      .maybeSingle()

    const { error: insertErr } = await admin.from('marketplace_webhook_events').insert({
      source: 'shopify',
      topic,
      external_event_id: webhookId || null,
      install_id: install?.id ?? null,
      payload: payload ?? { _raw: rawBody },
      signature_verified: verified,
      status: verified ? 'received' : 'skipped',
    })

    // Duplicate (already-seen webhook_id) → ignore safely
    if (insertErr && insertErr.message.includes('uq_marketplace_webhook_dedup')) {
      safeLog('[shopify-webhook] duplicate webhook_id', { topic, webhookId })
      return NextResponse.json({ received: true, dedup: true })
    }

    if (!verified) {
      void sendSlackAlert({
        type: 'system_event',
        severity: 'warning',
        message: `Shopify webhook signature failed — topic=${topic} shop=${shopDomain}`,
      })
      return NextResponse.json({ received: true })
    }

    // Run the topic-specific handler. Failures still 200 to Shopify (logged).
    try {
      const result = await handler({
        topic,
        shopDomain,
        webhookId,
        payload,
        rawBody,
      })

      if (webhookId) {
        await admin
          .from('marketplace_webhook_events')
          .update({
            status: result.status,
            processed_at: new Date().toISOString(),
            error_message: result.error,
          })
          .eq('source', 'shopify')
          .eq('external_event_id', webhookId)
      }
    } catch (err) {
      safeError('[shopify-webhook] handler threw', err)
      if (webhookId) {
        await admin
          .from('marketplace_webhook_events')
          .update({
            status: 'failed',
            processed_at: new Date().toISOString(),
            error_message: err instanceof Error ? err.message : String(err),
          })
          .eq('source', 'shopify')
          .eq('external_event_id', webhookId)
      }
    }

    return NextResponse.json({ received: true })
  }
}
