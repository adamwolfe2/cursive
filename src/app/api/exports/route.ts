/**
 * Data Export API
 * Generate and download CSV/JSON exports
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  exportLeads,
  exportCampaignLeads,
  exportEmailSends,
  exportConversations,
  exportCampaignAnalytics,
  exportSuppressionList,
  type ExportFormat,
  type ExportOptions,
} from '@/lib/services/export.service'
import { logDataExport } from '@/lib/services/audit.service'

const exportSchema = z.object({
  type: z.enum([
    'leads',
    'campaign_leads',
    'email_sends',
    'conversations',
    'campaign_analytics',
    'suppression_list',
  ]),
  format: z.enum(['csv', 'json']).optional().default('csv'),
  campaign_id: z.string().uuid().optional(),
  filters: z.record(z.any()).optional(),
  fields: z.array(z.string()).optional(),
  include_headers: z.boolean().optional().default(true),
  date_range: z
    .object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    })
    .optional(),
})

/**
 * POST /api/exports
 * Generate and return export data
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = exportSchema.parse(body)

    const options: ExportOptions = {
      format: validated.format as ExportFormat,
      filters: validated.filters,
      fields: validated.fields,
      includeHeaders: validated.include_headers,
      dateRange: validated.date_range
        ? {
            start: validated.date_range.start ? new Date(validated.date_range.start) : new Date(0),
            end: validated.date_range.end ? new Date(validated.date_range.end) : new Date(),
          }
        : undefined,
    }

    let result

    switch (validated.type) {
      case 'leads':
        result = await exportLeads(user.workspace_id, options)
        break

      case 'campaign_leads':
        if (!validated.campaign_id) {
          return badRequest('campaign_id is required for campaign_leads export')
        }
        result = await exportCampaignLeads(user.workspace_id, validated.campaign_id, options)
        break

      case 'email_sends':
        result = await exportEmailSends(user.workspace_id, {
          ...options,
          campaignId: validated.campaign_id,
        })
        break

      case 'conversations':
        result = await exportConversations(user.workspace_id, options)
        break

      case 'campaign_analytics':
        if (!validated.campaign_id) {
          return badRequest('campaign_id is required for campaign_analytics export')
        }
        result = await exportCampaignAnalytics(user.workspace_id, validated.campaign_id, options)
        break

      case 'suppression_list':
        result = await exportSuppressionList(user.workspace_id, options)
        break

      default:
        return badRequest('Invalid export type')
    }

    // Log the export for audit/compliance
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    await logDataExport(
      user.workspace_id,
      user.id,
      validated.type,
      result.rowCount,
      ipAddress || undefined
    )

    // Return the file
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'X-Row-Count': result.rowCount.toString(),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/exports
 * List available export types
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    return NextResponse.json({
      success: true,
      data: {
        export_types: [
          {
            key: 'leads',
            name: 'All Leads',
            description: 'Export all leads in your workspace',
            requires_campaign_id: false,
            available_fields: [
              'email',
              'first_name',
              'last_name',
              'full_name',
              'title',
              'company_name',
              'company_domain',
              'phone',
              'linkedin_url',
              'status',
              'timezone',
              'created_at',
            ],
          },
          {
            key: 'campaign_leads',
            name: 'Campaign Leads',
            description: 'Export leads from a specific campaign',
            requires_campaign_id: true,
            available_fields: [
              'email',
              'first_name',
              'last_name',
              'company_name',
              'title',
              'status',
              'current_step',
              'enrichment_status',
              'created_at',
            ],
          },
          {
            key: 'email_sends',
            name: 'Email Sends',
            description: 'Export email sending history with tracking data',
            requires_campaign_id: false,
            available_fields: [
              'recipient_email',
              'recipient_name',
              'subject',
              'status',
              'sent_at',
              'opened_at',
              'clicked_at',
              'replied_at',
              'step_number',
            ],
          },
          {
            key: 'conversations',
            name: 'Conversations',
            description: 'Export conversation threads',
            requires_campaign_id: false,
            available_fields: [
              'lead_email',
              'lead_name',
              'company_name',
              'subject',
              'status',
              'priority',
              'message_count',
              'sentiment',
              'intent',
              'last_message_at',
            ],
          },
          {
            key: 'campaign_analytics',
            name: 'Campaign Analytics',
            description: 'Export campaign performance metrics',
            requires_campaign_id: true,
            available_fields: ['metric', 'value', 'rate'],
          },
          {
            key: 'suppression_list',
            name: 'Suppression List',
            description: 'Export suppressed/blocked emails',
            requires_campaign_id: false,
            available_fields: ['email', 'reason', 'bounce_type', 'source', 'suppressed_at'],
          },
        ],
        formats: ['csv', 'json'],
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
