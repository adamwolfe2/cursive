/**
 * Deals API
 * GET /api/crm/deals - List deals with filters
 * POST /api/crm/deals - Create a new deal
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { DealRepository } from '@/lib/repositories/deal.repository'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import type { DealStage } from '@/types/crm.types'

const dealFiltersSchema = z.object({
  stage: z.string().optional(),
  company_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  owner_user_id: z.string().optional(),
  probability_min: z.string().optional(),
  probability_max: z.string().optional(),
  value_min: z.string().optional(),
  value_max: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.string().optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
  page: z.string().optional(),
  page_size: z.string().optional(),
})

const createDealSchema = z.object({
  company_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Deal name is required'),
  description: z.string().optional(),
  value: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  stage: z.enum(['Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']).default('Qualified'),
  probability: z.number().min(0).max(100).default(0),
  close_date: z.string().optional(),
  owner_user_id: z.string().uuid().optional(),
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
      stage: searchParams.get('stage') || undefined,
      company_id: searchParams.get('company_id') || undefined,
      contact_id: searchParams.get('contact_id') || undefined,
      owner_user_id: searchParams.get('owner_user_id') || undefined,
      probability_min: searchParams.get('probability_min') || undefined,
      probability_max: searchParams.get('probability_max') || undefined,
      value_min: searchParams.get('value_min') || undefined,
      value_max: searchParams.get('value_max') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_direction: searchParams.get('sort_direction') || undefined,
      page: searchParams.get('page') || '1',
      page_size: searchParams.get('page_size') || '100',
    }

    const validated = dealFiltersSchema.parse(params)

    // Parse pagination
    const page = parseInt(validated.page || '1', 10)
    const pageSize = parseInt(validated.page_size || '100', 10)

    // Parse filters
    const filters = {
      stage: validated.stage ? [validated.stage as DealStage] : undefined,
      company_id: validated.company_id ? [validated.company_id] : undefined,
      contact_id: validated.contact_id ? [validated.contact_id] : undefined,
      owner_user_id: validated.owner_user_id ? [validated.owner_user_id] : undefined,
      probability_min: validated.probability_min ? parseInt(validated.probability_min, 10) : undefined,
      probability_max: validated.probability_max ? parseInt(validated.probability_max, 10) : undefined,
      value_min: validated.value_min ? parseFloat(validated.value_min) : undefined,
      value_max: validated.value_max ? parseFloat(validated.value_max) : undefined,
      search: validated.search,
    }

    // Parse sorting
    const sort =
      validated.sort_by && validated.sort_direction
        ? [{ field: validated.sort_by, direction: validated.sort_direction as 'asc' | 'desc' }]
        : undefined

    // 3. Fetch deals with workspace filtering
    const dealRepo = new DealRepository()
    const result = await dealRepo.findByWorkspace(user.workspace_id, filters, sort, page, pageSize)

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
    const validated = createDealSchema.parse(body)

    // 3. Create deal
    const dealRepo = new DealRepository()
    const deal = await dealRepo.create({
      ...validated,
      workspace_id: user.workspace_id,
      created_by_user_id: user.id,
      updated_by_user_id: user.id,
    })

    // 4. Return response
    return NextResponse.json(
      {
        success: true,
        data: deal,
      },
      { status: 201 }
    )
  } catch (error: any) {
    return handleApiError(error)
  }
}
