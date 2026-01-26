// Lead Note Detail API
// PATCH /api/leads/[id]/notes/[noteId] - Update a note
// DELETE /api/leads/[id]/notes/[noteId] - Delete a note

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { LeadActivityRepository } from '@/lib/repositories/lead-activity.repository'
import { handleApiError, unauthorized, notFound, success, badRequest } from '@/lib/utils/api-error-handler'

interface RouteContext {
  params: Promise<{ id: string; noteId: string }>
}

const updateNoteSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  is_pinned: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id, noteId } = await context.params

    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = updateNoteSchema.safeParse(body)

    if (!validationResult.success) {
      return badRequest(validationResult.error.errors[0]?.message || 'Invalid request')
    }

    // 3. Update note
    const activityRepo = new LeadActivityRepository()
    const note = await activityRepo.updateNote(noteId, user.workspace_id, validationResult.data)

    return success({ note })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id, noteId } = await context.params

    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Delete note
    const activityRepo = new LeadActivityRepository()
    await activityRepo.deleteNote(noteId, user.workspace_id)

    return success({ message: 'Note deleted successfully' })
  } catch (error: any) {
    return handleApiError(error)
  }
}
