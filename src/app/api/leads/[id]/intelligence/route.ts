/**
 * POST /api/leads/[id]/intelligence
 * Body: { tier: 'intel' | 'deep_research' }
 * Deducts credits first, then fires Inngest job for on-demand intelligence enrichment.
 *
 * GET /api/leads/[id]/intelligence
 * Returns current intelligence data for the lead.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { inngest } from '@/inngest/client'
import { safeError } from '@/lib/utils/log-sanitizer'

const schema = z.object({
  tier: z.enum(['intel', 'deep_research']),
})

const CREDIT_COSTS: Record<'intel' | 'deep_research', number> = {
  intel: 2,
  deep_research: 10,
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id: leadId } = await params
    const body = await request.json()
    const { tier } = schema.parse(body)

    const creditsNeeded = CREDIT_COSTS[tier]
    const supabase = createAdminClient()

    // Verify lead belongs to this workspace
    const { data: lead } = await supabase
      .from('leads')
      .select('id, intelligence_tier')
      .eq('id', leadId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Check if already enriched at this tier
    const tierRank = { none: 0, auto: 1, intel: 2, deep_research: 3 }
    const currentRank =
      tierRank[(lead.intelligence_tier as keyof typeof tierRank) ?? 'none'] ?? 0
    const requestedRank = tierRank[tier] ?? 0
    if (currentRank >= requestedRank) {
      return NextResponse.json(
        {
          error: 'Lead already enriched at this tier',
          already_enriched: true,
        },
        { status: 409 }
      )
    }

    // Atomically check + deduct credits (prevents race condition)
    const { data: _newBalance, error: deductError } = await supabase
      .rpc('deduct_workspace_credits', {
        p_workspace_id: user.workspace_id,
        p_amount: creditsNeeded,
      })

    if (deductError) {
      // RPC raises exception on insufficient credits
      if (deductError.message?.includes('Insufficient credits')) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: creditsNeeded,
          },
          { status: 402 }
        )
      }
      safeError('[Intelligence] Credit deduction failed', deductError)
      return NextResponse.json(
        { error: 'Failed to deduct credits' },
        { status: 500 }
      )
    }

    // Fire Inngest job
    await inngest.send({
      name: 'enrichment/intelligence-pack',
      data: {
        lead_id: leadId,
        workspace_id: user.workspace_id,
        tier,
      },
    })

    return NextResponse.json({
      success: true,
      lead_id: leadId,
      tier,
      credits_deducted: creditsNeeded,
      message:
        tier === 'intel'
          ? 'Intelligence Pack queued — results ready in ~30 seconds'
          : 'Deep Research queued — results ready in 2–5 minutes',
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id: leadId } = await params
    const supabase = createAdminClient()

    const [leadResult, creditsResult] = await Promise.all([
      supabase
        .from('leads')
        .select(
          'id, company_tech_stack, linkedin_data, social_intel, news_mentions, research_brief, research_brief_at, intelligence_tier, research_outreach_angle'
        )
        .eq('id', leadId)
        .eq('workspace_id', user.workspace_id)
        .maybeSingle(),
      supabase
        .from('workspace_credits')
        .select('balance')
        .eq('workspace_id', user.workspace_id)
        .maybeSingle(),
    ])

    if (!leadResult.data) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: leadResult.data,
      credits_remaining: creditsResult.data?.balance ?? 0,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
