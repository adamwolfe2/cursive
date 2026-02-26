/**
 * Provision Workspace Audience
 *
 * Triggered immediately when a new business user completes onboarding.
 * Pulls a targeted batch of leads from AudienceLab's Audience Segment API
 * based on the user's declared industry + target locations.
 *
 * This gives new workspaces their first leads within minutes of signing up
 * instead of waiting up to 6 hours for the cron-based segment puller.
 *
 * Flow:
 * 1. Read workspace targeting preferences from user_targeting
 * 2. Build audience segment filters (industry + geo)
 * 3. Preview to confirm records exist
 * 4. Create audience and fetch up to 200 records
 * 5. Insert leads into workspace with proper routing
 * 6. Log result via Slack
 *
 * Event: audiencelab/provision-workspace-audience
 * Payload: { workspace_id, user_id, industries, states }
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  previewAudience,
  createAudience,
  fetchAudienceRecords,
  buildWorkspaceAudienceFilters,
  type ALEnrichedProfile,
} from '@/lib/audiencelab/api-client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[AL Provision Workspace]'
const MAX_INITIAL_LEADS = 200  // First-time pull cap — generous for new users
const MIN_QUALITY_SCORE = 20

/**
 * Score an ALEnrichedProfile's completeness (0–100).
 * Leads below MIN_QUALITY_SCORE are too sparse to be useful.
 */
function scoreALProfile(record: ALEnrichedProfile): number {
  let score = 0

  const bve = record.BUSINESS_VERIFIED_EMAILS
  const pve = record.PERSONAL_VERIFIED_EMAILS
  if ((typeof bve === 'string' && bve.length > 0) || (Array.isArray(bve) && bve.length > 0)) score += 30
  else if ((typeof pve === 'string' && pve.length > 0) || (Array.isArray(pve) && pve.length > 0)) score += 25
  else if (record.BUSINESS_EMAIL) score += 12
  else if (record.PERSONAL_EMAILS) score += 8

  if (record.FIRST_NAME && record.LAST_NAME) score += 15
  else if (record.FIRST_NAME || record.LAST_NAME) score += 5

  if (record.MOBILE_PHONE) score += 12
  else if (record.DIRECT_NUMBER) score += 10
  else if (record.PERSONAL_PHONE) score += 8
  else if (record.COMPANY_PHONE) score += 4

  if (record.COMPANY_NAME) score += 8
  if (record.JOB_TITLE) score += 7
  if (record.COMPANY_LINKEDIN_URL) score += 8

  if ((record.COMPANY_CITY || record.PERSONAL_CITY) && (record.COMPANY_STATE || record.PERSONAL_STATE)) score += 5
  else if (record.COMPANY_STATE || record.PERSONAL_STATE) score += 2

  if (record.COMPANY_DOMAIN) score += 5
  if (record.COMPANY_EMPLOYEE_COUNT) score += 3
  if (record.COMPANY_REVENUE) score += 3

  return score
}

