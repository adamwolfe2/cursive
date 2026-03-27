/**
 * Autoresearch Program Pause API
 * Pause a running autoresearch program
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
 * POST /api/autoresearch/programs/[programId]/pause
 * Pause the autoresearch program and cancel any active experiment
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { programId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    // Verify program exists and is running
    const { data: program, error: fetchError } = await supabase
      .from('autoresearch_programs')
      .select('id, status')
      .eq('id', programId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (fetchError || !program) {
      return notFound('Program not found')
    }

    if (program.status !== 'running') {
      return badRequest('Can only pause a running program')
    }

    // Cancel any active experiment
    const { error: expError } = await supabase
      .from('autoresearch_experiments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('program_id', programId)
      .in('status', ['sending', 'waiting', 'evaluating'])

    if (expError) {
      safeError('[Autoresearch Pause] Failed to cancel active experiments:', expError)
    }

    // Update program status to paused
    const { error: updateError } = await supabase
      .from('autoresearch_programs')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', programId)
      .eq('workspace_id', user.workspace_id)

    if (updateError) {
      safeError('[Autoresearch Pause] Failed to update status:', updateError)
      return badRequest('Failed to pause program')
    }

    return success({
      message: 'Autoresearch program paused',
      program_id: programId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
