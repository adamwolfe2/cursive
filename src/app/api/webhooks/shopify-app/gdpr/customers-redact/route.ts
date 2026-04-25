/**
 * Shopify GDPR — customers/redact.
 *
 * 30-day SLA: erase all data we hold on the specified customer for that
 * shop. We delete leads/identities/lead-related data scoped to the
 * customer's email + phone within the install's workspace.
 */

export const runtime = 'nodejs'
export const maxDuration = 30

import { makeShopifyWebhookRoute } from '@/lib/marketplace/shopify/webhook-base'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog } from '@/lib/utils/log-sanitizer'

interface RedactPayload {
  shop_id: number
  shop_domain: string
  customer: {
    id: number
    email?: string
    phone?: string
  }
  orders_to_redact?: number[]
}

export const POST = makeShopifyWebhookRoute(async (ctx) => {
  const payload = ctx.payload as RedactPayload | null
  if (!payload) return { status: 'failed', error: 'malformed payload' }

  const admin = createAdminClient()

  // Locate the install
  const { data: install } = await admin
    .from('app_installs')
    .select('id, workspace_id')
    .eq('source', 'shopify')
    .eq('external_id', ctx.shopDomain)
    .maybeSingle()

  if (!install) {
    safeLog('[shopify customers-redact] no install for shop', { shop: ctx.shopDomain })
    return { status: 'skipped' }
  }

  const email = payload.customer.email
  const phone = payload.customer.phone

  // Delete leads matching the customer's identifiers within this workspace
  if (email) {
    await admin.from('leads').delete().eq('workspace_id', install.workspace_id).eq('email', email)
  }
  if (phone) {
    await admin.from('leads').delete().eq('workspace_id', install.workspace_id).eq('phone', phone)
  }

  // (Future: delete metafield_writes log entries for this customer once
  // that table exists. For MVP we rely on lead deletion above.)

  return { status: 'processed' }
})
