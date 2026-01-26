// Lead Status API
// GET /api/leads/[id]/status - Get status history for a lead
// PUT /api/leads/[id]/status - Update lead status

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { LeadActivityRepository } from '@/lib/repositories/lead-activity.repository'
import { LeadRepository } from '@/lib/repositories/lead.repository'
import { handleApiError, unauthorized, notFound, success, badRequest } from '@/lib/utils/api-error-handler'

interface RouteContext {
  params: Promise<{ id: string }>
}

const updateStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
  note: z.string().max(1000).optional(),
})

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

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

    // 3. Get status history
    const activityRepo = new LeadActivityRepository()
    const history = await activityRepo.getStatusHistory(id, user.workspace_id)

    return success({
      current_status: (lead as any).status || 'new',
      history,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

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

    // 3. Parse and validate request body
    const body = await request.json()
    const validationResult = updateStatusSchema.safeParse(body)

    if (!validationResult.success) {
      return badRequest(validationResult.error.errors[0]?.message || 'Invalid request')
    }

    const { status, note } = validationResult.data

    // 4. Update status
    const activityRepo = new LeadActivityRepository()
    await activityRepo.updateStatus(id, user.id, status, note)

    return success({
      message: 'Status updated successfully',
      status,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
