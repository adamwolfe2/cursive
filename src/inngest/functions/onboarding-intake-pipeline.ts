// Onboarding Intake Pipeline
// Triggered when a client completes their onboarding form.
// Orchestrates: ICP enrichment, email copy generation, Slack notifications,
// confirmation email, CRM sync, and fulfillment checklist creation.

import { getInngest } from '../client'
import { OnboardingClientRepository } from '@/lib/repositories/onboarding-client.repository'
import { enrichClientICP } from '@/lib/services/onboarding/claude-enrichment'
import { generateEmailSequences } from '@/lib/services/onboarding/copy-generation'
import { checkCopyQuality } from '@/lib/services/onboarding/copy-quality-check'
import { sendOnboardingConfirmation } from '@/lib/services/onboarding/onboarding-email'
import {
  sendNewClientSlackAlert,
  sendCopyReviewSlackAlert,
} from '@/lib/services/onboarding/onboarding-slack'
import { syncClientToCRM } from '@/lib/services/onboarding/crm-sync'
import { generateChecklist } from '@/lib/services/onboarding/checklist-generator'
import { needsOutboundSetup } from '@/types/onboarding'
import type { PackageSlug, DraftSequences } from '@/types/onboarding'

const inngest = getInngest()

export const onboardingIntakePipeline = inngest.createFunction(
  {
    id: 'onboarding-intake-pipeline',
    retries: 2,
    onFailure: async ({ error, event }) => {
      const clientId = (event?.data?.event?.data as { client_id?: string })?.client_id
      const companyName = (event?.data?.event?.data as { company_name?: string })?.company_name || 'Unknown'
      try {
        const repo = new OnboardingClientRepository()
        if (clientId) {
          await repo.appendAutomationLog(clientId, {
            step: 'pipeline',
            status: 'failed',
            error: error?.message || 'Unknown pipeline failure',
            timestamp: new Date().toISOString(),
          })
        }

        // Send critical Slack alert
        const { sendSlackAlert } = await import('@/lib/monitoring/alerts')
        const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.meetcursive.com'}/admin/onboarding/${clientId}`
        await sendSlackAlert({
          type: 'inngest_failure',
          severity: 'critical',
          message: `Onboarding intake pipeline FAILED for ${companyName}`,
          metadata: {
            client_id: clientId || 'unknown',
            company: companyName,
            step: 'intake-pipeline',
            error: error?.message || 'Unknown error',
            admin_link: adminUrl,
          },
        }).catch(() => {})

        // Fallback: send email alert if Slack fails
        const alertEmail = process.env.ADMIN_ALERT_EMAIL
        if (alertEmail) {
          try {
            const { sendEmail } = await import('@/lib/email/resend-client')
            await sendEmail({
              to: alertEmail,
              from: 'Cursive Alerts <alerts@meetcursive.com>',
              subject: `[CRITICAL] Onboarding pipeline failed: ${companyName}`,
              html: `<p>The onboarding intake pipeline failed for <strong>${companyName}</strong> (client_id: ${clientId}).</p><p>Error: ${error?.message || 'Unknown'}</p><p><a href="${adminUrl}">View in admin</a></p>`,
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
  { event: 'onboarding/intake-complete' },
  async ({ event, step }) => {
    const { client_id } = event.data

    // Step 1: Load client record
    const client = await step.run('load-client', async () => {
      const repo = new OnboardingClientRepository()
      const c = await repo.findById(client_id)
      if (!c) throw new Error(`Client ${client_id} not found`)
      return c
    })

    // Step 2: Enrich ICP via Claude API
    const icpBrief = await step.run('enrich-icp', async () => {
      const repo = new OnboardingClientRepository()
      await repo.update(client_id, { enrichment_status: 'processing' })
      try {
        const brief = await enrichClientICP(client)
        await repo.update(client_id, {
          enriched_icp_brief: brief as any,
          enrichment_status: 'complete',
        })
        await repo.appendAutomationLog(client_id, {
          step: 'enrichment',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
        return brief
      } catch (e: any) {
        await repo.update(client_id, { enrichment_status: 'failed' })
        await repo.appendAutomationLog(client_id, {
          step: 'enrichment',
          status: 'failed',
          error: e.message,
          timestamp: new Date().toISOString(),
        })
        throw e // Inngest will retry
      }
    })

    // Step 3: Generate email sequences (if outbound/bundle)
    const packages = client.packages_selected as PackageSlug[]
    const needsCopy = needsOutboundSetup(packages)

    let sequences: DraftSequences | null = null
    if (needsCopy) {
      sequences = await step.run('generate-copy', async () => {
        const repo = new OnboardingClientRepository()
        await repo.update(client_id, { copy_generation_status: 'processing' })
        try {
          const seqs = await generateEmailSequences(client, icpBrief, checkCopyQuality)
          await repo.update(client_id, {
            draft_sequences: seqs as any,
            copy_generation_status: 'complete',
          })
          await repo.appendAutomationLog(client_id, {
            step: 'copy_generation',
            status: 'complete',
            timestamp: new Date().toISOString(),
          })
          return seqs
        } catch (e: any) {
          await repo.update(client_id, { copy_generation_status: 'failed' })
          await repo.appendAutomationLog(client_id, {
            step: 'copy_generation',
            status: 'failed',
            error: e.message,
            timestamp: new Date().toISOString(),
          })
          throw e // Inngest will retry
        }
      })
    } else {
      await step.run('skip-copy', async () => {
        const repo = new OnboardingClientRepository()
        await repo.update(client_id, {
          copy_generation_status: 'not_applicable',
          copy_approval_status: 'not_applicable',
        })
        await repo.appendAutomationLog(client_id, {
          step: 'copy_generation',
          status: 'skipped',
          timestamp: new Date().toISOString(),
        })
      })
    }

    // Step 4: Generate fulfillment checklist
    await step.run('generate-checklist', async () => {
      const repo = new OnboardingClientRepository()
      const items = generateChecklist(packages)
      await repo.createChecklist(client_id, items)
      await repo.appendAutomationLog(client_id, {
        step: 'checklist',
        status: 'complete',
        timestamp: new Date().toISOString(),
      })
    })

    // Step 5: Slack notifications (non-critical — errors are caught)
    await step.run('send-slack', async () => {
      const repo = new OnboardingClientRepository()
      try {
        await sendNewClientSlackAlert(client, icpBrief)
        if (needsCopy && sequences) {
          await sendCopyReviewSlackAlert(client, sequences)
        }
        await repo.update(client_id, { slack_notification_sent: true })
        await repo.appendAutomationLog(client_id, {
          step: 'slack',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
      } catch (e: any) {
        await repo.appendAutomationLog(client_id, {
          step: 'slack',
          status: 'failed',
          error: e.message,
          timestamp: new Date().toISOString(),
        })
        // FALLBACK: Send email if Slack fails
        const adminEmail = process.env.ADMIN_ALERT_EMAIL
        if (adminEmail) {
          try {
            const { sendEmail, createEmailTemplate } = await import('@/lib/email/resend-client')
            await sendEmail({
              to: adminEmail,
              subject: `[URGENT] New client onboarded: ${client.company_name} (Slack failed)`,
              html: createEmailTemplate({
                preheader: 'Slack notification failed — manual review required',
                title: `New Client: ${client.company_name}`,
                content: `<p>A new client completed onboarding but the Slack notification failed.</p>
                  <p><strong>Company:</strong> ${client.company_name}</p>
                  <p><strong>Contact:</strong> ${client.primary_contact_name} (${client.primary_contact_email})</p>
                  <p><strong>Packages:</strong> ${(client.packages_selected as string[]).join(', ')}</p>
                  <p><strong>Error:</strong> ${e.message}</p>
                  <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'}/admin/onboarding/${client.id}">View in Admin</a></p>`
              })
            })
          } catch {
            // Email fallback also failed — logged in automation_log already
          }
        }
        // Don't throw — Slack failure should not block the pipeline
      }
    })

    // Step 6: Send confirmation email (non-critical)
    await step.run('send-confirmation-email', async () => {
      const repo = new OnboardingClientRepository()
      try {
        await sendOnboardingConfirmation(client)
        await repo.update(client_id, { confirmation_email_sent: true })
        await repo.appendAutomationLog(client_id, {
          step: 'email',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
      } catch (e: any) {
        await repo.appendAutomationLog(client_id, {
          step: 'email',
          status: 'failed',
          error: e.message,
          timestamp: new Date().toISOString(),
        })
        // Don't throw — email failure should not block the pipeline
      }
    })

    // Step 7: CRM sync (non-critical)
    await step.run('sync-crm', async () => {
      const repo = new OnboardingClientRepository()
      try {
        const crmId = await syncClientToCRM(client, icpBrief)
        await repo.update(client_id, {
          crm_record_id: crmId,
          crm_sync_status: 'synced',
        })
        await repo.appendAutomationLog(client_id, {
          step: 'crm_sync',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
      } catch (e: any) {
        await repo.update(client_id, { crm_sync_status: 'failed' })
        await repo.appendAutomationLog(client_id, {
          step: 'crm_sync',
          status: 'failed',
          error: e.message,
          timestamp: new Date().toISOString(),
        })
        // Don't throw — CRM sync failure should not block the pipeline
      }
    })

    // Step 8: Update status to 'setup' now that all pipeline steps are complete
    await step.run('update-status', async () => {
      const repo = new OnboardingClientRepository()
      await repo.updateStatus(client_id, 'setup')
    })

    return { success: true, client_id }
  }
)
