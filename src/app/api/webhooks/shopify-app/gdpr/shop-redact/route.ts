/**
 * Shopify GDPR — shop/redact.
 *
 * Fired 48 hours after a merchant uninstalls. 30-day SLA: erase all data
 * for the shop. We mark the install as fully purged and delete leads
 * scoped to its workspace.
 *
 * IMPORTANT: only deletes data within the workspace this shop's install
 * owned. Other workspaces in cursive (e.g. Cursive's own DFY workspace)
 * are untouched.
 */

export const runtime = 'nodejs'
export const maxDuration = 60

import { makeShopifyWebhookRoute } from '@/lib/marketplace/shopify/webhook-base'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

interface ShopRedactPayload {
  shop_id: number
  shop_domain: string
}

export const POST = makeShopifyWebhookRoute(async (ctx) => {
  const payload = ctx.payload as ShopRedactPayload | null
  if (!payload) return { status: 'failed', error: 'malformed payload' }

  const admin = createAdminClient()

  const { data: install } = await admin
    .from('app_installs')
    .select('id, workspace_id')
    .eq('source', 'shopify')
    .eq('external_id', ctx.shopDomain)
    .maybeSingle()

  if (!install) {
    safeLog('[shopify shop-redact] no install for shop', { shop: ctx.shopDomain })
    return { status: 'skipped' }
  }

  try {
    // Best-effort: delete leads + identity events + sync logs for this workspace
    await admin.from('leads').delete().eq('workspace_id', install.workspace_id)
    await admin.from('audiencelab_events').delete().eq('workspace_id', install.workspace_id)
    try {
      await admin.from('audiencelab_identities').delete().eq('workspace_id', install.workspace_id)
    } catch {
      // table may not exist on this deployment — non-fatal
    }
    await admin.from('marketplace_sync_log').delete().eq('install_id', install.id)

    // Mark install fully purged
    await admin
      .from('app_installs')
      .update({
        status: 'uninstalled',
        access_token: null,
        refresh_token: null,
        metadata: { gdpr_redacted_at: new Date().toISOString() },
      })
      .eq('id', install.id)

    return { status: 'processed' }
  } catch (err) {
    safeError('[shopify shop-redact] cleanup failed', err)
    return { status: 'failed', error: err instanceof Error ? err.message : String(err) }
  }
})
