/**
 * Marketplace — GHL visitor sync (6-hour cron).
 *
 * For every active GHL install with sync_visitors_enabled=true, pulls
 * recently resolved visitors from the workspace's `leads` table and
 * upserts them as GHL contacts with intent tags.
 *
 * Tag mapping per PRD §F5:
 *   - all visitors:      'cursive-visitor'
 *   - SCORE = high:      'cursive-high-intent'
 *   - SCORE = medium:    'cursive-intent'
 *   - B2B fields present:'cursive-b2b'
 *
 * Field mapping V4 → GHL Contact:
 *   email, phone (E.164), firstName, lastName, city, state, postalCode,
 *   companyName.
 *
 * Rate-limit per PRD §F5: GHL allows 100 req/10s and 200K/day per location.
 * We process up to 100 visitors per location per run (well under the limit).
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { getValidAccessTokenForInstall } from '@/lib/marketplace/token-refresh'
import {
  upsertContact,
  addContactTags,
  normalizePhoneE164,
} from '@/lib/marketplace/ghl/client'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const BATCH_SIZE = 100

export const marketplaceGhlSync = inngest.createFunction(
  {
    id: 'marketplace-ghl-sync',
    name: 'Marketplace — GHL Visitor Sync (6h)',
    concurrency: { limit: 5 }, // process up to 5 installs in parallel
  },
  { cron: '0 */6 * * *' },
  async ({ step }) => {
    const admin = createAdminClient()

    // Find all active GHL installs with sync enabled
    const installs = await step.run('list-active-installs', async () => {
      const { data } = await admin
        .from('app_installs')
        .select('id, workspace_id, external_id, last_visitor_sync_at, metadata')
        .eq('source', 'ghl')
        .eq('status', 'active')
        .eq('sync_visitors_enabled', true)
      return data ?? []
    })

    safeLog('[ghl-sync] processing installs', { count: installs.length })

    const results = {
      processed: 0,
      synced: 0,
      failed: 0,
    }

    // Sequential per install (each install has its own GHL rate limit budget)
    for (const install of installs) {
      const result = await step.run(
        `sync-install-${install.id}`,
        async () => syncOneInstall(install),
      )
      results.processed++
      results.synced += result.synced
      results.failed += result.failed
    }

    return results
  },
)

interface InstallRow {
  id: string
  workspace_id: string
  external_id: string
  last_visitor_sync_at: string | null
  metadata: Record<string, unknown> | null
}

async function syncOneInstall(install: InstallRow): Promise<{ synced: number; failed: number }> {
  const admin = createAdminClient()

  // Acquire valid access token (auto-refresh if needed)
  const accessToken = await getValidAccessTokenForInstall({ installId: install.id })
  if (!accessToken) {
    safeError('[ghl-sync] no valid token for install', { installId: install.id })
    return { synced: 0, failed: 0 }
  }

  // Pull leads since last sync (or last 24h if first run)
  const since = install.last_visitor_sync_at
    ? new Date(install.last_visitor_sync_at)
    : new Date(Date.now() - 24 * 60 * 60 * 1000)

  const { data: leads, error: leadsErr } = await admin
    .from('leads')
    .select('id, email, phone, first_name, last_name, city, state, zip, company_name, intent_score_calculated, company_industry, company_domain, source, created_at')
    .eq('workspace_id', install.workspace_id)
    .gte('created_at', since.toISOString())
    .not('email', 'is', null)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (leadsErr || !leads || leads.length === 0) {
    // Mark synced timestamp anyway so we don't re-pull empty windows
    await admin
      .from('app_installs')
      .update({ last_visitor_sync_at: new Date().toISOString() })
      .eq('id', install.id)
    return { synced: 0, failed: 0 }
  }

  const logEntry = await admin
    .from('marketplace_sync_log')
    .insert({
      install_id: install.id,
      workspace_id: install.workspace_id,
      source: 'ghl',
      job_type: 'contact_sync',
      status: 'pending',
      visitors_processed: leads.length,
    })
    .select('id')
    .maybeSingle()

  let synced = 0
  let failed = 0

  for (const lead of leads) {
    try {
      const phone = normalizePhoneE164(lead.phone)

      const upsertResult = await upsertContact({
        accessToken,
        contact: {
          locationId: install.external_id,
          email: lead.email ?? undefined,
          phone: phone ?? undefined,
          firstName: lead.first_name ?? undefined,
          lastName: lead.last_name ?? undefined,
          city: lead.city ?? undefined,
          state: lead.state ?? undefined,
          postalCode: lead.zip ?? undefined,
          companyName: lead.company_name ?? undefined,
          source: 'Cursive',
        },
      })

      if (upsertResult.contact?.id) {
        // Determine intent tags
        const tags = ['cursive-visitor']
        const score = lead.intent_score_calculated
        if (typeof score === 'number') {
          if (score >= 80) tags.push('cursive-high-intent')
          else if (score >= 50) tags.push('cursive-intent')
        }
        if (lead.company_domain || lead.company_industry) {
          tags.push('cursive-b2b')
        }

        try {
          await addContactTags({
            accessToken,
            contactId: upsertResult.contact.id,
            tags,
          })
        } catch (tagErr) {
          // Tags are best-effort; the contact still exists
          safeError('[ghl-sync] tag application failed', {
            contactId: upsertResult.contact.id,
            err: tagErr instanceof Error ? tagErr.message : String(tagErr),
          })
        }

        synced++
      }
    } catch (err) {
      failed++
      safeError('[ghl-sync] contact upsert failed', {
        leadId: lead.id,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // Update install + log
  const now = new Date().toISOString()
  await admin
    .from('app_installs')
    .update({
      last_visitor_sync_at: now,
      visitor_sync_count: (typeof install.metadata?.visitor_sync_count === 'number'
        ? install.metadata.visitor_sync_count
        : 0) + synced,
    })
    .eq('id', install.id)

  if (logEntry?.data?.id) {
    await admin
      .from('marketplace_sync_log')
      .update({
        status: failed === 0 ? 'success' : synced === 0 ? 'failed' : 'partial',
        visitors_synced: synced,
        visitors_failed: failed,
        completed_at: now,
      })
      .eq('id', logEntry.data.id)
  }

  return { synced, failed }
}
