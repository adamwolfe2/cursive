/**
 * Autoresearch Winning Patterns API
 * List winning patterns discovered by autoresearch experiments
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
 * GET /api/autoresearch/programs/[programId]/patterns
 * List winning patterns for a program
 * Query params: element_type (filter), limit (default 50)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { programId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const url = new URL(request.url)
    const elementType = url.searchParams.get('element_type')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)

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

    // Build query for winning patterns
    let query = supabase
      .from('autoresearch_winning_patterns')
      .select(`
        id,
        element_type,
        pattern_description,
        example_text,
        lift_percent,
        confidence,
        times_validated,
        source_experiment_id,
        created_at
      `)
      .eq('program_id', programId)
      .order('lift_percent', { ascending: false })
      .limit(limit)

    if (elementType) {
      query = query.eq('element_type', elementType)
    }

    const { data: patterns, error } = await query

    if (error) {
      safeError('[Autoresearch Patterns GET] Database error:', error)
      return badRequest('Failed to fetch patterns')
    }

    return success({
      program_id: programId,
      program_name: program.name,
      patterns: patterns || [],
      total: patterns?.length || 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
