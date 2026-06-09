/**
 * Provision Workspace Audience
 *
 * Triggered immediately when a new business user completes onboarding,
 * or when a funnel buyer submits ICP. Pulls a targeted batch of leads
 * from AudienceLab's Audience Segment API based on the user's declared
 * industry + target locations.
 *
 * This gives new workspaces their first leads within minutes of signing
 * up instead of waiting up to 6 hours for the cron-based segment puller.
 *
 * Flow:
 *  1. Read workspace targeting from the event payload.
 *  2. Preview to confirm records exist.
 *  3. createAudience — AL returns an `audienceId` synchronously but
 *     records materialize asynchronously.
 *  4. Poll `fetchAudienceRecords` with backoff until the audience is
 *     materialized (or we give up gracefully).
 *  5. Page through records, applying a workspace-side ICP post-filter,
 *     then insert via the SHARED `insertLeadFromALRecord` (no more
 *     duplicate inline insert path).
 *  6. Mark the funnel order's `audience_delivered_at` so the
 *     "audience building" dashboard banner clears the moment leads
 *     actually land (forward-only, race-safe).
 *  7. Affiliate activation + first-leads event + ops_stage advance
 *     + Slack notify — all unchanged.
 *
 * Event: audiencelab/provision-workspace-audience
 * Payload: { workspace_id, user_id, industries, states }
 *
 * Idempotency: deduplication by (workspace_id, email) lives in the
 * shared inserter — re-runs don't double-insert. The funnel order
 * delivery flip uses a forward-only `.is(..., null)` predicate so
 * concurrent provisions can't fight each other.
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
  UNFILTERED_RECORDS_THRESHOLD,
  type ALEnrichedProfile,
} from '@/lib/audiencelab/api-client'
import { insertLeadFromALRecord } from '@/lib/audiencelab/lead-inserter'
import {
  AUDIENCE_POLL_DELAYS_SECONDS,
  classifyPollResult,
  matchesWorkspaceICP,
} from '@/lib/audiencelab/provision-helpers'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[AL Provision Workspace]'
const MAX_INITIAL_LEADS = 200 // First-time pull cap — generous for new users

export const provisionWorkspaceAudience = inngest.createFunction(
  {
    id: 'provision-workspace-audience',
    name: 'Provision Workspace Audience (First-Time Pull)',
    retries: 2,
    // Polling consumes step.sleep wall-clock that does NOT count against
    // the step's execution budget, but the overall finish budget still
    // needs to span the polling window + page-fetch loop + downstream
    // notify/affiliate/email steps. 12m is comfortable headroom.
    timeouts: { finish: '12m' },
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

    // Defensive normalization: caller might send null/undefined arrays.
    const industriesIn = Array.isArray(industries) ? industries.filter(Boolean) : []
    const statesIn = Array.isArray(states) ? states.filter(Boolean) : []

    // ─── Step 1: API key gate ────────────────────────────────────────
    const apiKeyOk = await step.run('check-api-key', async () => {
      return !!process.env.AUDIENCELAB_ACCOUNT_API_KEY
    })

    if (!apiKeyOk) {
      // Non-fatal — Slack alert so ops knows this workspace got no leads.
      sendSlackAlert({
        type: 'system_event',
        severity: 'warning',
        message: `Workspace ${workspace_id} provision SKIPPED — AUDIENCELAB_ACCOUNT_API_KEY not configured`,
        metadata: { workspace_id, user_id },
      }).catch((err) => safeError(`${LOG_PREFIX} Slack alert failed:`, err))
      safeLog(`${LOG_PREFIX} AUDIENCELAB_ACCOUNT_API_KEY not configured, skipping`)
      return { skipped: true, reason: 'No API key' }
    }

    // ─── Step 2: Preview + create audience ───────────────────────────
    const audienceResult = await step.run('preview-and-create-audience', async () => {
      const segmentFilters = buildWorkspaceAudienceFilters({
        industries: industriesIn.length > 0 ? industriesIn : undefined,
        states: statesIn.length > 0 ? statesIn : undefined,
      })

      safeLog(
        `${LOG_PREFIX} Workspace ${workspace_id}: industries=${industriesIn.join(',') || 'all'} states=${statesIn.join(',') || 'all'}`
      )

      // Preview count to validate the segment is sane before we commit.
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

        // Guard: if preview is suspiciously high the AL API ignored our
        // filters; abort so we don't pollute the workspace with garbage.
        if (previewCount >= UNFILTERED_PREVIEW_THRESHOLD) {
          sendSlackAlert({
            type: 'webhook_failure',
            severity: 'warning',
            message: `AL provision skipped for workspace ${workspace_id} — preview count ${previewCount.toLocaleString()} exceeds threshold (${UNFILTERED_PREVIEW_THRESHOLD.toLocaleString()}). Filters likely ignored by API.`,
            metadata: {
              workspace_id,
              user_id,
              industries: industriesIn.join(','),
              states: statesIn.join(','),
              previewCount,
            },
          }).catch((err) => safeError(`${LOG_PREFIX} Slack alert failed:`, err))
          return { audienceId: null as string | null, segmentFilters }
        }

        // Broaden window if first attempt was empty.
        if (previewCount === 0) {
          safeLog(`${LOG_PREFIX} No records found for this targeting, trying last 10 days`)
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
        safeLog(
          `${LOG_PREFIX} Preview failed, attempting direct create: ${err instanceof Error ? err.message : err}`
        )
      }

      const audienceName = `cursive-signup-${workspace_id.substring(0, 8)}-${industriesIn[0] || 'general'}-${Date.now()}`
      const audience = await createAudience({
        name: audienceName,
        filters: segmentFilters,
        description: `Auto-provisioned for workspace ${workspace_id} at signup. Industries: ${industriesIn.join(', ') || 'all'}. States: ${statesIn.join(', ') || 'all'}.`,
      })

      safeLog(`${LOG_PREFIX} Audience created: ${audience.audienceId}`)
      return {
        audienceId: audience.audienceId || (null as string | null),
        segmentFilters,
      }
    })

    if (!audienceResult.audienceId) {
      safeLog(`${LOG_PREFIX} No audience created (empty segment or AL unavailable)`)
      return { skipped: true, reason: 'Empty segment or audience creation failed' }
    }

    // ─── Step 2b: Poll until audience is materialized ────────────────
    //
    // AL's `createAudience` returns an id synchronously but record
    // materialization runs async on their side. The pre-2026-06-06 code
    // immediately called fetchAudienceRecords, which returned 0 records
    // for any audience still building → silent empty provision. We now
    // sleep-and-recheck up to 6 times with exponential backoff so a
    // typical 1–3 min build completes before we move on.
    //
    // Each attempt is its OWN durable step so Inngest retries don't
    // re-run the prior attempts. step.sleep is free wait time — does
    // not consume the function's wall-clock budget.

    let audienceTotalRecords = 0
    let aborted: 'unfiltered' | null = null

    for (let i = 0; i < AUDIENCE_POLL_DELAYS_SECONDS.length; i++) {
      const delaySec = AUDIENCE_POLL_DELAYS_SECONDS[i]
      if (delaySec > 0) {
        await step.sleep(`audience-wait-${i}`, `${delaySec}s`)
      }

      const pollResult = await step.run(`audience-poll-${i}`, async () => {
        try {
          // page=1, pageSize=1 — we only need total_records here.
          const res = await fetchAudienceRecords(audienceResult.audienceId!, 1, 1)
          return classifyPollResult(res.total_records, UNFILTERED_RECORDS_THRESHOLD)
        } catch (err) {
          if (err instanceof AudienceLabUnfilteredError) {
            return {
              state: 'unfiltered' as const,
              totalRecords: err.totalRecords,
            }
          }
          // Let Inngest's retry handle transient errors; throw and bail.
          throw err
        }
      })

      if (pollResult.state === 'unfiltered') {
        aborted = 'unfiltered'
        sendSlackAlert({
          type: 'webhook_failure',
          severity: 'warning',
          message: `AL provision aborted — unfiltered audience (${pollResult.totalRecords.toLocaleString()} records) for workspace ${workspace_id}`,
          metadata: {
            workspace_id,
            user_id,
            totalRecords: pollResult.totalRecords,
          },
        }).catch((err) => safeError(`${LOG_PREFIX} Slack alert failed:`, err))
        break
      }

      if (pollResult.state === 'ready') {
        audienceTotalRecords = pollResult.totalRecords
        safeLog(
          `${LOG_PREFIX} Audience ${audienceResult.audienceId} ready on attempt ${i + 1}: ${audienceTotalRecords} records`
        )
        break
      }
      // state === 'building' → next loop iteration
    }

    if (aborted) {
      return { skipped: true, reason: 'unfiltered_response' }
    }

    if (audienceTotalRecords === 0) {
      safeLog(
        `${LOG_PREFIX} Audience ${audienceResult.audienceId} never materialized (still 0 records after ${AUDIENCE_POLL_DELAYS_SECONDS.length} polls) — accepting empty segment`
      )
      return { skipped: true, reason: 'empty_segment_after_poll' }
    }

    // ─── Step 3: Fetch + insert leads (unified via shared inserter) ──
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
          const recordsResponse = await fetchAudienceRecords(
            audienceResult.audienceId!,
            page,
            pageSize
          )
          records = recordsResponse.data || []
          if (records.length === 0) break
        } catch (err) {
          if (err instanceof AudienceLabUnfilteredError) {
            safeLog(
              `${LOG_PREFIX} Unfiltered response on page ${page} (${err.totalRecords.toLocaleString()} records), aborting fetch`
            )
            sendSlackAlert({
              type: 'webhook_failure',
              severity: 'warning',
              message: `AL provision aborted mid-fetch — unfiltered response (${err.totalRecords.toLocaleString()} records) for workspace ${workspace_id}`,
              metadata: { workspace_id, user_id, totalRecords: err.totalRecords },
            }).catch((alertErr) => safeError(`${LOG_PREFIX} Slack alert failed:`, alertErr))
            break
          }
          safeError(`${LOG_PREFIX} Failed to fetch page ${page}`, err)
          break
        }

        for (const record of records) {
          if (inserted >= MAX_INITIAL_LEADS) break

          // Workspace-side ICP post-filter — defense in depth even when
          // AL respected the segment filters server-side.
          if (!matchesWorkspaceICP(record, industriesIn, statesIn)) {
            skipped++
            continue
          }

          // Hand off to the shared inserter — single source of truth for
          // quality scoring, dedupe, and the lead row shape.
          const result = await insertLeadFromALRecord(record, {
            workspaceId: workspace_id,
            assignedUserId: user_id,
            sourceTag: 'audiencelab_pull',
            extraTags: ['signup-provision'],
            industries: industriesIn,
          })

          if (result.outcome !== 'inserted') {
            skipped++
            continue
          }

          // Sample first 3 for the "first leads arrived" email.
          if (sampleLeads.length < 3) {
            const firstName = record.FIRST_NAME || ''
            const lastName = record.LAST_NAME || ''
            const fullName = [firstName, lastName].filter(Boolean).join(' ')
            if (fullName) {
              sampleLeads.push({
                name: fullName,
                company: record.COMPANY_NAME || '',
                title: record.JOB_TITLE || '',
              })
            }
          }

          // Per-user assignment so the lead shows up in "My Leads".
          if (result.leadId) {
            await supabase
              .from('user_lead_assignments')
              .insert({
                workspace_id,
                lead_id: result.leadId,
                user_id,
                matched_industry: record.COMPANY_INDUSTRY || industriesIn[0] || null,
                matched_geo: record.PERSONAL_STATE || record.COMPANY_STATE || statesIn[0] || null,
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

    safeLog(
      `${LOG_PREFIX} Workspace ${workspace_id}: ${insertResult.inserted} leads inserted, ${insertResult.skipped} skipped`
    )

    // ─── Step 3a: Register for the WEEKLY refresh ───────────────────
    // Without an al_audiences row (refresh_enabled=true), the Monday refresh
    // cron never sees this audience, so the buyer would get leads ONCE and
    // never again — silently breaking the "refreshed weekly" promise. Store
    // the RAW ICP filters so the cron rebuilds with the same targeting.
    if (insertResult.inserted > 0 && audienceResult.audienceId) {
      await step.run('register-weekly-refresh', async () => {
        const supabase = createAdminClient()
        const { error } = await supabase
          .from('al_audiences')
          .upsert(
            {
              workspace_id,
              al_audience_id: audienceResult.audienceId,
              name: `cursive-funnel-${workspace_id.slice(0, 8)}`,
              source: 'funnel_order',
              filters: { industries: industriesIn, states: statesIn },
              leads_imported: insertResult.inserted,
              refresh_enabled: true,
              last_refreshed_at: new Date().toISOString(),
            },
            { onConflict: 'workspace_id,al_audience_id' }
          )
        if (error) {
          safeError(`${LOG_PREFIX} al_audiences registration failed (weekly refresh won't run):`, error)
        } else {
          safeLog(`${LOG_PREFIX} Registered workspace ${workspace_id} for weekly audience refresh`)
        }
      })
    }

    // ─── Step 3b: Affiliate activation (idempotent, non-fatal) ───────
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

    // ─── Step 4: Emit "first leads arrived" event ────────────────────
    // Handled by first-leads-arrived.ts via Inngest dedup.
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
              industry: industriesIn[0] || null,
              location: statesIn[0] || null,
            },
          })

          safeLog(`${LOG_PREFIX} First-leads event emitted for workspace ${workspace_id}`)
        } catch (emitErr) {
          safeError(`${LOG_PREFIX} First-leads event emission failed (non-fatal)`, emitErr)
        }
      })
    }

    // ─── Step 4b: Clear funnel audience-building banner ──────────────
    // If this provision was triggered by a funnel order (Phase 4 push)
    // and we landed at least one lead, stamp the order's
    // audience_delivered_at so the dashboard banner clears itself.
    // Forward-only — never overwrites an existing delivery timestamp.
    if (insertResult.inserted > 0) {
      await step.run('mark-funnel-audience-delivered', async () => {
        try {
          const supabase = createAdminClient()
          const { data: updated, error } = await supabase
            .from('funnel_orders')
            .update({ audience_delivered_at: new Date().toISOString() })
            .eq('workspace_id', workspace_id)
            .is('audience_delivered_at', null)
            .select('id')

          if (error) {
            safeError(
              `${LOG_PREFIX} funnel audience-delivered flip failed (non-fatal)`,
              error
            )
            return
          }

          if (updated && updated.length > 0) {
            safeLog(
              `${LOG_PREFIX} Cleared audience-building banner for ${updated.length} funnel order(s) on workspace ${workspace_id}`
            )
          }
        } catch (err) {
          safeError(
            `${LOG_PREFIX} funnel audience-delivered flip threw (non-fatal)`,
            err
          )
        }
      })
    }

    // ─── Step 5: Auto-advance ops_stage to 'trial' on cal booking ────
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
            .eq('ops_stage', 'new') // only advance if still at default

          // Back-link the booking to this workspace.
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

    // ─── Step 6: Notify on meaningful results ────────────────────────
    if (insertResult.inserted > 0) {
      await step.run('notify', async () => {
        sendSlackAlert({
          type: 'system_event',
          severity: 'info',
          message: `New workspace provisioned with ${insertResult.inserted} leads (AL Audience API)`,
          metadata: {
            workspace_id,
            user_id,
            industries: industriesIn.join(', ') || 'all',
            states: statesIn.join(', ') || 'all',
            inserted: insertResult.inserted,
            skipped: insertResult.skipped,
            audience_total_records: audienceTotalRecords,
          },
        }).catch((err) => safeError(`${LOG_PREFIX} Slack alert failed`, err))
      })
    }

    return {
      workspace_id,
      audience_id: audienceResult.audienceId,
      audience_total_records: audienceTotalRecords,
      inserted: insertResult.inserted,
      skipped: insertResult.skipped,
    }
  }
)
