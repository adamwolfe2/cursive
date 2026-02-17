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
 * 6. Route to matching users via user_lead_assignments junction table
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

// ─── Lead Quality Scoring ─────────────────────────────────────────────────────
// Minimum completeness score — leads below this are not worth storing.
const MIN_QUALITY_SCORE = 20

/**
 * Score an ALEnrichedProfile's completeness (0–100).
 * Mirrors scoreLeadCompleteness() in audiencelab.service.ts but handles
 * ALEnrichedProfile types where multi-value fields are comma-separated strings.
 */
function scoreALProfile(record: ALEnrichedProfile): number {
  let score = 0

  // Verified emails are highest value
  const bve = record.BUSINESS_VERIFIED_EMAILS
  const pve = record.PERSONAL_VERIFIED_EMAILS
  if ((typeof bve === 'string' && bve.length > 0) || (Array.isArray(bve) && bve.length > 0)) score += 30
  else if ((typeof pve === 'string' && pve.length > 0) || (Array.isArray(pve) && pve.length > 0)) score += 25
  else if (record.BUSINESS_EMAIL) score += 12
  else if (record.PERSONAL_EMAILS) score += 8

  // Full name
  if (record.FIRST_NAME && record.LAST_NAME) score += 15
  else if (record.FIRST_NAME || record.LAST_NAME) score += 5

  // Phone
  if (record.MOBILE_PHONE) score += 12
  else if (record.DIRECT_NUMBER) score += 10
  else if (record.PERSONAL_PHONE) score += 8
  else if (record.COMPANY_PHONE) score += 4

  // Company
  if (record.COMPANY_NAME) score += 8

  // Job title
  if (record.JOB_TITLE) score += 7

  // LinkedIn
  if (record.COMPANY_LINKEDIN_URL) score += 8

  // Location
  if ((record.COMPANY_CITY || record.PERSONAL_CITY) && (record.COMPANY_STATE || record.PERSONAL_STATE)) score += 5
  else if (record.COMPANY_STATE || record.PERSONAL_STATE) score += 2

  // Company enrichment
  if (record.COMPANY_DOMAIN) score += 5
  if (record.COMPANY_EMPLOYEE_COUNT) score += 3
  if (record.COMPANY_REVENUE) score += 3

  return score
}

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

          const audienceId = audience.audienceId
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
            const records = recordsResponse.data || []

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

            // Use page-based pagination (no has_more field)
            if (page >= (recordsResponse.total_pages || 1)) break
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

    // Step 4: Route new leads to matching users via user_lead_assignments
    if (totalInserted > 0) {
      await step.run('route-new-leads', async () => {
        // Find leads that were just inserted (source=audiencelab_pull, last 15 minutes)
        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
        const { data: newLeads } = await supabase
          .from('leads')
          .select('id, workspace_id, company_industry, state_code, state, city, postal_code')
          .eq('source', 'audiencelab_pull')
          .gte('created_at', fifteenMinAgo)
          .is('assigned_user_id', null)

        if (!newLeads?.length) return

        let routed = 0
        for (const lead of newLeads) {
          // Get all active user targeting for this workspace
          const { data: targetingUsers } = await supabase
            .from('user_targeting')
            .select('user_id, target_industries, target_states, target_cities, target_zips, daily_lead_cap, daily_lead_count, weekly_lead_cap, weekly_lead_count, monthly_lead_cap, monthly_lead_count')
            .eq('workspace_id', lead.workspace_id)
            .eq('is_active', true)

          if (!targetingUsers?.length) continue

          const leadState = lead.state_code || lead.state
          const leadIndustry = lead.company_industry

          for (const ut of targetingUsers) {
            // Check caps
            if (ut.daily_lead_cap && ut.daily_lead_count >= ut.daily_lead_cap) continue
            if (ut.weekly_lead_cap && ut.weekly_lead_count >= ut.weekly_lead_cap) continue
            if (ut.monthly_lead_cap && ut.monthly_lead_count >= ut.monthly_lead_cap) continue

            // Check geo match
            let matchedGeo: string | null = null
            const hasGeo = (ut.target_states?.length > 0) || (ut.target_cities?.length > 0) || (ut.target_zips?.length > 0)
            if (hasGeo) {
              if (leadState && ut.target_states?.includes(leadState)) {
                matchedGeo = leadState
              } else if (lead.city && ut.target_cities?.some((c: string) => c.toLowerCase() === lead.city.toLowerCase())) {
                matchedGeo = lead.city
              } else if (lead.postal_code && ut.target_zips?.includes(lead.postal_code)) {
                matchedGeo = lead.postal_code
              } else {
                continue // No geo match
              }
            }

            // Check industry match
            let matchedIndustry: string | null = null
            const hasIndustry = (ut.target_industries?.length > 0)
            if (hasIndustry) {
              if (leadIndustry && ut.target_industries?.includes(leadIndustry)) {
                matchedIndustry = leadIndustry
              } else {
                continue // No industry match
              }
            }

            // Must have at least one targeting dimension
            if (!hasGeo && !hasIndustry) continue

            // Create user_lead_assignment (the junction record My Leads queries)
            const { error: assignErr } = await supabase
              .from('user_lead_assignments')
              .insert({
                workspace_id: lead.workspace_id,
                lead_id: lead.id,
                user_id: ut.user_id,
                matched_industry: matchedIndustry,
                matched_geo: matchedGeo,
                source: 'audiencelab_pull',
                status: 'new',
              })

            if (assignErr) {
              if (assignErr.code === '23505') continue // Duplicate
              safeError(`${LOG_PREFIX} Failed to assign lead ${lead.id} to user ${ut.user_id}`, assignErr)
              continue
            }

            // Update assigned_user_id on lead (first match wins)
            await supabase
              .from('leads')
              .update({ assigned_user_id: ut.user_id })
              .eq('id', lead.id)
              .is('assigned_user_id', null) // Only if not already assigned

            // Increment user lead counts
            await supabase
              .from('user_targeting')
              .update({
                daily_lead_count: (ut.daily_lead_count || 0) + 1,
                weekly_lead_count: (ut.weekly_lead_count || 0) + 1,
                monthly_lead_count: (ut.monthly_lead_count || 0) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', ut.user_id)
              .eq('workspace_id', lead.workspace_id)

            routed++
          }
        }

        safeLog(`${LOG_PREFIX} Routed ${routed} assignment(s) for ${newLeads.length} new leads`)
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
 * Parse comma-separated email/phone fields from AL records.
 * AL returns multi-value fields as comma-separated strings.
 */
function parseCSV(val: unknown): string[] {
  if (!val || typeof val !== 'string') return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Insert a single lead from an AL audience record.
 * AL records use UPPER_CASE field names (verified against live API).
 * Returns 'inserted' or 'skipped' (if duplicate).
 */
async function insertLeadFromALRecord(
  supabase: ReturnType<typeof createAdminClient>,
  record: ALEnrichedProfile,
  workspaceId: string,
  combo: TargetingCombo
): Promise<'inserted' | 'skipped'> {
  // Quality gate — skip records that are too sparse to be useful
  const qualityScore = scoreALProfile(record)
  if (qualityScore < MIN_QUALITY_SCORE) return 'skipped'

  // AL records use UPPER_CASE: PERSONAL_EMAILS, BUSINESS_EMAIL (comma-separated strings)
  const personalEmails = parseCSV(record.PERSONAL_EMAILS)
  const businessEmails = parseCSV(record.BUSINESS_EMAIL)
  const email = personalEmails[0] || businessEmails[0]

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

  const firstName = record.FIRST_NAME || ''
  const lastName = record.LAST_NAME || ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  // Parse phones from AL fields
  const phones = parseCSV(record.PERSONAL_PHONE || record.MOBILE_PHONE || record.DIRECT_NUMBER)

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
      phone: phones[0] || null,
      company_name: record.COMPANY_NAME || null,
      company_industry: record.COMPANY_INDUSTRY || combo.industries[0] || null,
      company_domain: record.COMPANY_DOMAIN || null,
      city: record.PERSONAL_CITY || record.COMPANY_CITY || null,
      state: record.PERSONAL_STATE || record.COMPANY_STATE || null,
      state_code: record.PERSONAL_STATE || record.COMPANY_STATE || null,
      country: 'US',
      country_code: 'US',
      postal_code: record.PERSONAL_ZIP || record.COMPANY_ZIP || null,
      job_title: record.JOB_TITLE || null,
      lead_score: Math.min(qualityScore, 100),
      intent_score_calculated: Math.round(qualityScore * 0.8), // Intent = 80% of completeness
      freshness_score: 100, // Always 100 at insert — decays over time via freshness cron
      has_email: true,
      has_phone: phones.length > 0,
      validated: false,
      enrichment_method: 'audiencelab_pull',
      tags: ['audiencelab', 'segment-pull', ...(combo.industries.map(i => i.toLowerCase()))],
      company_data: {
        name: record.COMPANY_NAME || null,
        industry: record.COMPANY_INDUSTRY || combo.industries[0] || null,
        domain: record.COMPANY_DOMAIN || null,
      },
      company_location: {
        city: record.PERSONAL_CITY || record.COMPANY_CITY || null,
        state: record.PERSONAL_STATE || record.COMPANY_STATE || null,
        country: 'US',
      },
    })

  if (error) {
    safeError(`${LOG_PREFIX} Failed to insert lead ${email}`, error)
    return 'skipped'
  }

  return 'inserted'
}
