export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getStripeClient } from '@/lib/stripe/client'
import { safeError } from '@/lib/utils/log-sanitizer'

/**
 * Stripe webhook handler for ad campaign payments
 * Handles checkout.session.completed events for campaign purchases
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_CAMPAIGN_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      safeError('[Campaign Webhook] Webhook secret not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Verify webhook signature (Edge-safe)
    const stripe = getStripeClient()
    const cryptoProvider = Stripe.createSubtleCryptoProvider()
    let event: Stripe.Event

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      )
    } catch (err) {
      safeError('[Campaign Webhook] Signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = await createClient()

    // Idempotency: check if we've already processed this event
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id, processed_at')
      .eq('stripe_event_id', event.id)
      .single()

    if (existingEvent?.processed_at) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Record the webhook event
    await supabase.from('webhook_events').upsert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event.data.object as unknown as Record<string, unknown>,
      received_at: new Date().toISOString(),
    }, { onConflict: 'stripe_event_id' })

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Only handle ad campaign payments
        if (session.metadata?.type !== 'ad_campaign') {
          break
        }

        const campaignId = session.metadata?.campaign_id
        if (!campaignId) {
          safeError('[Campaign Webhook] Missing campaign_id in metadata')
          break
        }

        // Update campaign payment status
        const { error: updateError } = await supabase
          .from('ad_campaigns')
          .update({
            payment_status: 'paid',
            campaign_status: 'in_review',
            stripe_payment_intent_id: session.payment_intent as string,
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaignId)

        if (updateError) {
          safeError('[Campaign Webhook] Failed to update campaign:', updateError)
        }

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.metadata?.type !== 'ad_campaign') {
          break
        }

        const campaignId = session.metadata?.campaign_id
        if (campaignId) {
          await supabase
            .from('ad_campaigns')
            .update({
              payment_status: 'failed',
              campaign_status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', campaignId)
            .eq('payment_status', 'pending')
        }

        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        if (paymentIntentId) {
          // Find campaign by payment intent and mark as refunded
          const { data: campaign } = await supabase
            .from('ad_campaigns')
            .select('id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .single()

          if (campaign) {
            await supabase
              .from('ad_campaigns')
              .update({
                payment_status: 'refunded',
                campaign_status: 'cancelled',
                updated_at: new Date().toISOString(),
              })
              .eq('id', campaign.id)
          }
        }

        break
      }

      default:
        // Unhandled event type - that's OK
        break
    }

    // Mark event as processed
    await supabase
      .from('webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id)

    return NextResponse.json({ received: true })
  } catch (error) {
    safeError('[Campaign Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
