/**
 * Workspace Send Limits API
 * Manage global daily sending limits for workspace
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import { getWorkspaceSendStats, updateWorkspaceDailyLimit } from '@/lib/services/campaign/send-limits.service'

const updateLimitSchema = z.object({
  global_daily_send_limit: z.number().int().min(1).max(2000),
})

/**
 * GET /api/workspace/send-limits
 * Get workspace send stats including all campaign limits
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const stats = await getWorkspaceSendStats(user.workspace_id)

    return success({
      workspace: {
        global_limit: stats.globalLimit,
        sent_today: stats.globalSent,
        remaining: stats.globalRemaining,
        usage_percent: stats.globalLimit > 0
          ? Math.round((stats.globalSent / stats.globalLimit) * 100)
          : 0,
      },
      campaigns: stats.campaigns.map((c) => ({
        ...c,
        usage_percent: c.limit > 0 ? Math.round((c.sent / c.limit) * 100) : 0,
      })),
      total_campaigns: stats.campaigns.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/workspace/send-limits
 * Update global daily send limit for workspace
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = updateLimitSchema.parse(body)

    const result = await updateWorkspaceDailyLimit(
      user.workspace_id,
      validated.global_daily_send_limit
    )

    if (!result.success) {
      return badRequest(result.error || 'Failed to update limit')
    }

    return success({
      message: 'Global daily send limit updated',
      global_daily_send_limit: validated.global_daily_send_limit,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
