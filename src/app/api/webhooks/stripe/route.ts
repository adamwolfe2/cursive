import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPurchaseConfirmationEmail, sendCreditPurchaseConfirmationEmail } from '@/lib/email/service'

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

    // IDEMPOTENCY CHECK: Prevent duplicate processing of same event
    const eventId = event.id
    const { data: existingEvent } = await supabase
      .from('processed_webhook_events')
      .select('id')
      .eq('stripe_event_id', eventId)
      .single()

    if (existingEvent) {
      console.log(`Webhook event ${eventId} already processed, skipping`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Record event as being processed (before actual processing)
    await supabase.from('processed_webhook_events').insert({
      stripe_event_id: eventId,
      event_type: event.type,
      processed_at: new Date().toISOString(),
    })

    // WEBHOOK RETRY LOGIC: Wrap event processing in try-catch
    try {
      await processWebhookEvent(event, supabase)
      return NextResponse.json({ received: true })
    } catch (processingError: any) {
      console.error(`[Webhook] Failed to process ${event.type}:`, processingError)

      // Queue for retry with exponential backoff
      try {
        const { data: queueId } = await supabase.rpc('queue_webhook_retry', {
          p_stripe_event_id: event.id,
          p_event_type: event.type,
          p_event_data: event as any,
          p_error: processingError.message || 'Unknown error',
        })

        console.log(`[Webhook] Queued for retry: ${event.id}, queue_id: ${queueId}`)
      } catch (queueError) {
        console.error(`[Webhook] Failed to queue retry:`, queueError)
      }

      // Still return 500 to inform Stripe of failure
      return NextResponse.json(
        { error: 'Webhook processing failed, queued for retry' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Extract event processing logic into separate function for reuse in retry processor
async function processWebhookEvent(event: Stripe.Event, supabase: any) {
  // Handle payment success
  if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const purchaseType = session.metadata?.type

      // Handle marketplace lead purchase
      if (purchaseType === 'lead_purchase') {
        const purchaseId = session.metadata?.purchase_id
        const workspaceId = session.metadata?.workspace_id

        if (!purchaseId || !workspaceId) {
          console.error('Missing metadata for lead purchase')
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        // Check if purchase already completed (extra idempotency check)
        const { data: existingPurchase } = await supabase
          .from('marketplace_purchases')
          .select('status')
          .eq('id', purchaseId)
          .single()

        if (existingPurchase?.status === 'completed') {
          console.log(`Lead purchase ${purchaseId} already completed, skipping`)
          return NextResponse.json({ received: true, duplicate: true })
        }

        // Complete the marketplace purchase
        await supabase
          .from('marketplace_purchases')
          .update({
            status: 'completed',
            stripe_payment_intent_id: session.payment_intent as string,
            completed_at: new Date().toISOString(),
          })
          .eq('id', purchaseId)

        // Get purchase items to mark leads as sold
        const { data: items } = await supabase
          .from('marketplace_purchase_items')
          .select('lead_id, partner_id, commission_amount')
          .eq('purchase_id', purchaseId)

        if (items && items.length > 0) {
          // Mark leads as sold
          const leadIds = items.map(item => item.lead_id)
          for (const leadId of leadIds) {
            await supabase.rpc('mark_lead_sold', { p_lead_id: leadId })
          }

          // Update partner pending balances for commissions
          const partnerCommissions = items.reduce<Record<string, number>>((acc, item) => {
            if (item.partner_id && item.commission_amount) {
              acc[item.partner_id] = (acc[item.partner_id] || 0) + item.commission_amount
            }
            return acc
          }, {})

          for (const [partnerId, amount] of Object.entries(partnerCommissions)) {
            const { data: partner } = await supabase
              .from('partners')
              .select('pending_balance, total_earnings')
              .eq('id', partnerId)
              .single()

            if (partner) {
              await supabase
                .from('partners')
                .update({
                  pending_balance: (partner.pending_balance || 0) + amount,
                  total_earnings: (partner.total_earnings || 0) + amount,
                  total_leads_sold: supabase.sql`COALESCE(total_leads_sold, 0) + 1`,
                  updated_at: new Date().toISOString(),
                } as never)
                .eq('id', partnerId)
            }
          }
        }

        // Send purchase confirmation email
        try {
          const { data: purchase } = await supabase
            .from('marketplace_purchases')
            .select('buyer_user_id, total_price')
            .eq('id', purchaseId)
            .single()

          if (purchase?.buyer_user_id) {
            const { data: user } = await supabase
              .from('users')
              .select('email, full_name')
              .eq('id', purchase.buyer_user_id)
              .single()

            if (user) {
              const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/marketplace/download/${purchaseId}`
              const downloadExpiresAt = new Date()
              downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 90)

              await sendPurchaseConfirmationEmail(
                user.email,
                user.full_name || 'Valued Customer',
                {
                  totalLeads: items?.length || 0,
                  totalPrice: purchase.total_price,
                  purchaseId,
                  downloadUrl,
                  downloadExpiresAt,
                }
              )
            }
          }
        } catch (emailError) {
          console.error('[Stripe Webhook] Failed to send purchase confirmation:', emailError)
          // Don't fail the webhook if email fails
        }

        console.log(`✅ Lead purchase completed: ${purchaseId} for workspace ${workspaceId}`)
        return NextResponse.json({ received: true })
      }

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

        // Send credit purchase confirmation email
        try {
          const { data: creditPurchase } = await supabase
            .from('credit_purchases')
            .select('user_id, amount, package_name')
            .eq('id', creditPurchaseId)
            .single()

          if (creditPurchase?.user_id) {
            const { data: user } = await supabase
              .from('users')
              .select('email, full_name')
              .eq('id', creditPurchase.user_id)
              .single()

            if (user) {
              // Get new balance
              const { data: updatedCredits } = await supabase
                .from('workspace_credits')
                .select('balance')
                .eq('workspace_id', workspaceId)
                .single()

              await sendCreditPurchaseConfirmationEmail(
                user.email,
                user.full_name || 'Valued Customer',
                {
                  creditsAmount: credits,
                  totalPrice: creditPurchase.amount,
                  packageName: creditPurchase.package_name || `${credits} Credits`,
                  newBalance: updatedCredits?.balance || credits,
                }
              )
            }
          }
        } catch (emailError) {
          console.error('[Stripe Webhook] Failed to send credit confirmation:', emailError)
          // Don't fail the webhook if email fails
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

    // Handle refunds
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = charge.payment_intent as string

      if (!paymentIntentId) {
        console.error('Charge refunded but no payment_intent found')
        return NextResponse.json({ received: true })
      }

      // Check if this is a credit purchase refund
      const { data: creditPurchase } = await supabase
        .from('credit_purchases')
        .select('id, workspace_id, credits, user_id, package_name')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single()

      if (creditPurchase) {
        // Mark credit purchase as refunded
        await supabase
          .from('credit_purchases')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
          })
          .eq('id', creditPurchase.id)

        // Deduct credits from workspace balance
        const { data: workspaceCredits } = await supabase
          .from('workspace_credits')
          .select('balance, total_purchased')
          .eq('workspace_id', creditPurchase.workspace_id)
          .single()

        if (workspaceCredits) {
          await supabase
            .from('workspace_credits')
            .update({
              balance: Math.max(0, workspaceCredits.balance - creditPurchase.credits),
              total_purchased: Math.max(0, workspaceCredits.total_purchased - creditPurchase.credits),
              updated_at: new Date().toISOString(),
            })
            .eq('workspace_id', creditPurchase.workspace_id)
        }

        // Send refund confirmation email
        try {
          const { data: user } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', creditPurchase.user_id)
            .single()

          if (user) {
            // Note: sendCreditRefundEmail would need to be created in email service
            console.log(`Credit refund for user ${user.email}: ${creditPurchase.credits} credits`)
          }
        } catch (emailError) {
          console.error('[Stripe Webhook] Failed to send refund notification:', emailError)
        }

        console.log(`✅ Credit refund processed: ${creditPurchase.credits} credits for workspace ${creditPurchase.workspace_id}`)
        return NextResponse.json({ received: true })
      }

      // Check if this is a marketplace purchase refund
      const { data: marketplacePurchase } = await supabase
        .from('marketplace_purchases')
        .select('id, buyer_workspace_id, credits_used, buyer_user_id, total_leads')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single()

      if (marketplacePurchase) {
        // Mark purchase as refunded
        await supabase
          .from('marketplace_purchases')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
          })
          .eq('id', marketplacePurchase.id)

        // Get purchase items to reverse operations
        const { data: items } = await supabase
          .from('marketplace_purchase_items')
          .select('lead_id, partner_id, commission_amount')
          .eq('purchase_id', marketplacePurchase.id)

        if (items && items.length > 0) {
          // Return leads to marketplace (make available again)
          const leadIds = items.map(item => item.lead_id)
          await supabase
            .from('leads')
            .update({
              is_marketplace_listed: true,
              marketplace_status: 'listed',
              updated_at: new Date().toISOString(),
            })
            .in('id', leadIds)

          // Reverse partner commissions
          const partnerCommissions = items.reduce<Record<string, number>>((acc, item) => {
            if (item.partner_id && item.commission_amount) {
              acc[item.partner_id] = (acc[item.partner_id] || 0) + item.commission_amount
            }
            return acc
          }, {})

          for (const [partnerId, amount] of Object.entries(partnerCommissions)) {
            const { data: partner } = await supabase
              .from('partners')
              .select('pending_balance, total_earnings, total_leads_sold')
              .eq('id', partnerId)
              .single()

            if (partner) {
              await supabase
                .from('partners')
                .update({
                  pending_balance: Math.max(0, (partner.pending_balance || 0) - amount),
                  total_earnings: Math.max(0, (partner.total_earnings || 0) - amount),
                  total_leads_sold: Math.max(0, (partner.total_leads_sold || 0) - 1),
                  updated_at: new Date().toISOString(),
                } as never)
                .eq('id', partnerId)
            }
          }
        }

        // Return credits to workspace (if purchase used credits)
        if (marketplacePurchase.credits_used > 0) {
          const { data: workspaceCredits } = await supabase
            .from('workspace_credits')
            .select('balance')
            .eq('workspace_id', marketplacePurchase.buyer_workspace_id)
            .single()

          if (workspaceCredits) {
            await supabase
              .from('workspace_credits')
              .update({
                balance: workspaceCredits.balance + marketplacePurchase.credits_used,
                updated_at: new Date().toISOString(),
              })
              .eq('workspace_id', marketplacePurchase.buyer_workspace_id)
          }
        }

        // Send refund confirmation email
        try {
          const { data: user } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', marketplacePurchase.buyer_user_id)
            .single()

          if (user) {
            console.log(`Lead purchase refund for user ${user.email}: ${marketplacePurchase.total_leads} leads`)
          }
        } catch (emailError) {
          console.error('[Stripe Webhook] Failed to send refund notification:', emailError)
        }

        console.log(`✅ Marketplace purchase refund processed: ${marketplacePurchase.total_leads} leads for workspace ${marketplacePurchase.buyer_workspace_id}`)
        return NextResponse.json({ received: true })
      }

      // Refund doesn't match any known purchase type
      console.log(`Refund for payment_intent ${paymentIntentId} - no matching purchase found`)
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
}
