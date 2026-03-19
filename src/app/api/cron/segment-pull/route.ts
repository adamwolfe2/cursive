/**
 * Edge-Compatible Segment Pull Cron Handler
 *
 * GET /api/cron/segment-pull
 *
 * Replaces the Inngest-based audiencelab-segment-puller with an inline
 * Edge-compatible version. Triggered by Vercel Cron (vercel.json) or
 * external scheduler hitting this protected endpoint.
 *
 * Auth: Requires CRON_SECRET header matching env var.
 * Vercel Cron automatically sends this header.
 *
 * Flow:
 * 1. Fetch all active user_targeting records
 * 2. Group by unique industry+geo combos to minimize API calls
 * 3. For each combo: create audience → fetch records page by page
 * 4. Dedupe against existing leads (email-based per workspace)
 * 5. Insert new leads with routing fields populated
 * 6. Route to matching users via user_lead_assignments
 * 7. Notify via Slack
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createAudience,
  fetchAudienceRecords,
  buildWorkspaceAudienceFilters,
  type ALEnrichedProfile,
} from '@/lib/audiencelab/api-client'
import {
  normalizeALPayload,
  isLeadWorthy,
  isVerifiedEmail,
} from '@/lib/audiencelab/field-map'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

// Allow up to 5 minutes — AL audience creation + record fetching can be slow
export const maxDuration = 300

const LOG_PREFIX = '[AL Segment Pull Cron]'
const MAX_RECORDS_PER_RUN = 500
const MAX_PAGES = 5

/** US state name → 2-letter code normalization */
const STATE_NAMES: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY',
}

/** Normalize state values to 2-letter codes, deduping the result */
function normalizeStates(states: string[]): string[] {
  const codes = new Set<string>()
  for (const s of states) {
    const upper = s.toUpperCase().trim()
    if (upper.length === 2) {
      codes.add(upper)
    } else {
      const code = STATE_NAMES[s.toLowerCase().trim()]
      if (code) codes.add(code)
    }
  }
  return Array.from(codes)
}

/**
 * Poll for audience records with exponential backoff.
 * AL audiences can take 5–30 seconds to finish processing after creation.
 */
async function fetchAudienceRecordsWithRetry(
  audienceId: string,
  page: number,
  pageSize: number,
  maxAttempts = 5,
): Promise<Awaited<ReturnType<typeof fetchAudienceRecords>>> {
  let delay = 5000 // start at 5 seconds
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetchAudienceRecords(audienceId, page, pageSize)
    if ((response.data?.length ?? 0) > 0 || attempt === maxAttempts) {
      return response
    }
    safeLog(`${LOG_PREFIX} Audience ${audienceId} not ready yet (attempt ${attempt}/${maxAttempts}), waiting ${delay}ms...`)
    await new Promise(r => setTimeout(r, delay))
    delay = Math.min(delay * 1.5, 20000) // cap at 20s
  }
  return await fetchAudienceRecords(audienceId, page, pageSize)
}

interface TargetingCombo {
  industries: string[]
  states: string[]
  workspaceIds: string[]
}

/**
 * Parse comma-separated values from AL records.
 */
