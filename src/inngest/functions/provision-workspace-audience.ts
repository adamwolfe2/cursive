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
  AudienceLabUnfilteredError,
  UNFILTERED_PREVIEW_THRESHOLD,
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
      // Send alert so ops knows this workspace got no leads
      sendSlackAlert({
        type: 'system_event',
        severity: 'warning',
        message: `Workspace ${workspace_id} provision SKIPPED — AUDIENCELAB_ACCOUNT_API_KEY not configured`,
        metadata: { workspace_id, user_id },
      }).catch(() => {}) // non-fatal
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

        // Guard: if preview count is suspiciously high the AL API ignored our filters.
        // Returning global (500k) records would pollute the workspace with garbage leads.
        if (previewCount >= UNFILTERED_PREVIEW_THRESHOLD) {
          sendSlackAlert({
            type: 'webhook_failure',
            severity: 'warning',
            message: `AL provision skipped for workspace ${workspace_id} — preview count ${previewCount.toLocaleString()} exceeds threshold (${UNFILTERED_PREVIEW_THRESHOLD.toLocaleString()}). Filters likely ignored by API.`,
            metadata: { workspace_id, user_id, industries: industries?.join(','), states: states?.join(','), previewCount },
          }).catch(() => {})
          return { audienceId: null as string | null, segmentFilters }
        }

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
      const sampleLeads: Array<{ name: string; company: string; title: string }> = []
      const maxPages = Math.ceil(MAX_INITIAL_LEADS / 100)

      for (let page = 1; page <= maxPages; page++) {
        const pageSize = Math.min(100, MAX_INITIAL_LEADS - inserted)
        if (pageSize <= 0) break

        let records: ALEnrichedProfile[] = []
        try {
          const recordsResponse = await fetchAudienceRecords(audienceResult.audienceId!, page, pageSize)
          records = recordsResponse.data || []
          if (records.length === 0) break
        } catch (err) {
          if (err instanceof AudienceLabUnfilteredError) {
            safeLog(`${LOG_PREFIX} Unfiltered response detected (${err.totalRecords.toLocaleString()} records), aborting fetch`)
            sendSlackAlert({
              type: 'webhook_failure',
              severity: 'warning',
              message: `AL provision aborted — unfiltered response (${err.totalRecords.toLocaleString()} records) for workspace ${workspace_id}`,
              metadata: { workspace_id, user_id, totalRecords: err.totalRecords },
            }).catch(() => {})
            break
          }
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

          // Post-fetch targeting filter: even if AL ignored our segment filters,
          // we enforce industry and state matching using the record's own fields.
          if (industries?.length > 0) {
            const recIndustry = (record.COMPANY_INDUSTRY || '').toLowerCase()
            const hasIndustryMatch = industries.some(i =>
              recIndustry.includes(i.toLowerCase()) || i.toLowerCase().includes(recIndustry)
            )
            if (!hasIndustryMatch) {
              skipped++
              continue
            }
          }
          if (states?.length > 0) {
            const recState = record.PERSONAL_STATE || record.COMPANY_STATE
            if (recState && !states.includes(recState)) {
              skipped++
              continue
            }
          }

          const email =
            record.BUSINESS_VERIFIED_EMAILS?.[0] ||
            record.PERSONAL_VERIFIED_EMAILS?.[0] ||
            parseCSV(record.PERSONAL_EMAILS)[0] ||
            record.BUSINESS_EMAIL ||
            null

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
              // Demographics (AL V4 fields)
              age_range: record.AGE_RANGE || null,
              gender: record.GENDER || null,
              homeowner: record.HOMEOWNER ? ['Y','y','true','TRUE','Yes','yes'].includes(String(record.HOMEOWNER)) : null,
              married: record.MARRIED ? ['Y','y','true','TRUE','Yes','yes'].includes(String(record.MARRIED)) : null,
              // Professional
              headline: record.HEADLINE || null,
              // Company extended
              company_address: record.COMPANY_ADDRESS || null,
              company_city: record.COMPANY_CITY || null,
              company_state: record.COMPANY_STATE || null,
              company_zip: record.COMPANY_ZIP || null,
              company_phone: record.COMPANY_PHONE || null,
              company_sic: record.COMPANY_SIC || null,
              company_naics: record.COMPANY_NAICS || null,
              // Social
              individual_twitter_url: record.INDIVIDUAL_TWITTER_URL || null,
              individual_facebook_url: record.INDIVIDUAL_FACEBOOK_URL || null,
              // Phone lists
              all_mobiles: record.ALL_MOBILES ? String(record.ALL_MOBILES).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
              all_landlines: record.ALL_LANDLINES ? String(record.ALL_LANDLINES).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
              // Profile attributes
              skills: record.SKILLS ? String(record.SKILLS).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
              interests: record.INTERESTS ? String(record.INTERESTS).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
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
            if (insertErr.code !== '23505') {
              safeError(`${LOG_PREFIX} Insert failed for ${email}`, insertErr)
            }
            skipped++
            continue
          }

          // Collect sample leads for activation email (first 3 only)
          if (sampleLeads.length < 3 && fullName) {
            sampleLeads.push({
              name: fullName,
              company: record.COMPANY_NAME || '',
              title: record.JOB_TITLE || '',
            })
          }

          // Create user_lead_assignment so the lead appears in "My Leads"
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
              .maybeSingle()
          }

          inserted++
        }

        if (records.length < pageSize) break
      }

      return { inserted, skipped, sampleLeads }
    })

    safeLog(`${LOG_PREFIX} Workspace ${workspace_id}: ${insertResult.inserted} leads inserted, ${insertResult.skipped} skipped`)

    // Step 3b: Process affiliate activation (idempotent, non-fatal)
    if (insertResult.inserted > 0) {
      await step.run('affiliate-activation', async () => {
        try {
          const supabase = createAdminClient()
          const { data: userRow } = await supabase
            .from('users')
            .select('email')
            .eq('id', user_id)
            .maybeSingle()

          if (!userRow?.email) return

          const { processAffiliateActivation } = await import('@/lib/affiliate/activation')
          await processAffiliateActivation(workspace_id, user_id, userRow.email)
        } catch (err) {
          safeError(`${LOG_PREFIX} Affiliate activation failed (non-fatal)`, err)
        }
      })
    }

    // Step 4: Emit "first leads arrived" event — handled by first-leads-arrived.ts
    // which uses a shared email template and prevents duplicate sends via Inngest dedup.
    if (insertResult.inserted > 0) {
      await step.run('emit-first-leads-event', async () => {
        try {
          const supabase = createAdminClient()
          const { data: userRow } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', user_id)
            .maybeSingle()

          if (!userRow?.email) return

          await inngest.send({
            name: 'workspace/first-leads-arrived',
            data: {
              workspaceId: workspace_id,
              userId: user_id,
              userEmail: userRow.email,
              userName: userRow.full_name || userRow.email.split('@')[0],
              leadCount: insertResult.inserted,
              industry: industries?.[0] || null,
              location: states?.[0] || null,
            },
          })

          safeLog(`${LOG_PREFIX} First-leads event emitted for workspace ${workspace_id}`)
        } catch (emitErr) {
          safeError(`${LOG_PREFIX} First-leads event emission failed (non-fatal)`, emitErr)
        }
      })
    }

    // Step 5: Auto-advance ops_stage to 'trial' if a cal_booking email matches the owner
    await step.run('auto-advance-ops-stage', async () => {
      try {
        const supabase = createAdminClient()
        const { data: userRow } = await supabase
          .from('users')
          .select('email')
          .eq('id', user_id)
          .maybeSingle()
        if (!userRow?.email) return

        const { data: booking } = await supabase
          .from('cal_bookings')
          .select('id')
          .eq('attendee_email', userRow.email)
          .limit(1)
          .maybeSingle()

        if (booking) {
          await supabase
            .from('workspaces')
            .update({ ops_stage: 'trial' })
            .eq('id', workspace_id)
            .eq('ops_stage', 'new') // only advance if still at default stage

          // Also back-link the booking to this workspace
          await supabase
            .from('cal_bookings')
            .update({ workspace_id })
            .eq('attendee_email', userRow.email)
            .is('workspace_id', null)

          safeLog(`${LOG_PREFIX} Auto-advanced ops_stage to 'trial' for workspace ${workspace_id}`)
        }
      } catch (err) {
        safeError(`${LOG_PREFIX} ops_stage auto-advance failed (non-fatal)`, err)
      }
    })

    // Step 6: Notify if meaningful results
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
