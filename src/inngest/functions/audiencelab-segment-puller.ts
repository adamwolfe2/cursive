/**
 * AudienceLab Segment Puller
 *
 * Scheduled Inngest function that pulls leads from AL Audiences API
 * based on user targeting preferences. This complements the push (webhook)
 * pipeline with proactive lead sourcing.
 *
 * Flow:
 * 1. Fetch all active user_targeting records
 * 2. Group by unique industry+geo combos to minimize API calls
 * 3. For each combo: preview → create audience → fetch records
 * 4. Dedupe against existing leads
 * 5. Insert new leads with routing fields populated
 * 6. Route to matching users via find_matching_users_for_lead()
 *
 * Runs every 6 hours via cron, or on-demand via event.
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getAudienceAttributes,
  previewAudience,
  createAudience,
  fetchAudienceRecords,
  type ALEnrichedProfile,
  type ALAudienceFilter,
} from '@/lib/audiencelab/api-client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[AL Segment Puller]'
const MAX_RECORDS_PER_RUN = 500 // Safety cap per run
const MAX_PAGES = 5 // Max pages to fetch per audience

interface TargetingCombo {
  industries: string[]
  states: string[]
  workspaceIds: string[]
}

export const audienceLabSegmentPuller = inngest.createFunction(
  {
    id: 'audiencelab-segment-puller',
    name: 'AudienceLab Segment Puller',
    retries: 2,
    timeouts: { finish: '10m' },
    concurrency: [{ limit: 1 }], // Only one puller at a time
  },
  [
    { cron: '0 */6 * * *' }, // Every 6 hours
    { event: 'audiencelab/segment-pull' }, // On-demand trigger
  ],
  async ({ event, step }) => {
    const supabase = createAdminClient()

    // Step 1: Check if AL API key is configured
    const apiKeyOk = await step.run('check-api-key', async () => {
      if (!process.env.AUDIENCELAB_ACCOUNT_API_KEY) {
        safeLog(`${LOG_PREFIX} AUDIENCELAB_ACCOUNT_API_KEY not configured, skipping`)
        return false
      }
      return true
    })

    if (!apiKeyOk) return { skipped: true, reason: 'No API key configured' }

    // Step 2: Fetch all active targeting preferences
    const targetingCombos = await step.run('fetch-targeting', async () => {
      const { data: targetingRows, error } = await supabase
        .from('user_targeting')
        .select('target_industries, target_states, workspace_id')
        .eq('is_active', true)

      if (error || !targetingRows?.length) {
        safeLog(`${LOG_PREFIX} No active targeting found`)
        return []
      }

      // Group by unique industry+state combos to minimize API calls
      const comboMap = new Map<string, TargetingCombo>()

      for (const row of targetingRows) {
        const industries = (row.target_industries || []).sort()
        const states = (row.target_states || []).sort()
        const key = `${industries.join(',')}|${states.join(',')}`

        if (comboMap.has(key)) {
          comboMap.get(key)!.workspaceIds.push(row.workspace_id)
        } else {
          comboMap.set(key, {
            industries,
            states,
            workspaceIds: [row.workspace_id],
          })
        }
      }

      return Array.from(comboMap.values())
    })

    if (!targetingCombos.length) {
      return { skipped: true, reason: 'No active targeting preferences' }
    }

    safeLog(`${LOG_PREFIX} Found ${targetingCombos.length} unique targeting combo(s)`)

    // Step 3: For each combo, try to pull leads from AL
    let totalInserted = 0
    let totalSkipped = 0
    const errors: string[] = []

    for (let i = 0; i < targetingCombos.length && totalInserted < MAX_RECORDS_PER_RUN; i++) {
      const combo = targetingCombos[i]

      const result = await step.run(`pull-combo-${i}`, async () => {
        try {
          // Build AL audience filter
          const filters: ALAudienceFilter = {
            days_back: 7, // Only recent data
          }
          if (combo.industries.length > 0) {
            filters.industries = combo.industries
          }
          if (combo.states.length > 0) {
            filters.state = combo.states
          }

          // Try preview first to see count
          let previewCount = 0
          try {
            const preview = await previewAudience({ filters })
            previewCount = preview.count || 0
            safeLog(`${LOG_PREFIX} Preview for ${combo.industries.join(',')} in ${combo.states.join(',') || 'all states'}: ${previewCount} records`)

            if (previewCount === 0) {
              return { inserted: 0, skipped: 0, error: null as string | null }
            }
          } catch (previewErr) {
            // Preview endpoint might not exist — continue anyway
            safeLog(`${LOG_PREFIX} Preview not available, attempting direct audience creation`)
          }

          // Create audience
          const audienceName = `cursive-pull-${combo.industries.join('-')}-${combo.states.join('-') || 'national'}-${Date.now()}`
          const audience = await createAudience({
            name: audienceName,
            filters,
          })

          const audienceId = audience.audienceId || audience.id
          if (!audienceId) {
            safeLog(`${LOG_PREFIX} No audienceId returned from create`)
            return { inserted: 0, skipped: 0, error: 'No audienceId returned' }
          }

          // Fetch records page by page
          let inserted = 0
          let skipped = 0
          const remaining = MAX_RECORDS_PER_RUN - totalInserted

          for (let page = 1; page <= MAX_PAGES; page++) {
            const pageSize = Math.min(500, remaining - inserted)
            if (pageSize <= 0) break

            const recordsResponse = await fetchAudienceRecords(audienceId, page, pageSize)
            const records = recordsResponse.records || []

            if (records.length === 0) break

            for (const record of records) {
              if (inserted >= remaining) break

              const result = await insertLeadFromALRecord(
                supabase,
                record,
                combo.workspaceIds[0], // Use first workspace as owner
                combo
              )

              if (result === 'inserted') inserted++
              else skipped++
            }

            if (!recordsResponse.has_more) break
          }

          return { inserted, skipped, error: null as string | null }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          safeError(`${LOG_PREFIX} Error pulling combo ${i}`, err)
          return { inserted: 0, skipped: 0, error: msg as string | null }
        }
      })

      totalInserted += result.inserted
      totalSkipped += result.skipped
      if (result.error) errors.push(result.error)
    }

    // Step 4: Route new leads to matching users
    if (totalInserted > 0) {
      await step.run('route-new-leads', async () => {
        // Find leads that were just inserted (source=audiencelab_pull, last 15 minutes)
        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
        const { data: newLeads } = await supabase
          .from('leads')
          .select('id, workspace_id')
          .eq('source', 'audiencelab_pull')
          .gte('created_at', fifteenMinAgo)
          .is('assigned_user_id', null)

        if (!newLeads?.length) return

        let routed = 0
        for (const lead of newLeads) {
          const { data: matches } = await supabase
            .rpc('find_matching_users_for_lead', {
              p_lead_id: lead.id,
              p_workspace_id: lead.workspace_id,
            })

          if (matches?.length > 0) {
            await supabase
              .from('leads')
              .update({ assigned_user_id: matches[0].user_id })
              .eq('id', lead.id)
            routed++
          }
        }

        safeLog(`${LOG_PREFIX} Routed ${routed}/${newLeads.length} new leads`)
      })
    }

    // Step 5: Notify
    if (totalInserted > 0) {
      await step.run('notify', async () => {
        sendSlackAlert({
          type: 'system_event',
          severity: 'info',
          message: `AL Segment Puller: ${totalInserted} new leads pulled, ${totalSkipped} skipped (dupes)`,
          metadata: {
            combos: targetingCombos.length,
            inserted: totalInserted,
            skipped: totalSkipped,
            errors: errors.length,
          },
        }).catch(() => {})
      })
    }

    return {
      combos_processed: targetingCombos.length,
      total_inserted: totalInserted,
      total_skipped: totalSkipped,
      errors,
    }
  }
)

