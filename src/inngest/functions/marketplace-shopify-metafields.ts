/**
 * Marketplace — Shopify customer metafield writeback (6h cron).
 *
 * For each Shopify install with sync_metafields_enabled, looks at recently
 * resolved leads in the workspace, attempts to match each by email to a
 * Shopify Customer in that shop, and writes:
 *   - cursive.intent_score       (0–100)
 *   - cursive.last_resolved_at   (date_time)
 *   - cursive.resolution_source  (single_line_text_field, default 'pixel_v4')
 *
 * Visible inside Shopify admin's Customer detail view + Shopify Segments
 * builder. Powers all downstream Shopify-native automations.
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { getValidAccessTokenForInstall } from '@/lib/marketplace/token-refresh'
import {
  findCustomerByEmail,
  writeCustomerMetafields,
} from '@/lib/marketplace/shopify/client'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const BATCH_SIZE = 50

export const marketplaceShopifyMetafields = inngest.createFunction(
  {
    id: 'marketplace-shopify-metafields',
    name: 'Marketplace — Shopify Metafield Writeback (6h)',
    concurrency: { limit: 5 },
  },
  { cron: '15 */6 * * *' }, // offset 15min from GHL sync to spread Shopify Admin GraphQL load
  async ({ step }) => {
    const admin = createAdminClient()

    const installs = await step.run('list-active-installs', async () => {
      const { data } = await admin
        .from('app_installs')
        .select('id, workspace_id, external_id, last_visitor_sync_at')
        .eq('source', 'shopify')
        .eq('status', 'active')
        .eq('sync_metafields_enabled', true)
      return data ?? []
    })

    safeLog('[shopify-metafields] processing installs', { count: installs.length })

    const results = { processed: 0, written: 0, failed: 0, matched: 0 }

    for (const install of installs) {
      const result = await step.run(
        `metafields-${install.id}`,
        async () => syncOneInstall(install),
      )
      results.processed++
      results.written += result.written
      results.failed += result.failed
      results.matched += result.matched
    }

    return results
  },
)

interface InstallRow {
  id: string
  workspace_id: string
  external_id: string
  last_visitor_sync_at: string | null
}

async function syncOneInstall(install: InstallRow): Promise<{
  written: number
  failed: number
  matched: number
}> {
  const admin = createAdminClient()

  const accessToken = await getValidAccessTokenForInstall({ installId: install.id })
  if (!accessToken) {
    safeError('[shopify-metafields] no valid token', { installId: install.id })
    return { written: 0, failed: 0, matched: 0 }
  }

  const since = install.last_visitor_sync_at
    ? new Date(install.last_visitor_sync_at)
    : new Date(Date.now() - 24 * 60 * 60 * 1000)

  const { data: leads } = await admin
    .from('leads')
    .select('id, email, intent_score_calculated, created_at')
    .eq('workspace_id', install.workspace_id)
    .gte('created_at', since.toISOString())
    .not('email', 'is', null)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (!leads || leads.length === 0) {
    await admin
      .from('app_installs')
      .update({ last_visitor_sync_at: new Date().toISOString() })
      .eq('id', install.id)
    return { written: 0, failed: 0, matched: 0 }
  }

  const log = await admin
    .from('marketplace_sync_log')
    .insert({
      install_id: install.id,
      workspace_id: install.workspace_id,
      source: 'shopify',
      job_type: 'metafield_writeback',
      status: 'pending',
      visitors_processed: leads.length,
    })
    .select('id')
    .maybeSingle()

  let matched = 0
  let written = 0
  let failed = 0

  for (const lead of leads) {
    if (!lead.email) continue

    try {
      const customer = await findCustomerByEmail({
        shop: install.external_id,
        accessToken,
        email: lead.email,
      })

      if (!customer) continue
      matched++

      await writeCustomerMetafields({
        shop: install.external_id,
        accessToken,
        customerId: customer.id,
        intentScore: typeof lead.intent_score_calculated === 'number'
          ? lead.intent_score_calculated
          : 0,
        lastResolvedAt: new Date(lead.created_at),
        resolutionSource: 'pixel_v4',
      })
      written++
    } catch (err) {
      failed++
      safeError('[shopify-metafields] write failed', {
        leadId: lead.id,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const now = new Date().toISOString()
  await admin
    .from('app_installs')
    .update({ last_visitor_sync_at: now })
    .eq('id', install.id)

  if (log?.data?.id) {
    await admin
      .from('marketplace_sync_log')
      .update({
        status: failed === 0 ? 'success' : written === 0 ? 'failed' : 'partial',
        visitors_synced: written,
        visitors_failed: failed,
        metadata: { matched_customers: matched },
        completed_at: now,
      })
      .eq('id', log.data.id)
  }

  return { matched, written, failed }
}
