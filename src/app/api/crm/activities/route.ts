/**
 * Activities API
 * GET /api/crm/activities - List activities with filters
 * POST /api/crm/activities - Create a new activity
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { ActivityRepository } from '@/lib/repositories/activity.repository'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import type { ActivityType } from '@/types/crm.types'

const activityFiltersSchema = z.object({
  activity_type: z.string().optional(),
  company_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  owner_user_id: z.string().optional(),
  is_completed: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.string().optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
  page: z.string().optional(),
  page_size: z.string().optional(),
})

const createActivitySchema = z.object({
  activity_type: z.enum(['call', 'email', 'meeting', 'note', 'task']),
  company_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  due_date: z.string().optional(),
  owner_user_id: z.string().uuid().optional(),
})
  .refine((data) => data.company_id || data.contact_id || data.deal_id, {
    message: 'At least one of company_id, contact_id, or deal_id must be provided',
  })

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input with Zod
    const searchParams = request.nextUrl.searchParams
    const params = {
      activity_type: searchParams.get('activity_type') || undefined,
      company_id: searchParams.get('company_id') || undefined,
      contact_id: searchParams.get('contact_id') || undefined,
      deal_id: searchParams.get('deal_id') || undefined,
      owner_user_id: searchParams.get('owner_user_id') || undefined,
      is_completed: searchParams.get('is_completed') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_direction: searchParams.get('sort_direction') || undefined,
      page: searchParams.get('page') || '1',
      page_size: searchParams.get('page_size') || '100',
    }

    const validated = activityFiltersSchema.parse(params)

    // Parse pagination
    const page = parseInt(validated.page || '1', 10)
    const pageSize = parseInt(validated.page_size || '100', 10)

    // Parse filters
    const filters = {
      activity_type: validated.activity_type ? [validated.activity_type as ActivityType] : undefined,
      company_id: validated.company_id ? [validated.company_id] : undefined,
      contact_id: validated.contact_id ? [validated.contact_id] : undefined,
      deal_id: validated.deal_id ? [validated.deal_id] : undefined,
      owner_user_id: validated.owner_user_id ? [validated.owner_user_id] : undefined,
      is_completed: validated.is_completed ? validated.is_completed === 'true' : undefined,
      search: validated.search,
    }

    // Parse sorting
    const sort =
      validated.sort_by && validated.sort_direction
        ? [{ field: validated.sort_by, direction: validated.sort_direction as 'asc' | 'desc' }]
        : undefined

    // 3. Fetch activities with workspace filtering
    const activityRepo = new ActivityRepository()
    const result = await activityRepo.findByWorkspace(user.workspace_id, filters, sort, page, pageSize)

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input with Zod
    const body = await request.json()
    const validated = createActivitySchema.parse(body)

    // 3. Create activity
    const activityRepo = new ActivityRepository()
    const activity = await activityRepo.create({
      ...validated,
      workspace_id: user.workspace_id,
      created_by_user_id: user.id,
    })

    // 4. Return response
    return NextResponse.json(
      {
        success: true,
        data: activity,
      },
      { status: 201 }
    )
  } catch (error: any) {
    return handleApiError(error)
  }
}