/**
 * Insert a single lead from an AL audience record.
 * Returns 'inserted' or 'skipped' (if duplicate).
 */
async function insertLeadFromALRecord(
  supabase: ReturnType<typeof createAdminClient>,
  record: ALEnrichedProfile,
  workspaceId: string,
  combo: TargetingCombo
): Promise<'inserted' | 'skipped'> {
  const email = record.email || record.personal_emails?.[0] || record.business_emails?.[0]

  // Skip records without email — can't dedupe
  if (!email) return 'skipped'

  // Dedupe check: look for existing lead with same email in this workspace
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('email', email.toLowerCase())
    .limit(1)
    .maybeSingle()

  if (existing) return 'skipped'

  const firstName = record.first_name || ''
  const lastName = record.last_name || ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  const { error } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspaceId,
      source: 'audiencelab_pull',
      enrichment_status: 'enriched' as const,
      status: 'new',
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: fullName || null,
      email: email.toLowerCase(),
      phone: record.phones?.[0] || null,
      company_name: record.company_name || null,
      company_industry: combo.industries[0] || null,
      company_domain: record.company_domain || null,
      city: record.city || null,
      state: record.state || null,
      state_code: record.state || null,
      country: 'US',
      country_code: 'US',
      postal_code: record.zip || null,
      job_title: record.job_title || null,
      lead_score: 60, // Default score for pull-sourced leads
      intent_score_calculated: 50,
      freshness_score: 100,
      has_email: true,
      has_phone: !!record.phones?.length,
      validated: false,
      enrichment_method: 'audiencelab_pull',
      tags: ['audiencelab', 'segment-pull', ...(combo.industries.map(i => i.toLowerCase()))],
      company_data: {
        name: record.company_name || null,
        industry: combo.industries[0] || null,
        domain: record.company_domain || null,
      },
      company_location: {
        city: record.city || null,
        state: record.state || null,
        country: 'US',
      },
    })

  if (error) {
    safeError(`${LOG_PREFIX} Failed to insert lead ${email}`, error)
    return 'skipped'
  }

  return 'inserted'
}
