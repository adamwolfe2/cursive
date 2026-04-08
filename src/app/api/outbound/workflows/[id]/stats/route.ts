/**
 * GET /api/outbound/workflows/[id]/stats
 *
 * Returns the live counts for the 6 stage cards plus latest_run + recent_runs.
 * Polled by the StagePipeline component every 5 seconds.
 *
 * Computes stage counts from live queries on campaign_leads + email_sends
 * so the numbers reflect reality immediately, not what the stats-refresher
 * cron had at its last run. We still fall back to the pre-aggregated view
 * if the agent has no outbound_campaign_id wired up yet (rare — only for
 * agents that have never had a run triggered).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import {
  handleApiError,
  unauthorized,
  NotFoundError,
} from '@/lib/utils/api-error-handler'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { OutboundRunRepository } from '@/lib/repositories/outbound-run.repository'
import { getSendingAccountGate } from '@/lib/services/outbound/email-account-gate.service'
import { createClient } from '@/lib/supabase/server'
import type { StageCounts, WorkflowStatsResponse } from '@/types/outbound'

const agentRepo = new AgentRepository()
const runRepo = new OutboundRunRepository()

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params

    // Verify workflow exists + workspace ownership
    const agent = await agentRepo.findOutboundById(id, user.workspace_id)
    if (!agent) throw new NotFoundError('Workflow not found')

    const supabase = await createClient()

    // ── Live stage counts ────────────────────────────────────────────────
    // Previously we read from `outbound_pipeline_counts` (a view that's
    // refreshed by the outbound-stats-refresher cron). That lagged behind
    // reality by up to a few minutes, which made the detail page feel
    // unresponsive while a run was in flight. Now we compute the counts
    // directly from the source tables.
    const campaignId = (agent as { outbound_campaign_id?: string | null }).outbound_campaign_id
      ?? null

    let stages: StageCounts = {
      prospecting: 0,
      enriching: 0,
      drafting: 0,
      engaging: 0,
      replying: 0,
      booked: 0,
    }

    if (campaignId) {
      const [
        { count: prospectingCount },
        { count: enrichingCount },
        { count: draftingCount },
        { count: engagingCount },
        { count: replyingCount },
        { count: bookedCount },
      ] = await Promise.all([
        supabase
          .from('campaign_leads')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('status', 'pending'),
        supabase
          .from('campaign_leads')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('status', 'enriching'),
        supabase
          .from('email_sends')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('status', 'pending_approval'),
        supabase
          .from('email_sends')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .in('status', ['approved', 'sending', 'sent']),
        supabase
          .from('email_replies')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId),
        supabase
          .from('cal_bookings')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId),
      ])

      stages = {
        prospecting: prospectingCount ?? 0,
        enriching: enrichingCount ?? 0,
        drafting: draftingCount ?? 0,
        engaging: engagingCount ?? 0,
        replying: replyingCount ?? 0,
        booked: bookedCount ?? 0,
      }
    } else {
      // Fallback — agent has no campaign yet, try the view
      const { data: viewRow } = await supabase
        .from('outbound_pipeline_counts')
        .select('*')
        .eq('agent_id', id)
        .maybeSingle()

      stages = {
        prospecting: (viewRow as any)?.prospecting_count ?? 0,
        enriching: (viewRow as any)?.enriching_count ?? 0,
        drafting: (viewRow as any)?.drafting_count ?? 0,
        engaging: (viewRow as any)?.engaging_count ?? 0,
        replying: (viewRow as any)?.replying_count ?? 0,
        booked: (viewRow as any)?.booked_count ?? 0,
      }
    }

    const [latest_run, recent_runs, sendingGate] = await Promise.all([
      runRepo.findLatest(id, user.workspace_id),
      runRepo.findRecent(id, user.workspace_id, 10),
      getSendingAccountGate(user.workspace_id),
    ])

    const response: WorkflowStatsResponse = {
      stages,
      latest_run,
      recent_runs,
      sending_account: {
        ready: sendingGate.ready,
        count: sendingGate.count,
        needs_reconnect: sendingGate.needs_reconnect,
        account: sendingGate.account,
      },
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    return handleApiError(error)
  }
}
