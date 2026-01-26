/**
 * Campaign Experiments API
 * Manage A/B test experiments
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, notFound, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  createExperiment,
  startExperiment,
  getExperimentResults,
  endExperiment,
  applyWinner,
} from '@/lib/services/campaign/ab-testing.service'

interface RouteContext {
  params: Promise<{ id: string }>
}

const createExperimentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  hypothesis: z.string().optional(),
  test_type: z.enum(['subject', 'body', 'full_template', 'send_time']).optional(),
  success_metric: z.enum(['open_rate', 'click_rate', 'reply_rate', 'conversion_rate']).optional(),
  minimum_sample_size: z.number().int().min(10).max(10000).optional(),
  confidence_level: z.number().min(80).max(99.9).optional(),
  auto_end_on_significance: z.boolean().optional(),
})

const actionSchema = z.object({
  action: z.enum(['start', 'pause', 'end', 'apply_winner']),
  winner_variant_id: z.string().uuid().optional(),
})

/**
 * GET /api/campaigns/[id]/experiments
 * Get all experiments for a campaign
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    // Verify campaign access
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('id, name')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (campaignError || !campaign) {
      return notFound('Campaign not found')
    }

    // Get experiments
    const { data: experiments, error } = await supabase
      .from('ab_experiments')
      .select(`
        id,
        name,
        description,
        hypothesis,
        test_type,
        success_metric,
        minimum_sample_size,
        confidence_level,
        status,
        winner_variant_id,
        statistical_significance,
        started_at,
        ended_at,
        created_at
      `)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      return badRequest(error.message)
    }

    // Get results for running experiments
    const experimentsWithResults = await Promise.all(
      (experiments || []).map(async (exp) => {
        if (exp.status === 'running' || exp.status === 'completed') {
          const results = await getExperimentResults(exp.id)
          return {
            ...exp,
            results: results
              ? {
                  status: results.status,
                  winner_variant_id: results.winnerVariantId,
                  winner_name: results.winnerName,
                  confidence_level: results.confidenceLevel,
                  lift_percent: results.liftPercent,
                  recommendation: results.recommendation,
                  variant_summary: results.variants.map((v) => ({
                    name: v.name,
                    is_control: v.isControl,
                    sample_size: v.sampleSize,
                    open_rate: v.openRate,
                    click_rate: v.clickRate,
                    reply_rate: v.replyRate,
                  })),
                }
              : null,
          }
        }
        return { ...exp, results: null }
      })
    )

    return success({
      campaign_id: campaignId,
      campaign_name: campaign.name,
      experiments: experimentsWithResults,
      total: experiments?.length || 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/campaigns/[id]/experiments
 * Create a new experiment
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = createExperimentSchema.parse(body)

    const supabase = await createClient()

    // Verify campaign access
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (error || !campaign) {
      return notFound('Campaign not found')
    }

    // Check for existing running experiment
    const { data: existingRunning } = await supabase
      .from('ab_experiments')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('status', 'running')
      .single()

    if (existingRunning) {
      return badRequest('Campaign already has a running experiment. End it before starting a new one.')
    }

    const result = await createExperiment(campaignId, user.workspace_id, {
      name: validated.name,
      description: validated.description,
      hypothesis: validated.hypothesis,
      testType: validated.test_type,
      successMetric: validated.success_metric,
      minimumSampleSize: validated.minimum_sample_size,
      confidenceLevel: validated.confidence_level,
      autoEndOnSignificance: validated.auto_end_on_significance,
    })

    if (!result.success) {
      return badRequest(result.error || 'Failed to create experiment')
    }

    return success({
      message: 'Experiment created',
      experiment: {
        id: result.experiment!.id,
        name: result.experiment!.name,
        status: result.experiment!.status,
        test_type: result.experiment!.testType,
        success_metric: result.experiment!.successMetric,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/campaigns/[id]/experiments
 * Perform action on experiment (start, pause, end, apply_winner)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = actionSchema.parse(body)

    const supabase = await createClient()

    // Verify campaign access
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (campaignError || !campaign) {
      return notFound('Campaign not found')
    }

    // Get experiment ID from query or body
    const url = new URL(request.url)
    const experimentId = url.searchParams.get('experiment_id')

    if (!experimentId) {
      return badRequest('experiment_id query parameter is required')
    }

    // Verify experiment belongs to campaign
    const { data: experiment, error: expError } = await supabase
      .from('ab_experiments')
      .select('id, status')
      .eq('id', experimentId)
      .eq('campaign_id', campaignId)
      .single()

    if (expError || !experiment) {
      return notFound('Experiment not found')
    }

    let result: { success: boolean; error?: string }

    switch (validated.action) {
      case 'start':
        if (experiment.status !== 'draft') {
          return badRequest('Can only start experiments in draft status')
        }
        result = await startExperiment(experimentId)
        break

      case 'pause':
        if (experiment.status !== 'running') {
          return badRequest('Can only pause running experiments')
        }
        const { error: pauseError } = await supabase
          .from('ab_experiments')
          .update({ status: 'paused' })
          .eq('id', experimentId)
        result = { success: !pauseError, error: pauseError?.message }
        break

      case 'end':
        if (!['running', 'paused'].includes(experiment.status)) {
          return badRequest('Can only end running or paused experiments')
        }
        result = await endExperiment(experimentId, validated.winner_variant_id)
        break

      case 'apply_winner':
        if (experiment.status !== 'completed') {
          return badRequest('Can only apply winner from completed experiments')
        }
        if (!validated.winner_variant_id) {
          return badRequest('winner_variant_id is required for apply_winner action')
        }
        result = await applyWinner(campaignId, validated.winner_variant_id)
        break

      default:
        return badRequest('Invalid action')
    }

    if (!result.success) {
      return badRequest(result.error || 'Action failed')
    }

    return success({
      message: `Experiment ${validated.action} successful`,
      experiment_id: experimentId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
