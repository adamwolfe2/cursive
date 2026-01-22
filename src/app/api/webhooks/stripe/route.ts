// Stripe Webhook API Route
// POST /api/webhooks/stripe - Process Stripe webhook events

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { processWebhookEvent } from '@/lib/stripe/webhooks'
import Stripe from 'stripe'

// Disable body parsing so we can verify webhook signature
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('[Stripe Webhook] No signature provided')
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[Stripe Webhook] No webhook secret configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error: any) {
    console.error('[Stripe Webhook] Signature verification failed:', error.message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error.message}` },
      { status: 400 }
    )
  }

  try {
    // Process the webhook event
    await processWebhookEvent(event)

    return NextResponse.json({
      received: true,
      event_type: event.type,
    })
  } catch (error: any) {
    console.error('[Stripe Webhook] Error processing event:', error)
    return NextResponse.json(
      { error: `Webhook processing failed: ${error.message}` },
      { status: 500 }
    )
  }
}
