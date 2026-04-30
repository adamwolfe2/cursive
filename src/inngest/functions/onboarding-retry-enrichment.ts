// Onboarding Retry Enrichment
// Retries just the ICP enrichment step for a client.
// If the client has an outbound package and no sequences yet,
// chains to copy generation via the regenerate-copy event.

import { getInngest } from '../client'
import { OnboardingClientRepository } from '@/lib/repositories/onboarding-client.repository'
import { enrichClientICP } from '@/lib/services/onboarding/claude-enrichment'
import { generateEmailSequences } from '@/lib/services/onboarding/copy-generation'
import { needsOutboundSetup } from '@/types/onboarding'
import type { PackageSlug } from '@/types/onboarding'

const inngest = getInngest()

export const onboardingRetryEnrichment = inngest.createFunction(
  {
    id: 'onboarding-retry-enrichment',
    retries: 2,
    onFailure: async ({ error, event }) => {
      const clientId = (event?.data?.event?.data as { client_id?: string })?.client_id
      try {
        const repo = new OnboardingClientRepository()
        if (clientId) {
          await repo.appendAutomationLog(clientId, {
            step: 'enrichment_retry',
            status: 'failed',
            error: error?.message || 'Unknown enrichment retry failure',
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
          message: `Enrichment retry FAILED for ${companyName}`,
          metadata: {
            client_id: clientId || 'unknown',
            company: companyName,
            step: 'enrichment-retry',
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
              subject: `[CRITICAL] Enrichment retry failed: ${companyName}`,
              html: `<p>Enrichment retry failed for <strong>${companyName}</strong> (client_id: ${clientId}).</p><p>Error: ${error?.message || 'Unknown'}</p><p><a href="${adminUrl}">View in admin</a></p>`,
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
  { event: 'onboarding/retry-enrichment' },
  async ({ event, step }) => {
    const { client_id } = event.data

    // Step 1: Load client record
    const client = await step.run('load-client', async () => {
      const repo = new OnboardingClientRepository()
      const c = await repo.findById(client_id)
      if (!c) throw new Error(`Client ${client_id} not found`)
      return c
    })

    // Step 2: Re-run ICP enrichment
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
          step: 'enrichment_retry',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
        return brief
      } catch (e: any) {
        await repo.update(client_id, { enrichment_status: 'failed' })
        await repo.appendAutomationLog(client_id, {
          step: 'enrichment_retry',
          status: 'failed',
          error: e.message,
          timestamp: new Date().toISOString(),
        })
        throw e // Inngest will retry
      }
    })

    // Step 3: If outbound package and no sequences yet, generate copy
    const packages = client.packages_selected as PackageSlug[]
    const needsCopy = needsOutboundSetup(packages)
    const hasSequences = !!client.draft_sequences

    if (needsCopy && !hasSequences) {
      await step.run('generate-copy-after-enrichment', async () => {
        const repo = new OnboardingClientRepository()
        await repo.update(client_id, { copy_generation_status: 'processing' })
        try {
          const seqs = await generateEmailSequences(client, icpBrief)
          await repo.update(client_id, {
            draft_sequences: seqs as any,
            copy_generation_status: 'complete',
          })
          await repo.appendAutomationLog(client_id, {
            step: 'copy_generation_after_enrichment_retry',
            status: 'complete',
            timestamp: new Date().toISOString(),
          })
        } catch (e: any) {
          await repo.update(client_id, { copy_generation_status: 'failed' })
          await repo.appendAutomationLog(client_id, {
            step: 'copy_generation_after_enrichment_retry',
            status: 'failed',
            error: e.message,
            timestamp: new Date().toISOString(),
          })
          throw e // Inngest will retry
        }
      })
    }

    return { success: true, client_id }
  }
)
