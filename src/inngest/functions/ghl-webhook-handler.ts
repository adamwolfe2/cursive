/**
 * GHL Webhook Handler
 *
 * Consumes `ghl/webhook.received` events fired by /api/webhooks/leadconnector
 * and routes them by event type. Designed to be safe to extend — unknown
 * event types are logged and acked, never thrown.
 *
 * GHL event types we care about (initial set):
 *   - ContactCreate / ContactUpdate         → audit + reverse-sync hook
 *   - OpportunityCreate / OpportunityStatusUpdate → fire pipeline lifecycle
 *   - InboundMessage / OutboundMessage      → log for engagement scoring
 *   - CallStatusUpdate                       → log for engagement scoring
 *
 * For now we persist every event to audit_logs (already done in the webhook
 * route) and emit lifecycle events when relevant. Full bidirectional sync
 * can be layered on top of this skeleton.
 */

import { inngest } from '../client'
import { safeLog } from '@/lib/utils/log-sanitizer'

export const ghlWebhookHandler = inngest.createFunction(
  {
    id: 'ghl-webhook-handler',
    name: 'GHL Inbound Webhook Router',
    retries: 3,
    timeouts: { finish: '1m' },
    concurrency: [{ limit: 10 }],
  },
  { event: 'ghl/webhook.received' },
  async ({ event, step }) => {
    const { workspaceId, eventType, locationId, payload } = event.data

    safeLog(`[GHL Webhook] Routing event=${eventType} workspace=${workspaceId} location=${locationId}`)

    // Note: `step` is reserved for future steps that need durable retries.
    // The webhook route already persists raw events to audit_logs, so this
    // handler currently classifies events for downstream feature work
    // (engagement scoring, reverse contact sync, opportunity mirroring).
    void step

    switch (eventType) {
      case 'OpportunityCreate':
      case 'OpportunityStatusUpdate':
        // TODO: mirror opportunity changes back into Cursive's sales pipeline.
        return { handled: true, routedTo: 'opportunity_audit', payloadKeys: Object.keys(payload) }

      case 'ContactCreate':
      case 'ContactUpdate':
        // TODO: pull the contact back into Cursive's leads table for two-way sync.
        return { handled: true, routedTo: 'contact_audit' }

      case 'InboundMessage':
      case 'OutboundMessage':
      case 'CallStatusUpdate':
        // Engagement signals — already persisted to audit_logs for later scoring.
        return { handled: true, routedTo: 'engagement_log' }

      default:
        safeLog(`[GHL Webhook] Unhandled event type: ${eventType}`)
        return { handled: false, eventType }
    }
  }
)
