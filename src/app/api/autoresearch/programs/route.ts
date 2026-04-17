/**
 * Autoresearch Programs API
 * List and create autoresearch programs for a workspace
 */

import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, success, created, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

const createProgramSchema = z.object({
  name: z.string().min(1).max(255),
  emailbison_campaign_id: z.string().min(1),
  baseline_subject: z.string().min(1).max(500),
  baseline_body: z.string().min(1).max(10000),
  config: z.object({
    max_experiments: z.number().int().min(1).max(1000).optional(),
    sample_size_per_variant: z.number().int().min(50).max(50000).optional(),
    confidence_threshold: z.number().min(0.8).max(0.99).optional(),
    wait_hours_before_eval: z.number().int().min(1).max(168).optional(),
    elements_to_test: z.array(z.enum(['subject', 'opener', 'cta', 'tone', 'length', 'personalization'])).optional(),
  }).optional(),
})

/**
 * GET /api/autoresearch/programs
 * List all autoresearch programs for the current workspace
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    const { data: programs, error } = await supabase
      .from('autoresearch_programs')
      .select(`
        id,
        name,
        status,
        emailbison_campaign_id,
        baseline_subject,
        baseline_body,
        config,
        current_experiment_number,
        created_at,
        updated_at
      `)
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    if (error) {
      safeError('[Autoresearch Programs GET] Database error:', error)
      return badRequest('Failed to fetch programs')
    }

    return success({
      programs: programs || [],
      total: programs?.length || 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/autoresearch/programs
 * Create a new autoresearch program
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = createProgramSchema.parse(body)

    const supabase = await createClient()

    const { data: program, error } = await supabase
      .from('autoresearch_programs')
      .insert({
        workspace_id: user.workspace_id,
        name: validated.name,
        emailbison_campaign_id: validated.emailbison_campaign_id,
        baseline_subject: validated.baseline_subject,
        baseline_body: validated.baseline_body,
        config: validated.config || {},
        status: 'draft',
        current_experiment_number: 0,
      })
      .select()
      .single()

    if (error) {
      safeError('[Autoresearch Programs POST] Database error:', error)
      return badRequest('Failed to create program')
    }

    return created({
      message: 'Autoresearch program created',
      program,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
