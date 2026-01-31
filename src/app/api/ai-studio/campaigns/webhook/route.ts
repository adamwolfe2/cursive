/**
 * Stripe Webhook Handler for Campaign Payments
 * POST /api/ai-studio/campaigns/webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const campaignId = session.metadata?.campaign_id
      const workspaceId = session.metadata?.workspace_id

      if (!campaignId) {
        console.error('[Stripe Webhook] Missing campaign_id in metadata')
        return NextResponse.json({ error: 'Missing campaign_id' }, { status: 400 })
      }

      // Check if already processed (idempotency)
      const { data: existingCampaign } = await supabase
        .from('ad_campaigns')
        .select('payment_status')
        .eq('id', campaignId)
        .single()

      if (existingCampaign?.payment_status === 'paid') {
        console.log(`[Stripe Webhook] Campaign ${campaignId} already marked as paid, skipping`)
        return NextResponse.json({ received: true, message: 'Already processed' })
      }

      // Update campaign status to in_review (paid, awaiting launch)
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
        console.error('[Stripe Webhook] Failed to update campaign:', updateError)
        return NextResponse.json(
          { error: 'Failed to update campaign' },
          { status: 500 }
        )
      }

      console.log(`[Stripe Webhook] Campaign ${campaignId} payment confirmed, status: in_review`)

      // TODO: Send confirmation email to user

      // TODO: Trigger campaign launch workflow (Inngest job)
      // This would:
      // 1. Notify team that campaign is ready for review
      // 2. Set up Meta Ads account connection
      // 3. Create ad sets with selected creatives
      // 4. Configure targeting based on customer profiles
      // 5. Set budget and schedule
      // 6. Launch campaign (status -> 'active')
    }

    // Handle payment_intent.payment_failed event
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Find campaign by payment intent
      const { data: campaigns } = await supabase
        .from('ad_campaigns')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntent.id)

      if (campaigns && campaigns.length > 0) {
        await supabase
          .from('ad_campaigns')
          .update({
            payment_status: 'failed',
            campaign_status: 'cancelled',
          })
          .eq('id', campaigns[0].id)

        console.log(`[Stripe Webhook] Campaign ${campaigns[0].id} payment failed`)
      }
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
