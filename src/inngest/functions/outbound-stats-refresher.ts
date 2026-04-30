/**
 * Outbound Stats Refresher
 *
 * Cron (every 1 minute): for each `outbound_runs.status='running'` row,
 * recompute counts from the live tables (`campaign_leads`, `email_sends`,
 * `email_replies`) and write them back to outbound_runs so the workflow
 * detail page always shows fresh numbers.
 *
 * Auto-completes runs when there is nothing left to do — i.e. all leads
 * are drafted/sent/skipped and the prospecting/enriching counts are 0.
 *
 * This is the single place that bridges the async fan-out of enrichment +
 * compose with the per-run header. It also runs on demand via
 * `outbound/stats.refresh` event for tests.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { OutboundRunRepository } from '@/lib/repositories/outbound-run.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

const runRepo = new OutboundRunRepository()

async function refreshAllRunningRuns(): Promise<{ refreshed: number; completed: number }> {
  const running = await runRepo.findAllRunning()
  if (running.length === 0) {
    return { refreshed: 0, completed: 0 }
  }

  const supabase = createAdminClient()
  let refreshed = 0
  let completed = 0

  for (const run of running) {
    try {
      // Read counts from the view (one query per run is fine — there are usually
      // <10 running rows at a time)
      const { data: stats } = await supabase
        .from('outbound_pipeline_counts')
        .select('*')
        .eq('agent_id', run.agent_id)
        .maybeSingle()

      if (!stats) continue

      const enriching = (stats as any).enriching_count ?? 0
      const drafting = (stats as any).drafting_count ?? 0
      const engaging = (stats as any).engaging_count ?? 0
      const replying = (stats as any).replying_count ?? 0
      const booked = (stats as any).booked_count ?? 0

      // For prospects_enriched: anything that has moved past 'pending'/'enriching'
      // counts as enriched. We don't track per-run enriched cleanly because
      // multiple runs can hit the same campaign — use the cumulative count.
      const enrichedTotal = drafting + engaging + replying + booked

      await runRepo.updateProgress(run.id, {
        prospects_enriched: enrichedTotal,
        drafts_created: drafting + engaging + replying + booked,
        emails_sent: engaging + replying + booked,
        replies_received: replying,
        meetings_booked: booked,
      })

      refreshed += 1

      // Auto-complete: if no leads are still in pending/enriching AND we've had
      // at least 30 seconds for drafts to flow, mark complete.
      const ageMs = Date.now() - new Date(run.started_at).getTime()
      if (enriching === 0 && ageMs > 30_000 && drafting + engaging > 0) {
        await runRepo.markComplete(run.id, 'completed')
        completed += 1
      }
    } catch (err) {
      safeError(`[outbound stats] Failed to refresh run ${run.id}:`, err)
    }
  }

  return { refreshed, completed }
}

/**
 * Cron-driven refresher.
 */
export const outboundStatsRefresherCron = inngest.createFunction(
  {
    id: 'outbound-stats-refresher-cron',
    name: 'Outbound Stats Refresher (cron)',
    retries: 1,
    timeouts: { finish: '2m' },
  },
  { cron: '*/1 * * * *' },
  async () => {
    return refreshAllRunningRuns()
  }
)

/**
 * On-demand refresher (used by tests + manual triggers).
 */
export const outboundStatsRefresherEvent = inngest.createFunction(
  {
    id: 'outbound-stats-refresher-event',
    name: 'Outbound Stats Refresher (on-demand)',
    retries: 1,
    timeouts: { finish: '2m' },
  },
  { event: 'outbound/stats.refresh' },
  async () => {
    return refreshAllRunningRuns()
  }
)
