/**
 * Stripe Webhook Handlers for Service Subscriptions
 *
 * Handles subscription lifecycle events and updates database accordingly
 */

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import {
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendCancellationEmail,
} from '@/lib/email/service-emails'

// Lazy-load Stripe to avoid build-time initialization
let stripeClient: Stripe | null = null
function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  }
  return stripeClient
}

/**
 * Helper to get workspace and user info for email sending
 */
async function getWorkspaceEmailInfo(workspaceId: string) {
  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name, users(email, full_name)')
    .eq('id', workspaceId)
    .single()

  if (!workspace || !workspace.users || workspace.users.length === 0) {
    throw new Error(`Workspace or user not found: ${workspaceId}`)
  }

  const user = Array.isArray(workspace.users) ? workspace.users[0] : workspace.users

  return {
    customerEmail: user.email,
    customerName: user.full_name || user.email.split('@')[0],
    workspaceName: workspace.name,
  }
}

/**
 * Handle subscription.created event
 * Called when a new subscription is created via Checkout
 */
export async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  console.log('[Webhook] subscription.created:', subscription.id)

  const supabase = await createClient()

  try {
    // Extract metadata
    const workspaceId = subscription.metadata.workspace_id
    const serviceTierId = subscription.metadata.service_tier_id

    if (!workspaceId || !serviceTierId) {
      throw new Error('Missing workspace_id or service_tier_id in subscription metadata')
    }

    // Get tier info
    const tier = await serviceTierRepository.getTierById(serviceTierId)
    if (!tier) {
      throw new Error(`Service tier not found: ${serviceTierId}`)
    }

    // Calculate pricing from subscription
    const monthlyPrice = subscription.items.data
      .filter(item => item.price.recurring?.interval === 'month')
      .reduce((sum, item) => sum + (item.price.unit_amount || 0), 0) / 100

    const setupFeePaid = subscription.items.data
      .filter(item => !item.price.recurring)
      .reduce((sum, item) => sum + (item.price.unit_amount || 0), 0) / 100

    // Determine initial status
    let status = 'pending_payment'
    if (subscription.status === 'active') {
      status = tier.onboarding_required ? 'onboarding' : 'active'
    } else if (subscription.status === 'trialing') {
      status = 'onboarding'
    }

    // Create or update service subscription record
    const { error: upsertError } = await supabase
      .from('service_subscriptions')
      .upsert({
        workspace_id: workspaceId,
        service_tier_id: serviceTierId,
        status,
        setup_fee_paid: setupFeePaid,
        monthly_price: monthlyPrice,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        created_at: new Date(subscription.created * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'workspace_id,service_tier_id'
      })

    if (upsertError) {
      throw new Error(`Failed to create subscription record: ${upsertError.message}`)
    }

    console.log('[Webhook] Created service subscription for workspace:', workspaceId)

    // Send welcome email
    try {
      const emailInfo = await getWorkspaceEmailInfo(workspaceId)
      await sendWelcomeEmail({
        customerEmail: emailInfo.customerEmail,
        customerName: emailInfo.customerName,
        tierName: tier.name,
        monthlyPrice: monthlyPrice,
      })
      console.log('[Webhook] Welcome email sent to:', emailInfo.customerEmail)
    } catch (emailError: any) {
      console.error('[Webhook] Failed to send welcome email:', emailError)
      // Don't throw - email failures shouldn't block webhook processing
    }

    // TODO: Create initial delivery if applicable
    // await scheduleInitialDelivery(workspaceId, serviceTierId)

  } catch (error: any) {
    console.error('[Webhook] Error handling subscription.created:', error)
    throw error
  }
}

