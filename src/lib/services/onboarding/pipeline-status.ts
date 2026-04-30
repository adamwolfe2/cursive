/**
 * Pipeline Status Auto-Advancement
 * Checks conditions and advances onboarding client status when ready.
 */

import { OnboardingClientRepository } from '@/lib/repositories/onboarding-client.repository'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import type { ClientStatus } from '@/types/onboarding'

/**
 * Check all advancement conditions and move the client to 'active'
 * if enrichment is done, copy is approved (or n/a), and campaigns exist.
 * Returns the new status (or current status if no advancement occurred).
 */
export async function checkAndAdvanceStatus(clientId: string): Promise<ClientStatus> {
  const repo = new OnboardingClientRepository()
  const client = await repo.findById(clientId)

  if (!client) {
    throw new Error(`Client ${clientId} not found`)
  }

  // Only advance from 'setup' status
  if (client.status !== 'setup') {
    return client.status
  }

  const enrichmentReady = client.enrichment_status === 'complete'

  const copyReady =
    client.copy_generation_status === 'complete' ||
    client.copy_generation_status === 'not_applicable'

  const approvalReady =
    client.copy_approval_status === 'approved' ||
    client.copy_approval_status === 'not_applicable'

  const campaignsExist =
    Array.isArray(client.emailbison_campaign_ids) &&
    client.emailbison_campaign_ids.length > 0

  if (enrichmentReady && copyReady && approvalReady && campaignsExist) {
    await repo.updateStatus(clientId, 'active')
    await repo.appendAutomationLog(clientId, {
      step: 'auto_advance',
      status: 'complete',
      timestamp: new Date().toISOString(),
    })

    try {
      await sendSlackAlert({
        type: 'pipeline_update',
        severity: 'info',
        message: `Client auto-advanced to active: ${client.company_name}`,
        metadata: {
          client_id: clientId,
          company: client.company_name,
          previous_status: 'setup',
          new_status: 'active',
        },
      })
    } catch {
      // Non-critical: do not fail if Slack is down
    }

    return 'active'
  }

  return client.status
}