function _parseCSV(val: unknown): string[] {
  if (!val || typeof val !== 'string') return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

export async function GET(request: NextRequest) {
  // Auth: Vercel Cron sends CRON_SECRET automatically
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Fix: reject if CRON_SECRET is missing (was previously open when unset)
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if AL API key is configured
  if (!process.env.AUDIENCELAB_ACCOUNT_API_KEY) {
    safeLog(`${LOG_PREFIX} AUDIENCELAB_ACCOUNT_API_KEY not configured, skipping`)
    return NextResponse.json({ skipped: true, reason: 'No API key configured' })
  }

  const supabase = createAdminClient()

  try {
    // Step 1: Fetch all active targeting preferences
    const { data: targetingRows, error: targetError } = await supabase
      .from('user_targeting')
      .select('target_industries, target_states, workspace_id')
      .eq('is_active', true)

    if (targetError || !targetingRows?.length) {
      safeLog(`${LOG_PREFIX} No active targeting found`)
      return NextResponse.json({ skipped: true, reason: 'No active targeting preferences' })
    }

    // Group by unique industry+state combos, normalizing state codes to 2-letter format
    const comboMap = new Map<string, TargetingCombo>()
    for (const row of targetingRows!) {
      const industries = (row.target_industries || []).sort()
      const states = normalizeStates(row.target_states || []).sort()

      if (industries.length === 0 && states.length === 0) continue // skip blank targeting

      const key = `${industries.join(',')}|${states.join(',')}`

      if (comboMap.has(key)) {
        comboMap.get(key)!.workspaceIds.push(row.workspace_id)
      } else {
        comboMap.set(key, { industries, states, workspaceIds: [row.workspace_id] })
      }
    }

    const combos = Array.from(comboMap.values())
    safeLog(`${LOG_PREFIX} Found ${combos.length} unique targeting combo(s)`)

    // Step 2: Pull leads for each combo
    let totalInserted = 0
    let totalSkipped = 0
    const errors: string[] = []

    for (let i = 0; i < combos.length && totalInserted < MAX_RECORDS_PER_RUN; i++) {
      const combo = combos[i]

      try {
        const segmentFilters = buildWorkspaceAudienceFilters({
          industries: combo.industries.length > 0 ? combo.industries : undefined,
          states: combo.states.length > 0 ? combo.states : undefined,
        })

        // Create audience
        const audienceName = `cursive-pull-${combo.industries.join('-').slice(0, 30)}-${combo.states.join('-') || 'national'}-${Date.now()}`
        const audience = await createAudience({ name: audienceName, filters: segmentFilters })

        const audienceId = audience.audienceId
        if (!audienceId) {
          safeLog(`${LOG_PREFIX} No audienceId returned for combo ${i}`)
          errors.push('No audienceId returned')
          continue
        }

        // Fetch records page by page — poll with retry since AL takes time to build the audience
        let inserted = 0
        let skipped = 0
        const remaining = MAX_RECORDS_PER_RUN - totalInserted

        for (let page = 1; page <= MAX_PAGES; page++) {
          const pageSize = Math.min(500, remaining - inserted)
          if (pageSize <= 0) break

          // First page uses retry logic; subsequent pages fetch directly (audience is ready)
          const response = page === 1
            ? await fetchAudienceRecordsWithRetry(audienceId, page, pageSize)
            : await fetchAudienceRecords(audienceId, page, pageSize)
          const records = response.data || []

          if (records.length === 0) break

          for (const record of records) {
            if (inserted >= remaining) break

            const result = await insertLeadFromRecord(supabase, record, combo.workspaceIds[0], combo)
            if (result === 'inserted') inserted++
            else skipped++
          }

          if (page >= (response.total_pages || 1)) break
        }

        totalInserted += inserted
        totalSkipped += skipped
      } catch (err: unknown) {
        const msg = err instanceof Error ? (err as Error).message : 'Unknown error'
        safeError(`${LOG_PREFIX} Error pulling combo ${i}`, err)
        errors.push(msg)
      }
    }

    // Step 3: Route new leads to matching users
    if (totalInserted > 0) {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      const { data: newLeads } = await supabase
        .from('leads')
        .select('id, workspace_id, company_industry, state_code, state, city, postal_code')
        .eq('source', 'audiencelab_pull')
        .gte('created_at', fifteenMinAgo)
        .is('assigned_user_id', null)

      if (newLeads?.length) {
        let routed = 0
        for (const lead of newLeads!) {
          const { data: targetingUsers } = await supabase
            .from('user_targeting')
            .select('user_id, target_industries, target_states, target_cities, target_zips, daily_lead_cap, daily_lead_count, weekly_lead_cap, weekly_lead_count, monthly_lead_cap, monthly_lead_count')
            .eq('workspace_id', lead.workspace_id)
            .eq('is_active', true)

          if (!targetingUsers?.length) continue

          const leadState = lead.state_code || lead.state
          const leadIndustry = lead.company_industry

          for (const ut of targetingUsers!) {
            if (ut.daily_lead_cap && ut.daily_lead_count >= ut.daily_lead_cap) continue
            if (ut.weekly_lead_cap && ut.weekly_lead_count >= ut.weekly_lead_cap) continue
            if (ut.monthly_lead_cap && ut.monthly_lead_count >= ut.monthly_lead_cap) continue

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
                continue
              }
            }

            let matchedIndustry: string | null = null
            const hasIndustry = (ut.target_industries?.length > 0)
            if (hasIndustry) {
              if (leadIndustry && ut.target_industries?.includes(leadIndustry)) {
                matchedIndustry = leadIndustry
              } else {
                continue
              }
            }

            if (!hasGeo && !hasIndustry) continue

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
              if ((assignErr as { code?: string }).code === '23505') continue
              safeError(`${LOG_PREFIX} Failed to assign lead ${lead.id}`, assignErr)
              continue
            }

            await supabase
              .from('leads')
              .update({ assigned_user_id: ut.user_id })
              .eq('id', lead.id)
              .is('assigned_user_id', null)

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

        safeLog(`${LOG_PREFIX} Routed ${routed} assignment(s) for ${newLeads!.length} new leads`)
      }
    }

    // Step 4: Slack notification
    if (totalInserted > 0) {
      sendSlackAlert({
        type: 'system_event',
        severity: 'info',
        message: `AL Segment Pull: ${totalInserted} new leads, ${totalSkipped} skipped (dupes)`,
        metadata: { combos: combos.length, inserted: totalInserted, skipped: totalSkipped, errors: errors.length },
      }).catch((error) => {
        safeError(`${LOG_PREFIX} Slack notification failed:`, error)
      })
    }

    const result = {
      combos_processed: combos.length,
      total_inserted: totalInserted,
      total_skipped: totalSkipped,
      errors,
    }

    safeLog(`${LOG_PREFIX} Complete: ${JSON.stringify(result)}`)

    return NextResponse.json(result)
  } catch (error) {
    safeError(`${LOG_PREFIX} Unhandled error`, error)
    return NextResponse.json({ error: 'Segment pull failed' }, { status: 500 })
  }
}

