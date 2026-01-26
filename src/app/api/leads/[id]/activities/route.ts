// Lead Activities API
// GET /api/leads/[id]/activities - Get activity timeline for a lead

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { LeadActivityRepository } from '@/lib/repositories/lead-activity.repository'
import { LeadRepository } from '@/lib/repositories/lead.repository'
import { handleApiError, unauthorized, notFound, success } from '@/lib/utils/api-error-handler'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)

    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Verify lead exists and belongs to workspace
    const leadRepo = new LeadRepository()
    const lead = await leadRepo.findById(id, user.workspace_id)

    if (!lead) {
      return notFound('Lead not found')
    }

    // 3. Get activities
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const activityRepo = new LeadActivityRepository()
    const activities = await activityRepo.getActivities(id, user.workspace_id, limit)

    return success({ activities })
  } catch (error: any) {
    return handleApiError(error)
  }
}
