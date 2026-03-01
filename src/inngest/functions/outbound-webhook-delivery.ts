/**
 * Outbound Webhook Delivery — Inngest Function
 * Cursive Platform
 *
 * Triggered by 'outbound-webhook/deliver' events.
 * Fan-out: finds all matching workspace webhooks and delivers to each.
 */

import { inngest } from '../client'
import {
  getMatchingWebhookIds,
  deliverWebhook,
} from '@/lib/services/webhook-delivery.service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export const deliverOutboundWebhooks = inngest.createFunction(
  { id: 'deliver-outbound-webhooks', retries: 3 },
  { event: 'outbound-webhook/deliver' },
  async ({ event, step }) => {
    const { workspace_id, event_type, payload } = event.data as {
      workspace_id: string
      event_type: string
      payload: unknown
    }

    // Find all active webhooks for this workspace that subscribe to this event
    const webhookIds = await step.run('find-matching-webhooks', async () => {
      return getMatchingWebhookIds(workspace_id, event_type)
    })

    if (webhookIds.length === 0) {
      safeLog(`[OutboundWebhooks] No matching webhooks for workspace=${workspace_id} event=${event_type}`)
      return { delivered: 0, skipped: true }
    }

    safeLog(`[OutboundWebhooks] Delivering event=${event_type} to ${webhookIds.length} webhook(s) for workspace=${workspace_id}`)

    // Deliver to each webhook in its own step so failures are isolated
    const results = await Promise.all(
      webhookIds.map((webhookId) =>
        step.run(`deliver-to-${webhookId}`, async () => {
          try {
            const result = await deliverWebhook(webhookId, event_type, payload)
            return result
          } catch (err: any) {
            safeError(`[OutboundWebhooks] Delivery error webhookId=${webhookId}:`, err)
            return { webhookId, deliveryId: '', success: false, error: err.message }
          }
        })
      )
    )

    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return { delivered: succeeded, failed, total: webhookIds.length }
  }
)
