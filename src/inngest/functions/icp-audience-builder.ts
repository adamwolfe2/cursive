/**
 * ICP Audience Builder — Launch Video Campaign
 *
 * Builds 4 distinct Audience Labs audiences targeting funded startup founders
 * who need launch videos. Pulls records into the Cursive HQ workspace tagged
 * for the outbound campaign.
 *
 * Audience tiers (matching the campaign ICP strategy):
 *   1. Tier 1A — Firmographic: C-Suite at tech/SaaS/AI companies, 5-50 employees, CA/WA/OR
 *   2. Tier 1B — Intent: People actively researching video production (brand video, explainer, etc.)
 *   3. Tier 2A — Firmographic: C-Suite/VP at tech companies, 50-500 employees, CA/WA/OR (Series B/C range)
 *   4. Tier 2B — Intent: People working on brand strategy / product launch (pre-video signal)
 *
 * Trigger: `icp/audience-build` event (manual) — run once or on-demand
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  previewAudience,
  createAudience,
  createCustomAudience,
  fetchAudienceRecords,
  AudienceLabUnfilteredError,
  type ALEnrichedProfile,
} from '@/lib/audiencelab/api-client'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { createOnFailureHandler } from '@/inngest/utils/on-failure-handler'

// ─── Constants ────────────────────────────────────────────────────────────────

// Cursive HQ workspace — where all campaign leads are stored
const CURSIVE_HQ_WORKSPACE_ID = '691fefc8-8ba8-4ef2-8a78-43ecce9f3e0e'

const MAX_RECORDS_PER_AUDIENCE = 500
const LOG_PREFIX = '[ICP Audience Builder]'

// Campaign tag applied to all leads from this builder
const CAMPAIGN_TAG = 'launch-video-icp'

// ─── Audience Definitions ─────────────────────────────────────────────────────

const AUDIENCES = [
  {
    id: 'tier1a-firmographic',
    label: 'Tier 1A — Tech Founders (5-50 emp, CA/WA/OR)',
    tier: 'tier1',
    type: 'firmographic' as const,
    filters: {
      business: {
        seniority: ['C-Suite'] as Array<'C-Suite'>,
        industry: [
          'Technology',
          'Software',
          'Internet',
          'Computer Software',
          'Information Technology and Services',
          'Artificial Intelligence',
        ],
        employeeCount: { min: 5, max: 50 },
      },
      location: {
        state: ['CA', 'WA', 'OR'],
      },
    },
  },
  {
    id: 'tier1b-video-intent',
    label: 'Tier 1B — Active Video Production Researchers',
    tier: 'tier1',
    type: 'custom' as const,
    topics: [
      'brand video production',
      'explainer video',
      'product launch video',
      'startup video',
      'corporate video production',
      'SaaS explainer video',
      'promotional video production',
      'product demo video',
      'animated explainer video',
      'video production services',
      'brand storytelling video',
    ],
    description: 'People actively researching video production services — highest purchase intent',
  },
  {
    id: 'tier2a-firmographic',
    label: 'Tier 2A — Series B/C Range (50-500 emp, CA/WA/OR)',
    tier: 'tier2',
    type: 'firmographic' as const,
    filters: {
      business: {
        seniority: ['C-Suite', 'VP'] as Array<'C-Suite' | 'VP'>,
        industry: [
          'Technology',
          'Software',
          'Internet',
          'Computer Software',
          'Information Technology and Services',
          'Artificial Intelligence',
          'Financial Services',
          'Health, Wellness and Fitness',
        ],
        employeeCount: { min: 50, max: 500 },
      },
      location: {
        state: ['CA', 'WA', 'OR', 'CO'],
      },
    },
  },
  {
    id: 'tier2b-brand-intent',
    label: 'Tier 2B — Brand Builders / Pre-Launch Signal',
    tier: 'tier2',
    type: 'custom' as const,
    topics: [
      'brand awareness campaign',
      'brand building strategy',
      'brand storytelling',
      'brand positioning strategy',
      'branding agency',
      'creative agency',
      'product launch marketing',
      'startup branding',
      'go to market strategy',
      'brand identity design',
    ],
    description: 'People building brand strategy / planning launch — 2-4 week pre-video window',
  },
]

// ─── Inngest Function ─────────────────────────────────────────────────────────

export const icpAudienceBuilder = inngest.createFunction(
  {
    id: 'icp-audience-builder',
    name: 'ICP Audience Builder — Launch Video Campaign',
    retries: 1,
    timeouts: { finish: '20m' },
    concurrency: [{ limit: 1 }],
    onFailure: createOnFailureHandler('icp-audience-builder'),
  },
  { event: 'icp/audience-build' },
  async ({ event, step }) => {
    const supabase = createAdminClient()
    const dryRun: boolean = (event.data as { dry_run?: boolean }).dry_run ?? false

    safeLog(`${LOG_PREFIX} Starting ICP audience build — dry_run=${dryRun}`)

    // ─── Step 1: Check API key ───────────────────────────────────────────────
    const apiKeyOk = await step.run('check-api-key', async () => {
      if (!process.env.AUDIENCELAB_ACCOUNT_API_KEY) {
        safeError(`${LOG_PREFIX} AUDIENCELAB_ACCOUNT_API_KEY not configured`)
        return false
      }
      return true
    })

    if (!apiKeyOk) return { skipped: true, reason: 'AUDIENCELAB_ACCOUNT_API_KEY not configured' }

    // ─── Step 2: Preview all audiences in parallel ───────────────────────────
    const previews = await step.run('preview-all-audiences', async () => {
      const results: Record<string, { count: number; error?: string }> = {}

      for (const audience of AUDIENCES) {
        try {
          let count = 0

          if (audience.type === 'custom') {
            // Custom audiences don't have a preview endpoint — estimate based on topics count
            // We'll create them directly and report actual counts after fetch
            count = -1 // Sentinel: will be filled after creation
          } else {
            const preview = await previewAudience({
              days_back: 7,
              filters: audience.filters,
              limit: 10,
              include_dnc: false,
            }).catch(() => ({ count: 0, result: [] }))
            count = preview.count || 0
          }

          results[audience.id] = { count }
          safeLog(`${LOG_PREFIX} Preview [${audience.label}]: ${count === -1 ? 'intent-based (no preview)' : count} records`)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          safeError(`${LOG_PREFIX} Preview failed for ${audience.id}:`, err)
          results[audience.id] = { count: 0, error: msg }
        }
      }

      return results
    })

    if (dryRun) {
      return {
        dry_run: true,
        previews,
        message: 'Dry run complete — no leads pulled. Remove dry_run: true to execute.',
      }
    }

    // ─── Step 3: Build each audience and pull leads ──────────────────────────
    const summary: Array<{
      audience: string
      tier: string
      pulled: number
      inserted: number
      skipped: number
      error?: string
    }> = []

    for (const audience of AUDIENCES) {
      const result = await step.run(`pull-${audience.id}`, async () => {
        try {
          let audienceId: string

          if (audience.type === 'custom') {
            const created = await createCustomAudience({
              name: `cursive-icp-${audience.id}-${Date.now()}`,
              topics: audience.topics,
              description: audience.description,
            })
            audienceId = created.audienceId
          } else {
            const created = await createAudience({
              name: `cursive-icp-${audience.id}-${Date.now()}`,
              filters: audience.filters,
            })
            audienceId = created.audienceId
          }

          if (!audienceId) {
            return { pulled: 0, inserted: 0, skipped: 0, error: 'No audienceId returned' }
          }

          safeLog(`${LOG_PREFIX} Created audience ${audienceId} for ${audience.label}`)

          // Fetch first page of records
          let recordsResponse
          try {
            recordsResponse = await fetchAudienceRecords(audienceId, 1, MAX_RECORDS_PER_AUDIENCE)
          } catch (fetchErr) {
            if (fetchErr instanceof AudienceLabUnfilteredError) {
              safeError(`${LOG_PREFIX} Unfiltered response for ${audience.id}, skipping`)
              return { pulled: 0, inserted: 0, skipped: 0, error: 'Unfiltered response — audience too broad' }
            }
            throw fetchErr
          }

          const records = recordsResponse.data || []
          safeLog(`${LOG_PREFIX} Fetched ${records.length} records for ${audience.label}`)

          if (records.length === 0) {
            return { pulled: 0, inserted: 0, skipped: 0 }
          }

          // Dedup + insert
          let inserted = 0
          let skipped = 0

          for (const record of records) {
            const result = await insertICPLead(supabase, record, audience.id, audience.tier, audience.label)
            if (result === 'inserted') inserted++
            else skipped++
          }

          return { pulled: records.length, inserted, skipped }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          safeError(`${LOG_PREFIX} Failed to pull ${audience.id}:`, err)
          return { pulled: 0, inserted: 0, skipped: 0, error: msg }
        }
      })

      summary.push({
        audience: audience.label,
        tier: audience.tier,
        ...result,
      })
    }

    // ─── Step 4: Notify ──────────────────────────────────────────────────────
    await step.run('notify', async () => {
      const totalInserted = summary.reduce((sum, s) => sum + s.inserted, 0)
      const totalPulled = summary.reduce((sum, s) => sum + s.pulled, 0)

      await sendSlackAlert({
        type: 'system_event',
        severity: 'info',
        message: `ICP Audience Builder complete: ${totalInserted} new leads pulled for Launch Video campaign`,
        metadata: {
          workspace: 'Cursive HQ',
          total_pulled: totalPulled,
          total_inserted: totalInserted,
          audiences: summary.map(s => ({
            name: s.audience,
            tier: s.tier,
            inserted: s.inserted,
            skipped: s.skipped,
            error: s.error,
          })),
          tag: CAMPAIGN_TAG,
        },
      }).catch((err) => safeError(`${LOG_PREFIX} Slack alert failed:`, err))

      safeLog(`${LOG_PREFIX} Done. Total inserted: ${totalInserted}`, summary)
    })

    return {
      workspace: 'Cursive HQ',
      audiences_processed: AUDIENCES.length,
      summary,
    }
  }
)

// ─── Lead Insert Helper ────────────────────────────────────────────────────────

async function insertICPLead(
  supabase: ReturnType<typeof createAdminClient>,
  record: ALEnrichedProfile,
  audienceId: string,
  tier: string,
  audienceLabel: string
): Promise<'inserted' | 'skipped'> {
  const email = record.BUSINESS_EMAIL || record.PERSONAL_EMAILS?.split(',')[0]
  if (!email) return 'skipped'

  const normalizedEmail = email.toLowerCase()

  // Global dedup
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('email', normalizedEmail)
    .limit(1)
    .maybeSingle()

  if (existing) return 'skipped'

  const firstName = record.FIRST_NAME || ''
  const lastName = record.LAST_NAME || ''

  const { error } = await supabase.from('leads').insert({
    workspace_id: CURSIVE_HQ_WORKSPACE_ID,
    source: 'audiencelab_pull',
    enrichment_status: 'enriched',
    status: 'new',
    first_name: firstName || null,
    last_name: lastName || null,
    full_name: [firstName, lastName].filter(Boolean).join(' ') || null,
    email: normalizedEmail,
    phone: record.MOBILE_PHONE || record.DIRECT_NUMBER || record.PERSONAL_PHONE || null,
    company_name: record.COMPANY_NAME || null,
    company_industry: record.COMPANY_INDUSTRY || null,
    company_domain: record.COMPANY_DOMAIN || null,
    company_employee_count: record.COMPANY_EMPLOYEE_COUNT
      ? parseInt(String(record.COMPANY_EMPLOYEE_COUNT), 10) || null
      : null,
    city: record.PERSONAL_CITY || record.COMPANY_CITY || null,
    state: record.PERSONAL_STATE || record.COMPANY_STATE || null,
    state_code: record.PERSONAL_STATE || record.COMPANY_STATE || null,
    country: 'US',
    country_code: 'US',
    job_title: record.JOB_TITLE || null,
    contact_seniority: record.SENIORITY_LEVEL || null,
    linkedin_url: record.COMPANY_LINKEDIN_URL || record.INDIVIDUAL_LINKEDIN_URL || null,
    has_email: true,
    has_phone: !!(record.MOBILE_PHONE || record.DIRECT_NUMBER || record.PERSONAL_PHONE),
    enrichment_method: 'audiencelab_pull',
    tags: [
      CAMPAIGN_TAG,
      tier,
      audienceId,
      'launch-video',
      'outbound-2026',
    ],
    metadata: {
      icp_tier: tier,
      icp_audience: audienceLabel,
      campaign: 'launch-video-production',
      pulled_at: new Date().toISOString(),
    },
    company_data: {
      name: record.COMPANY_NAME || null,
      industry: record.COMPANY_INDUSTRY || null,
      domain: record.COMPANY_DOMAIN || null,
      employee_count: record.COMPANY_EMPLOYEE_COUNT || null,
    },
    company_location: {
      city: record.PERSONAL_CITY || record.COMPANY_CITY || null,
      state: record.PERSONAL_STATE || record.COMPANY_STATE || null,
      country: 'US',
    },
  })

  if (error) {
    safeError(`${LOG_PREFIX} Insert failed for ${normalizedEmail}:`, error)
    return 'skipped'
  }

  return 'inserted'
}
