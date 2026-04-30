/**
 * Autoresearch Program Start API
 * Kick off the autoresearch loop via Inngest
 */

import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, notFound, success, badRequest } from '@/lib/utils/api-error-handler'
import { inngest } from '@/inngest/client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ programId: string }>
}

/**
 * POST /api/autoresearch/programs/[programId]/start
 * Start the autoresearch loop for a program
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { programId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    // Fetch program and validate it's ready to start
    const { data: program, error: fetchError } = await supabase
      .from('autoresearch_programs')
      .select('id, status, baseline_subject, baseline_body, emailbison_campaign_id')
      .eq('id', programId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (fetchError || !program) {
      return notFound('Program not found')
    }

    if (program.status === 'running') {
      return badRequest('Program is already running')
    }

    if (program.status === 'completed') {
      return badRequest('Program has already completed. Create a new program to continue testing.')
    }

    if (!program.baseline_subject || !program.baseline_body) {
      return badRequest('Program must have a baseline subject and body before starting')
    }

    if (!program.emailbison_campaign_id) {
      return badRequest('Program must have an EmailBison campaign linked before starting')
    }

    // Update status to running
    const { error: updateError } = await supabase
      .from('autoresearch_programs')
      .update({
        status: 'running',
        updated_at: new Date().toISOString(),
      })
      .eq('id', programId)
      .eq('workspace_id', user.workspace_id)

    if (updateError) {
      safeError('[Autoresearch Start] Failed to update status:', updateError)
      return badRequest('Failed to start program')
    }

    // Emit Inngest event to kick off the loop
    await inngest.send({
      name: 'autoresearch/program.start',
      data: {
        program_id: programId,
        workspace_id: user.workspace_id,
      },
    })

    try {
      await sendSlackAlert({
        type: 'system_event',
        severity: 'info',
        message: `Autoresearch started for program ${programId}`,
        metadata: {
          program_id: programId,
          workspace_id: user.workspace_id,
        },
      })
    } catch {
      // Non-critical: do not fail if Slack is down
    }

    return success({
      message: 'Autoresearch program started',
      program_id: programId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
