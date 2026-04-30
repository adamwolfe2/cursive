/**
 * Outbound Workflow Run — Inngest orchestrator
 *
 * Triggered by `outbound/workflow.run` (sent by POST /api/outbound/workflows/[id]/run).
 *
 * Pipeline (each is a `step.run` block, durably checkpointed):
 *   1. loadAgent          — fetch agent + filters; ensure outbound_campaign_id exists
 *   2. previewAndPull     — prospectAndIngest() (AL preview + create + fetch + dedupe + insert)
 *   3. dncFilter          — filter blocked / suppressed emails
 *   4. queueEnrichment    — insert campaign_leads + emit one campaign/lead-added per lead
 *   5. markRunComplete    — outbound_runs.status='completed', agents.outbound_last_run_at=now()
 *
 * Concurrency: 1 per agent_id (prevents overlapping runs)
 * Throttle: 80/hr per workspace (Claude rate-limit safety net)
 * Retries: 2; failures land in `outbound_runs.error_message` AND universal failure handler
 *
 * Drafts land in `email_sends.status='pending_approval'` automatically because
 * `enrichCampaignLead` (existing) emits `campaign/compose-email`, and the patched
 * `composeCampaignEmail` synthesizes a draft via Claude when the campaign is
 * flagged `is_outbound_agent`.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { OutboundRunRepository } from '@/lib/repositories/outbound-run.repository'
import { DncRepository } from '@/lib/repositories/dnc.repository'
import { isEmailSuppressed } from '@/lib/services/campaign/suppression.service'
import {
  prospectAndIngest,
  EmptyPreviewError,
  OverlyBroadFilterError,
  InsufficientCreditsError,
} from '@/lib/services/outbound/al-prospecting.service'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { OutboundFilters } from '@/types/outbound'

export const outboundWorkflowRun = inngest.createFunction(
  {
    id: 'outbound-workflow-run',
    name: 'Outbound Workflow Run',
    retries: 2,
    timeouts: { finish: '15m' },
    concurrency: { limit: 1, key: 'event.data.agent_id' },
    throttle: {
      limit: 80,
      period: '1h',
      key: 'event.data.workspace_id',
    },
  },
  { event: 'outbound/workflow.run' },
  async ({ event, step, logger }) => {
    const { run_id, agent_id, workspace_id, target_count, triggered_by } = event.data
    const agentRepo = new AgentRepository()
    const runRepo = new OutboundRunRepository()
    const dncRepo = new DncRepository()

    // ----------------------------------------------------------------
    // 1. Load agent + ensure synthetic campaign exists
    // ----------------------------------------------------------------
    const ctx = await step.run('load-agent', async () => {
      const supabase = createAdminClient()
      const { data: agent, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agent_id)
        .eq('workspace_id', workspace_id)
        .maybeSingle()

      if (error || !agent) {
        throw new Error(`Agent not found: ${agent_id}`)
      }
      if (!(agent as { outbound_enabled?: boolean }).outbound_enabled) {
        throw new Error(`Agent ${agent_id} does not have outbound enabled`)
      }

      const campaignId = await agentRepo.ensureOutboundCampaign(agent.id)

      return {
        agent: agent as Record<string, unknown>,
        campaignId,
      }
    })

    const filters = (ctx.agent.outbound_filters as OutboundFilters | null) ?? {}

    // ----------------------------------------------------------------
    // 2. Pull prospects from AudienceLab (preview + create + fetch + dedupe + insert)
    // ----------------------------------------------------------------
    let pullResult: Awaited<ReturnType<typeof prospectAndIngest>>
    try {
      pullResult = await step.run('pull-prospects', () =>
        prospectAndIngest({
          workspaceId: workspace_id,
          agentId: agent_id,
          filters,
          targetCount: target_count,
          runId: run_id,
          triggeredByUserId: triggered_by,
        })
      )
    } catch (err) {
      const message =
        err instanceof EmptyPreviewError ? 'No matches for these filters — broaden ICP' :
        err instanceof OverlyBroadFilterError ? `Filter is too broad (${err.previewCount.toLocaleString()} matches). Add more constraints.` :
        err instanceof InsufficientCreditsError ? `Insufficient credits: ${err.required} required, ${err.balance} available` :
        err instanceof Error ? err.message :
        String(err)

      safeError('[outbound] pull-prospects failed:', err)
      await runRepo.markComplete(run_id, 'failed', message)
      throw err
    }

    await step.run('update-run-prospects', async () =>
      runRepo.updateProgress(run_id, {
        prospects_target: target_count,
        prospects_found: pullResult.newLeads,
        credits_spent: pullResult.creditsCharged,
      })
    )

    // If nothing new came through, mark complete and exit cleanly
    if (pullResult.insertedLeadIds.length === 0) {
      await step.run('mark-empty-complete', async () => {
        await runRepo.markComplete(run_id, 'completed')
        await agentRepo.updateOutboundConfig(agent_id, workspace_id, {
          outbound_last_run_at: new Date().toISOString(),
        }).catch(() => undefined) // RLS may reject without auth context — non-fatal
        // Fallback admin update
        const supabase = createAdminClient()
        await supabase
          .from('agents')
          .update({ outbound_last_run_at: new Date().toISOString() })
          .eq('id', agent_id)
      })
      return {
        success: true,
        run_id,
        prospects_found: 0,
        message: 'No new leads found (all filtered or duplicates)',
      }
    }

    // ----------------------------------------------------------------
    // 3. DNC + suppression filter — skip blocked emails before drafting
    // ----------------------------------------------------------------
    const filteredLeadIds = await step.run('dnc-filter', async () => {
      const supabase = createAdminClient()
      const { data: insertedLeads, error } = await supabase
        .from('leads')
        .select('id, email')
        .in('id', pullResult.insertedLeadIds)

      if (error || !insertedLeads) {
        throw new Error(`Failed to re-fetch inserted leads: ${error?.message ?? 'unknown'}`)
      }

      const allowed: string[] = []
      for (const lead of insertedLeads) {
        if (!lead.email) continue
        const isDnc = await dncRepo.isBlocked(workspace_id, lead.email)
        if (isDnc) continue
        const sup = await isEmailSuppressed(lead.email, workspace_id)
        if ((sup as { suppressed?: boolean })?.suppressed) continue
        allowed.push(lead.id)
      }
      return allowed
    })

    if (filteredLeadIds.length === 0) {
      await step.run('mark-all-suppressed', async () => {
        await runRepo.markComplete(run_id, 'completed', 'All leads were on DNC/suppression list')
      })
      return {
        success: true,
        run_id,
        prospects_found: pullResult.newLeads,
        suppressed: pullResult.newLeads,
        message: 'All leads filtered by DNC / suppression',
      }
    }

    // ----------------------------------------------------------------
    // 4. Insert campaign_leads rows + emit campaign/lead-added events
    // ----------------------------------------------------------------
    await step.run('queue-enrichment', async () => {
      const supabase = createAdminClient()

      const campaignLeadInserts = filteredLeadIds.map(lead_id => ({
        campaign_id: ctx.campaignId,
        lead_id,
        status: 'pending',
      }))

      const { data: created, error } = await supabase
        .from('campaign_leads')
        .insert(campaignLeadInserts as any)
        .select('id, lead_id')

      if (error || !created) {
        throw new Error(`Failed to insert campaign_leads: ${error?.message ?? 'unknown'}`)
      }

      // Emit one campaign/lead-added event per lead — enrichCampaignLead
      // (existing function) takes it from here: enrich → emit campaign/compose-email
      // → patched composeCampaignEmail synthesizes a draft via generateSalesEmail()
      // → email_sends.status='pending_approval'.
      const events = created.map(cl => ({
        name: 'campaign/lead-added' as const,
        data: {
          campaign_lead_id: cl.id,
          campaign_id: ctx.campaignId,
          lead_id: cl.lead_id,
          workspace_id,
        },
      }))

      if (events.length > 0) {
        await inngest.send(events)
      }
      logger.info(`[outbound] Queued ${events.length} leads for enrichment + drafting`)
    })

    // ----------------------------------------------------------------
    // 5. Mark run complete (drafts will continue arriving asynchronously;
    //    the stats refresher cron will keep counts in sync)
    // ----------------------------------------------------------------
    await step.run('mark-complete', async () => {
      await runRepo.markComplete(run_id, 'completed')
      const supabase = createAdminClient()
      await supabase
        .from('agents')
        .update({ outbound_last_run_at: new Date().toISOString() })
        .eq('id', agent_id)
    })

    await step.run('emit-completed-event', async () => {
      await inngest.send({
        name: 'outbound/workflow.completed',
        data: {
          run_id,
          agent_id,
          workspace_id,
          status: 'completed',
        },
      })
    })

    return {
      success: true,
      run_id,
      prospects_found: pullResult.newLeads,
      suppressed: pullResult.newLeads - filteredLeadIds.length,
      queued_for_drafting: filteredLeadIds.length,
      credits_spent: pullResult.creditsCharged,
      dev_mock: pullResult.devMock,
    }
  }
)
