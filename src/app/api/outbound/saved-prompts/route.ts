/**
 * GET  /api/outbound/saved-prompts — globals + workspace customs
 * POST /api/outbound/saved-prompts — create a workspace-specific prompt
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { OutboundSavedPromptRepository } from '@/lib/repositories/outbound-saved-prompt.repository'

const createSchema = z.object({
  label: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  prompt_template: z.string().min(1).max(8000),
  icon_name: z.string().max(60).optional(),
  sort_order: z.number().int().min(0).max(999).optional(),
})

const repo = new OutboundSavedPromptRepository()

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const prompts = await repo.listForWorkspace(user.workspace_id)
    return NextResponse.json({ data: prompts })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const body = await request.json()
    const parsed = createSchema.parse(body)

    const created = await repo.create({
      workspace_id: user.workspace_id,
      label: parsed.label,
      description: parsed.description ?? null,
      prompt_template: parsed.prompt_template,
      icon_name: parsed.icon_name ?? null,
      sort_order: parsed.sort_order ?? 99,
      created_by: user.id,
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
