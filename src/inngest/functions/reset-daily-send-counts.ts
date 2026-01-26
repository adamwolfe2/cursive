/**
 * Reset Daily Send Counts
 * Runs at midnight UTC to reset all daily sending counters
 */

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'

/**
 * Daily reset cron job
 * Runs at midnight UTC to reset all workspace and campaign send counts
 */
export const resetDailySendCounts = inngest.createFunction(
  {
    id: 'reset-daily-send-counts',
    name: 'Reset Daily Send Counts',
    retries: 3,
  },
  { cron: '0 0 * * *' }, // Midnight UTC daily
  async ({ step, logger }) => {
    const today = new Date().toISOString().split('T')[0]

    logger.info(`Starting daily send count reset for ${today}`)

    // Step 1: Reset workspace counts using database function
    const workspaceResult = await step.run('reset-workspace-counts', async () => {
      const supabase = await createClient()

      // Use the database function for atomic reset
      const { error } = await supabase.rpc('reset_all_daily_send_counts')

      if (error) {
        logger.error(`Database function failed: ${error.message}`)
        // Fallback to manual reset
        return await manualResetCounts(supabase, logger)
      }

      return { success: true, method: 'database_function' }
    })

    // Step 2: Log the reset for audit purposes
    await step.run('log-reset', async () => {
      const supabase = await createClient()

      // Get count of active workspaces and campaigns for logging
      const [workspaceCount, campaignCount] = await Promise.all([
        supabase.from('workspaces').select('id', { count: 'exact', head: true }),
        supabase
          .from('email_campaigns')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
      ])

      logger.info(`Daily reset complete`, {
        date: today,
        workspaces: workspaceCount.count || 0,
        active_campaigns: campaignCount.count || 0,
        method: workspaceResult.method,
      })

      return {
        workspaces_reset: workspaceCount.count || 0,
        campaigns_reset: campaignCount.count || 0,
      }
    })

    return {
      success: true,
      reset_date: today,
      ...workspaceResult,
    }
  }
)

/**
 * Manual fallback for resetting counts if database function fails
 */
async function manualResetCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  logger: any
): Promise<{ success: boolean; method: string; errors?: string[] }> {
  const today = new Date().toISOString().split('T')[0]
  const errors: string[] = []

  try {
    // Reset all workspaces
    const { error: workspaceError } = await supabase
      .from('workspaces')
      .update({
        sends_today: 0,
        last_send_reset_at: today,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all rows

    if (workspaceError) {
      logger.error(`Failed to reset workspace counts: ${workspaceError.message}`)
      errors.push(`workspaces: ${workspaceError.message}`)
    }

    // Reset all campaigns
    const { error: campaignError } = await supabase
      .from('email_campaigns')
      .update({
        sends_today: 0,
        last_send_reset_at: today,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all rows

    if (campaignError) {
      logger.error(`Failed to reset campaign counts: ${campaignError.message}`)
      errors.push(`campaigns: ${campaignError.message}`)
    }

    return {
      success: errors.length === 0,
      method: 'manual_fallback',
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    logger.error(`Manual reset failed: ${error.message}`)
    return {
      success: false,
      method: 'manual_fallback',
      errors: [error.message],
    }
  }
}

/**
 * On-demand reset for a specific workspace
 * Can be triggered manually if needed
 */
export const resetWorkspaceSendCount = inngest.createFunction(
  {
    id: 'reset-workspace-send-count',
    name: 'Reset Workspace Send Count',
    retries: 2,
  },
  { event: 'workspace/reset-send-count' },
  async ({ event, step, logger }) => {
    const { workspace_id } = event.data
    const today = new Date().toISOString().split('T')[0]

    logger.info(`Resetting send count for workspace ${workspace_id}`)

    await step.run('reset-counts', async () => {
      const supabase = await createClient()

      // Reset workspace count
      const { error: workspaceError } = await supabase
        .from('workspaces')
        .update({
          sends_today: 0,
          last_send_reset_at: today,
        })
        .eq('id', workspace_id)

      if (workspaceError) {
        throw new Error(`Failed to reset workspace: ${workspaceError.message}`)
      }

      // Reset all campaigns in this workspace
      const { error: campaignError } = await supabase
        .from('email_campaigns')
        .update({
          sends_today: 0,
          last_send_reset_at: today,
        })
        .eq('workspace_id', workspace_id)

      if (campaignError) {
        throw new Error(`Failed to reset campaigns: ${campaignError.message}`)
      }
    })

    return { success: true, workspace_id, reset_date: today }
  }
)
