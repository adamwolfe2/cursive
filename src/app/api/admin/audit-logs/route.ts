/**
 * Audit Logs API
 * View and filter audit logs for compliance and debugging
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, forbidden } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  getAuditLogs,
  getSecurityEvents,
  getResourceActivity,
  type AuditAction,
  type ResourceType,
  type AuditSeverity,
  type SecurityEventCategory,
  type RiskLevel,
} from '@/lib/services/audit.service'

const auditLogsQuerySchema = z.object({
  type: z.enum(['audit', 'security']).optional().default('audit'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  action: z
    .string()
    .transform((val) => val.split(',') as AuditAction[])
    .optional(),
  resource_type: z
    .string()
    .transform((val) => val.split(',') as ResourceType[])
    .optional(),
  resource_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  severity: z
    .string()
    .transform((val) => val.split(',') as AuditSeverity[])
    .optional(),
  event_type: z.string().optional(),
  event_category: z.enum(['authentication', 'authorization', 'data_access', 'configuration']).optional(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  is_suspicious: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
})

/**
 * GET /api/admin/audit-logs
 * Retrieve audit logs or security events with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const params = auditLogsQuerySchema.parse(searchParams)

    // Build date range if provided
    const dateRange =
      params.start_date || params.end_date
        ? {
            start: params.start_date ? new Date(params.start_date) : new Date(0),
            end: params.end_date ? new Date(params.end_date) : new Date(),
          }
        : undefined

    if (params.type === 'security') {
      // Fetch security events
      const result = await getSecurityEvents(
        user.workspace_id,
        {
          eventType: params.event_type,
          eventCategory: params.event_category as SecurityEventCategory | undefined,
          riskLevel: params.risk_level as RiskLevel | undefined,
          isSuspicious: params.is_suspicious,
          dateRange,
        },
        { page: params.page, limit: params.limit }
      )

      return NextResponse.json({
        success: true,
        data: {
          events: result.events,
          pagination: {
            page: params.page,
            limit: params.limit,
            total: result.total,
            total_pages: Math.ceil(result.total / params.limit),
          },
        },
      })
    }

    // Fetch audit logs
    const result = await getAuditLogs(
      user.workspace_id,
      {
        action: params.action,
        resourceType: params.resource_type,
        resourceId: params.resource_id,
        userId: params.user_id,
        severity: params.severity,
        dateRange,
      },
      { page: params.page, limit: params.limit }
    )

    return NextResponse.json({
      success: true,
      data: {
        logs: result.logs,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: result.total,
          total_pages: Math.ceil(result.total / params.limit),
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
