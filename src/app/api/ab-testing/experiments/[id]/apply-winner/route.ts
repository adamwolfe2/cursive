/**
 * Apply A/B Experiment Winner API
 * Promotes the winning variant to 100% traffic share
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { applyWinner, endExperiment } from '@/lib/services/campaign/ab-testing.service'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'

const applyWinnerSchema = z.object({
  winnerVariantId: z.string().uuid(),
})

// POST /api/ab-testing/experiments/[id]/apply-winner
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const { id: experimentId } = await params

    const body = await request.json()
    const parsed = applyWinnerSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'winnerVariantId is required')
    }

    const { winnerVariantId } = parsed.data

    // Verify workspace access
    const supabase = await createClient()
    const { data: experiment } = await supabase
      .from('ab_experiments')
      .select('id, campaign_id, status')
      .eq('id', experimentId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found or access denied' }, { status: 404 })
    }

    if (experiment.status === 'completed' || experiment.status === 'cancelled') {
      return badRequest('Experiment is already ended')
    }

    // Apply winner (sets variant to 100% weight, pauses others)
    const applyResult = await applyWinner(experiment.campaign_id, winnerVariantId)
    if (!applyResult.success) {
      return NextResponse.json({ error: applyResult.error }, { status: 400 })
    }

    // End the experiment
    const endResult = await endExperiment(experimentId, winnerVariantId)
    if (!endResult.success) {
      return NextResponse.json({ error: endResult.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
