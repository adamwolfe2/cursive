/**
 * Shopify GDPR Compliance Webhooks
 * Cursive Platform
 *
 * Shopify REQUIRES these three compliance endpoints to pass app review.
 * They must return 200 within 5 seconds.
 *
 * Topics:
 *   customers/data_request — merchant asks for all data we hold on a customer
 *   customers/redact       — we must delete all PII for a customer
 *   shop/redact            — merchant uninstalled; delete all their data
 *
 * We verify the HMAC signature, log the request, and return 200.
 * Real deletion/export jobs should be queued here when applicable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[Shopify GDPR]'

async function verifyShopifySignature(
  request: NextRequest,
  rawBody: string
): Promise<boolean> {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret) return false

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

  if (computed.length !== shopifyHmac.length) return false
  let result = 0
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ shopifyHmac.charCodeAt(i)
  }
  return result === 0
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    const ok = await verifyShopifySignature(request, rawBody)
    if (!ok) {
      safeError(`${LOG_PREFIX} Signature verification failed`)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const topic = request.headers.get('x-shopify-topic') || 'unknown'
    const shopDomain = request.headers.get('x-shopify-shop-domain') || ''

    let payload: Record<string, unknown> = {}
    try {
      payload = JSON.parse(rawBody)
    } catch { /* best effort */ }

    safeLog(`${LOG_PREFIX} Compliance request received: topic=${topic} shop=${shopDomain}`)

    // Persist for auditing + future automated handling
    const supabase = createAdminClient()
    await supabase.from('audit_logs').insert({
      workspace_id: null,  // may not resolve — shop might be deleted
      action: 'gdpr_compliance_request',
      resource_type: 'integration',
      metadata: { provider: 'shopify', topic, shop_domain: shopDomain, payload },
      severity: 'warn',
    })

    // TODO: For customers/redact and shop/redact, queue an Inngest job that
    // deletes leads sourced from this shop or belonging to this customer.
    // For customers/data_request, queue a job that emails the merchant
    // a report of all data we hold.

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: unknown) {
    safeError(`${LOG_PREFIX} Compliance handler error:`, error)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
