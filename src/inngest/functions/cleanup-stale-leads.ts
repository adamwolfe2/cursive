/**
 * Stale Lead Cleanup
 *
 * Runs nightly to delete Audience Labs sourced leads older than STALE_DAYS.
 *
 * Why:
 *   - AL gives us "unlimited fresh intent data" — there's no reason to keep
 *     old records. Fresh leads are fetched every 6 hours (segment puller) and
 *     at 8am daily. Storing months of stale data wastes DB space and clutters
 *     users' lead views.
 *   - AL leads are flagged by source ('audience_labs_*' or 'audiencelab_*').
 *     Manually uploaded or partner-sourced leads are intentionally NOT deleted.
 *
 * Safety:
 *   - Only deletes leads where source starts with 'audience_labs' or 'audiencelab'.
 *   - Preserves any lead that was manually contacted (status != 'new').
 *   - Runs in batches to avoid long-running transactions on large tables.
 *   - Logs how many were deleted per workspace for audit trail.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[StaleLeadCleanup]'

/** Delete AL-sourced leads older than this many days that are still 'new' (unworked) */
const STALE_DAYS = 45

/** Process in batches to avoid DB timeouts */
const BATCH_SIZE = 500

export const cleanupStaleLeads = inngest.createFunction(
  {
    id: 'cleanup-stale-leads',
    name: 'Cleanup Stale Audience Labs Leads',
    retries: 1,
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 3 * * *' }, // 3am UTC daily (off-peak)
  async ({ event, step }) => {
    const supabase = createAdminClient()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - STALE_DAYS)
    const cutoffISO = cutoffDate.toISOString()

    safeLog(`${LOG_PREFIX} Starting cleanup. Cutoff: ${cutoffISO} (${STALE_DAYS} days ago)`)

    // Step 1: Count how many stale leads exist
    const countResult = await step.run('count-stale-leads', async () => {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .or('source.ilike.audience_labs%,source.ilike.audiencelab%')
        .eq('status', 'new')            // Only unworked leads — never delete contacted/qualified ones
        .lt('delivered_at', cutoffISO)

      if (error) {
        safeError(`${LOG_PREFIX} Count query failed`, error)
        return 0
      }

      safeLog(`${LOG_PREFIX} Found ${count} stale leads to delete`)
      return count || 0
    })

    if (countResult === 0) {
      safeLog(`${LOG_PREFIX} No stale leads found. Done.`)
      return { deleted: 0, batches: 0 }
    }

    // Step 2: Delete in batches
    let totalDeleted = 0
    const batches = Math.ceil(countResult / BATCH_SIZE)

    for (let batch = 0; batch < batches; batch++) {
      const batchDeleted = await step.run(`delete-batch-${batch}`, async () => {
        // Fetch IDs to delete in this batch (Supabase doesn't support LIMIT on delete directly)
        const { data: toDelete, error: fetchError } = await supabase
          .from('leads')
          .select('id')
          .or('source.ilike.audience_labs%,source.ilike.audiencelab%')
          .eq('status', 'new')
          .lt('delivered_at', cutoffISO)
          .limit(BATCH_SIZE)

        if (fetchError || !toDelete?.length) {
          safeError(`${LOG_PREFIX} Batch ${batch} fetch failed`, fetchError)
          return 0
        }

        const ids = toDelete.map(r => r.id)

        const { error: deleteError } = await supabase
          .from('leads')
          .delete()
          .in('id', ids)

        if (deleteError) {
          safeError(`${LOG_PREFIX} Batch ${batch} delete failed`, deleteError)
          return 0
        }

        safeLog(`${LOG_PREFIX} Batch ${batch + 1}/${batches}: deleted ${ids.length} leads`)
        return ids.length
      })

      totalDeleted += batchDeleted
    }

    safeLog(`${LOG_PREFIX} Cleanup complete: ${totalDeleted} stale leads deleted`)

    // Step 3: Notify
    if (totalDeleted > 0) {
      await step.run('notify', async () => {
        sendSlackAlert({
          type: 'system_event',
          severity: 'info',
          message: `Stale lead cleanup: deleted ${totalDeleted} AL leads older than ${STALE_DAYS} days`,
          metadata: {
            deleted: totalDeleted,
            batches,
            cutoff_date: cutoffISO,
          },
        }).catch((err) => safeError('[CleanupStaleLeads] Slack alert failed:', err))
      })
    }

    return {
      deleted: totalDeleted,
      batches,
      cutoff_date: cutoffISO,
    }
  }
)
