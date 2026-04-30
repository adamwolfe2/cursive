/**
 * A/B Testing Experiments API
 * List and create experiments for a sequence/campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createExperiment } from '@/lib/services/campaign/ab-testing.service'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'

const createExperimentSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  hypothesis: z.string().optional(),
  testType: z.enum(['subject', 'body', 'full_template', 'send_time']).optional(),
  successMetric: z
    .enum(['open_rate', 'click_rate', 'reply_rate', 'conversion_rate'])
    .optional(),
  minimumSampleSize: z.number().int().min(10).max(10000).optional(),
  confidenceLevel: z.number().int().refine((v) => [80, 90, 95, 99].includes(v)).optional(),
  variantALabel: z.string().min(1).max(50).optional(),
  variantBLabel: z.string().min(1).max(50).optional(),
})

// GET /api/ab-testing/experiments?sequenceId=xxx&campaignId=xxx
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const sequenceId = searchParams.get('sequenceId')
    const campaignId = searchParams.get('campaignId')

    // Sequence-level A/B testing is not yet supported.
    // The email_campaigns table does not have a sequence_id column,
    // so we cannot resolve campaigns for a given sequence.
    if (sequenceId && !campaignId) {
      return NextResponse.json({ experiments: [] })
    }

    if (!campaignId) {
      return badRequest('campaignId is required')
    }

    const supabase = await createClient()

    // Verify workspace access to the campaign
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!campaign) {
      return NextResponse.json({ experiments: [] })
    }

    const { data: experiments, error } = await supabase
      .from('ab_experiments')
      .select(
        `
        *,
        winner_variant:email_template_variants!winner_variant_id(id, name)
      `
      )
      .eq('campaign_id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    if (error) {
      return handleApiError(error)
    }

    return NextResponse.json({ experiments: experiments || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/ab-testing/experiments
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const body = await request.json()
    const parsed = createExperimentSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid request')
    }

    const {
      campaignId,
      name,
      description,
      hypothesis,
      testType,
      successMetric,
      minimumSampleSize,
      confidenceLevel,
    } = parsed.data

    // Verify workspace access to campaign
    const supabase = await createClient()
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!campaign) {
      return badRequest('Campaign not found or access denied')
    }

    const result = await createExperiment(campaignId, user.workspace_id, {
      name,
      description,
      hypothesis,
      testType,
      successMetric,
      minimumSampleSize,
      confidenceLevel,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ experiment: result.experiment }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
