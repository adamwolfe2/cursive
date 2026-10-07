/**
 * Reprocess events that were rejected with error='quota_exhausted'.
 *
 * Applying the AL quota migration turned on a per-workspace daily cap that had
 * never actually been enforced (the table and RPCs did not exist, so checkQuota
 * failed open). Workspaces above the default 1,000/day immediately started
 * having real leads rejected. Those events were marked processed=true with
 * error='quota_exhausted', so no other backfill picks them up.
 *
 * Run with a raised AL_DAILY_QUOTA_PER_WORKSPACE so the reprocess is not capped
 * by the same limit that dropped them.
 *
 *   pnpm exec tsx scripts/reprocess-quota-exhausted.ts            # dry run
 *   pnpm exec tsx scripts/reprocess-quota-exhausted.ts --apply
 */

import { createAdminClient } from '../src/lib/supabase/admin'
import { processEventInline } from '../src/lib/audiencelab/edge-processor'

const APPLY = process.argv.includes('--apply')
const PAGE = 200

async function main() {
  const supabase = createAdminClient()
  const stats = { scanned: 0, reprocessed: 0, leads: 0, stillBlocked: 0, errors: 0 }

  for (;;) {
    const { data, error } = await supabase
      .from('audiencelab_events')
      .select('id, workspace_id, source')
      .eq('error', 'quota_exhausted')
      .limit(PAGE)

    if (error) throw new Error(`fetch failed: ${error.message}`)
    if (!data || data.length === 0) break

    for (const row of data) {
      stats.scanned++
      if (!row.workspace_id) continue
      if (!APPLY) continue

      try {
        const { error: resetErr } = await supabase
          .from('audiencelab_events')
          .update({ processed: false, error: null })
          .eq('id', row.id)
        if (resetErr) throw new Error(resetErr.message)

        const result = await processEventInline(row.id, row.workspace_id, row.source || 'superpixel')
        stats.reprocessed++
        if (result.lead_id) stats.leads++
        else if (result.error === 'quota_exhausted') stats.stillBlocked++
      } catch (err) {
        stats.errors++
        console.error(`  ! ${row.id}:`, err instanceof Error ? err.message : err)
      }
    }

    if (!APPLY) break // dry run: one page is enough to report the shape
  }

  console.log(APPLY ? '\n=== REPROCESS APPLIED ===' : '\n=== DRY RUN ===')
  console.table(stats)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
