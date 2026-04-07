/**
 * PATCH  /api/outbound/saved-prompts/[id] — edit a workspace-owned prompt
 * DELETE /api/outbound/saved-prompts/[id] — delete a workspace-owned prompt
 *
 * Globals (workspace_id IS NULL) are read-only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { OutboundSavedPromptRepository } from '@/lib/repositories/outbound-saved-prompt.repository'

const updateSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  prompt_template: z.string().min(1).max(8000).optional(),
  icon_name: z.string().max(60).nullable().optional(),
  sort_order: z.number().int().min(0).max(999).optional(),
})

const repo = new OutboundSavedPromptRepository()

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.parse(body)

    const updated = await repo.update(id, user.workspace_id, parsed)
    return NextResponse.json({ data: updated })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params
    await repo.delete(id, user.workspace_id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
