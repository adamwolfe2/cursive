import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { handleServiceWebhookEvent } from '@/lib/stripe/service-webhooks'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('[Stripe Webhook] Missing signature')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('[Stripe Webhook] Received event:', event.type, event.id)

    // Handle service subscription events
    const serviceSubscriptionEvents = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed'
    ]

    if (serviceSubscriptionEvents.includes(event.type)) {
      await handleServiceWebhookEvent(event)
      return NextResponse.json({ received: true })
    }

    // TODO: Handle other webhook events (checkout, credits, marketplace, etc.)

    console.log('[Stripe Webhook] Unhandled event type:', event.type)
    return NextResponse.json({ received: true, unhandled: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
