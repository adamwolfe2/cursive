// Stripe uses synchronous constructEvent (Node.js crypto) — must stay on Node.js runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  handleAffiliateClawback,
  handleAffiliateStripeAccountUpdated,
  resolveInvoiceIdForCharge,
} from '@/lib/affiliate/commission'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { STRIPE_CONFIG } from '@/lib/stripe/config'
import { existingEventAction } from './event-lease'
import {
  getStripe,
  handleCheckoutSessionCompleted,
  handleChargeFailed,
  handleChargeRefunded,
  handleChargeDisputeCreated,
  handleCustomerDeleted,
  handleServiceSubscriptionEvent,
  SERVICE_SUBSCRIPTION_EVENTS,
} from './handlers'

const webhookSecret = STRIPE_CONFIG.webhookSecret

// ============================================================================
// MAIN WEBHOOK ROUTE HANDLER
// ============================================================================

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      safeError('[Stripe Webhook] Missing signature')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    if (!webhookSecret) {
      safeError('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event

    try {
      event = getStripe().webhooks.constructEvent(
        body, signature, webhookSecret
      )
    } catch (err) {
      safeError('[Stripe Webhook] Signature verification failed:', err)
      Sentry.captureException(err, {
        tags: { source: 'stripe_webhook', error_type: 'signature_verification_failed' },
      })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // ========================================================================
    // IDEMPOTENCY CHECK - Prevent duplicate webhook processing
    // ========================================================================
    const adminClient = createAdminClient()
    const processingStartTime = Date.now()

    // Has this event been seen? See event-lease.ts for why an unfinished row is not a duplicate.
    const { data: existingEvent, error: lookupError } = await adminClient
      .from('webhook_events')
      .select('id, processed_at, error_message, processing_duration_ms, created_at')
      .eq('stripe_event_id', event.id)
      .maybeSingle()

    if (lookupError) {
      safeError('[Stripe Webhook] Failed to look up webhook event', lookupError)
      return NextResponse.json({ error: 'Webhook lookup failed' }, { status: 500 })
    }

    const action = existingEventAction(existingEvent, Date.now())

    if (action === 'duplicate') {
      safeLog('[Stripe Webhook] Duplicate event detected, skipping', {
        eventId: event.id,
        eventType: event.type,
        originallyProcessedAt: existingEvent?.processed_at,
      })
      return NextResponse.json({
        received: true,
        duplicate: true,
        originallyProcessedAt: existingEvent?.processed_at,
      })
    }

    if (action === 'in_progress') {
      safeLog('[Stripe Webhook] Event still processing elsewhere, asking Stripe to retry', { eventId: event.id })
      return NextResponse.json({ error: 'Event is being processed; retry later' }, { status: 503 })
    }

    if (action === 'reclaim' && existingEvent) {
      safeLog('[Stripe Webhook] Reclaiming failed or abandoned event', {
        eventId: event.id,
        previousError: existingEvent.error_message,
      })
      // Delete by row id so a row another instance just re-inserted is left alone.
      const { error: deleteError } = await adminClient.from('webhook_events').delete().eq('id', existingEvent.id)
      if (deleteError) {
        safeError('[Stripe Webhook] Failed to reclaim webhook event', deleteError)
        return NextResponse.json({ error: 'Webhook reclaim failed' }, { status: 500 })
      }
    }

    // Record that we're processing this event
    // This prevents race conditions if duplicate webhooks arrive simultaneously
    const { error: insertError } = await adminClient
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event as any, // Store full payload for debugging
      })

    if (insertError) {
      // If insert fails due to unique constraint, another instance is processing it
      if (insertError.code === '23505') { // Postgres unique violation
        safeLog('[Stripe Webhook] Race condition detected, another instance processing', {
          eventId: event.id,
        })
        // Not a 200: if that instance crashes, Stripe must still retry this event.
        return NextResponse.json({ error: 'Event is being processed; retry later' }, { status: 503 })
      }

      // Other insert errors are unexpected
      safeError('[Stripe Webhook] Failed to record webhook event', insertError)
      // Continue processing anyway - better to process twice than not at all
    }

    // ========================================================================
    // Dispatch to event-specific handlers
    // ========================================================================
    let processingError: Error | null = null

    try {
      if ((SERVICE_SUBSCRIPTION_EVENTS as readonly string[]).includes(event.type)) {
        await handleServiceSubscriptionEvent(event)
      } else if (event.type === 'account.updated') {
        // Stripe Connect: affiliate's Express account updated (onboarding completed)
        // AWAIT: an un-awaited promise is dropped when the function freezes after
        // the 200 response. Awaiting lets a failure bubble to processingError → 500
        // → Stripe retries (the handler is idempotent).
        await handleAffiliateStripeAccountUpdated(event.data.object as Stripe.Account)
      } else if (event.type === 'checkout.session.completed') {
        await handleCheckoutSessionCompleted(event)
      } else if (event.type === 'charge.failed') {
        await handleChargeFailed(event)
      } else if (event.type === 'charge.refunded') {
        await handleChargeRefunded(event)
        // Affiliate clawback on refund — use charge.invoice (the Stripe invoice ID)
        const charge = event.data.object as Stripe.Charge
        const chargeInvoiceId = charge.invoice as string | null
        if (chargeInvoiceId) {
          // AWAIT: a dropped clawback leaves a refunded commission paid out. Awaiting
          // turns a failure into a 500 so Stripe retries (clawback is idempotent).
          await handleAffiliateClawback(chargeInvoiceId)
        }
      } else if (event.type === 'charge.dispute.created') {
        await handleChargeDisputeCreated(event)
        // Affiliate clawback on chargeback (worse than a refund — we also lose the
        // revenue + dispute fee). The dispute only carries the charge id, so resolve
        // the invoice behind it, then claw back + reverse the commission cash.
        const dispute = event.data.object as Stripe.Dispute
        const disputeChargeId =
          typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id ?? null
        if (disputeChargeId) {
          // AWAIT: dispute clawback must not be dropped (chargeback = lost revenue +
          // fee). Failure → 500 → Stripe retries (idempotent).
          const invId = await resolveInvoiceIdForCharge(disputeChargeId)
          if (invId) await handleAffiliateClawback(invId)
        }
      } else if (event.type === 'invoice.voided' || event.type === 'invoice.marked_uncollectible') {
        // Voided / uncollectible invoice — the revenue never settles, so claw back
        // any commission recorded against it.
        const voidedInvoice = event.data.object as Stripe.Invoice
        if (voidedInvoice.id) {
          // AWAIT: a dropped void clawback leaves commission paid on revenue that
          // never settled. Failure → 500 → Stripe retries (idempotent).
          await handleAffiliateClawback(voidedInvoice.id)
        }
      } else if (event.type === 'customer.deleted') {
        await handleCustomerDeleted(event)
      } else {
        safeLog('[Stripe Webhook] Unhandled event type: ' + event.type)
      }
    } catch (err) {
      processingError = err instanceof Error ? err : new Error(String(err))
      safeError('[Stripe Webhook] Error processing event:', processingError)
      Sentry.captureException(processingError, {
        tags: {
          source: 'stripe_webhook',
          event_type: event.type,
          error_type: 'processing_error',
        },
        extra: {
          stripe_event_id: event.id,
          stripe_event_type: event.type,
        },
      })
    }

    // ========================================================================
    // Update webhook event record with processing results
    // ========================================================================
    const processingDuration = Date.now() - processingStartTime

    const { error: finishError } = await adminClient
      .from('webhook_events')
      .update({
        processing_duration_ms: processingDuration,
        error_message: processingError?.message || null,
        resource_id: event.type === 'checkout.session.completed'
          ? (event.data.object as Stripe.Checkout.Session).metadata?.credit_purchase_id ||
            (event.data.object as Stripe.Checkout.Session).metadata?.purchase_id
          : null,
      })
      .eq('stripe_event_id', event.id)

    if (finishError) {
      // The row stays unfinished, so a Stripe retry after the lease reprocesses it (handlers are idempotent).
      safeError('[Stripe Webhook] Failed to mark webhook event finished', finishError)
    }

    // If processing failed, return 500 so Stripe retries
    if (processingError) {
      return NextResponse.json(
        { error: 'Webhook processing failed', message: processingError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // Outer catch for unexpected errors (signature verification, etc.)
    safeError('[Stripe Webhook] Fatal error in webhook handler:', error)
    Sentry.captureException(error, {
      tags: { source: 'stripe_webhook', error_type: 'fatal_handler_error' },
    })
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
