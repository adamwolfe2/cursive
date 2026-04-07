/**
 * GET /api/outbound/workflows/[id]/stats
 *
 * Returns the live counts for the 6 stage cards plus latest_run + recent_runs.
 * Polled by the StagePipeline component every 5 seconds.
 *
 * Reads from the `outbound_pipeline_counts` view (single query) plus the
 * outbound_runs table.
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

    // Read from the view
    const { data: viewRow } = await supabase
      .from('outbound_pipeline_counts')
      .select('*')
      .eq('agent_id', id)
      .maybeSingle()

    const stages: StageCounts = {
      prospecting: (viewRow as any)?.prospecting_count ?? 0,
      enriching: (viewRow as any)?.enriching_count ?? 0,
      drafting: (viewRow as any)?.drafting_count ?? 0,
      engaging: (viewRow as any)?.engaging_count ?? 0,
      replying: (viewRow as any)?.replying_count ?? 0,
      booked: (viewRow as any)?.booked_count ?? 0,
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
        account: sendingGate.account,
      },
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    return handleApiError(error)
  }
}
