/**
 * Pixel V4 Sync — cron + per-pixel worker
 *
 * Pulls v4 pixel events from AudienceLab on a schedule. For every event:
 *  - If the resolved visitor's email matches an existing lead in the
 *    workspace → ENRICH that lead with the richer v4 data (DNC flags,
 *    department, intent score, page url).
 *  - If the email is new to the workspace → INSERT it as a new lead via
 *    the shared `insertLeadFromALRecord` so visitors land in the
 *    dashboard's "Recent Leads" automatically. This is the half that was
 *    missing pre-2026-06-06: the prior implementation only enriched
 *    existing leads, so identified visitors who weren't already in the
 *    workspace fell on the floor.
 *
 * Architecture split:
 *  - `pixelV4SyncCron`   — every 4h cron. Lists active pixels, fans out
 *                          one `pixel/v4-sync.requested` event per pixel.
 *  - `pixelV4SyncWorker` — handles one pixel at a time, with per-pixel
 *                          concurrency=1 so a manual retrigger or a
 *                          retry can never race a still-running sync on
 *                          the same pixel.
 *
 * The webhook pipeline remains the canonical real-time path. This pull
 * is purely additive resilience: it back-fills events the webhook
 * missed, and v4 carries richer fields than the webhook payload.
 * Deduplication by (workspace_id, email) inside the shared inserter
 * means a webhook+pull collision never double-inserts.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchPixelEventsV4, fetchPixelEvents } from '@/lib/audiencelab/api-client'
import { scoreUrlIntent, parseDncFlag } from '@/lib/audiencelab/intent-scoring'
import { insertLeadFromALRecord } from '@/lib/audiencelab/lead-inserter'
import { v4ResolutionToProfile } from '@/lib/audiencelab/provision-helpers'
import { assessLeadQuality } from '@/lib/services/lead-quality.service'
import { maybeEnrichTopUp } from '@/lib/services/lead-enrichment.service'
import { touchFunnelPixelLastEvent } from '@/lib/funnel/order.service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[PixelV4Sync]'

// Cap concurrent pixels processed per cron tick — keeps the fan-out
// bounded even if account has many active pixels.
const MAX_PIXELS_PER_TICK = 50

// V4 page size — small enough to fit comfortably in a single step,
// large enough to amortize the HTTP round-trip cost.
const V4_PAGE_SIZE = 500

// Max pages to walk per pixel per run. Bounds work while still covering a
// large backlog: 20 × 500 = 10k events/run. Without pagination a busy pixel
// with >500 new events between runs would have the overflow skipped forever
// once the watermark advanced.
const MAX_V4_PAGES = 20

// If a pixel is older than this AND a sync run produces zero usable
// events AND its prior run was also zero, escalate to Slack so ops can
// poke AudienceLab. Younger pixels are still expected to be quiet.
const SILENT_PIXEL_AGE_HOURS = 24

// =============================================================================
// Helpers (pure, exported for testability)
// =============================================================================

/** Parse all candidate emails from a v4 resolution, lowercased + deduped. */
export function extractV4Emails(resolution: {
  PERSONAL_EMAILS?: string
  PERSONAL_VERIFIED_EMAILS?: string
  BUSINESS_EMAIL?: string
  BUSINESS_VERIFIED_EMAILS?: string
}): string[] {
  const raw = [
    ...(resolution.PERSONAL_EMAILS?.split(',') || []),
    ...(resolution.PERSONAL_VERIFIED_EMAILS?.split(',') || []),
    resolution.BUSINESS_EMAIL,
    resolution.BUSINESS_VERIFIED_EMAILS,
  ]
  const seen = new Set<string>()
  const out: string[] = []
  for (const e of raw) {
    const trimmed = e?.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) continue
    if (seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

/**
 * Build the enrich-existing-lead patch payload. Only writes fields that
 * have a meaningful value so we don't overwrite a richer lead with
 * weaker v4 data.
 */
export function buildV4EnrichPatch(
  resolution: Record<string, unknown>,
  fullUrl: string | null | undefined
): Record<string, unknown> {
  const res = resolution as {
    DEPARTMENT?: string
    SENIORITY_LEVEL?: string
    COMPANY_REVENUE?: string
    COMPANY_EMPLOYEE_COUNT?: string
    MOBILE_DNC?: string | boolean | null
    LANDLINE_DNC?: string | boolean | null
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (res.DEPARTMENT) patch.department = res.DEPARTMENT
  if (res.SENIORITY_LEVEL) patch.seniority_level = res.SENIORITY_LEVEL
  if (res.COMPANY_REVENUE) patch.company_revenue = res.COMPANY_REVENUE
  if (res.COMPANY_EMPLOYEE_COUNT) {
    patch.company_employee_count = parseInt(res.COMPANY_EMPLOYEE_COUNT, 10) || null
  }
  if (fullUrl) patch.page_url = fullUrl

  // Intent — only override if URL had a meaningful pattern (not default 50).
  const { score, signal } = scoreUrlIntent(fullUrl)
  if (score !== 50) {
    patch.intent_score = score
    if (signal) patch.intent_signal = signal
  }

  // Always write DNC flags when present — they're authoritative.
  if (res.MOBILE_DNC !== undefined && res.MOBILE_DNC !== null) {
    patch.dnc_mobile = parseDncFlag(res.MOBILE_DNC)
  }
  if (res.LANDLINE_DNC !== undefined && res.LANDLINE_DNC !== null) {
    patch.dnc_landline = parseDncFlag(res.LANDLINE_DNC)
  }

  return patch
}

// =============================================================================
// Cron — fan out one event per active pixel
// =============================================================================

export const pixelV4SyncCron = inngest.createFunction(
  {
    id: 'pixel-v4-sync-cron',
    name: 'Pixel V4 Sync (cron fan-out)',
    retries: 1,
    timeouts: { finish: '2m' },
  },
  { cron: '0 * * * *' }, // Hourly — keeps every pixel's visitor pipeline fresh
  async ({ step }) => {
    const pixels = await step.run('list-active-pixels', async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('audiencelab_pixels')
        // NOTE: the AudienceLab pixel id lives in the `pixel_id` column.
        // (There is no `al_pixel_id` column — selecting it errored, which
        // silently dispatched 0 pixels and made the whole V4 pull a no-op.)
        .select('id, pixel_id, workspace_id, created_at, last_v4_synced_at')
        .eq('is_active', true)
        .not('pixel_id', 'is', null)
        .limit(MAX_PIXELS_PER_TICK)

      if (error) {
        safeError(`${LOG_PREFIX} Failed to list pixels:`, error)
        return []
      }
      return data || []
    })

    if (pixels.length === 0) {
      safeLog(`${LOG_PREFIX} No active pixels to sync`)
      return { dispatched: 0 }
    }

    // Fan out one event per pixel — the worker picks them up with
    // per-pixel concurrency=1 so two collide-free.
    await step.run('dispatch-pixel-events', async () => {
      await inngest.send(
        pixels.map((p) => ({
          name: 'pixel/v4-sync.requested',
          data: {
            pixel_row_id: p.id,
            // Event field stays `al_pixel_id` (worker + concurrency key
            // unchanged); it is sourced from the real `pixel_id` column.
            al_pixel_id: p.pixel_id as string,
            workspace_id: p.workspace_id as string,
            pixel_created_at: p.created_at as string,
            last_v4_synced_at: (p.last_v4_synced_at as string | null) ?? null,
          },
        }))
      )
    })

    safeLog(`${LOG_PREFIX} Dispatched v4 sync for ${pixels.length} pixels`)
    return { dispatched: pixels.length }
  }
)

// =============================================================================
// Worker — handle one pixel at a time, per-pixel concurrency
// =============================================================================

export const pixelV4SyncWorker = inngest.createFunction(
  {
    id: 'pixel-v4-sync-worker',
    name: 'Pixel V4 Sync (worker)',
    retries: 2,
    timeouts: { finish: '10m' },
    // Per-pixel serialization — two events for the same pixel queue
    // instead of racing, so we never double-process the same v4 window.
    concurrency: {
      key: 'event.data.al_pixel_id',
      limit: 1,
    },
  },
  { event: 'pixel/v4-sync.requested' },
  async ({ event, step }) => {
    const {
      pixel_row_id,
      al_pixel_id,
      workspace_id,
      pixel_created_at,
      last_v4_synced_at,
    } = event.data as {
      pixel_row_id: string
      al_pixel_id: string
      workspace_id: string
      pixel_created_at: string
      last_v4_synced_at: string | null
    }

    if (!al_pixel_id || !workspace_id) {
      safeError(`${LOG_PREFIX} Worker missing pixel/workspace id`, event.data)
      return { skipped: true, reason: 'missing_ids' }
    }

    const apiKeyOk = await step.run('check-api-key', async () => {
      return !!process.env.AUDIENCELAB_ACCOUNT_API_KEY
    })
    if (!apiKeyOk) {
      return { skipped: true, reason: 'no_api_key' }
    }

    // ─── Pull + process v4 events ───────────────────────────────────
    const result = await step.run(`sync-pixel-${pixel_row_id}`, async () => {
      const supabase = createAdminClient()
      const watermark = last_v4_synced_at ? new Date(last_v4_synced_at).getTime() : 0

      let processed = 0
      let enriched = 0
      let inserted = 0
      let skippedNoEmail = 0
      // Advance the watermark to the NEWEST event we actually processed —
      // never to wall-clock now(), which would skip events that exist
      // server-side but weren't in the pages we read this run.
      let maxEventTs = watermark

      // Track emails handled in THIS run to avoid double-inserting when
      // a single pixel has multiple events for the same person.
      const handledEmails = new Set<string>()

      // Walk pages until a short/empty page (last page) or the cap. Single
      // page-1-only fetches silently dropped events 501+ once the watermark
      // advanced past them.
      for (let page = 1; page <= MAX_V4_PAGES; page++) {
        let response: Awaited<ReturnType<typeof fetchPixelEventsV4>>
        try {
          response = await fetchPixelEventsV4(al_pixel_id, page, V4_PAGE_SIZE)
        } catch (err) {
          // AL's V4 endpoint has been returning 500s. Fall back to the V3
          // events endpoint (GET /pixels/{id}) — identical envelope +
          // resolution shape, so the lead mapper works the same.
          safeError(`${LOG_PREFIX} V4 fetch failed (pixel ${al_pixel_id}, page ${page}), falling back to V3:`, err)
          try {
            response = await fetchPixelEvents(al_pixel_id, page, V4_PAGE_SIZE)
            safeLog(`${LOG_PREFIX} V3 fallback succeeded for pixel ${al_pixel_id} page ${page}`)
          } catch (v3err) {
            // Page 1 total failure → throw so Inngest retries the whole run.
            // Later-page failure → stop paginating, keep what we processed.
            if (page === 1) {
              safeError(`${LOG_PREFIX} V3 fallback also failed for pixel ${al_pixel_id}:`, v3err)
              throw v3err
            }
            safeError(`${LOG_PREFIX} page ${page} fetch failed, stopping pagination:`, v3err)
            break
          }
        }

        const events = response.events || []
        if (events.length === 0) break

        for (const event of events) {
          processed++
          if (!event.resolution) continue

          // Watermark — skip events at/older than our last successful sync.
          // Track the newest timestamp seen so we can advance correctly.
          if (event.event_timestamp) {
            const ts = new Date(event.event_timestamp).getTime()
            if (!Number.isNaN(ts)) {
              if (watermark > 0 && ts <= watermark) continue
              if (ts > maxEventTs) maxEventTs = ts
            }
          }

          const emails = extractV4Emails(event.resolution)
          if (emails.length === 0) {
            skippedNoEmail++
            continue
          }

          // Already handled in this run? Skip — webhook OR our own loop
          // could have already inserted/enriched.
          const dedupKey = emails[0]
          if (handledEmails.has(dedupKey)) continue

          // Look for an existing lead matching ANY of the candidate emails.
          const { data: matchedLeads } = await supabase
            .from('leads')
            .select('id')
            .eq('workspace_id', workspace_id)
            .in('email', emails)
            .limit(1)

          const enrichPatch = buildV4EnrichPatch(
            event.resolution as Record<string, unknown>,
            event.full_url
          )

          if (matchedLeads && matchedLeads.length > 0) {
            // ENRICH existing lead
            const { error } = await supabase
              .from('leads')
              .update(enrichPatch)
              .eq('id', matchedLeads[0].id)
            if (!error) {
              enriched++
              handledEmails.add(dedupKey)
            }
            continue
          }

          // INSERT new lead via shared inserter — this is the visitor →
          // dashboard-lead path that was missing pre-2026-06-06.
          const profile = v4ResolutionToProfile(event.resolution)
          // QUALITY GATE v2: same unified bar as the audience path — verified
          // email required + explicit-bad email_validation_status rejected.
          // Visitors that don't pass are not surfaced as leads (the raw event is
          // still stored upstream). markVerified stamps the ones we do insert.
          const quality = assessLeadQuality(profile)
          if (!quality.deliverable) {
            skippedNoEmail++
            continue
          }

          // Top-up a sparse-but-deliverable visitor before insert.
          const finalProfile = await maybeEnrichTopUp(profile, quality.needsEnrichment)

          const insertResult = await insertLeadFromALRecord(finalProfile, {
            workspaceId: workspace_id,
            sourceTag: 'audiencelab_pixel_v4',
            extraTags: ['visitor', 'pixel-v4'],
            industries: [],
            markVerified: true,
          })

          if (insertResult.outcome === 'inserted' && insertResult.leadId) {
            // Apply the v4-specific enrichment (intent score from full_url,
            // DNC flags) — the shared inserter doesn't know about pages.
            await supabase
              .from('leads')
              .update(enrichPatch)
              .eq('id', insertResult.leadId)
            inserted++
            handledEmails.add(dedupKey)
          }
          // Outcome 'skipped_duplicate' is expected when webhook beat us
          // here; not an error. 'skipped_quality' / 'skipped_no_email'
          // also no-op silently.
        }

        // Last page reached.
        if (events.length < V4_PAGE_SIZE) break
      }

      // Advance watermark to the newest processed event timestamp. Only
      // moves forward; if nothing newer was seen, leave it untouched so we
      // never skip a not-yet-arrived event by jumping to now().
      if (maxEventTs > watermark) {
        await supabase
          .from('audiencelab_pixels')
          .update({ last_v4_synced_at: new Date(maxEventTs).toISOString() })
          .eq('id', pixel_row_id)
      }

      return {
        processed,
        enriched,
        inserted,
        skippedNoEmail,
        usableEvents: enriched + inserted,
      }
    })

    // Stamp pixel_last_event_at on the funnel order(s) for this pixel so the
    // first-visitor "aha" email fires even when the webhook missed the event
    // and the pull is the path that surfaced it.
    if (result.usableEvents > 0) {
      await step.run('touch-funnel-last-event', async () => {
        await touchFunnelPixelLastEvent(al_pixel_id)
      })

      // Fire the first-visitor "aha" check immediately instead of waiting for
      // its 15-min cron — the pull just surfaced new visitor leads, so a brand
      // new buyer gets their activation email within seconds, not minutes.
      await step.sendEvent('trigger-first-visitor-check', {
        name: 'funnel/first-visitor.run',
      })
    }

    // ─── Failsafe alert: silent pixel after 24h ────────────────────
    // Only fire if the pixel has been alive long enough that we'd
    // expect at least one usable event by now AND this run was empty.
    if (result.usableEvents === 0) {
      const pixelAgeHours =
        (Date.now() - new Date(pixel_created_at).getTime()) / 3_600_000
      if (pixelAgeHours >= SILENT_PIXEL_AGE_HOURS) {
        await step.run('silent-pixel-alert', async () => {
          // Don't spam Slack on every cron tick — the silent-pixel
          // monitor cron (every 2h) is the durable alerting path. Here
          // we only log a structured warning so it shows up in Inngest.
          safeLog(
            `${LOG_PREFIX} Pixel ${al_pixel_id} (workspace ${workspace_id}) returned 0 usable v4 events on this sync — age ${pixelAgeHours.toFixed(1)}h`
          )
        })
      }
    }

    safeLog(
      `${LOG_PREFIX} Pixel ${al_pixel_id}: processed=${result.processed} enriched=${result.enriched} inserted=${result.inserted} no_email=${result.skippedNoEmail}`
    )

    return {
      al_pixel_id,
      workspace_id,
      ...result,
    }
  }
)

// =============================================================================
// Back-compat export
// =============================================================================
// The old single-function `pixelV4Sync` symbol stays available so any
// external monitoring or runtime probe that references it by name keeps
// resolving. New work should use the cron + worker pair.
export const pixelV4Sync = pixelV4SyncCron