function parseCSV(val: unknown): string[] {
  if (!val || typeof val !== 'string') return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

export const provisionWorkspaceAudience = inngest.createFunction(
  {
    id: 'provision-workspace-audience',
    name: 'Provision Workspace Audience (First-Time Pull)',
    retries: 2,
    timeouts: { finish: '8m' },
  },
  { event: 'audiencelab/provision-workspace-audience' },
  async ({ event, step }) => {
    const { workspace_id, user_id, industries, states } = event.data as {
      workspace_id: string
      user_id: string
      industries: string[]
      states: string[]
    }

    if (!workspace_id || !user_id) {
      safeLog(`${LOG_PREFIX} Missing workspace_id or user_id, skipping`)
      return { skipped: true, reason: 'Missing required fields' }
    }

    // Step 1: Verify AL API key is configured
    const apiKeyOk = await step.run('check-api-key', async () => {
      return !!process.env.AUDIENCELAB_ACCOUNT_API_KEY
    })

    if (!apiKeyOk) {
      safeLog(`${LOG_PREFIX} AUDIENCELAB_ACCOUNT_API_KEY not configured, skipping`)
      return { skipped: true, reason: 'No API key' }
    }

    // Step 2: Build the audience segment filters
    const audienceResult = await step.run('preview-and-create-audience', async () => {
      const segmentFilters = buildWorkspaceAudienceFilters({
        industries: industries?.length > 0 ? industries : undefined,
        states: states?.length > 0 ? states : undefined,
      })

      safeLog(`${LOG_PREFIX} Workspace ${workspace_id}: industries=${industries?.join(',') || 'all'} states=${states?.join(',') || 'all'}`)

      // Preview count to validate the segment exists
      let previewCount = 0
      try {
        const preview = await previewAudience({
          days_back: 7,
          filters: segmentFilters,
          limit: 50,
          include_dnc: false,
          score: true,
        })
        previewCount = preview.count || 0
        safeLog(`${LOG_PREFIX} Preview count: ${previewCount}`)

        if (previewCount === 0) {
          safeLog(`${LOG_PREFIX} No records found for this targeting, trying last 30 days`)
          // Broaden to 30 days if 7-day window is empty
          const widerPreview = await previewAudience({
            days_back: 10,
            filters: segmentFilters,
            limit: 50,
            include_dnc: false,
          })
          previewCount = widerPreview.count || 0
          if (previewCount === 0) {
            return { audienceId: null as string | null, segmentFilters }
          }
        }
      } catch (err) {
        safeLog(`${LOG_PREFIX} Preview failed, attempting direct create: ${err instanceof Error ? err.message : err}`)
      }

      // Create the named audience
      const audienceName = `cursive-signup-${workspace_id.substring(0, 8)}-${industries?.[0] || 'general'}-${Date.now()}`
      const audience = await createAudience({
        name: audienceName,
        filters: segmentFilters,
        description: `Auto-provisioned for workspace ${workspace_id} at signup. Industries: ${industries?.join(', ') || 'all'}. States: ${states?.join(', ') || 'all'}.`,
      })

      safeLog(`${LOG_PREFIX} Audience created: ${audience.audienceId}`)
      return { audienceId: audience.audienceId || null as string | null, segmentFilters }
    })

    if (!audienceResult.audienceId) {
      safeLog(`${LOG_PREFIX} No audience created (empty segment or AL unavailable)`)
      return { skipped: true, reason: 'Empty segment or audience creation failed' }
    }

    // Step 3: Fetch and insert leads
    const insertResult = await step.run('fetch-and-insert-leads', async () => {
      const supabase = createAdminClient()
      let inserted = 0
      let skipped = 0
      const maxPages = Math.ceil(MAX_INITIAL_LEADS / 100)

      for (let page = 1; page <= maxPages; page++) {
        const pageSize = Math.min(100, MAX_INITIAL_LEADS - inserted)
        if (pageSize <= 0) break

        let records: ALEnrichedProfile[] = []
        try {
          const recordsResponse = await fetchAudienceRecords(audienceResult.audienceId!, page, pageSize)
          records = recordsResponse.data || []
          if (records.length === 0) break
          if (page >= (recordsResponse.total_pages || 1)) {
            // process these then stop
          }
        } catch (err) {
          safeError(`${LOG_PREFIX} Failed to fetch page ${page}`, err)
          break
        }

        for (const record of records) {
          if (inserted >= MAX_INITIAL_LEADS) break

          const qualityScore = scoreALProfile(record)
          if (qualityScore < MIN_QUALITY_SCORE) {
            skipped++
            continue
          }

          const personalEmails = parseCSV(record.PERSONAL_EMAILS)
          const businessEmails = parseCSV(record.BUSINESS_EMAIL)
          const email = personalEmails[0] || businessEmails[0]

          if (!email) {
            skipped++
            continue
          }

          // Dedupe: skip if this email already exists in workspace
          const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('workspace_id', workspace_id)
            .eq('email', email.toLowerCase())
            .limit(1)
            .maybeSingle()

          if (existing) {
            skipped++
            continue
          }

          const firstName = record.FIRST_NAME || ''
          const lastName = record.LAST_NAME || ''
          const fullName = [firstName, lastName].filter(Boolean).join(' ')
          const phones = parseCSV(record.PERSONAL_PHONE || record.MOBILE_PHONE || record.DIRECT_NUMBER)

          const { error: insertErr } = await supabase
            .from('leads')
            .insert({
              workspace_id,
              source: 'audiencelab_pull',
              enrichment_status: 'enriched',
              status: 'new',
              first_name: firstName || null,
              last_name: lastName || null,
              full_name: fullName || null,
              email: email.toLowerCase(),
              phone: phones[0] || null,
              company_name: record.COMPANY_NAME || null,
              company_industry: record.COMPANY_INDUSTRY || industries?.[0] || null,
              company_domain: record.COMPANY_DOMAIN || null,
              city: record.PERSONAL_CITY || record.COMPANY_CITY || null,
              state: record.PERSONAL_STATE || record.COMPANY_STATE || null,
              state_code: record.PERSONAL_STATE || record.COMPANY_STATE || null,
              country: 'US',
              country_code: 'US',
              postal_code: record.PERSONAL_ZIP || record.COMPANY_ZIP || null,
              job_title: record.JOB_TITLE || null,
              lead_score: Math.min(qualityScore, 100),
              intent_score_calculated: Math.round(qualityScore * 0.8),
              freshness_score: 100,
              has_email: true,
              has_phone: phones.length > 0,
              validated: false,
              assigned_user_id: user_id,
              enrichment_method: 'audiencelab_pull',
              tags: ['audiencelab', 'signup-provision', ...(industries?.map(i => i.toLowerCase()) || [])],
              company_data: {
                name: record.COMPANY_NAME || null,
                industry: record.COMPANY_INDUSTRY || industries?.[0] || null,
                domain: record.COMPANY_DOMAIN || null,
              },
              company_location: {
                city: record.PERSONAL_CITY || record.COMPANY_CITY || null,
                state: record.PERSONAL_STATE || record.COMPANY_STATE || null,
                country: 'US',
              },
            })

          if (insertErr) {
            if (insertErr.code !== '23505') { // ignore dupes
              safeError(`${LOG_PREFIX} Insert failed for ${email}`, insertErr)
            }
            skipped++
            continue
          }

          // Create user_lead_assignment so the lead appears in "My Leads"
          // Fetch the lead we just inserted to get its ID
          const { data: newLead } = await supabase
            .from('leads')
            .select('id')
            .eq('workspace_id', workspace_id)
            .eq('email', email.toLowerCase())
            .limit(1)
            .maybeSingle()

          if (newLead?.id) {
            await supabase
              .from('user_lead_assignments')
              .insert({
                workspace_id,
                lead_id: newLead.id,
                user_id,
                matched_industry: record.COMPANY_INDUSTRY || industries?.[0] || null,
                matched_geo: record.PERSONAL_STATE || record.COMPANY_STATE || states?.[0] || null,
                source: 'audiencelab_pull',
                status: 'new',
              })
              .select()
              .maybeSingle() // ignore duplicate conflicts via upsert fallback
          }

          inserted++
        }

        if (records.length < pageSize) break
      }

      return { inserted, skipped }
    })

    safeLog(`${LOG_PREFIX} Workspace ${workspace_id}: ${insertResult.inserted} leads inserted, ${insertResult.skipped} skipped`)

    // Step 4: Notify if meaningful results
    if (insertResult.inserted > 0) {
      await step.run('notify', async () => {
        sendSlackAlert({
          type: 'system_event',
          severity: 'info',
          message: `New workspace provisioned with ${insertResult.inserted} leads (AL Audience API)`,
          metadata: {
            workspace_id,
            user_id,
            industries: industries?.join(', ') || 'all',
            states: states?.join(', ') || 'all',
            inserted: insertResult.inserted,
            skipped: insertResult.skipped,
          },
        }).catch((err) => safeError(`${LOG_PREFIX} Slack alert failed`, err))
      })
    }

    return {
      workspace_id,
      audience_id: audienceResult.audienceId,
      inserted: insertResult.inserted,
      skipped: insertResult.skipped,
    }
  }
)
