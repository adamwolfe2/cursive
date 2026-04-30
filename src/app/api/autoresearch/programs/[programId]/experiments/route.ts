/**
 * Autoresearch Experiments API
 * List experiments for an autoresearch program
 */

import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, notFound, success, badRequest } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ programId: string }>
}

/**
 * GET /api/autoresearch/programs/[programId]/experiments
 * List all experiments for a program, ordered by experiment_number DESC
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { programId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    // Verify program belongs to workspace
    const { data: program, error: programError } = await supabase
      .from('autoresearch_programs')
      .select('id, name')
      .eq('id', programId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (programError || !program) {
      return notFound('Program not found')
    }

    // Fetch experiments with result summaries
    const { data: experiments, error } = await supabase
      .from('autoresearch_experiments')
      .select(`
        id,
        experiment_number,
        element_tested,
        hypothesis,
        control_variant,
        test_variant,
        status,
        result_summary,
        winner,
        lift_percent,
        confidence,
        sample_size_control,
        sample_size_test,
        started_at,
        evaluated_at,
        created_at
      `)
      .eq('program_id', programId)
      .order('experiment_number', { ascending: false })

    if (error) {
      safeError('[Autoresearch Experiments GET] Database error:', error)
      return badRequest('Failed to fetch experiments')
    }

    return success({
      program_id: programId,
      program_name: program.name,
      experiments: experiments || [],
      total: experiments?.length || 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
