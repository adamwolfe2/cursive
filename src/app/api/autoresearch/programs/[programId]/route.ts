/**
 * Autoresearch Program Detail API
 * Get, update, or delete a single autoresearch program
 */

import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, notFound, success, badRequest, noContent } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ programId: string }>
}

const updateProgramSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.enum(['draft', 'running', 'paused', 'completed']).optional(),
  baseline_subject: z.string().min(1).max(500).optional(),
  baseline_body: z.string().min(1).max(10000).optional(),
  config: z.object({
    max_experiments: z.number().int().min(1).max(1000).optional(),
    sample_size_per_variant: z.number().int().min(50).max(50000).optional(),
    confidence_threshold: z.number().min(0.8).max(0.99).optional(),
    wait_hours_before_eval: z.number().int().min(1).max(168).optional(),
    elements_to_test: z.array(z.enum(['subject', 'opener', 'cta', 'tone', 'length', 'personalization'])).optional(),
  }).optional(),
})

/**
 * GET /api/autoresearch/programs/[programId]
 * Fetch a single program by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { programId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    const { data: program, error } = await supabase
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
      .eq('id', programId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (error) {
      safeError('[Autoresearch Program GET] Database error:', error)
      return badRequest('Failed to fetch program')
    }

    if (!program) {
      return notFound('Program not found')
    }

    return success({ program })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/autoresearch/programs/[programId]
 * Update a program's name, config, status, or baseline
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { programId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = updateProgramSchema.parse(body)

    const supabase = await createClient()

    // Verify program exists and belongs to workspace
    const { data: existing, error: fetchError } = await supabase
      .from('autoresearch_programs')
      .select('id, status')
      .eq('id', programId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (fetchError || !existing) {
      return notFound('Program not found')
    }

    const { data: program, error } = await supabase
      .from('autoresearch_programs')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', programId)
      .eq('workspace_id', user.workspace_id)
      .select()
      .single()

    if (error) {
      safeError('[Autoresearch Program PATCH] Database error:', error)
      return badRequest('Failed to update program')
    }

    return success({
      message: 'Program updated',
      program,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/autoresearch/programs/[programId]
 * Delete a program (only if draft or paused)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { programId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    // Verify program exists and check status
    const { data: existing, error: fetchError } = await supabase
      .from('autoresearch_programs')
      .select('id, status')
      .eq('id', programId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (fetchError || !existing) {
      return notFound('Program not found')
    }

    if (existing.status !== 'draft' && existing.status !== 'paused') {
      return badRequest('Can only delete programs in draft or paused status')
    }

    const { error } = await supabase
      .from('autoresearch_programs')
      .delete()
      .eq('id', programId)
      .eq('workspace_id', user.workspace_id)

    if (error) {
      safeError('[Autoresearch Program DELETE] Database error:', error)
      return badRequest('Failed to delete program')
    }

    return noContent()
  } catch (error) {
    return handleApiError(error)
  }
}
