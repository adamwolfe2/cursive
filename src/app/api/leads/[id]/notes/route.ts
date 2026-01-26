// Lead Notes API
// GET /api/leads/[id]/notes - Get notes for a lead
// POST /api/leads/[id]/notes - Create a note for a lead

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { LeadActivityRepository } from '@/lib/repositories/lead-activity.repository'
import { LeadRepository } from '@/lib/repositories/lead.repository'
import { handleApiError, unauthorized, notFound, success, badRequest } from '@/lib/utils/api-error-handler'

interface RouteContext {
  params: Promise<{ id: string }>
}

const createNoteSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  note_type: z.enum(['note', 'call', 'email', 'meeting', 'task']).default('note'),
  is_pinned: z.boolean().default(false),
})

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

    // 3. Get notes with optional filters
    const activityRepo = new LeadActivityRepository()
    const notes = await activityRepo.getNotes(id, user.workspace_id, {
      note_type: searchParams.get('note_type') as any,
      is_pinned: searchParams.get('is_pinned') === 'true' ? true : undefined,
    })

    return success({ notes })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function POST(
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
    const validationResult = createNoteSchema.safeParse(body)

    if (!validationResult.success) {
      return badRequest(validationResult.error.errors[0]?.message || 'Invalid request')
    }

    const { content, note_type, is_pinned } = validationResult.data

    // 4. Create note
    const activityRepo = new LeadActivityRepository()
    const note = await activityRepo.createNote({
      lead_id: id,
      workspace_id: user.workspace_id,
      content,
      note_type,
      is_pinned,
      created_by: user.id,
    })

    return success({ note }, 201)
  } catch (error: any) {
    return handleApiError(error)
  }
}