/**
 * Handle subscription.updated event
 * Called when subscription is modified (status change, upgrade, etc.)
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log('[Webhook] subscription.updated:', subscription.id)

  const supabase = await createClient()

  try {
    // Find existing subscription record
    const { data: existingSubscription, error: findError } = await supabase
      .from('service_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (findError || !existingSubscription) {
      console.warn('[Webhook] Subscription not found in DB, creating new record')
      return await handleSubscriptionCreated(subscription)
    }

    // Map Stripe status to our status
    let status = existingSubscription.status
    if (subscription.status === 'active') {
      const tier = await serviceTierRepository.getTierById(existingSubscription.service_tier_id)
      if (existingSubscription.onboarding_completed || !tier?.onboarding_required) {
        status = 'active'
      } else {
        status = 'onboarding'
      }
    } else if (subscription.status === 'past_due') {
      status = 'pending_payment'
    } else if (subscription.status === 'canceled') {
      status = 'cancelled'
    } else if (subscription.status === 'unpaid') {
      status = 'pending_payment'
    }

    // Calculate current monthly price
    const monthlyPrice = subscription.items.data
      .filter(item => item.price.recurring?.interval === 'month')
      .reduce((sum, item) => sum + (item.price.unit_amount || 0), 0) / 100

    // Update subscription record
    const { error: updateError } = await supabase
      .from('service_subscriptions')
      .update({
        status,
        monthly_price: monthlyPrice,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSubscription.id)

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`)
    }

    console.log('[Webhook] Updated subscription status to:', status)

    // Send notification based on status change
    if (status === 'active' && existingSubscription.status !== 'active') {
      // Send activation email (payment success)
      try {
        const emailInfo = await getWorkspaceEmailInfo(existingSubscription.workspace_id)
        const tier = await serviceTierRepository.getTierById(existingSubscription.service_tier_id)
        await sendPaymentSuccessEmail({
          customerEmail: emailInfo.customerEmail,
          customerName: emailInfo.customerName,
          tierName: tier?.name || 'Cursive Service',
          amount: existingSubscription.monthly_price,
          periodEnd: existingSubscription.current_period_end,
        })
        console.log('[Webhook] Activation email sent to:', emailInfo.customerEmail)
      } catch (emailError: any) {
        console.error('[Webhook] Failed to send activation email:', emailError)
        // Don't throw - email failures shouldn't block webhook processing
      }
    } else if (status === 'pending_payment') {
      // Send payment failed email
      try {
        const emailInfo = await getWorkspaceEmailInfo(existingSubscription.workspace_id)
        const tier = await serviceTierRepository.getTierById(existingSubscription.service_tier_id)
        await sendPaymentFailedEmail({
          customerEmail: emailInfo.customerEmail,
          customerName: emailInfo.customerName,
          tierName: tier?.name || 'Cursive Service',
          amount: existingSubscription.monthly_price,
        })
        console.log('[Webhook] Payment failed email sent to:', emailInfo.customerEmail)
      } catch (emailError: any) {
        console.error('[Webhook] Failed to send payment failed email:', emailError)
        // Don't throw - email failures shouldn't block webhook processing
      }
    }

  } catch (error: any) {
    console.error('[Webhook] Error handling subscription.updated:', error)
    throw error
  }
}

/**
 * Handle subscription.deleted event
 * Called when subscription is canceled
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log('[Webhook] subscription.deleted:', subscription.id)

  const supabase = await createClient()

  try {
    // Update subscription to cancelled status
    const { error: updateError } = await supabase
      .from('service_subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)

    if (updateError) {
      throw new Error(`Failed to cancel subscription: ${updateError.message}`)
    }

    console.log('[Webhook] Cancelled subscription:', subscription.id)

    // Send cancellation confirmation email
    try {
      const { data: serviceSubscription } = await supabase
        .from('service_subscriptions')
        .select('workspace_id, current_period_end, service_tier:service_tiers(name)')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (serviceSubscription) {
        const emailInfo = await getWorkspaceEmailInfo(serviceSubscription.workspace_id)
        const tier = serviceSubscription.service_tier as any
        await sendCancellationEmail({
          customerEmail: emailInfo.customerEmail,
          customerName: emailInfo.customerName,
          tierName: tier?.name || 'Cursive Service',
          accessUntil: serviceSubscription.current_period_end || new Date().toISOString(),
        })
        console.log('[Webhook] Cancellation email sent to:', emailInfo.customerEmail)
      }
    } catch (emailError: any) {
      console.error('[Webhook] Failed to send cancellation email:', emailError)
    }

    // TODO: Schedule data retention/deletion if applicable

  } catch (error: any) {
    console.error('[Webhook] Error handling subscription.deleted:', error)
    throw error
  }
}

/**
 * Handle invoice.payment_failed event
 * Called when a payment attempt fails
 */
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('[Webhook] invoice.payment_failed:', invoice.id)

  const supabase = await createClient()

  try {
    if (!invoice.subscription) {
      console.warn('[Webhook] Invoice has no subscription, skipping')
      return
    }

    // Update subscription status to pending_payment
    const { error: updateError } = await supabase
      .from('service_subscriptions')
      .update({
        status: 'pending_payment',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription as string)

    if (updateError) {
      throw new Error(`Failed to update subscription status: ${updateError.message}`)
    }

    console.log('[Webhook] Updated subscription to pending_payment due to failed payment')

    // Send payment failed notification email
    try {
      const { data: subscription } = await supabase
        .from('service_subscriptions')
        .select('workspace_id, service_tier:service_tiers(name)')
        .eq('stripe_subscription_id', invoice.subscription as string)
        .single()

      if (subscription) {
        const emailInfo = await getWorkspaceEmailInfo(subscription.workspace_id)
        const tier = subscription.service_tier as any
        await sendPaymentFailedEmail({
          customerEmail: emailInfo.customerEmail,
          customerName: emailInfo.customerName,
          tierName: tier?.name || 'Cursive Service',
          amount: (invoice.amount_due || 0) / 100,
        })
        console.log('[Webhook] Payment failed email sent to:', emailInfo.customerEmail)
      }
    } catch (emailError: any) {
      console.error('[Webhook] Failed to send payment failed email:', emailError)
    }

  } catch (error: any) {
    console.error('[Webhook] Error handling invoice.payment_failed:', error)
    throw error
  }
}

