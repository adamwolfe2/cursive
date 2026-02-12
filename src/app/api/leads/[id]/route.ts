// Lead Detail API
// GET /api/leads/[id] - Get single lead
// PUT /api/leads/[id] - Update lead
// DELETE /api/leads/[id] - Delete lead

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { LeadRepository } from '@/lib/repositories/lead.repository'
import { handleApiError, unauthorized, notFound, success } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const updateLeadSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  job_title: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'lost', 'converted']).optional(),
  source: z.string().optional(),
  intent_score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

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

    // 2. Fetch lead with workspace filtering
    const leadRepo = new LeadRepository()
    const lead = await leadRepo.findById(id, user.workspace_id)

    if (!lead) {
      return notFound('Lead not found')
    }

    // 3. Return response
    return success(lead)
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

    // 2. Validate input
    const body = await request.json()
    const validated = updateLeadSchema.parse(body)

    // 3. Update lead with workspace filtering
    const leadRepo = new LeadRepository()
    const lead = await leadRepo.update(id, user.workspace_id, validated as any)

    // 4. Return response
    return success(lead)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(
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

    // 2. Delete lead with workspace filtering
    const leadRepo = new LeadRepository()
    await leadRepo.delete(id, user.workspace_id)

    // 3. Return response
    return success({ message: 'Lead deleted successfully' })
  } catch (error: any) {
    return handleApiError(error)
  }
}
