// Stripe uses synchronous constructEvent (Node.js crypto) — must stay on Node.js runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  handleAffiliateClawback,
  handleAffiliateStripeAccountUpdated,
} from '@/lib/affiliate/commission'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { STRIPE_CONFIG } from '@/lib/stripe/config'
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

    // Check if this event has already been processed
    // IMPORTANT: Only skip if error_message IS NULL (meaning it succeeded or is in-progress).
    // If error_message is set, the previous attempt failed — delete it and allow Stripe to retry,
    // otherwise Stripe gets a 200 "duplicate" response and never retries failed payments.
    const { data: existingEvent } = await adminClient
      .from('webhook_events')
      .select('id, processed_at, error_message')
      .eq('stripe_event_id', event.id)
      .maybeSingle()

    if (existingEvent && existingEvent.error_message === null) {
      // Previously processed successfully (or currently in-progress) — skip
      safeLog('[Stripe Webhook] Duplicate event detected, skipping', {
        eventId: event.id,
        eventType: event.type,
        originallyProcessedAt: existingEvent.processed_at,
      })
      return NextResponse.json({
        received: true,
        duplicate: true,
        originallyProcessedAt: existingEvent.processed_at,
      })
    }

    // If a previous attempt failed (error_message set), delete it so we can retry cleanly
    if (existingEvent?.error_message) {
      safeLog('[Stripe Webhook] Previous attempt failed, retrying', {
        eventId: event.id,
        previousError: existingEvent.error_message,
      })
      await adminClient.from('webhook_events').delete().eq('stripe_event_id', event.id)
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
        return NextResponse.json({
          received: true,
          duplicate: true,
          raceCondition: true,
        })
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
        handleAffiliateStripeAccountUpdated(event.data.object as Stripe.Account)
          .catch((err) => safeError('[Stripe Webhook] Affiliate account update failed (non-fatal):', err))
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
          handleAffiliateClawback(chargeInvoiceId)
            .catch((err) => safeError('[Stripe Webhook] Affiliate clawback failed (non-fatal):', err))
        }
      } else if (event.type === 'charge.dispute.created') {
        await handleChargeDisputeCreated(event)
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

    await adminClient
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
