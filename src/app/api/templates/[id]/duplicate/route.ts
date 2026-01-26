// Template Duplicate API Route
// Duplicate a template

import { type NextRequest } from 'next/server'
import { TemplateRepository } from '@/lib/repositories/template.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, notFound, created } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

interface RouteContext {
  params: Promise<{ id: string }>
}

const duplicateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
})

/**
 * POST - Duplicate a template
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json().catch(() => ({}))
    const validatedData = duplicateSchema.parse(body)

    const repo = new TemplateRepository()

    // Check template exists
    const existing = await repo.findById(id, user.workspace_id)
    if (!existing) return notFound('Template not found')

    const template = await repo.duplicate(id, user.workspace_id, validatedData.name)

    return created(template)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
