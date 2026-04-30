/**
 * Shopify Webhook Handler
 *
 * Consumes `shopify/webhook.received` events fired by /api/webhooks/shopify
 * and routes them by topic for downstream processing.
 *
 * Topics handled:
 *   customers/create, customers/update → tag + enrichment hook
 *   orders/create, orders/updated      → revenue attribution
 *   products/update                    → catalog sync (future)
 */

import { inngest } from '../client'
import { safeLog } from '@/lib/utils/log-sanitizer'

export const shopifyWebhookHandler = inngest.createFunction(
  {
    id: 'shopify-webhook-handler',
    name: 'Shopify Inbound Webhook Router',
    retries: 3,
    timeouts: { finish: '2m' },
    concurrency: [{ limit: 10 }],
  },
  { event: 'shopify/webhook.received' },
  async ({ event }) => {
    const { workspaceId, topic, shopDomain, payload } = event.data

    safeLog(`[Shopify Webhook] Routing topic=${topic} workspace=${workspaceId} shop=${shopDomain}`)

    switch (topic) {
      case 'customers/create':
      case 'customers/update': {
        // A Shopify customer was created or updated.
        // Future: push matching Cursive lead tags or enrichment back to the customer.
        // Audit log already captured by the webhook route.
        const customerId = payload.id
        return { handled: true, topic, customerId }
      }

      case 'orders/create':
      case 'orders/updated': {
        // An order was placed or updated.
        // Future: attribute revenue to Cursive-identified visitors via email match.
        const orderId = payload.id
        const orderTotal = payload.total_price
        return { handled: true, topic, orderId, orderTotal }
      }

      case 'products/update': {
        // A product was updated — catalog sync placeholder.
        const productId = payload.id
        return { handled: true, topic, productId }
      }

      default: {
        safeLog(`[Shopify Webhook] Unhandled topic: ${topic}`)
        return { handled: false, topic }
      }
    }
  }
)
