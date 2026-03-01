/**
 * Pixel V4 Sync
 *
 * Cron job that pulls v4 pixel events from AudienceLab every 2 hours.
 * For each event:
 * - Calculates URL intent score from FULL_URL
 * - Extracts DNC flags, department, seniority, career data
 * - Enriches existing leads in the workspace with richer data
 *
 * This supplements the webhook pipeline (which fires in real-time) with
 * richer v4 data that only the pull API provides.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchPixelEventsV4 } from '@/lib/audiencelab/api-client'
import { scoreUrlIntent, parseDncFlag } from '@/lib/audiencelab/intent-scoring'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[PixelV4Sync]'

export const pixelV4Sync = inngest.createFunction(
  {
    id: 'pixel-v4-sync',
    retries: 2,
    timeouts: { finish: '10m' },
  },
  { cron: '0 */4 * * *' }, // Every 4 hours (cost: 2x fewer cron invocations)
  async ({ step }) => {
    // Step 1: Get all active pixels with AudienceLab pixel IDs
    const pixels = await step.run('get-active-pixels', async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('audiencelab_pixels')
        .select('id, al_pixel_id, workspace_id, last_v4_synced_at')
        .eq('is_active', true)
        .not('al_pixel_id', 'is', null)
        .limit(50)

      if (error) throw new Error(`Failed to fetch pixels: ${error.message}`)
      return data || []
    })

    safeLog(`${LOG_PREFIX} Syncing v4 data for ${pixels.length} pixels`)

    const summary = { pixels: 0, events_processed: 0, leads_enriched: 0, errors: 0 }

    for (const pixel of pixels) {
      const pixelResult = await step.run(`sync-pixel-${pixel.id}`, async () => {
        const supabase = createAdminClient()
        let enriched = 0
        let processed = 0

        try {
          // Fetch up to 500 most recent v4 events
          const response = await fetchPixelEventsV4(pixel.al_pixel_id, 1, 500)

          for (const event of response.events || []) {
            processed++
            if (!event.resolution) continue

            const res = event.resolution

            // Parse emails — try both personal and business
            const rawEmails = [
              ...(res.PERSONAL_EMAILS?.split(',') || []),
              ...(res.PERSONAL_VERIFIED_EMAILS?.split(',') || []),
              res.BUSINESS_EMAIL,
              res.BUSINESS_VERIFIED_EMAILS,
            ]
              .map((e) => e?.trim().toLowerCase())
              .filter((e): e is string => !!e && e.includes('@'))

            if (rawEmails.length === 0) continue

            // Score intent from visited URL
            const { score: intentScore, signal: intentSignal } = scoreUrlIntent(event.full_url)

            // Parse DNC flags
            const dncMobile = parseDncFlag(res.MOBILE_DNC)
            const dncLandline = parseDncFlag(res.LANDLINE_DNC)

            // Build enrichment patch
            const enrichData: Record<string, unknown> = {
              updated_at: new Date().toISOString(),
            }

            if (res.DEPARTMENT) enrichData.department = res.DEPARTMENT
            if (res.SENIORITY_LEVEL) enrichData.seniority_level = res.SENIORITY_LEVEL
            if (res.COMPANY_REVENUE) enrichData.company_revenue = res.COMPANY_REVENUE
            if (res.COMPANY_EMPLOYEE_COUNT) enrichData.company_employee_count = parseInt(res.COMPANY_EMPLOYEE_COUNT, 10) || null
            if (event.full_url) enrichData.page_url = event.full_url
            // Only update intent if we got a meaningful signal (not default 50)
            if (intentScore !== 50) {
              enrichData.intent_score = intentScore
              if (intentSignal) enrichData.intent_signal = intentSignal
            }
            // Always write DNC flags if the v4 event has them
            if (res.MOBILE_DNC !== undefined && res.MOBILE_DNC !== null) {
              enrichData.dnc_mobile = dncMobile
            }
            if (res.LANDLINE_DNC !== undefined && res.LANDLINE_DNC !== null) {
              enrichData.dnc_landline = dncLandline
            }

            // Batch lookup: find first matching lead for any of the emails (1 query vs N)
            const { data: matchedLeads } = await supabase
              .from('leads')
              .select('id')
              .eq('workspace_id', pixel.workspace_id)
              .in('email', rawEmails)
              .limit(1)

            if (matchedLeads && matchedLeads.length > 0) {
              await supabase.from('leads').update(enrichData).eq('id', matchedLeads[0].id)
              enriched++
            }
          }

          // Update last synced timestamp on the pixel
          await supabase
            .from('audiencelab_pixels')
            .update({ last_v4_synced_at: new Date().toISOString() })
            .eq('id', pixel.id)

        } catch (err) {
          safeError(`${LOG_PREFIX} Error syncing pixel ${pixel.id}:`, err)
          return { enriched, processed, error: true }
        }

        return { enriched, processed, error: false }
      })

      summary.pixels++
      summary.events_processed += pixelResult.processed
      summary.leads_enriched += pixelResult.enriched
      if (pixelResult.error) summary.errors++
    }

    safeLog(`${LOG_PREFIX} Complete:`, summary)
    return summary
  }
)
