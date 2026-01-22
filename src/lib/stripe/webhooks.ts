// Stripe Webhook Handlers
// Process Stripe webhook events

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

/**
 * Handle customer.subscription.created event
 * Called when a new subscription is created
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
) {
  const supabase = await createClient()

  const userId = subscription.metadata.user_id
  const workspaceId = subscription.metadata.workspace_id

  if (!userId || !workspaceId) {
    throw new Error('Missing user_id or workspace_id in subscription metadata')
  }

  // Update user plan to 'pro'
  const { error: userError } = await supabase
    .from('users')
    .update({
      plan: 'pro',
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_period_start: new Date(
        subscription.current_period_start * 1000
      ).toISOString(),
      subscription_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    })
    .eq('id', userId)

  if (userError) {
    throw new Error(`Failed to update user: ${userError.message}`)
  }

  // Log billing event
  await supabase.from('billing_events').insert({
    workspace_id: workspaceId,
    event_type: 'subscription_created',
    stripe_event_id: subscription.id,
    amount: subscription.items.data[0]?.price?.unit_amount || 0,
    currency: subscription.currency,
    metadata: {
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      status: subscription.status,
    },
  })
}

/**
 * Handle customer.subscription.updated event
 * Called when subscription status changes
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const supabase = await createClient()

  const userId = subscription.metadata.user_id
  const workspaceId = subscription.metadata.workspace_id

  if (!userId || !workspaceId) {
    throw new Error('Missing user_id or workspace_id in subscription metadata')
  }

  // Determine plan based on subscription status
  let plan: 'free' | 'pro' = 'pro'
  if (
    subscription.status === 'canceled' ||
    subscription.status === 'unpaid' ||
    subscription.cancel_at_period_end
  ) {
    plan = 'free'
  }

  // Update user subscription details
  const { error: userError } = await supabase
    .from('users')
    .update({
      plan,
      subscription_status: subscription.status,
      subscription_period_start: new Date(
        subscription.current_period_start * 1000
      ).toISOString(),
      subscription_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('id', userId)

  if (userError) {
    throw new Error(`Failed to update user: ${userError.message}`)
  }

  // Log billing event
  await supabase.from('billing_events').insert({
    workspace_id: workspaceId,
    event_type: 'subscription_updated',
    stripe_event_id: subscription.id,
    amount: subscription.items.data[0]?.price?.unit_amount || 0,
    currency: subscription.currency,
    metadata: {
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
  })
}

/**
 * Handle customer.subscription.deleted event
 * Called when subscription is cancelled/deleted
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const supabase = await createClient()

  const userId = subscription.metadata.user_id
  const workspaceId = subscription.metadata.workspace_id

  if (!userId || !workspaceId) {
    throw new Error('Missing user_id or workspace_id in subscription metadata')
  }

  // Downgrade user to free plan
  const { error: userError } = await supabase
    .from('users')
    .update({
      plan: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      cancel_at_period_end: false,
    })
    .eq('id', userId)

  if (userError) {
    throw new Error(`Failed to update user: ${userError.message}`)
  }

  // Log billing event
  await supabase.from('billing_events').insert({
    workspace_id: workspaceId,
    event_type: 'subscription_deleted',
    stripe_event_id: subscription.id,
    amount: 0,
    currency: subscription.currency,
    metadata: {
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      status: 'canceled',
    },
  })
}

/**
 * Handle invoice.payment_succeeded event
 * Called when invoice payment succeeds
 */
export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const supabase = await createClient()

  if (!invoice.subscription) return

  const subscription = await supabase
    .from('users')
    .select('workspace_id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single()

  if (!subscription.data) return

  // Log billing event
  await supabase.from('billing_events').insert({
    workspace_id: subscription.data.workspace_id,
    event_type: 'payment_succeeded',
    stripe_event_id: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    metadata: {
      invoice_id: invoice.id,
      subscription_id: invoice.subscription,
      customer_id: invoice.customer,
      invoice_number: invoice.number,
    },
  })
}

/**
 * Handle invoice.payment_failed event
 * Called when invoice payment fails
 */
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = await createClient()

  if (!invoice.subscription) return

  const subscription = await supabase
    .from('users')
    .select('workspace_id, id, email')
    .eq('stripe_subscription_id', invoice.subscription)
    .single()

  if (!subscription.data) return

  // Log billing event
  await supabase.from('billing_events').insert({
    workspace_id: subscription.data.workspace_id,
    event_type: 'payment_failed',
    stripe_event_id: invoice.id,
    amount: invoice.amount_due,
    currency: invoice.currency,
    metadata: {
      invoice_id: invoice.id,
      subscription_id: invoice.subscription,
      customer_id: invoice.customer,
      attempt_count: invoice.attempt_count,
    },
  })

  // TODO: Send email notification to user about failed payment
}

/**
 * Process webhook event based on type
 */
export async function processWebhookEvent(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        // Unhandled event type
        break
    }
  } catch (error: any) {
    console.error(`[Stripe] Error processing webhook:`, error)
    throw error
  }
}
