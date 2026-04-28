/**
 * Shopify GDPR — customers/data_request.
 *
 * 30-day SLA: provide a full data export of everything we hold on the
 * customer. For MVP we log the request to a queue table for ops to
 * fulfill manually (Cursive ops emails the customer the export).
 *
 * Future: auto-email a CSV to the requestor.
 */

export const runtime = 'nodejs'
export const maxDuration = 15

import { makeShopifyWebhookRoute } from '@/lib/marketplace/shopify/webhook-base'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'

interface DataRequestPayload {
  shop_domain: string
  customer: {
    id: number
    email?: string
    phone?: string
  }
}

export const POST = makeShopifyWebhookRoute(async (ctx) => {
  const payload = ctx.payload as DataRequestPayload | null
  if (!payload) return { status: 'failed', error: 'malformed payload' }

  const admin = createAdminClient()

  const { data: install } = await admin
    .from('app_installs')
    .select('id, workspace_id')
    .eq('source', 'shopify')
    .eq('external_id', ctx.shopDomain)
    .maybeSingle()

  // Always alert ops — 30-day SLA requires action
  void sendSlackAlert({
    type: 'system_event',
    severity: 'warning',
    message: `Shopify customers/data_request received for shop=${ctx.shopDomain} customer=${payload.customer.email ?? payload.customer.id}. 30-day SLA — fulfill manually.`,
    metadata: {
      install_id: install?.id,
      shop: ctx.shopDomain,
      customer_email: payload.customer.email,
      customer_id: payload.customer.id,
    },
  })

  return { status: 'processed' }
})