/**
 * Handle invoice.payment_succeeded event
 * Called when a payment is successful
 */
export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  console.log('[Webhook] invoice.payment_succeeded:', invoice.id)

  const supabase = await createClient()

  try {
    if (!invoice.subscription) {
      console.warn('[Webhook] Invoice has no subscription, skipping')
      return
    }

    // Get subscription to check current status
    const { data: subscription } = await supabase
      .from('service_subscriptions')
      .select('*, service_tier:service_tiers(*)')
      .eq('stripe_subscription_id', invoice.subscription as string)
      .single()

    if (!subscription) {
      console.warn('[Webhook] Subscription not found in DB')
      return
    }

    // Determine new status
    let newStatus = subscription.status
    if (subscription.status === 'pending_payment') {
      const tier = subscription.service_tier
      newStatus = (subscription.onboarding_completed || !tier?.onboarding_required) ? 'active' : 'onboarding'
    }

    // Update subscription
    const { error: updateError } = await supabase
      .from('service_subscriptions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`)
    }

    console.log('[Webhook] Payment succeeded, updated status to:', newStatus)

    // Send payment success email (only for recurring payments, not initial)
    if (invoice.billing_reason === 'subscription_cycle') {
      try {
        const emailInfo = await getWorkspaceEmailInfo(subscription.workspace_id)
        const tier = subscription.service_tier
        await sendPaymentSuccessEmail({
          customerEmail: emailInfo.customerEmail,
          customerName: emailInfo.customerName,
          tierName: tier?.name || 'Cursive Service',
          amount: (invoice.amount_paid || 0) / 100,
          periodEnd: new Date(invoice.period_end! * 1000).toISOString(),
        })
        console.log('[Webhook] Payment success email sent to:', emailInfo.customerEmail)
      } catch (emailError: any) {
        console.error('[Webhook] Failed to send payment success email:', emailError)
      }
    }

    // TODO: Schedule next delivery if applicable

  } catch (error: any) {
    console.error('[Webhook] Error handling invoice.payment_succeeded:', error)
    throw error
  }
}

/**
 * Main webhook event router
 */
export async function handleServiceWebhookEvent(event: Stripe.Event): Promise<void> {
  console.log('[Webhook] Processing event:', event.type, event.id)

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

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      default:
        console.log('[Webhook] Unhandled event type:', event.type)
    }

    console.log('[Webhook] Successfully processed event:', event.id)
  } catch (error: any) {
    console.error('[Webhook] Error processing event:', event.type, error)
    throw error
  }
}
