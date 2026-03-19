// Template Detail API Routes
// Get, update, and delete a specific template

import { type NextRequest } from 'next/server'
import { TemplateRepository } from '@/lib/repositories/template.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, notFound, success } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Validation schema for updating a template
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).optional(),
  body_html: z.string().min(1).optional(),
  body_text: z.string().nullable().optional(),
  variables: z.record(z.any()).optional(),
  // Taxonomy
  tone: z.enum(['informal', 'formal', 'energetic', 'humble']).nullable().optional(),
  structure: z.enum(['problem_solution', 'value_prop_first', 'social_proof', 'question_based']).nullable().optional(),
  cta_type: z.enum(['demo_request', 'meeting_request', 'free_trial', 'open_question', 'send_resource']).nullable().optional(),
  target_seniority: z.array(z.enum(['c_level', 'vp', 'director', 'manager'])).nullable().optional(),
  company_types: z.array(z.string()).nullable().optional(),
  // Active status
  is_active: z.boolean().optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new TemplateRepository()
    const template = await repo.findById(id, user.workspace_id)

    if (!template) return notFound('Template not found')

    return success(template)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validatedData = updateTemplateSchema.parse(body)

    const repo = new TemplateRepository()

    // Check template exists
    const existing = await repo.findById(id, user.workspace_id)
    if (!existing) return notFound('Template not found')

    const template = await repo.update(id, user.workspace_id, validatedData)

    return success(template)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const repo = new TemplateRepository()

    // Check template exists
    const existing = await repo.findById(id, user.workspace_id)
    if (!existing) return notFound('Template not found')

    // Soft delete (set is_active = false)
    await repo.delete(id, user.workspace_id)

    return success({ message: 'Template deleted successfully' })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
