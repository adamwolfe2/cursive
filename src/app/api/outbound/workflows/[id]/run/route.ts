/**
 * POST /api/outbound/workflows/[id]/run
 *
 * Triggers an outbound run for the workflow.
 * Validates: workspace credits >= 0.5 * target, no other run currently 'running'
 * for this agent, target_count is capped to min(filters.cap_per_run, 100).
 *
 * Inserts a row in `outbound_runs` with status='running' and sends an
 * `outbound/workflow.run` Inngest event. Returns immediately with the run id.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import {
  handleApiError,
  unauthorized,
  NotFoundError,
  ApiError,
} from '@/lib/utils/api-error-handler'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { OutboundRunRepository } from '@/lib/repositories/outbound-run.repository'
import { CREDIT_COST_PER_LEAD, HARD_CAP_PER_RUN } from '@/lib/services/outbound/al-prospecting.service'
import { getSendingAccountGate } from '@/lib/services/outbound/email-account-gate.service'
import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'

const bodySchema = z.object({
  target_count: z.number().int().min(1).max(HARD_CAP_PER_RUN).optional(),
})

const agentRepo = new AgentRepository()
const runRepo = new OutboundRunRepository()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as { target_count?: number }
    const parsed = bodySchema.parse(body)

    // 1. Load the agent
    const agent = await agentRepo.findOutboundById(id, user.workspace_id)
    if (!agent) throw new NotFoundError('Workflow not found')

    // 1a. SAFETY LOCK (Phase 0): refuse to run unless the workspace has a
    // verified, ACTIVE sending account. Distinguishes "no account" from
    // "account exists but token revoked" so the UI can show the right CTA
    // (Connect Gmail vs Reconnect Gmail) and route the user accordingly.
    const gate = await getSendingAccountGate(user.workspace_id)
    if (!gate.ready) {
      if (gate.needs_reconnect && gate.account) {
        throw new ApiError(
          `Reconnect Gmail (${gate.account.email_address}) before running this workflow. Google revoked the token — visit Settings → Email Accounts to re-authorize.`,
          412
        )
      }
      throw new ApiError(
        'Connect a sending email account before running this workflow. Outbound Agent needs your Gmail (or other inbox) to send from your domain — not the platform default.',
        412
      )
    }

    // 2. Cap target_count
    const filterCap = (agent.outbound_filters as { cap_per_run?: number })?.cap_per_run ?? 25
    const targetCount = Math.min(
      parsed.target_count ?? filterCap,
      filterCap,
      HARD_CAP_PER_RUN
    )

    // 3. Check workspace credits (skip if in dev mock mode)
    if (process.env.OUTBOUND_DEV_MOCK_AL !== '1') {
      const supabase = createAdminClient()
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('credits_balance')
        .eq('id', user.workspace_id)
        .maybeSingle()

      const required = targetCount * CREDIT_COST_PER_LEAD
      const available = workspace?.credits_balance ?? 0
      if (available < required) {
        throw new ApiError(
          `Not enough credits — this run needs ${required.toLocaleString()} credits but you have ${available.toLocaleString()}. Buy more credits at /settings/billing or lower the prospect cap on this workflow.`,
          402,
        )
      }
    }

    // 4. Refuse if a run is already in progress
    const hasActive = await runRepo.hasActiveRun(id, user.workspace_id)
    if (hasActive) {
      throw new ApiError('A run is already in progress for this workflow', 409)
    }

    // 5. Insert outbound_runs row + send Inngest event
    const run = await runRepo.create({
      workspace_id: user.workspace_id,
      agent_id: id,
      triggered_by: user.id,
      status: 'running',
      prospects_target: targetCount,
    })

    await inngest.send({
      name: 'outbound/workflow.run',
      data: {
        run_id: run.id,
        agent_id: id,
        workspace_id: user.workspace_id,
        target_count: targetCount,
        triggered_by: user.id,
      },
    })

    return NextResponse.json({ data: { run_id: run.id, target_count: targetCount } }, { status: 202 })
  } catch (error) {
    return handleApiError(error)
  }
}
