/**
 * Deal API
 * GET /api/crm/deals/[id] - Get a specific deal
 * PUT /api/crm/deals/[id] - Update a deal
 * DELETE /api/crm/deals/[id] - Delete a deal
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { DealRepository } from '@/lib/repositories/deal.repository'
import { handleApiError, unauthorized, notFound } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const updateDealSchema = z.object({
  company_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  value: z.number().min(0).optional(),
  currency: z.string().optional(),
  stage: z.enum(['Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']).optional(),
  probability: z.number().min(0).max(100).optional(),
  close_date: z.string().optional(),
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

    // 2. Get deal ID from params
    const { id } = await params

    // 3. Fetch deal with workspace filtering
    const dealRepo = new DealRepository()
    const deal = await dealRepo.findById(id, user.workspace_id)

    if (!deal) {
      return notFound('Deal not found')
    }

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: deal,
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

    // 2. Get deal ID from params
    const { id } = await params

    // 3. Validate input with Zod
    const body = await request.json()
    const validated = updateDealSchema.parse(body)

    // 4. Update deal
    const dealRepo = new DealRepository()
    const deal = await dealRepo.update(id, user.workspace_id, {
      ...validated,
      updated_by_user_id: user.id,
    })

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: deal,
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

    // 2. Get deal ID from params
    const { id } = await params

    // 3. Delete deal
    const dealRepo = new DealRepository()
    await dealRepo.delete(id, user.workspace_id)

    // 4. Return response
    return NextResponse.json({
      success: true,
      message: 'Deal deleted successfully',
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
