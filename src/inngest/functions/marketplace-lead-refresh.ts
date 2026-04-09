// Marketplace Lead Refresh
//
// Daily cron job that pulls fresh leads from AudienceLab for each segment
// configured in the audience_lab_segments table and lists them for purchase
// on the marketplace.
//
// Why the rewrite (2026-04-08):
//   The original version hardcoded a list of marketplace segment names
//   ('Technology', 'Financial Services', ...) that did NOT match anything
//   in audience_lab_segments (which contains verticals like 'hvac',
//   'roofing', 'home_security', etc). The ILIKE matching was always
//   returning 0 rows, so the refresh silently ran as a no-op for weeks —
//   that's why the marketplace has shown the same 341 static leads.
//
//   This version uses real segment IDs from the table and routes leads
//   into the three existing marketplace workspaces
//   (00000000-0000-0000-0000-00000000000{1,2,3}) based on industry.

import { getInngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import {
  fetchAudienceRecords,
  AudienceLabUnfilteredError,
  type ALEnrichedProfile,
} from '@/lib/audiencelab/api-client'

const inngest = getInngest()

// Target marketplace size — if we have this many available leads, skip refresh.
const TARGET_MARKETPLACE_SIZE = 500

// Max leads to fetch per audience per run — prevents any one audience
// from dominating and controls AL API cost per run.
const MAX_LEADS_PER_SEGMENT = 60

// Minimum quality — skip any AL record that doesn't meet our bar.
const MIN_QUALITY_SCORE = 40

// Map AL industry tag → marketplace workspace UUID.
// The three placeholder workspaces exist in production and hold the
// existing marketplace leads. Any industry not explicitly mapped falls
// back to Healthcare/Med Spas (id 1) which is the catch-all.
const INDUSTRY_WORKSPACE_MAP: Record<string, string> = {
  // Home Services vertical → 00000000-0000-0000-0000-000000000002
  home_services: '00000000-0000-0000-0000-000000000002',
  hvac: '00000000-0000-0000-0000-000000000002',
  plumbing: '00000000-0000-0000-0000-000000000002',
  contractor: '00000000-0000-0000-0000-000000000002',
  roofing: '00000000-0000-0000-0000-000000000002',
  home_security: '00000000-0000-0000-0000-000000000002',
  security: '00000000-0000-0000-0000-000000000002',

  // Door-to-Door Sales vertical → 00000000-0000-0000-0000-000000000003
  fba: '00000000-0000-0000-0000-000000000003',
  logistics: '00000000-0000-0000-0000-000000000003',
  shipping: '00000000-0000-0000-0000-000000000003',
  real_estate: '00000000-0000-0000-0000-000000000003',
  commercial_real_estate: '00000000-0000-0000-0000-000000000003',
  cre: '00000000-0000-0000-0000-000000000003',
}
const FALLBACK_WORKSPACE = '00000000-0000-0000-0000-000000000001'

function workspaceForIndustry(industry: string): string {
  return INDUSTRY_WORKSPACE_MAP[industry.toLowerCase()] ?? FALLBACK_WORKSPACE
}

function scoreRecord(r: ALEnrichedProfile): number {
  let score = 0
  const bve = r.BUSINESS_VERIFIED_EMAILS
  const pve = r.PERSONAL_VERIFIED_EMAILS
  if ((typeof bve === 'string' && bve.length > 0)) score += 30
  else if ((typeof pve === 'string' && pve.length > 0)) score += 25
  else if (r.BUSINESS_EMAIL) score += 12
  else if (r.PERSONAL_EMAILS) score += 8
  if (r.FIRST_NAME && r.LAST_NAME) score += 15
  if (r.MOBILE_PHONE) score += 12
  else if (r.DIRECT_NUMBER) score += 10
  else if (r.PERSONAL_PHONE) score += 6
  if (r.COMPANY_NAME) score += 8
  if (r.JOB_TITLE) score += 7
  if (r.COMPANY_STATE || r.PERSONAL_STATE) score += 3
  if (r.COMPANY_DOMAIN) score += 5
  return score
}

function pickEmail(r: ALEnrichedProfile): string | null {
  const bve = r.BUSINESS_VERIFIED_EMAILS
  if (typeof bve === 'string' && bve.includes('@')) return bve.split(',')[0].trim()
  const pve = r.PERSONAL_VERIFIED_EMAILS
  if (typeof pve === 'string' && pve.includes('@')) return pve.split(',')[0].trim()
  if (typeof r.BUSINESS_EMAIL === 'string' && r.BUSINESS_EMAIL.includes('@')) return r.BUSINESS_EMAIL
  const pe = r.PERSONAL_EMAILS
  if (typeof pe === 'string' && pe.includes('@')) return pe.split(',')[0].trim()
  return null
}

/**
 * Daily marketplace lead refresh.
 * Runs at 2 AM CT (7 AM UTC) daily.
 */
export const marketplaceLeadRefresh = inngest.createFunction(
  {
    id: 'marketplace-lead-refresh',
    retries: 2,
    timeouts: { finish: '10m' },
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 7 * * *' },
  async ({ step }) => {
    const supabase = createAdminClient()

    // Step 1: Check if we have enough marketplace leads already.
    const currentCount = await step.run('check-current-count', async () => {
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('is_marketplace_listed', true)
        .eq('marketplace_status', 'available')
      return count ?? 0
    })

    if (currentCount >= TARGET_MARKETPLACE_SIZE) {
      return {
        skipped: true,
        reason: `Marketplace already has ${currentCount} available leads`,
      }
    }

    // Step 2: Load all configured segments.
    const segments = await step.run('load-segments', async () => {
      const { data, error } = await supabase
        .from('audience_lab_segments')
        .select('id, industry, segment_name, segment_id')
        .not('segment_id', 'is', null)
      if (error) {
        safeError('[MarketplaceRefresh] Failed to load segments:', error.message)
        return []
      }
      return data || []
    })

    if (segments.length === 0) {
      return { skipped: true, reason: 'No audience_lab_segments configured' }
    }

    // Dedupe segment_id — the table has multiple rows pointing to the same segment
    const uniqueSegments = Array.from(
      new Map(segments.map((s: any) => [s.segment_id, s])).values()
    ) as typeof segments

    safeLog(`[MarketplaceRefresh] Loaded ${uniqueSegments.length} unique segments`)

    // Step 3: For each segment, pull fresh records via previewAudience.
    interface SegmentStepResult {
      added: number
      skipped: number
      error?: string
    }

    let totalAdded = 0
    const perSegmentResults: Array<{ segment: string; added: number; skipped: number; error?: string }> = []

    for (const segment of uniqueSegments) {
      if (totalAdded >= TARGET_MARKETPLACE_SIZE - currentCount) break

      const result: SegmentStepResult = await step.run(`segment-${segment.id}`, async (): Promise<SegmentStepResult> => {
        const workspaceId = workspaceForIndustry(segment.industry)
        try {
          if (!process.env.AUDIENCELAB_ACCOUNT_API_KEY) {
            return { added: 0, skipped: 0, error: 'AL API key not configured' }
          }

          // The "segment_id" in audience_lab_segments is actually an AL audience UUID.
          // Use fetchAudienceRecords to pull from the prebuilt audience.
          let recordsResponse
          try {
            recordsResponse = await fetchAudienceRecords(
              segment.segment_id,
              1,
              MAX_LEADS_PER_SEGMENT
            )
          } catch (fetchErr) {
            if (fetchErr instanceof AudienceLabUnfilteredError) {
              return { added: 0, skipped: 0, error: 'unfiltered-response' }
            }
            throw fetchErr
          }

          const records = (recordsResponse.data ?? []).slice(0, MAX_LEADS_PER_SEGMENT)
          if (records.length === 0) {
            return { added: 0, skipped: 0 }
          }

          // Score + filter to quality records with deliverable email
          const qualified = records
            .map((r) => ({ record: r, score: scoreRecord(r), email: pickEmail(r) }))
            .filter((x) => x.score >= MIN_QUALITY_SCORE && x.email)

          if (qualified.length === 0) {
            return { added: 0, skipped: records.length }
          }

          // Dedupe against existing marketplace leads by email
          const emails = qualified.map((q) => q.email!)
          const { data: existing } = await supabase
            .from('leads')
            .select('email')
            .in('email', emails)
            .eq('is_marketplace_listed', true)
          const existingSet = new Set((existing || []).map((r: any) => r.email))

          const toInsert = qualified
            .filter((q) => !existingSet.has(q.email!))
            .map((q) => {
              const r = q.record
              return {
                workspace_id: workspaceId,
                first_name: r.FIRST_NAME ?? null,
                last_name: r.LAST_NAME ?? null,
                email: q.email,
                phone: r.MOBILE_PHONE ?? r.DIRECT_NUMBER ?? null,
                company_name: r.COMPANY_NAME ?? null,
                job_title: r.JOB_TITLE ?? null,
                source: 'audiencelab_marketplace',
                status: 'new',
                is_marketplace_listed: true,
                marketplace_status: 'available',
                marketplace_price: 0.6,
                verification_status: 'valid',
                intent_score_calculated: Math.min(100, q.score + 20),
                freshness_score: 90,
                lead_score: Math.min(100, q.score + 20),
                delivered_at: new Date().toISOString(),
                company_industry: r.COMPANY_INDUSTRY ?? segment.industry,
                city: r.COMPANY_CITY ?? r.PERSONAL_CITY ?? null,
                state: r.COMPANY_STATE ?? r.PERSONAL_STATE ?? null,
                postal_code: r.COMPANY_ZIP ?? r.PERSONAL_ZIP ?? null,
                metadata: {
                  audiencelab_segment_id: segment.segment_id,
                  audiencelab_segment_name: segment.segment_name,
                  audiencelab_industry: segment.industry,
                  source: 'marketplace_refresh',
                },
              }
            })

          if (toInsert.length === 0) {
            return { added: 0, skipped: qualified.length }
          }

          const { error: insertError } = await supabase.from('leads').insert(toInsert)
          if (insertError) {
            safeError(`[MarketplaceRefresh] Insert failed for ${segment.industry}:`, insertError.message)
            return { added: 0, skipped: 0, error: insertError.message }
          }

          safeLog(
            `[MarketplaceRefresh] Added ${toInsert.length} leads from segment ${segment.industry} → workspace ${workspaceId}`
          )
          return { added: toInsert.length, skipped: records.length - toInsert.length }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          safeError(`[MarketplaceRefresh] Segment ${segment.industry} error:`, msg)
          return { added: 0, skipped: 0, error: msg }
        }
      })

      totalAdded += result.added
      perSegmentResults.push({
        segment: segment.industry,
        added: result.added,
        skipped: result.skipped,
        error: result.error,
      })
    }

    return {
      success: true,
      previousCount: currentCount,
      added: totalAdded,
      newTotal: currentCount + totalAdded,
      segments: perSegmentResults,
    }
  }
)
