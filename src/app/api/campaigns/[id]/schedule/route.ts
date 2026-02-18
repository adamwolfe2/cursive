/**
 * Campaign Schedule API
 * Manage send windows and timezone scheduling
 */


import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, notFound, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  updateCampaignLeadOptimalTimes,
  COMMON_TIMEZONES,
  WEEKDAYS,
  isValidTimezone,
} from '@/lib/services/campaign/timezone-scheduling.service'
import { safeError } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ id: string }>
}

const sendWindowSchema = z.object({
  send_window_enabled: z.boolean().optional(),
  send_window_start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  send_window_end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  send_timezone: z.string().refine(isValidTimezone, 'Invalid timezone').optional(),
  send_days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
  respect_recipient_timezone: z.boolean().optional(),
})

const recalculateSchema = z.object({
  recalculate_optimal_times: z.literal(true),
})

/**
 * GET /api/campaigns/[id]/schedule
 * Get campaign scheduling settings
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    // Get campaign schedule settings
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .select(`
        id,
        name,
        send_window_enabled,
        send_window_start,
        send_window_end,
        send_timezone,
        send_days,
        sequence_settings
      `)
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (error || !campaign) {
      return notFound('Campaign not found')
    }

    // Get lead timezone distribution for analytics
    const { data: tzDistribution } = await supabase
      .from('campaign_leads')
      .select('recipient_timezone')
      .eq('campaign_id', campaignId)
      .not('recipient_timezone', 'is', null)

    const timezoneStats = (tzDistribution || []).reduce(
      (acc, { recipient_timezone }) => {
        acc[recipient_timezone] = (acc[recipient_timezone] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Count leads pending optimal time calculation
    const { count: pendingCount } = await supabase
      .from('campaign_leads')
      .select('*', { count: 'estimated', head: true })
      .eq('campaign_id', campaignId)
      .is('optimal_send_time', null)
      .in('status', ['pending', 'ready', 'in_sequence'])

    return success({
      campaign_id: campaignId,
      campaign_name: campaign.name,
      schedule: {
        send_window_enabled: campaign.send_window_enabled ?? true,
        send_window_start: campaign.send_window_start || '09:00',
        send_window_end: campaign.send_window_end || '17:00',
        send_timezone: campaign.send_timezone || 'America/New_York',
        send_days: campaign.send_days || ['mon', 'tue', 'wed', 'thu', 'fri'],
        respect_recipient_timezone:
          (campaign.sequence_settings as any)?.respect_recipient_timezone ?? true,
      },
      analytics: {
        timezone_distribution: timezoneStats,
        leads_pending_optimization: pendingCount || 0,
      },
      available_timezones: COMMON_TIMEZONES,
      available_days: WEEKDAYS,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/campaigns/[id]/schedule
 * Update campaign scheduling settings
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()

    // Check if this is a recalculate request
    if (body.recalculate_optimal_times) {
      const result = await updateCampaignLeadOptimalTimes(campaignId)
      return success({
        message: 'Optimal send times recalculated',
        leads_updated: result.updated,
        errors: result.errors.length > 0 ? result.errors : undefined,
      })
    }

    // Validate schedule update
    const validated = sendWindowSchema.parse(body)

    // Validate time range
    if (validated.send_window_start && validated.send_window_end) {
      const start = validated.send_window_start
      const end = validated.send_window_end
      if (start >= end) {
        return badRequest('Send window end must be after start')
      }
    }

    const supabase = await createClient()

    // Build update object
    const updateData: Record<string, any> = {}
    if (validated.send_window_enabled !== undefined) {
      updateData.send_window_enabled = validated.send_window_enabled
    }
    if (validated.send_window_start) {
      updateData.send_window_start = validated.send_window_start
    }
    if (validated.send_window_end) {
      updateData.send_window_end = validated.send_window_end
    }
    if (validated.send_timezone) {
      updateData.send_timezone = validated.send_timezone
    }
    if (validated.send_days) {
      updateData.send_days = validated.send_days
    }

    // Update campaign
    const { error: updateError } = await supabase
      .from('email_campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)

    if (updateError) {
      safeError('[Campaign Schedule] Update error:', updateError.message)
      return badRequest('Failed to update campaign schedule')
    }

    // Handle respect_recipient_timezone in sequence_settings
    if (validated.respect_recipient_timezone !== undefined) {
      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('sequence_settings')
        .eq('id', campaignId)
        .single()

      const settings = (campaign?.sequence_settings || {}) as Record<string, any>
      settings.respect_recipient_timezone = validated.respect_recipient_timezone

      await supabase
        .from('email_campaigns')
        .update({ sequence_settings: settings })
        .eq('id', campaignId)
    }

    // Optionally recalculate optimal times after settings change
    if (Object.keys(updateData).length > 0) {
      // Run recalculation in background
      updateCampaignLeadOptimalTimes(campaignId).catch(() => {
        // Ignore errors in background task
      })
    }

    return success({
      message: 'Schedule settings updated',
      updated_fields: Object.keys(updateData),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/campaigns/[id]/schedule
 * Trigger optimal time recalculation
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    // Verify campaign exists
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (error || !campaign) {
      return notFound('Campaign not found')
    }

    // Recalculate optimal send times
    const result = await updateCampaignLeadOptimalTimes(campaignId)

    return success({
      message: 'Optimal send times recalculated',
      campaign_id: campaignId,
      leads_updated: result.updated,
      errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
