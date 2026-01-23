import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    // Initialize Stripe only when the function is called
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia'
    })

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Handle payment success
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const leadId = session.metadata?.lead_id
      const buyerEmail = session.metadata?.buyer_email
      const companyName = session.metadata?.company_name

      if (!leadId || !buyerEmail) {
        console.error('Missing metadata in checkout session')
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      // Get or create buyer
      const { data: buyer, error: buyerError } = await supabase
        .from('buyers')
        .upsert({
          email: buyerEmail,
          company_name: companyName || 'Unknown',
          stripe_customer_id: session.customer as string,
          workspace_id: 'default'
        }, { onConflict: 'email' })
        .select()
        .single()

      if (buyerError) {
        console.error('Failed to create buyer:', buyerError)
        return NextResponse.json({ error: 'Failed to create buyer' }, { status: 500 })
      }

      // Create purchase record
      const { error: purchaseError } = await supabase
        .from('lead_purchases')
        .insert({
          lead_id: leadId,
          buyer_id: buyer.id,
          price_paid: (session.amount_total || 0) / 100,
          stripe_payment_intent: session.payment_intent as string,
          stripe_session_id: session.id
        })

      if (purchaseError) {
        console.error('Failed to create purchase:', purchaseError)
        return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 })
      }

      // Update lead status to delivered
      await supabase
        .from('leads')
        .update({ delivery_status: 'delivered' })
        .eq('id', leadId)

      console.log(`✅ Payment successful for lead ${leadId}`)
    }

    // Handle payment failures
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.error('Payment failed:', paymentIntent.id)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
