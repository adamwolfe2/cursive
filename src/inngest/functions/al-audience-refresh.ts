/**
 * AudienceLab DFY Audience Refresh
 *
 * Cron: every Monday at 2am CT
 * Re-pulls net-new leads from all active DFY audiences to keep each
 * workspace's lead supply fresh throughout the engagement.
 *
 * Algorithm:
 *   1. Fetch all al_audiences rows where refresh_enabled = true
 *   2. For each workspace audience, call fetchAudienceRecords with the same filters
 *   3. Skip records already in the workspace (dedupe by email)
 *   4. Insert net-new leads only
 *   5. Update al_audiences.last_refreshed_at + leads_imported count
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createAudience,
  fetchAudienceRecords,
  buildWorkspaceAudienceFilters,
  AudienceLabUnfilteredError,
  UNFILTERED_PREVIEW_THRESHOLD,
  previewAudience,
  type ALEnrichedProfile,
} from '@/lib/audiencelab/api-client'
import { bulkInsertALRecords } from '@/lib/audiencelab/lead-inserter'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[AL Audience Refresh]'
const MAX_REFRESH_LEADS_PER_WORKSPACE = 200
const MAX_WORKSPACES_PER_RUN = 50

export const alAudienceRefresh = inngest.createFunction(
  {
    id: 'al-audience-refresh',
    name: 'AudienceLab DFY Audience Weekly Refresh',
    retries: 1,
    timeouts: { finish: '30m' },
    concurrency: { limit: 1 },
  },
  // Every Monday at 2am CT (8am UTC)
  { cron: '0 8 * * 1' },
  async ({ step }) => {
    if (!process.env.AUDIENCELAB_ACCOUNT_API_KEY) {
      safeLog(`${LOG_PREFIX} AL API key not configured — skipping refresh`)
      return { skipped: true, reason: 'no_api_key' }
    }

    // Step 1: Load all active DFY audiences
    const audiences = await step.run('load-dfy-audiences', async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('al_audiences')
        .select('id, workspace_id, al_audience_id, name, filters, leads_imported')
        .eq('refresh_enabled', true)
        .order('last_refreshed_at', { ascending: true, nullsFirst: true })
        .limit(MAX_WORKSPACES_PER_RUN)

      if (error) {
        safeError(`${LOG_PREFIX} Failed to load audiences:`, error)
        return []
      }

      safeLog(`${LOG_PREFIX} Found ${(data || []).length} audiences to refresh`)
      return data || []
    })

    if (audiences.length === 0) {
      return { refreshed: 0, total_leads: 0, message: 'No active DFY audiences found' }
    }

    // Step 2: Refresh each workspace audience
    let totalRefreshed = 0
    let totalLeadsInserted = 0

    for (const audience of audiences) {
      const result = await step.run(`refresh-audience-${audience.id}`, async () => {
        const supabase = createAdminClient()
        const filters = audience.filters as { industries?: string[]; states?: string[] } || {}
        const industries = filters.industries || []
        const states = filters.states || []

        try {
          // Build fresh audience filters from stored preferences
          const segmentFilters = buildWorkspaceAudienceFilters({
            industries: industries.length > 0 ? industries : undefined,
            states: states.length > 0 ? states : undefined,
          })

          // Preview to validate before pulling
          let skipPull = false
          try {
            const preview = await previewAudience({
              days_back: 7,
              filters: segmentFilters,
              limit: 5,
              include_dnc: false,
              score: false,
            })
            if ((preview.count || 0) >= UNFILTERED_PREVIEW_THRESHOLD) {
              safeLog(`${LOG_PREFIX} Preview count ${preview.count} exceeds threshold for workspace ${audience.workspace_id} — skipping`)
              skipPull = true
            }
          } catch {
            // Preview failures shouldn't block the refresh
          }

          if (skipPull) {
            return { inserted: 0, skipped: 0, reason: 'unfiltered_preview' }
          }

          // Create a fresh audience with current filters (refreshed date range)
          const refreshName = `${audience.name}-refresh-${Date.now()}`
          const freshAudience = await createAudience({
            name: refreshName,
            filters: segmentFilters,
            description: `Weekly refresh of ${audience.name} for workspace ${audience.workspace_id}`,
          })

          const freshAudienceId = freshAudience.audienceId
          let inserted = 0
          let skipped = 0
          const maxPages = Math.ceil(MAX_REFRESH_LEADS_PER_WORKSPACE / 100)

          for (let page = 1; page <= maxPages; page++) {
            const pageSize = Math.min(100, MAX_REFRESH_LEADS_PER_WORKSPACE - inserted)
            if (pageSize <= 0) break

            let records: ALEnrichedProfile[] = []
            try {
              const response = await fetchAudienceRecords(freshAudienceId, page, pageSize)
              records = response.data || []
              if (records.length === 0) break
            } catch (err) {
              if (err instanceof AudienceLabUnfilteredError) {
                safeLog(`${LOG_PREFIX} Unfiltered response for workspace ${audience.workspace_id} — aborting`)
                break
              }
              throw err
            }

            const batchResult = await bulkInsertALRecords(records, {
              workspaceId: audience.workspace_id,
              sourceTag: 'audiencelab_pull',
              extraTags: ['dfy', 'weekly-refresh'],
              industries,
              maxRecords: MAX_REFRESH_LEADS_PER_WORKSPACE - inserted,
            })

            inserted += batchResult.inserted
            skipped += batchResult.skipped

            if (records.length < pageSize) break
          }

          // Update al_audiences record
          await supabase
            .from('al_audiences')
            .update({
              last_refreshed_at: new Date().toISOString(),
              leads_imported: (audience.leads_imported || 0) + inserted,
            })
            .eq('id', audience.id)

          return { inserted, skipped, freshAudienceId }
        } catch (err) {
          safeError(`${LOG_PREFIX} Refresh failed for audience ${audience.id}:`, err)
          return { inserted: 0, skipped: 0, error: err instanceof Error ? err.message : String(err) }
        }
      })

      totalRefreshed++
      totalLeadsInserted += result.inserted || 0
    }

    safeLog(`${LOG_PREFIX} Refresh complete: ${totalRefreshed} workspaces, ${totalLeadsInserted} net-new leads`)

    if (totalLeadsInserted > 0) {
      sendSlackAlert({
        type: 'system_event',
        severity: 'info',
        message: `Weekly DFY refresh: ${totalLeadsInserted} net-new leads across ${totalRefreshed} workspaces`,
        metadata: { total_refreshed: totalRefreshed, total_leads: totalLeadsInserted },
      }).catch((err) => safeError(`${LOG_PREFIX} Slack alert failed:`, err))
    }

    return { refreshed: totalRefreshed, total_leads: totalLeadsInserted }
  }
)
