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
      const purchaseType = session.metadata?.type

      // Handle marketplace credit purchase
      if (purchaseType === 'credit_purchase') {
        const creditPurchaseId = session.metadata?.credit_purchase_id
        const workspaceId = session.metadata?.workspace_id
        const credits = parseInt(session.metadata?.credits || '0', 10)

        if (!creditPurchaseId || !workspaceId || !credits) {
          console.error('Missing metadata for credit purchase')
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        // Complete the credit purchase
        await supabase
          .from('credit_purchases')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('id', creditPurchaseId)

        // Add credits to workspace
        const { data: existingCredits } = await supabase
          .from('workspace_credits')
          .select('*')
          .eq('workspace_id', workspaceId)
          .single()

        if (existingCredits) {
          await supabase
            .from('workspace_credits')
            .update({
              balance: existingCredits.balance + credits,
              total_purchased: existingCredits.total_purchased + credits,
              updated_at: new Date().toISOString(),
            })
            .eq('workspace_id', workspaceId)
        } else {
          await supabase
            .from('workspace_credits')
            .insert({
              workspace_id: workspaceId,
              balance: credits,
              total_purchased: credits,
              total_used: 0,
              total_earned: 0,
            })
        }

        console.log(`✅ Credit purchase completed: ${credits} credits for workspace ${workspaceId}`)
        return NextResponse.json({ received: true })
      }

      // Handle legacy lead purchase
      const leadId = session.metadata?.lead_id
      const buyerEmail = session.metadata?.buyer_email
      const companyName = session.metadata?.company_name

      if (!leadId || !buyerEmail) {
        // Not a lead purchase or credit purchase - might be another type
        console.log('Checkout session without lead/credit metadata - skipping')
        return NextResponse.json({ received: true })
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

    // Handle subscription events
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Find workspace by customer ID
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (workspace) {
        // Get plan from price ID
        const priceId = subscription.items.data[0]?.price.id
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('id, name')
          .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
          .single()

        // Update subscription
        await supabase
          .from('subscriptions')
          .upsert({
            workspace_id: workspace.id,
            plan_id: plan?.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'workspace_id' })

        // Update workspace plan
        if (plan) {
          await supabase
            .from('workspaces')
            .update({ plan: plan.name })
            .eq('id', workspace.id)
        }
      }
    }

    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription

      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)

      // Find and downgrade workspace
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('workspace_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (sub) {
        await supabase
          .from('workspaces')
          .update({ plan: 'free' })
          .eq('id', sub.workspace_id)
      }
    }

    // Handle invoice paid
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (workspace) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('workspace_id', workspace.id)
          .single()

        await supabase.from('invoices').insert({
          workspace_id: workspace.id,
          subscription_id: subscription?.id,
          stripe_invoice_id: invoice.id,
          amount: (invoice.amount_paid || 0) / 100,
          currency: invoice.currency,
          status: 'paid',
          invoice_number: invoice.number,
          invoice_pdf_url: invoice.invoice_pdf,
          paid_at: new Date().toISOString(),
        })
      }
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
