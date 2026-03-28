/**
 * A/B Experiment Results API
 * Returns live statistical analysis for an experiment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { getExperimentResults } from '@/lib/services/campaign/ab-testing.service'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

// GET /api/ab-testing/experiments/[id]/results
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const { id: experimentId } = await params

    // Verify workspace access
    const supabase = await createClient()
    const { data: experiment } = await supabase
      .from('ab_experiments')
      .select('id')
      .eq('id', experimentId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found or access denied' }, { status: 404 })
    }

    const results = await getExperimentResults(experimentId)

    return NextResponse.json({ results })
  } catch (error) {
    return handleApiError(error)
  }
}
