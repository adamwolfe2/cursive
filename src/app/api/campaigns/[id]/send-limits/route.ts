/**
 * Campaign Send Limits API
 * Manage daily sending limits for campaigns
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, notFound, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import { checkSendLimits, updateCampaignDailyLimit } from '@/lib/services/campaign/send-limits.service'

interface RouteContext {
  params: Promise<{ id: string }>
}

const updateLimitSchema = z.object({
  daily_send_limit: z.number().int().min(1).max(500),
})

/**
 * GET /api/campaigns/[id]/send-limits
 * Get current send limits and usage for a campaign
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    // Verify campaign exists and belongs to workspace
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('id, workspace_id, name, daily_send_limit, sends_today, last_send_reset_at')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (campaignError || !campaign) {
      return notFound('Campaign not found')
    }

    // Get full limits status
    const limitsStatus = await checkSendLimits(campaignId, user.workspace_id)

    return success({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        daily_limit: campaign.daily_send_limit || 50,
        sent_today: campaign.sends_today || 0,
        last_reset: campaign.last_send_reset_at,
      },
      limits: limitsStatus,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/campaigns/[id]/send-limits
 * Update daily send limit for a campaign
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = updateLimitSchema.parse(body)

    // Update the limit
    const result = await updateCampaignDailyLimit(
      campaignId,
      user.workspace_id,
      validated.daily_send_limit
    )

    if (!result.success) {
      return badRequest(result.error || 'Failed to update limit')
    }

    return success({
      message: 'Daily send limit updated',
      daily_send_limit: validated.daily_send_limit,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
