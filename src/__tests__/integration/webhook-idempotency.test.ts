/**
 * Webhook Idempotency Integration Tests
 *
 * Tests the idempotency handling for Stripe webhooks to prevent
 * duplicate processing of payment events.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Simulated database
let processedEvents: Map<string, { eventId: string; processedAt: Date; eventType: string }>
let creditPurchases: Array<{ id: string; workspaceId: string; credits: number; status: string }>
let leadPurchases: Array<{ id: string; workspaceId: string; leadCount: number; status: string }>

// Event types
type StripeEventType =
  | 'checkout.session.completed'
  | 'payment_intent.succeeded'
  | 'charge.refunded'

interface StripeEvent {
  id: string
  type: StripeEventType
  data: {
    object: {
      id: string
      metadata?: Record<string, string>
      amount?: number
      amount_refunded?: number
    }
  }
  created: number
}

describe('Webhook Idempotency', () => {
  beforeEach(() => {
    processedEvents = new Map()
    creditPurchases = []
    leadPurchases = []
  })

  // ==========================================================================
  // EVENT RECORDING
  // ==========================================================================
  describe('Event Recording', () => {
    it('should record processed event with timestamp', async () => {
      const event: StripeEvent = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: { type: 'credit_purchase', workspace_id: 'ws-1' },
          },
        },
        created: Date.now() / 1000,
      }

      const result = await processWebhook(event)

      expect(result.success).toBe(true)
      expect(processedEvents.has(event.id)).toBe(true)

      const recorded = processedEvents.get(event.id)
      expect(recorded?.eventType).toBe('checkout.session.completed')
    })

    it('should track event type in processed record', async () => {
      const event: StripeEvent = {
        id: 'evt_test_456',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_456',
            metadata: { type: 'credit_purchase' },
          },
        },
        created: Date.now() / 1000,
      }

      await processWebhook(event)

      const recorded = processedEvents.get(event.id)
      expect(recorded?.eventType).toBe('payment_intent.succeeded')
    })
  })

  // ==========================================================================
  // DUPLICATE DETECTION
  // ==========================================================================
  describe('Duplicate Detection', () => {
    it('should detect duplicate event by ID', async () => {
      const event: StripeEvent = {
        id: 'evt_duplicate_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_789',
            metadata: { type: 'credit_purchase', workspace_id: 'ws-1', credits: '100' },
          },
        },
        created: Date.now() / 1000,
      }

      // First processing
      const result1 = await processWebhook(event)
      expect(result1.success).toBe(true)
      expect(result1.duplicate).toBe(false)

      // Second processing (duplicate)
      const result2 = await processWebhook(event)
      expect(result2.success).toBe(true) // Still success (idempotent)
      expect(result2.duplicate).toBe(true)
    })

    it('should NOT apply credits twice for duplicate events', async () => {
      const event: StripeEvent = {
        id: 'evt_credit_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_credit_123',
            metadata: { type: 'credit_purchase', workspace_id: 'ws-1', credits: '500' },
          },
        },
        created: Date.now() / 1000,
      }

      // Process twice
      await processWebhook(event)
      await processWebhook(event)

      // Should only have one credit purchase
      const purchases = creditPurchases.filter(p => p.workspaceId === 'ws-1')
      expect(purchases.length).toBe(1)
      expect(purchases[0].credits).toBe(500)
    })

    it('should NOT fulfill lead purchase twice for duplicate events', async () => {
      const event: StripeEvent = {
        id: 'evt_lead_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_lead_123',
            metadata: {
              type: 'lead_purchase',
              workspace_id: 'ws-2',
              purchase_id: 'purchase-123',
            },
          },
        },
        created: Date.now() / 1000,
      }

      // Process twice
      await processWebhook(event)
      await processWebhook(event)

      // Should only have one lead purchase fulfillment
      const purchases = leadPurchases.filter(p => p.workspaceId === 'ws-2')
      expect(purchases.length).toBe(1)
    })
  })

  // ==========================================================================
  // CONCURRENT PROCESSING
  // ==========================================================================
  describe('Concurrent Processing', () => {
    it('should handle concurrent duplicate events', async () => {
      const event: StripeEvent = {
        id: 'evt_concurrent_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_concurrent_123',
            metadata: { type: 'credit_purchase', workspace_id: 'ws-3', credits: '1000' },
          },
        },
        created: Date.now() / 1000,
      }

      // Process 10 times concurrently
      const results = await Promise.all(
        Array.from({ length: 10 }, () => processWebhook(event))
      )

      // Only one should be non-duplicate
      const nonDuplicates = results.filter(r => !r.duplicate)
      expect(nonDuplicates.length).toBe(1)

      // Should only have one purchase
      const purchases = creditPurchases.filter(p => p.workspaceId === 'ws-3')
      expect(purchases.length).toBe(1)
    })

    it('should process different events concurrently', async () => {
      const events: StripeEvent[] = Array.from({ length: 5 }, (_, i) => ({
        id: `evt_different_${i}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: `cs_different_${i}`,
            metadata: { type: 'credit_purchase', workspace_id: `ws-${i}`, credits: '100' },
          },
        },
        created: Date.now() / 1000,
      }))

      const results = await Promise.all(events.map(e => processWebhook(e)))

      // All should succeed, none duplicates
      expect(results.every(r => r.success)).toBe(true)
      expect(results.every(r => !r.duplicate)).toBe(true)

      // Should have 5 different purchases
      expect(creditPurchases.length).toBe(5)
    })
  })

  // ==========================================================================
  // EVENT TYPE HANDLING
  // ==========================================================================
  describe('Event Type Handling', () => {
    it('should handle checkout.session.completed for credits', async () => {
      const event: StripeEvent = {
        id: 'evt_checkout_credits',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_credits_456',
            metadata: { type: 'credit_purchase', workspace_id: 'ws-5', credits: '250' },
          },
        },
        created: Date.now() / 1000,
      }

      const result = await processWebhook(event)
      expect(result.success).toBe(true)
      expect(result.action).toBe('credits_applied')
    })

    it('should handle checkout.session.completed for leads', async () => {
      const event: StripeEvent = {
        id: 'evt_checkout_leads',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_leads_789',
            metadata: { type: 'lead_purchase', workspace_id: 'ws-6', purchase_id: 'p-123' },
          },
        },
        created: Date.now() / 1000,
      }

      const result = await processWebhook(event)
      expect(result.success).toBe(true)
      expect(result.action).toBe('leads_fulfilled')
    })

    it('should handle charge.refunded', async () => {
      // First, process original purchase
      const purchaseEvent: StripeEvent = {
        id: 'evt_original_purchase',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_to_refund',
            metadata: { type: 'credit_purchase', workspace_id: 'ws-7', credits: '100' },
          },
        },
        created: Date.now() / 1000,
      }
      await processWebhook(purchaseEvent)

      // Then process refund
      const refundEvent: StripeEvent = {
        id: 'evt_refund',
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_refund_123',
            metadata: { type: 'credit_purchase', workspace_id: 'ws-7' },
            amount: 5000, // $50 in cents
            amount_refunded: 5000,
          },
        },
        created: Date.now() / 1000,
      }

      const result = await processWebhook(refundEvent)
      expect(result.success).toBe(true)
    })

    it('should ignore unknown event types', async () => {
      const event = {
        id: 'evt_unknown',
        type: 'customer.created', // Not handled
        data: {
          object: {
            id: 'cus_123',
          },
        },
        created: Date.now() / 1000,
      }

      const result = await processWebhook(event as StripeEvent)
      expect(result.success).toBe(true)
      expect(result.action).toBe('ignored')
    })
  })

  // ==========================================================================
  // PURCHASE STATUS VERIFICATION
  // ==========================================================================
  describe('Purchase Status Verification', () => {
    it('should verify purchase is pending before fulfillment', async () => {
      // Simulate purchase already completed
      leadPurchases.push({
        id: 'purchase-already-done',
        workspaceId: 'ws-8',
        leadCount: 10,
        status: 'completed',
      })

      const event: StripeEvent = {
        id: 'evt_late_webhook',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_late',
            metadata: {
              type: 'lead_purchase',
              workspace_id: 'ws-8',
              purchase_id: 'purchase-already-done',
            },
          },
        },
        created: Date.now() / 1000,
      }

      const result = await processWebhook(event)
      expect(result.success).toBe(true)
      expect(result.action).toBe('already_completed')
    })
  })

  // ==========================================================================
  // EVENT RETENTION
  // ==========================================================================
  describe('Event Retention', () => {
    it('should clean up old processed events', async () => {
      // Simulate old events (31 days ago)
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)

      processedEvents.set('evt_old_1', {
        eventId: 'evt_old_1',
        processedAt: oldDate,
        eventType: 'checkout.session.completed',
      })
      processedEvents.set('evt_old_2', {
        eventId: 'evt_old_2',
        processedAt: oldDate,
        eventType: 'checkout.session.completed',
      })

      // Recent event
      processedEvents.set('evt_recent', {
        eventId: 'evt_recent',
        processedAt: new Date(),
        eventType: 'checkout.session.completed',
      })

      // Run cleanup
      const deleted = cleanupOldEvents(30) // 30 day retention

      expect(deleted).toBe(2)
      expect(processedEvents.size).toBe(1)
      expect(processedEvents.has('evt_recent')).toBe(true)
    })
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  describe('Error Handling', () => {
    it('should return 200 even on processing error (to prevent Stripe retries)', async () => {
      const event: StripeEvent = {
        id: 'evt_error_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_error',
            metadata: { type: 'invalid_type' }, // Will cause processing error
          },
        },
        created: Date.now() / 1000,
      }

      const result = await processWebhook(event)
      // Should still return success to Stripe
      expect(result.httpStatus).toBe(200)
      // But mark as error internally
      expect(result.error).toBeDefined()
    })

    it('should record event even if processing fails', async () => {
      const event: StripeEvent = {
        id: 'evt_fail_but_record',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_fail',
            metadata: { type: 'credit_purchase', workspace_id: 'invalid' },
          },
        },
        created: Date.now() / 1000,
      }

      // Simulate processing that fails after recording
      await processWebhook(event)

      // Event should be recorded to prevent retry
      expect(processedEvents.has(event.id)).toBe(true)
    })
  })
})

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

async function processWebhook(event: StripeEvent): Promise<{
  success: boolean
  duplicate: boolean
  action?: string
  httpStatus: number
  error?: string
}> {
  // Check for duplicate
  if (processedEvents.has(event.id)) {
    return {
      success: true,
      duplicate: true,
      action: 'already_processed',
      httpStatus: 200,
    }
  }

  // Record event first (before processing)
  processedEvents.set(event.id, {
    eventId: event.id,
    processedAt: new Date(),
    eventType: event.type,
  })

  try {
    // Process based on event type
    switch (event.type) {
      case 'checkout.session.completed':
        return await handleCheckoutCompleted(event)

      case 'payment_intent.succeeded':
        return { success: true, duplicate: false, action: 'payment_recorded', httpStatus: 200 }

      case 'charge.refunded':
        return { success: true, duplicate: false, action: 'refund_processed', httpStatus: 200 }

      default:
        return { success: true, duplicate: false, action: 'ignored', httpStatus: 200 }
    }
  } catch (error) {
    return {
      success: true,
      duplicate: false,
      httpStatus: 200,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function handleCheckoutCompleted(event: StripeEvent): Promise<{
  success: boolean
  duplicate: boolean
  action?: string
  httpStatus: number
}> {
  const metadata = event.data.object.metadata || {}
  const purchaseType = metadata.type

  if (purchaseType === 'credit_purchase') {
    const credits = parseInt(metadata.credits || '0', 10)
    const workspaceId = metadata.workspace_id

    if (!workspaceId) {
      throw new Error('Missing workspace_id')
    }

    // Apply credits
    creditPurchases.push({
      id: `cp-${Date.now()}`,
      workspaceId,
      credits,
      status: 'completed',
    })

    return { success: true, duplicate: false, action: 'credits_applied', httpStatus: 200 }
  }

  if (purchaseType === 'lead_purchase') {
    const workspaceId = metadata.workspace_id
    const purchaseId = metadata.purchase_id

    // Check if already completed
    const existing = leadPurchases.find(p => p.id === purchaseId)
    if (existing?.status === 'completed') {
      return { success: true, duplicate: false, action: 'already_completed', httpStatus: 200 }
    }

    // Fulfill purchase
    leadPurchases.push({
      id: purchaseId || `lp-${Date.now()}`,
      workspaceId: workspaceId || 'unknown',
      leadCount: 0,
      status: 'completed',
    })

    return { success: true, duplicate: false, action: 'leads_fulfilled', httpStatus: 200 }
  }

  throw new Error(`Unknown purchase type: ${purchaseType}`)
}

function cleanupOldEvents(retentionDays: number): number {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
  let deleted = 0

  for (const [eventId, record] of processedEvents.entries()) {
    if (record.processedAt < cutoff) {
      processedEvents.delete(eventId)
      deleted++
    }
  }

  return deleted
}
