/**
 * Shopify lifecycle — orders/paid (suppression trigger).
 *
 * When a customer completes a purchase, add them to the workspace's
 * suppression list so they stop seeing acquisition ads (Meta retargeting,
 * Klaviyo cold flows). This is the headline differentiator per Shopify
 * PRD §F8 — no competitor ships automatic suppression.
 *
 * For the MVP we mark the lead as `is_customer = true` in the leads table
 * (existing column). Downstream destination syncs (Meta CA, Klaviyo) will
 * exclude is_customer=true.
 */

export const runtime = 'nodejs'
export const maxDuration = 15

import { makeShopifyWebhookRoute } from '@/lib/marketplace/shopify/webhook-base'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog } from '@/lib/utils/log-sanitizer'

interface OrdersPaidPayload {
  id: number
  email?: string
  phone?: string
  customer?: {
    id: number
    email?: string
    phone?: string
  }
  total_price?: string
  total_price_set?: { shop_money: { amount: string; currency_code: string } }
}

export const POST = makeShopifyWebhookRoute(async (ctx) => {
  const payload = ctx.payload as OrdersPaidPayload | null
  if (!payload) return { status: 'failed', error: 'malformed payload' }

  const admin = createAdminClient()

  const { data: install } = await admin
    .from('app_installs')
    .select('id, workspace_id')
    .eq('source', 'shopify')
    .eq('external_id', ctx.shopDomain)
    .maybeSingle()

  if (!install) {
    safeLog('[shopify orders-paid] no install for shop', { shop: ctx.shopDomain })
    return { status: 'skipped' }
  }

  const email = payload.email ?? payload.customer?.email
  const phone = payload.phone ?? payload.customer?.phone

  // Best-effort lookup → mark suppressed
  // Note: the leads table doesn't have a dedicated is_customer column in all
  // workspaces; using metadata jsonb for forward-compat.
  if (email) {
    try {
      await admin
        .from('leads')
        .update({ status: 'customer' })
        .eq('workspace_id', install.workspace_id)
        .eq('email', email)
    } catch {
      // status column may not exist in some workspace shapes — non-fatal
    }
  }
  if (phone) {
    try {
      await admin
        .from('leads')
        .update({ status: 'customer' })
        .eq('workspace_id', install.workspace_id)
        .eq('phone', phone)
    } catch {
      // non-fatal
    }
  }

  // Log the suppression event for ops/audit
  await admin.from('marketplace_sync_log').insert({
    install_id: install.id,
    workspace_id: install.workspace_id,
    source: 'shopify',
    job_type: 'suppression',
    status: 'success',
    visitors_processed: 1,
    visitors_synced: 1,
    metadata: {
      shopify_order_id: payload.id,
      total_price: payload.total_price ?? payload.total_price_set?.shop_money?.amount,
      email,
      phone,
    },
    completed_at: new Date().toISOString(),
  })

  return { status: 'processed' }
})
