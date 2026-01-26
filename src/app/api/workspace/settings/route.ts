/**
 * Workspace Settings API
 * Get and update workspace configuration
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  getWorkspaceSettings,
  updateWorkspaceSettings,
} from '@/lib/services/workspace-settings.service'

const updateSchema = z.object({
  default_sender_name: z.string().max(100).optional(),
  default_sender_email: z.string().email().optional(),
  default_sender_title: z.string().max(100).optional(),
  email_signature: z.string().max(1000).optional(),
  default_send_window_start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  default_send_window_end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  default_timezone: z.string().optional(),
  default_send_days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
  default_daily_limit: z.number().int().min(1).max(500).optional(),
  company_name: z.string().max(100).optional(),
  company_website: z.string().url().optional().nullable(),
  company_logo: z.string().url().optional().nullable(),
  ai_enrichment_enabled: z.boolean().optional(),
  ab_testing_enabled: z.boolean().optional(),
  auto_send_enabled: z.boolean().optional(),
  require_approval_first_email: z.boolean().optional(),
  max_concurrent_campaigns: z.number().int().min(1).max(50).optional(),
})

/**
 * GET /api/workspace/settings
 * Get workspace settings
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const settings = await getWorkspaceSettings(user.workspace_id)

    return success({
      settings: {
        sender: {
          name: settings.defaultSenderName,
          email: settings.defaultSenderEmail,
          title: settings.defaultSenderTitle,
          signature: settings.emailSignature,
        },
        campaign_defaults: {
          send_window_start: settings.defaultSendWindowStart,
          send_window_end: settings.defaultSendWindowEnd,
          timezone: settings.defaultTimezone,
          send_days: settings.defaultSendDays,
          daily_limit: settings.defaultDailyLimit,
        },
        company: {
          name: settings.companyName,
          website: settings.companyWebsite,
          logo: settings.companyLogo,
        },
        features: {
          ai_enrichment: settings.aiEnrichmentEnabled,
          ab_testing: settings.abTestingEnabled,
          auto_send: settings.autoSendEnabled,
        },
        security: {
          require_approval_first_email: settings.requireApprovalForFirstEmail,
          max_concurrent_campaigns: settings.maxConcurrentCampaigns,
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/workspace/settings
 * Update workspace settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = updateSchema.parse(body)

    const result = await updateWorkspaceSettings(user.workspace_id, {
      defaultSenderName: validated.default_sender_name,
      defaultSenderEmail: validated.default_sender_email,
      defaultSenderTitle: validated.default_sender_title,
      emailSignature: validated.email_signature,
      defaultSendWindowStart: validated.default_send_window_start,
      defaultSendWindowEnd: validated.default_send_window_end,
      defaultTimezone: validated.default_timezone,
      defaultSendDays: validated.default_send_days,
      defaultDailyLimit: validated.default_daily_limit,
      companyName: validated.company_name,
      companyWebsite: validated.company_website,
      companyLogo: validated.company_logo,
      aiEnrichmentEnabled: validated.ai_enrichment_enabled,
      abTestingEnabled: validated.ab_testing_enabled,
      autoSendEnabled: validated.auto_send_enabled,
      requireApprovalForFirstEmail: validated.require_approval_first_email,
      maxConcurrentCampaigns: validated.max_concurrent_campaigns,
    })

    if (!result.success) {
      return badRequest(result.error || 'Failed to update settings')
    }

    return success({
      message: 'Settings updated successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
