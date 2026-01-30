/**
 * Activity API
 * GET /api/crm/activities/[id] - Get a specific activity
 * PUT /api/crm/activities/[id] - Update an activity
 * DELETE /api/crm/activities/[id] - Delete an activity
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { ActivityRepository } from '@/lib/repositories/activity.repository'
import { handleApiError, unauthorized, notFound } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const updateActivitySchema = z.object({
  activity_type: z.enum(['call', 'email', 'meeting', 'note', 'task']).optional(),
  company_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  due_date: z.string().optional(),
  completed_at: z.string().optional(),
  owner_user_id: z.string().uuid().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Get activity ID from params
    const { id } = await params

    // 3. Fetch activity with workspace filtering
    const activityRepo = new ActivityRepository()
    const activity = await activityRepo.findById(id, user.workspace_id)

    if (!activity) {
      return notFound('Activity not found')
    }

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: activity,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Get activity ID from params
    const { id } = await params

    // 3. Validate input with Zod
    const body = await request.json()
    const validated = updateActivitySchema.parse(body)

    // 4. Update activity
    const activityRepo = new ActivityRepository()
    const activity = await activityRepo.update(id, user.workspace_id, {
      ...validated,
      updated_by_user_id: user.id,
    })

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: activity,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Get activity ID from params
    const { id } = await params

    // 3. Delete activity
    const activityRepo = new ActivityRepository()
    await activityRepo.delete(id, user.workspace_id)

    // 4. Return response
    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully',
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
