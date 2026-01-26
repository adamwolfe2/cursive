/**
 * Resource Activity API
 * View activity history for a specific resource
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import { getResourceActivity, type ResourceType } from '@/lib/services/audit.service'

const resourceTypes: ResourceType[] = [
  'campaign',
  'lead',
  'email_send',
  'email_template',
  'conversation',
  'workspace',
  'user',
  'integration',
  'api_key',
  'settings',
  'suppression',
]

const paramsSchema = z.object({
  resourceType: z.enum(resourceTypes as [ResourceType, ...ResourceType[]]),
  resourceId: z.string().uuid(),
})

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

/**
 * GET /api/admin/audit-logs/[resourceType]/[resourceId]
 * Get activity history for a specific resource
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceType: string; resourceId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const resolvedParams = await params
    const validatedParams = paramsSchema.parse(resolvedParams)

    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const queryParams = querySchema.parse(searchParams)

    const activity = await getResourceActivity(
      validatedParams.resourceType,
      validatedParams.resourceId,
      queryParams.limit
    )

    return NextResponse.json({
      success: true,
      data: {
        resource_type: validatedParams.resourceType,
        resource_id: validatedParams.resourceId,
        activity,
        count: activity.length,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
