import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { DncRepository } from '@/lib/repositories/dnc.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

export const sdrFollowupCron = inngest.createFunction(
  { id: 'sdr-followup-cron', retries: 1, concurrency: { limit: 1 } },
  { cron: 'TZ=America/Chicago 0 9 * * 1-5' }, // 9am CT weekdays
  async ({ step, logger }) => {
    // Step 1: Load all workspaces with follow-up enabled
    const configs = await step.run('load-configs', async () => {
      const { data } = await createAdminClient()
        .from('sdr_configurations')
        .select('*')
        .eq('follow_up_enabled', true)
      return data || []
    })

    logger.info(`[SDR Follow-up] Processing ${configs.length} workspaces`)

    for (const config of configs) {
      await step.run(`followup-${config.workspace_id}`, async () => {
        const supabase = createAdminClient()
        const dncRepo = new DncRepository()

        // Find leads that replied but haven't heard back in follow_up_interval_days
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - config.follow_up_interval_days)

        const { data: leads } = await supabase
          .from('campaign_leads')
          .select('id, lead_id, campaign_id, leads!inner(email, first_name)')
          .eq('status', 'replied')
          .lt('replied_at', cutoff.toISOString())
          .limit(20)

        for (const lead of leads || []) {
          try {
            const leadData = lead.leads as unknown as { email: string; first_name: string | null }
            const isBlocked = await dncRepo.isBlocked(config.workspace_id, leadData.email)
            if (isBlocked) continue

            // Count how many follow-ups already sent
            const { count } = await supabase
              .from('email_replies')
              .select('id', { count: 'exact', head: true })
              .eq('lead_id', lead.lead_id)
              .eq('workspace_id', config.workspace_id)
              .in('draft_status', ['sent'])

            if ((count || 0) >= config.follow_up_count) continue

            // For MVP: log that follow-up is needed; full Claude generation in v2
            logger.info(`[SDR Follow-up] Queued follow-up for lead in workspace ${config.workspace_id}`)
            // TODO v2: generate follow-up via Claude + route through HiL/auto-send
          } catch (e) {
            safeError('[SDR Follow-up] Error processing lead:', e)
          }
        }
      })
    }
  }
)
