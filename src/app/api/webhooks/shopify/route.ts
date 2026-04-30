/**
 * Shopify Inbound Webhook Handler
 * Cursive Platform
 *
 * Receives data webhooks from Shopify (customers, orders, products) and fans
 * them out via Inngest for async processing.
 *
 * SIGNATURE VERIFICATION:
 *   Shopify signs every webhook with HMAC-SHA256 using SHOPIFY_API_SECRET.
 *   The signature is sent base64-encoded in the `X-Shopify-Hmac-Sha256` header
 *   and computed over the raw (unmodified) request body.
 *
 * TOPICS subscribed (from shopify.app.toml):
 *   customers/create, customers/update
 *   orders/create, orders/updated
 *   products/update
 *
 * Returns 200 immediately — Shopify retries on any non-2xx within 5 seconds.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[Shopify Webhook]'
const MAX_BODY_SIZE = 4 * 1024 * 1024 // 4MB — Shopify payloads can be large

/**
 * Verify Shopify webhook HMAC-SHA256 signature.
 * https://shopify.dev/docs/apps/webhooks/configuration/https#step-5-verify-the-webhook
 */
async function verifyShopifySignature(
  request: NextRequest,
  rawBody: string
): Promise<boolean> {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret) {
    safeError(`${LOG_PREFIX} SHOPIFY_WEBHOOK_SECRET not configured`)
    return false
  }

  const shopifyHmac = request.headers.get('x-shopify-hmac-sha256')
  if (!shopifyHmac) return false

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody))
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)))

  // Constant-time compare
  if (computed.length !== shopifyHmac.length) return false
  let result = 0
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ shopifyHmac.charCodeAt(i)
  }
  return result === 0
}

/**
 * Resolve the workspace from the shop domain via crm_connections.
 */
async function resolveWorkspaceId(shopDomain: string): Promise<string | null> {
  if (!shopDomain) return null
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('crm_connections')
    .select('workspace_id')
    .eq('provider', 'shopify')
    .eq('status', 'active')
    .filter('metadata->>shop_domain', 'eq', shopDomain)
    .maybeSingle()

  if (error) {
    safeError(`${LOG_PREFIX} Failed to resolve workspace:`, error.message)
    return null
  }
  return (data?.workspace_id as string) ?? null
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    if (rawBody.length > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    // Verify signature
    const ok = await verifyShopifySignature(request, rawBody)
    if (!ok) {
      safeError(`${LOG_PREFIX} Signature verification failed`)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const topic = request.headers.get('x-shopify-topic') || 'unknown'
    const shopDomain = request.headers.get('x-shopify-shop-domain') || ''

    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const workspaceId = await resolveWorkspaceId(shopDomain)
    if (!workspaceId) {
      safeLog(`${LOG_PREFIX} No active workspace for shop ${shopDomain} (topic=${topic})`)
      return NextResponse.json({ ok: true, status: 'no_workspace' }, { status: 200 })
    }

    // Persist raw event
    const supabase = createAdminClient()
    await supabase.from('audit_logs').insert({
      workspace_id: workspaceId,
      action: 'webhook_received',
      resource_type: 'integration',
      metadata: {
        provider: 'shopify',
        topic,
        shop_domain: shopDomain,
        payload,
      },
      severity: 'info',
    })

    // Fan out to Inngest
    await inngest.send({
      name: 'shopify/webhook.received',
      data: { workspaceId, topic, shopDomain, payload },
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: unknown) {
    safeError(`${LOG_PREFIX} Handler error:`, error)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
