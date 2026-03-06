/**
 * POST /api/leads/bulk-intelligence
 * Body: { lead_ids: string[], tier: 'intel' }
 * Max 50 leads at once. Deducts credits for all eligible leads, then fires
 * one Inngest event per lead for batch Intelligence Pack enrichment.
 * Only 'intel' tier is supported for bulk — deep_research is single-lead only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { fastAuth } from '@/lib/auth/fast-auth'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { inngest } from '@/inngest/client'
import { safeError } from '@/lib/utils/log-sanitizer'

const schema = z.object({
  lead_ids: z.array(z.string().uuid()).min(1).max(50),
  tier: z.enum(['intel']), // Only intel for bulk; deep_research is single-lead only
})

const INTEL_CREDIT_COST = 2

export async function POST(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { lead_ids, tier } = schema.parse(body)

    const supabase = createAdminClient()

    // Verify all leads belong to this workspace and filter already-enriched ones
    const { data: leads } = await supabase
      .from('leads')
      .select('id, intelligence_tier')
      .eq('workspace_id', user.workspaceId)
      .in('id', lead_ids)

    const eligibleLeads = (leads ?? []).filter((l) => {
      const tierRank = { none: 0, auto: 1, intel: 2, deep_research: 3 }
      const current =
        tierRank[(l.intelligence_tier as keyof typeof tierRank) ?? 'none'] ?? 0
      return current < 2 // below intel tier
    })

    if (eligibleLeads.length === 0) {
      return NextResponse.json(
        { error: 'All selected leads already have Intelligence Pack' },
        { status: 409 }
      )
    }

    const creditsNeeded = eligibleLeads.length * INTEL_CREDIT_COST

    // Check credit balance
    const { data: credits } = await supabase
      .from('workspace_credits')
      .select('balance')
      .eq('workspace_id', user.workspaceId)
      .maybeSingle()

    const balance = credits?.balance ?? 0
    if (balance < creditsNeeded) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: creditsNeeded,
          available: balance,
          eligible_leads: eligibleLeads.length,
        },
        { status: 402 }
      )
    }

    // Deduct credits for all eligible leads
    const { error: deductError } = await supabase
      .from('workspace_credits')
      .update({ balance: balance - creditsNeeded })
      .eq('workspace_id', user.workspaceId)

    if (deductError) {
      safeError('[BulkIntelligence] Credit deduction failed', deductError)
      return NextResponse.json(
        { error: 'Failed to deduct credits' },
        { status: 500 }
      )
    }

    // Fire one Inngest event per eligible lead
    const events = eligibleLeads.map((lead) => ({
      name: 'enrichment/intelligence-pack' as const,
      data: {
        lead_id: lead.id,
        workspace_id: user.workspaceId,
        tier,
      },
    }))

    await inngest.send(events)

    return NextResponse.json({
      success: true,
      leads_queued: eligibleLeads.length,
      credits_deducted: creditsNeeded,
      skipped: lead_ids.length - eligibleLeads.length,
      message: `Intelligence Pack queued for ${eligibleLeads.length} leads`,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