/**
 * Insert a single lead from an AL audience record, applying the full quality gate.
 * Uses normalizeALPayload + isLeadWorthy — same pipeline as the superpixel webhook.
 */
async function insertLeadFromRecord(
  supabase: ReturnType<typeof createAdminClient>,
  record: ALEnrichedProfile,
  workspaceId: string,
  combo: TargetingCombo
): Promise<'inserted' | 'skipped'> {
  // Normalize using the canonical field-map (handles UPPER_CASE AL fields)
  const normalized = normalizeALPayload(record as Record<string, any>)

  const email = normalized.primary_email
  if (!email) return 'skipped'

  // Quality gate: verified email + proper first+last name + deliverability score ≥ 60
  const worthy = isLeadWorthy({
    eventType: 'segment_pull',
    deliverabilityScore: normalized.deliverability_score,
    hasVerifiedEmail: isVerifiedEmail(normalized.email_validation_status),
    hasBusinessEmail: normalized.business_emails.length > 0,
    hasPhone: normalized.phones.length > 0,
    hasName: !!(normalized.first_name && normalized.last_name),
    hasCompany: !!normalized.company_name?.trim(),
  })

  if (!worthy) return 'skipped'

  // Dedupe: email per workspace
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('email', email)
    .limit(1)
    .maybeSingle()

  if (existing) return 'skipped'

  const phones = normalized.phones
  const fullName = [normalized.first_name, normalized.last_name].filter(Boolean).join(' ')

  const { error } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspaceId,
      source: 'audiencelab_pull',
      enrichment_status: 'enriched' as const,
      status: 'new',
      first_name: normalized.first_name,
      last_name: normalized.last_name,
      full_name: fullName || null,
      email,
      phone: phones[0] || null,
      company_name: normalized.company_name || null,
      company_industry: normalized.company_industry || combo.industries[0] || null,
      company_domain: normalized.company_domain || null,
      city: normalized.city || null,
      state: normalized.state || null,
      state_code: normalized.state || null,
      country: 'US',
      country_code: 'US',
      postal_code: normalized.zip || null,
      job_title: normalized.job_title || null,
      lead_score: normalized.deliverability_score,
      intent_score_calculated: normalized.deliverability_score,
      freshness_score: 100,
      has_email: true,
      has_phone: phones.length > 0,
      validated: isVerifiedEmail(normalized.email_validation_status),
      // Marketplace fields — verified email already confirmed by quality gate above
      is_marketplace_listed: true,
      marketplace_status: 'available',
      verification_status: 'valid',
      enrichment_method: 'audiencelab_pull',
      tags: ['audiencelab', 'segment-pull', ...(combo.industries.map(i => i.toLowerCase()))],
      company_data: {
        name: normalized.company_name || null,
        industry: normalized.company_industry || combo.industries[0] || null,
        domain: normalized.company_domain || null,
      },
      company_location: {
        city: normalized.city || null,
        state: normalized.state || null,
        country: 'US',
      },
    })

  if (error) {
    safeError(`${LOG_PREFIX} Failed to insert lead ${email}`, error)
    return 'skipped'
  }

  return 'inserted'
}
