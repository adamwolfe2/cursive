// Templates API Routes
// List all templates and create new templates

import { type NextRequest } from 'next/server'
import { TemplateRepository } from '@/lib/repositories/template.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, created } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

// Validation schema for creating a template
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  subject: z.string().min(1, 'Subject is required'),
  body_html: z.string().min(1, 'Body is required'),
  body_text: z.string().optional(),
  variables: z.record(z.any()).optional(),
  // Taxonomy
  tone: z.enum(['informal', 'formal', 'energetic', 'humble']).optional(),
  structure: z.enum(['problem_solution', 'value_prop_first', 'social_proof', 'question_based']).optional(),
  cta_type: z.enum(['demo_request', 'meeting_request', 'free_trial', 'open_question', 'send_resource']).optional(),
  target_seniority: z.array(z.enum(['c_level', 'vp', 'director', 'manager'])).optional(),
  company_types: z.array(z.string()).optional(),
  // Source
  source: z.enum(['sales_co', 'custom', 'ai_generated']).optional(),
})

// Query params schema
const queryParamsSchema = z.object({
  tone: z.enum(['informal', 'formal', 'energetic', 'humble']).optional(),
  structure: z.enum(['problem_solution', 'value_prop_first', 'social_proof', 'question_based']).optional(),
  cta_type: z.enum(['demo_request', 'meeting_request', 'free_trial', 'open_question', 'send_resource']).optional(),
  target_seniority: z.enum(['c_level', 'vp', 'director', 'manager']).optional(),
  source: z.enum(['sales_co', 'custom', 'ai_generated']).optional(),
  is_active: z.enum(['true', 'false']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)

    // Parse query params
    const params = queryParamsSchema.parse({
      tone: searchParams.get('tone') || undefined,
      structure: searchParams.get('structure') || undefined,
      cta_type: searchParams.get('cta_type') || undefined,
      target_seniority: searchParams.get('target_seniority') || undefined,
      source: searchParams.get('source') || undefined,
      is_active: searchParams.get('is_active') || undefined,
    })

    const repo = new TemplateRepository()
    const templates = await repo.findByWorkspace(user.workspace_id, {
      tone: params.tone,
      structure: params.structure,
      cta_type: params.cta_type,
      target_seniority: params.target_seniority,
      source: params.source,
      is_active: params.is_active === undefined ? undefined : params.is_active === 'true',
    })

    return success(templates)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validatedData = createTemplateSchema.parse(body)

    const repo = new TemplateRepository()
    const template = await repo.create({
      workspace_id: user.workspace_id,
      name: validatedData.name,
      subject: validatedData.subject,
      body_html: validatedData.body_html,
      body_text: validatedData.body_text,
      variables: validatedData.variables || {},
      tone: validatedData.tone,
      structure: validatedData.structure,
      cta_type: validatedData.cta_type,
      target_seniority: validatedData.target_seniority,
      company_types: validatedData.company_types,
      source: validatedData.source || 'custom',
      is_active: true,
    })

    return created(template)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
