// Webhook Retry Processor
// Processes failed Stripe webhooks with exponential backoff

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export const webhookRetryProcessor = inngest.createFunction(
  {
    id: 'webhook-retry-processor',
    name: 'Webhook Retry Processor',
  },
  { cron: '* * * * *' }, // Every minute
  async ({ step, logger }) => {
    const result = await step.run('process-retry-queue', async () => {
      const supabase = createAdminClient()

      // Get webhooks ready for retry (max 10 at a time)
      const { data: webhooksToRetry, error: fetchError } = await supabase.rpc(
        'get_webhooks_ready_for_retry',
        { p_limit: 10 }
      )

      if (fetchError) {
        logger.error('Failed to fetch retry queue:', fetchError)
        throw new Error(`Failed to fetch retry queue: ${fetchError.message}`)
      }

      if (!webhooksToRetry || webhooksToRetry.length === 0) {
        logger.info('No webhooks ready for retry')
        return { processed: 0, succeeded: 0, failed: 0 }
      }

      logger.info(`Processing ${webhooksToRetry.length} webhook retries`)

      let succeeded = 0
      let failed = 0

      // Process each webhook
      for (const webhook of webhooksToRetry) {
        try {
          logger.info(`Retrying webhook: ${webhook.stripe_event_id} (attempt ${webhook.retry_count + 1})`)

          // Re-construct Stripe event from stored data
          const event = webhook.event_data as Stripe.Event

          // Initialize Stripe
          if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('Stripe not configured')
          }

          // Process the webhook event using the same logic
          await processWebhookEvent(event, supabase)

          // Mark as completed
          await supabase.rpc('complete_webhook_retry', {
            p_queue_id: webhook.id,
          })

          logger.info(`✅ Successfully processed webhook: ${webhook.stripe_event_id}`)
          succeeded++
        } catch (error: any) {
          logger.error(`❌ Failed to process webhook ${webhook.stripe_event_id}:`, error)

          // Queue for next retry (the queue_webhook_retry function will increment retry_count)
          await supabase.rpc('queue_webhook_retry', {
            p_stripe_event_id: webhook.stripe_event_id,
            p_event_type: webhook.event_type,
            p_event_data: webhook.event_data,
            p_error: error.message || 'Unknown error',
          })

          failed++
        }
      }

      return {
        processed: webhooksToRetry.length,
        succeeded,
        failed,
      }
    })

    return {
      success: true,
      ...result,
    }
  }
)

// Helper function to process webhook events (shared with main webhook handler)
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
        throw new Error('Missing metadata for lead purchase')
      }

      // Check if purchase already completed
      const { data: existingPurchase } = await supabase
        .from('marketplace_purchases')
        .select('status')
        .eq('id', purchaseId)
        .single()

      if (existingPurchase?.status === 'completed') {
        console.log(`Lead purchase ${purchaseId} already completed, skipping`)
        return
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
        const leadIds = items.map((item: any) => item.lead_id)
        for (const leadId of leadIds) {
          await supabase.rpc('mark_lead_sold', { p_lead_id: leadId })
        }

        // Update partner pending balances for commissions
        const partnerCommissions = items.reduce<Record<string, number>>((acc, item: any) => {
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

      console.log(`✅ Lead purchase completed: ${purchaseId} for workspace ${workspaceId}`)
      return
    }

    // Handle marketplace credit purchase
    if (purchaseType === 'credit_purchase') {
      const creditPurchaseId = session.metadata?.credit_purchase_id
      const workspaceId = session.metadata?.workspace_id
      const credits = parseInt(session.metadata?.credits || '0', 10)

      if (!creditPurchaseId || !workspaceId || !credits) {
        throw new Error('Missing metadata for credit purchase')
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
        await supabase.from('workspace_credits').insert({
          workspace_id: workspaceId,
          balance: credits,
          total_purchased: credits,
          total_used: 0,
          total_earned: 0,
        })
      }

      console.log(`✅ Credit purchase completed: ${credits} credits for workspace ${workspaceId}`)
      return
    }
  }

  // Handle refunds
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge
    const paymentIntentId = charge.payment_intent as string

    if (!paymentIntentId) {
      console.error('Charge refunded but no payment_intent found')
      return
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

      console.log(`✅ Credit refund processed: ${creditPurchase.credits} credits for workspace ${creditPurchase.workspace_id}`)
      return
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
        // Return leads to marketplace
        const leadIds = items.map((item: any) => item.lead_id)
        await supabase
          .from('leads')
          .update({
            is_marketplace_listed: true,
            marketplace_status: 'listed',
            updated_at: new Date().toISOString(),
          })
          .in('id', leadIds)

        // Reverse partner commissions
        const partnerCommissions = items.reduce<Record<string, number>>((acc, item: any) => {
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

      // Return credits to workspace
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

      console.log(`✅ Marketplace purchase refund processed: ${marketplacePurchase.total_leads} leads for workspace ${marketplacePurchase.buyer_workspace_id}`)
      return
    }
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
        .upsert(
          {
            workspace_id: workspace.id,
            plan_id: plan?.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'workspace_id' }
        )

      // Update workspace plan
      if (plan) {
        await supabase.from('workspaces').update({ plan: plan.name }).eq('id', workspace.id)
      }
    }
    return
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
      await supabase.from('workspaces').update({ plan: 'free' }).eq('id', sub.workspace_id)
    }
    return
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
    return
  }

  // Handle payment failures
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    console.error('Payment failed:', paymentIntent.id)
    return
  }
}
