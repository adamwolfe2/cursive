/**
 * Workspace Stats Cache Refresh
 *
 * Runs every 15 minutes to pre-compute per-workspace lead counts
 * into workspace_stats_cache. Dashboard pages read from this table
 * instead of running 8+ COUNT queries on the live leads table.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export const refreshWorkspaceStats = inngest.createFunction(
  {
    id: 'refresh-workspace-stats',
    name: 'Refresh Workspace Stats Cache',
    retries: 1,
  },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async ({ step }) => {
    const supabase = createAdminClient()

    const workspaceIds = await step.run('fetch-workspace-ids', async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id')
        .limit(2000)
      if (error) throw new Error(error.message)
      return (data || []).map((w) => w.id as string)
    })

    if (!workspaceIds.length) return { refreshed: 0 }

    // Refresh in batches of 50 to avoid overwhelming the DB
    const BATCH = 50
    let refreshed = 0

    for (let i = 0; i < workspaceIds.length; i += BATCH) {
      const batch = workspaceIds.slice(i, i + BATCH)

      await step.run(`refresh-batch-${i}`, async () => {
        for (const id of batch) {
          const { error } = await supabase.rpc('refresh_workspace_stats', {
            p_workspace_id: id,
          })
          if (error) safeError('[StatsRefresh] Failed for workspace', id, error.message)
          else refreshed++
        }
      })
    }

    safeLog(`[StatsRefresh] Refreshed ${refreshed}/${workspaceIds.length} workspaces`)
    return { refreshed }
  }
)
