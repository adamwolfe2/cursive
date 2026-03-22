// Onboarding Copy Regeneration
// Triggered when an admin requests regeneration of email sequences for a client.
// Loads existing client data, calls regenerateEmailSequences with feedback,
// updates the DB, and notifies via Slack.

import { getInngest } from '../client'
import { OnboardingClientRepository } from '@/lib/repositories/onboarding-client.repository'
import { regenerateEmailSequences } from '@/lib/services/onboarding/copy-generation'
import { sendCopyReviewSlackAlert } from '@/lib/services/onboarding/onboarding-slack'
import type { EnrichedICPBrief, DraftSequences } from '@/types/onboarding'

const inngest = getInngest()

export const onboardingCopyRegeneration = inngest.createFunction(
  {
    id: 'onboarding-copy-regeneration',
    retries: 2,
    onFailure: async ({ error, event }) => {
      const clientId = (event?.data?.event?.data as { client_id?: string })?.client_id
      try {
        const repo = new OnboardingClientRepository()
        if (clientId) {
          await repo.appendAutomationLog(clientId, {
            step: 'copy_regeneration',
            status: 'failed',
            error: error?.message || 'Unknown copy regeneration failure',
            timestamp: new Date().toISOString(),
          })
        }

        // Send critical Slack alert
        const { sendSlackAlert } = await import('@/lib/monitoring/alerts')
        const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.meetcursive.com'}/admin/onboarding/${clientId}`

        // Load company name if possible
        let companyName = 'Unknown'
        try {
          if (clientId) {
            const client = await repo.findById(clientId)
            if (client) companyName = client.company_name
          }
        } catch { /* best effort */ }

        await sendSlackAlert({
          type: 'inngest_failure',
          severity: 'critical',
          message: `Copy regeneration FAILED for ${companyName}`,
          metadata: {
            client_id: clientId || 'unknown',
            company: companyName,
            step: 'copy-regeneration',
            error: error?.message || 'Unknown error',
            admin_link: adminUrl,
          },
        }).catch(() => {})

        // Fallback: email alert
        const alertEmail = process.env.ADMIN_ALERT_EMAIL
        if (alertEmail) {
          try {
            const { sendEmail } = await import('@/lib/email/resend-client')
            await sendEmail({
              to: alertEmail,
              from: 'Cursive Alerts <alerts@meetcursive.com>',
              subject: `[CRITICAL] Copy regeneration failed: ${companyName}`,
              html: `<p>Copy regeneration failed for <strong>${companyName}</strong> (client_id: ${clientId}).</p><p>Error: ${error?.message || 'Unknown'}</p><p><a href="${adminUrl}">View in admin</a></p>`,
            })
          } catch {
            // Swallow — best effort
          }
        }
      } catch {
        // Swallow — failure handler must not throw
      }
    },
  },
  { event: 'onboarding/regenerate-copy' },
  async ({ event, step }) => {
    const { client_id, feedback } = event.data

    // Step 1: Load client record
    const client = await step.run('load-client', async () => {
      const repo = new OnboardingClientRepository()
      const c = await repo.findById(client_id)
      if (!c) throw new Error(`Client ${client_id} not found`)
      return c
    })

    // Step 2: Validate preconditions
    const icpBrief = client.enriched_icp_brief as EnrichedICPBrief | null
    if (!icpBrief) {
      throw new Error(`Client ${client_id} has no enriched ICP brief — cannot regenerate copy`)
    }

    const previousSequences = client.draft_sequences as DraftSequences | null
    if (!previousSequences) {
      throw new Error(`Client ${client_id} has no existing sequences — cannot regenerate copy`)
    }

    // Step 3: Regenerate email sequences with feedback
    const sequences = await step.run('regenerate-copy', async () => {
      const repo = new OnboardingClientRepository()
      await repo.update(client_id, {
        copy_generation_status: 'processing',
        copy_approval_status: 'regenerating',
      })
      try {
        const seqs = await regenerateEmailSequences(
          client,
          icpBrief,
          previousSequences,
          feedback || ''
        )
        await repo.update(client_id, {
          draft_sequences: seqs as any,
          copy_generation_status: 'complete',
          copy_approval_status: 'pending',
        })
        await repo.appendAutomationLog(client_id, {
          step: 'copy_regeneration',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
        return seqs
      } catch (e: any) {
        await repo.update(client_id, {
          copy_generation_status: 'failed',
          copy_approval_status: 'needs_edits',
        })
        await repo.appendAutomationLog(client_id, {
          step: 'copy_regeneration',
          status: 'failed',
          error: e.message,
          timestamp: new Date().toISOString(),
        })
        throw e // Inngest will retry
      }
    })

    // Step 4: Notify via Slack (non-critical)
    await step.run('send-slack-review', async () => {
      const repo = new OnboardingClientRepository()
      try {
        await sendCopyReviewSlackAlert(client, sequences)
        await repo.appendAutomationLog(client_id, {
          step: 'copy_regeneration_slack',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
      } catch (e: any) {
        await repo.appendAutomationLog(client_id, {
          step: 'copy_regeneration_slack',
          status: 'failed',
          error: e.message,
          timestamp: new Date().toISOString(),
        })
        // Don't throw — Slack failure should not block
      }
    })

    return { success: true, client_id }
  }
)
