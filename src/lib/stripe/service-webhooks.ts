/**
 * Stripe Webhook Handlers for Service Subscriptions
 *
 * Handles subscription lifecycle events and updates database accordingly
 */

import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendCancellationEmail,
} from '@/lib/email/service-emails'
import { logger } from '@/lib/monitoring/logger'

/**
 * Update all users in a workspace to a given plan + credit limit.
 * Called when subscription status changes to keep users.plan in sync.
 */
async function updateWorkspaceUserPlan(
  workspaceId: string,
  plan: 'free' | 'pro',
  dailyCreditLimit: number
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('users')
    .update({ plan, daily_credit_limit: dailyCreditLimit })
    .eq('workspace_id', workspaceId)

  if (error) {
    logger.error('[Webhook] Failed to update workspace user plans', {
      workspaceId,
      plan,
      error: error.message,
    })
    throw new Error(`Failed to update user plans: ${error.message}`)
  }

  logger.info('[Webhook] Updated workspace user plans', { workspaceId, plan, dailyCreditLimit })
}

/**
 * Get a service tier by ID using admin client (bypasses RLS).
 * Webhook handlers have no user auth context, so we can't use the repository
 * which relies on the SSR cookie-based client.
 */
async function getServiceTierById(tierId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('service_tiers')
    .select('*')
    .eq('id', tierId)
    .single()
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch service tier: ${error.message}`)
  }
  return data
}

// Lazy-load Stripe to avoid build-time initialization
let stripeClient: Stripe | null = null
function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
  }
  return stripeClient
}

/**
 * Helper to get workspace and user info for email sending
 */
async function getWorkspaceEmailInfo(workspaceId: string) {
  const supabase = createAdminClient()

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
  const supabase = createAdminClient()

  try {
    // Extract metadata
    const workspaceId = subscription.metadata.workspace_id
    const serviceTierId = subscription.metadata.service_tier_id

    if (!workspaceId) {
      throw new Error('Missing workspace_id in subscription metadata')
    }

    // Regular billing subscription (no service_tier_id) — just update users.plan
    if (!serviceTierId) {
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        await updateWorkspaceUserPlan(workspaceId, 'pro', 1000)
      }
      return
    }

    // Get tier info
    const tier = await getServiceTierById(serviceTierId)
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

    // Update users.plan to 'pro' for all workspace members
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      await updateWorkspaceUserPlan(workspaceId, 'pro', 1000)
    }

    // Send welcome email
    try {
      const emailInfo = await getWorkspaceEmailInfo(workspaceId)
      await sendWelcomeEmail({
        customerEmail: emailInfo.customerEmail,
        customerName: emailInfo.customerName,
        tierName: tier.name,
        monthlyPrice: monthlyPrice,
      })
    } catch (emailError: any) {
      logger.error('[Webhook] Failed to send welcome email', { error: emailError instanceof Error ? emailError.message : String(emailError) })
      // Don't throw - email failures shouldn't block webhook processing
    }

    // Trigger GHL sub-account creation for done-for-you tiers
    if (tier.onboarding_required) {
      try {
        const { inngest } = await import('@/inngest/client')
        const emailInfo = await getWorkspaceEmailInfo(workspaceId)

        await inngest.send({
          name: 'ghl-admin/onboard-customer',
          data: {
            user_id: subscription.metadata.user_id || '',
            user_email: emailInfo.customerEmail,
            user_name: emailInfo.customerName,
            company_name: emailInfo.workspaceName,
            workspace_id: workspaceId,
            purchase_type: 'subscription',
            amount: monthlyPrice,
          },
        })

        // For tiers that include sub-account setup, create one
        if (tier.platform_features && (tier.platform_features as Record<string, unknown>).ghl_subaccount) {
          await inngest.send({
            name: 'ghl-admin/create-subaccount',
            data: {
              user_id: subscription.metadata.user_id || '',
              user_email: emailInfo.customerEmail,
              user_name: emailInfo.customerName,
              company_name: emailInfo.workspaceName,
              workspace_id: workspaceId,
              plan_type: 'done_for_you',
            },
          })
        }
      } catch (ghlError: any) {
        logger.error('[Webhook] Failed to trigger GHL onboarding', { error: ghlError instanceof Error ? ghlError.message : String(ghlError) })
        // Don't throw - GHL setup failures shouldn't block subscription
      }
    }

  } catch (error: any) {
    logger.error('[Webhook] Error handling subscription.created', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

/**
 * Handle subscription.updated event
 * Called when subscription is modified (status change, upgrade, etc.)
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const supabase = createAdminClient()

  try {
    // Find existing subscription record
    const { data: existingSubscription, error: findError } = await supabase
      .from('service_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (findError || !existingSubscription) {
      return await handleSubscriptionCreated(subscription)
    }

    // Map Stripe status to our status
    let status = existingSubscription.status
    if (subscription.status === 'active') {
      const tier = await getServiceTierById(existingSubscription.service_tier_id)
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

    // Sync users.plan when subscription status changes
    if (status === 'active' && existingSubscription.status !== 'active') {
      await updateWorkspaceUserPlan(existingSubscription.workspace_id, 'pro', 1000)
    } else if (status === 'cancelled') {
      await updateWorkspaceUserPlan(existingSubscription.workspace_id, 'free', 3)
    }

    // Send notification based on status change
    if (status === 'active' && existingSubscription.status !== 'active') {
      // Send activation email (payment success)
      try {
        const emailInfo = await getWorkspaceEmailInfo(existingSubscription.workspace_id)
        const tier = await getServiceTierById(existingSubscription.service_tier_id)
        await sendPaymentSuccessEmail({
          customerEmail: emailInfo.customerEmail,
          customerName: emailInfo.customerName,
          tierName: tier?.name || 'Cursive Service',
          amount: existingSubscription.monthly_price,
          periodEnd: existingSubscription.current_period_end,
        })
      } catch (emailError: any) {
        logger.error('[Webhook] Failed to send activation email', { error: emailError instanceof Error ? emailError.message : String(emailError) })
        // Don't throw - email failures shouldn't block webhook processing
      }
    } else if (status === 'pending_payment') {
      // Send payment failed email
      try {
        const emailInfo = await getWorkspaceEmailInfo(existingSubscription.workspace_id)
        const tier = await getServiceTierById(existingSubscription.service_tier_id)
        await sendPaymentFailedEmail({
          customerEmail: emailInfo.customerEmail,
          customerName: emailInfo.customerName,
          tierName: tier?.name || 'Cursive Service',
          amount: existingSubscription.monthly_price,
        })
      } catch (emailError: any) {
        logger.error('[Webhook] Failed to send payment failed email', { error: emailError instanceof Error ? emailError.message : String(emailError) })
        // Don't throw - email failures shouldn't block webhook processing
      }
    }

  } catch (error: any) {
    logger.error('[Webhook] Error handling subscription.updated', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

/**
 * Handle subscription.deleted event
 * Called when subscription is canceled
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const supabase = createAdminClient()

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

    // Downgrade all workspace users to free plan
    // Try subscription metadata first (works for all subscription types),
    // then fall back to service_subscriptions record
    const workspaceId = subscription.metadata.workspace_id
      || (await supabase
          .from('service_subscriptions')
          .select('workspace_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()
        ).data?.workspace_id

    if (workspaceId) {
      await updateWorkspaceUserPlan(workspaceId, 'free', 3)
    }

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
      }
    } catch (emailError: any) {
      logger.error('[Webhook] Failed to send cancellation email', { error: emailError instanceof Error ? emailError.message : String(emailError) })
    }

    // FUTURE: Schedule data retention/deletion if applicable
    // This will be implemented when we add automated data cleanup policies

  } catch (error: any) {
    logger.error('[Webhook] Error handling subscription.deleted', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

/**
 * Handle invoice.payment_failed event
 * Called when a payment attempt fails
 */
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const supabase = createAdminClient()

  try {
    if (!invoice.subscription) {
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
      }
    } catch (emailError: any) {
      logger.error('[Webhook] Failed to send payment failed email', { error: emailError instanceof Error ? emailError.message : String(emailError) })
    }

  } catch (error: any) {
    logger.error('[Webhook] Error handling invoice.payment_failed', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

/**
 * Handle invoice.payment_succeeded event
 * Called when a payment is successful
 */
export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const supabase = createAdminClient()

  try {
    if (!invoice.subscription) {
      logger.warn('[Webhook] Invoice has no subscription, skipping')
      return
    }

    // Get subscription to check current status
    const { data: subscription } = await supabase
      .from('service_subscriptions')
      .select('*, service_tier:service_tiers(*)')
      .eq('stripe_subscription_id', invoice.subscription as string)
      .single()

    if (!subscription) {
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

    // Sync users.plan when payment recovers subscription to active
    if (newStatus === 'active' && subscription.status === 'pending_payment') {
      await updateWorkspaceUserPlan(subscription.workspace_id, 'pro', 1000)
    }

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
      } catch (emailError: any) {
        logger.error('[Webhook] Failed to send payment success email', { error: emailError instanceof Error ? emailError.message : String(emailError) })
      }
    }

    // FUTURE: Schedule next delivery if applicable
    // This will be implemented when we add recurring delivery scheduling

  } catch (error: any) {
    logger.error('[Webhook] Error handling invoice.payment_succeeded', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

/**
 * Main webhook event router
 */
export async function handleServiceWebhookEvent(event: Stripe.Event): Promise<void> {
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
        break
    }
  } catch (error: any) {
    logger.error('[Webhook] Error processing event', { eventType: event.type, error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}
