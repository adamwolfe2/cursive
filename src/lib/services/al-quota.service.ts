/**
 * AudienceLab API Quota Service
 *
 * Enforces per-workspace daily quotas for AudienceLab API lead consumption.
 * Quota resets at midnight UTC (keyed by CURRENT_DATE in the DB).
 *
 * Default daily limit: 1000 leads per workspace.
 * Override via env: AL_DAILY_QUOTA_PER_WORKSPACE=<integer>
 *
 * Storage: `al_quota_usage` table via admin (service-role) client.
 * All DB operations bypass RLS intentionally — quota checks are server-side only.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[ALQuota]'

const DEFAULT_DAILY_LIMIT = 1000

function getDailyLimit(): number {
  const raw = process.env.AL_DAILY_QUOTA_PER_WORKSPACE
  if (!raw) return DEFAULT_DAILY_LIMIT
  const parsed = parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_LIMIT
}

/**
 * Check whether a workspace is under its daily AL quota.
 *
 * @param workspaceId - The workspace to check.
 * @returns `true` if the workspace has remaining quota, `false` if capped.
 */
export async function checkQuota(workspaceId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const dailyLimit = getDailyLimit()

    const { data, error } = await supabase
      .rpc('get_al_quota_today', { p_workspace_id: workspaceId })

    if (error) {
      safeError(`${LOG_PREFIX} quota check error for workspace ${workspaceId}:`, error)
      // Fail open: allow the request if we can't read the quota
      return true
    }

    const used: number = typeof data === 'number' ? data : 0
    const allowed = used < dailyLimit

    if (!allowed) {
      safeLog(`${LOG_PREFIX} workspace ${workspaceId} quota exhausted: ${used}/${dailyLimit} leads today`)
    }

    return allowed
  } catch (err) {
    safeError(`${LOG_PREFIX} unexpected error checking quota:`, err)
    // Fail open — don't block processing on quota check failures
    return true
  }
}

/**
 * Increment the daily quota counter for a workspace.
 *
 * Uses an atomic DB upsert so concurrent calls never double-count or race.
 *
 * @param workspaceId - The workspace whose counter to increment.
 * @param count - Number of leads to add (default: 1).
 */
export async function incrementQuota(workspaceId: string, count: number = 1): Promise<void> {
  if (count <= 0) return

  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .rpc('increment_al_quota', {
        p_workspace_id: workspaceId,
        p_count: count,
      })

    if (error) {
      safeError(`${LOG_PREFIX} quota increment error for workspace ${workspaceId}:`, error)
    }
  } catch (err) {
    safeError(`${LOG_PREFIX} unexpected error incrementing quota:`, err)
    // Non-fatal: quota tracking failure should not block lead ingestion
  }
}

/**
 * Get today's quota usage for a workspace (for reporting/admin).
 *
 * @param workspaceId - The workspace to query.
 * @returns `{ used, limit, remaining }` for today's quota window.
 */
export async function getQuotaStatus(workspaceId: string): Promise<{
  used: number
  limit: number
  remaining: number
}> {
  const dailyLimit = getDailyLimit()

  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .rpc('get_al_quota_today', { p_workspace_id: workspaceId })

    if (error) {
      safeError(`${LOG_PREFIX} quota status error for workspace ${workspaceId}:`, error)
      return { used: 0, limit: dailyLimit, remaining: dailyLimit }
    }

    const used: number = typeof data === 'number' ? data : 0
    return {
      used,
      limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - used),
    }
  } catch (err) {
    safeError(`${LOG_PREFIX} unexpected error fetching quota status:`, err)
    return { used: 0, limit: dailyLimit, remaining: dailyLimit }
  }
}
