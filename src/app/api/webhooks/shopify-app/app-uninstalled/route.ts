/**
 * Shopify lifecycle — app/uninstalled.
 *
 * Fired immediately when a merchant uninstalls Cursive from their store.
 * Marks the install as 'uninstalled' and starts the 30-day GDPR retention
 * countdown (actual data deletion happens via the shop/redact webhook
 * Shopify fires 48h later).
 */

export const runtime = 'nodejs'
export const maxDuration = 15

import { makeShopifyWebhookRoute } from '@/lib/marketplace/shopify/webhook-base'
import { createAdminClient } from '@/lib/supabase/admin'

export const POST = makeShopifyWebhookRoute(async (ctx) => {
  const admin = createAdminClient()

  await admin
    .from('app_installs')
    .update({
      status: 'uninstalled',
      uninstalled_at: new Date().toISOString(),
      access_token: null,
      refresh_token: null,
    })
    .eq('source', 'shopify')
    .eq('external_id', ctx.shopDomain)

  return { status: 'processed' }
})
