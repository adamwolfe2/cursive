// Onboarding EmailBison Push
// Triggered when copy is approved. Creates campaigns in EmailBison and
// updates the client record with campaign IDs.

import { getInngest } from '../client'
import { OnboardingClientRepository } from '@/lib/repositories/onboarding-client.repository'
import { pushCopyToEmailBison } from '@/lib/services/onboarding/emailbison-push'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-helpers'
import type { DraftSequences } from '@/types/onboarding'

const inngest = getInngest()

export const onboardingEmailBisonPush = inngest.createFunction(
  {
    id: 'onboarding-emailbison-push',
    retries: 2,
    timeouts: { finish: '5m' },
    onFailure: async ({ error, event }) => {
      const clientId = (event?.data?.event?.data as { client_id?: string })?.client_id
      try {
        if (clientId) {
          const repo = new OnboardingClientRepository()
          await repo.appendAutomationLog(clientId, {
            step: 'emailbison_push',
            status: 'failed',
            error: error?.message || 'Unknown push failure',
            timestamp: new Date().toISOString(),
          })
        }

        await sendSlackAlert({
          type: 'inngest_failure',
          severity: 'critical',
          message: `EmailBison push FAILED for client ${clientId || 'unknown'}`,
          metadata: {
            client_id: clientId || 'unknown',
            step: 'emailbison-push',
            error: error?.message || 'Unknown error',
          },
        }).catch(() => {})
      } catch {
        // Failure handler must not throw
      }
    },
  },
  { event: 'onboarding/copy-approved' },
  async ({ event, step }) => {
    const { client_id, workspace_id } = event.data

    // Step 1: Load client and approved sequences
    const client = await step.run('load-client', async () => {
      const repo = new OnboardingClientRepository()
      const c = await repo.findById(client_id)
      if (!c) throw new Error(`Client ${client_id} not found`)
      if (!c.draft_sequences) throw new Error(`Client ${client_id} has no draft sequences`)
      if (c.copy_approval_status !== 'approved') {
        throw new Error(`Client ${client_id} copy is not approved (status: ${c.copy_approval_status})`)
      }
      return c
    })

    // Step 2: Push to EmailBison
    const pushResult = await step.run('push-to-emailbison', async () => {
      const repo = new OnboardingClientRepository()

      try {
        const result = await pushCopyToEmailBison({
          clientName: client.company_name,
          sequences: client.draft_sequences as DraftSequences,
          workspaceId: workspace_id,
          dryRun: client.is_test_client === true,
        })

        // Log success before returning so it's captured even if subsequent steps fail
        await repo.appendAutomationLog(client_id, {
          step: 'emailbison_push',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })

        return result
      } catch (error: unknown) {
        await repo.appendAutomationLog(client_id, {
          step: 'emailbison_push',
          status: 'failed',
          error: getErrorMessage(error),
          timestamp: new Date().toISOString(),
        })
        throw error
      }
    })

    // Step 3: Update client record with campaign IDs
    await step.run('update-client-campaigns', async () => {
      const repo = new OnboardingClientRepository()
      const campaignIds = pushResult.campaigns.map((c) => c.campaignId)

      await repo.update(client_id, {
        emailbison_campaign_ids: campaignIds,
        campaign_deployed: true,
      } as any)

      await repo.appendAutomationLog(client_id, {
        step: 'campaign_ids_saved',
        status: 'complete',
        timestamp: new Date().toISOString(),
      })
    })

    // Step 4: Send Slack notification
    await step.run('send-slack-notification', async () => {
      const campaignSummary = pushResult.campaigns
        .map((c) => `${c.campaignName} (${c.sequenceSteps} steps, ${c.variants} variants)`)
        .join('\n')

      try {
        await sendSlackAlert({
          type: 'pipeline_update',
          severity: 'info',
          message: `Campaigns created in EmailBison for ${client.company_name}`,
          metadata: {
            client_id,
            company: client.company_name,
            campaigns_created: pushResult.campaigns.length.toString(),
            campaign_summary: campaignSummary,
            admin_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.meetcursive.com'}/admin/onboarding/${client_id}`,
          },
        })
      } catch (error: unknown) {
        safeError(`[EmailBison Push] Slack notification failed: ${getErrorMessage(error)}`)
        // Non-fatal — don't throw
      }
    })

    // Step 5: Check if all setup steps are complete and move to active
    await step.run('check-activation', async () => {
      const repo = new OnboardingClientRepository()
      const freshClient = await repo.findById(client_id)
      if (!freshClient) return

      const isFullySetup =
        freshClient.campaign_deployed &&
        freshClient.copy_approval_status === 'approved' &&
        freshClient.enrichment_status === 'complete' &&
        freshClient.sow_signed &&
        freshClient.payment_confirmed

      if (isFullySetup && freshClient.status === 'setup') {
        await repo.updateStatus(client_id, 'active')
        await repo.appendAutomationLog(client_id, {
          step: 'status_to_active',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
      }
    })

    return {
      success: true,
      client_id,
      campaigns: pushResult.campaigns.length,
      campaign_ids: pushResult.campaigns.map((c) => c.campaignId),
    }
  }
)
