import Stripe from 'stripe'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export interface CreateServiceCheckoutParams {
  workspaceId: string
  serviceTierSlug: string
  negotiatedMonthlyPrice?: number
  billingEmail?: string
  successUrl?: string
  cancelUrl?: string
}

export interface ServiceCheckoutResult {
  checkout_url: string
  session_id: string
}

/**
 * Create a Stripe Checkout session for a service tier purchase
 * Handles both one-time setup fees and recurring monthly subscriptions
 */
export async function createServiceCheckout(
  params: CreateServiceCheckoutParams
): Promise<ServiceCheckoutResult> {
  const {
    workspaceId,
    serviceTierSlug,
    negotiatedMonthlyPrice,
    billingEmail,
    successUrl,
    cancelUrl
  } = params

  // Get the service tier
  const tier = await serviceTierRepository.getTierBySlug(serviceTierSlug)

  if (!tier) {
    throw new Error(`Service tier not found: ${serviceTierSlug}`)
  }

  if (!tier.is_public) {
    throw new Error(`Service tier ${tier.name} requires sales contact`)
  }

  // Determine pricing
  const monthlyPrice = negotiatedMonthlyPrice || tier.monthly_price_min
  const setupFee = tier.setup_fee || 0

  // Build line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

  // Add setup fee as one-time payment (if applicable)
  if (setupFee > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${tier.name} - Setup Fee`,
          description: 'One-time onboarding and setup',
          metadata: {
            service_tier_id: tier.id,
            service_tier_slug: tier.slug,
            item_type: 'setup_fee'
          }
        },
        unit_amount: Math.round(setupFee * 100) // Convert to cents
      },
      quantity: 1
    })
  }

  // Add recurring monthly subscription
  lineItems.push({
    price_data: {
      currency: 'usd',
      product_data: {
        name: tier.name,
        description: tier.description,
        metadata: {
          service_tier_id: tier.id,
          service_tier_slug: tier.slug,
          item_type: 'subscription'
        }
      },
      unit_amount: Math.round(monthlyPrice * 100), // Convert to cents
      recurring: {
        interval: 'month'
      }
    },
    quantity: 1
  })

  // Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: lineItems,
    customer_email: billingEmail,
    metadata: {
      workspace_id: workspaceId,
      service_tier_id: tier.id,
      service_tier_slug: tier.slug,
      monthly_price: monthlyPrice.toString(),
      setup_fee: setupFee.toString()
    },
    subscription_data: {
      metadata: {
        workspace_id: workspaceId,
        service_tier_id: tier.id,
        service_tier_slug: tier.slug
      }
    },
    success_url: successUrl || `${baseUrl}/services/success?tier=${tier.slug}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${baseUrl}/services/${tier.slug}`,
    allow_promotion_codes: true,
    billing_address_collection: 'required'
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session URL')
  }

  return {
    checkout_url: session.url,
    session_id: session.id
  }
}

/**
 * Handle Stripe webhook events for service subscriptions
 */
export async function handleServiceSubscriptionWebhook(
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break

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
      console.log(`[Stripe] Unhandled event type: ${event.type}`)
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const workspaceId = session.metadata?.workspace_id
  const serviceTierId = session.metadata?.service_tier_id
  const monthlyPrice = parseFloat(session.metadata?.monthly_price || '0')
  const setupFee = parseFloat(session.metadata?.setup_fee || '0')

  if (!workspaceId || !serviceTierId) {
    console.error('[Stripe] Missing metadata in checkout session:', session.id)
    return
  }

  console.log('[Stripe] Checkout completed for workspace:', workspaceId, 'tier:', serviceTierId)

  // Create service subscription record
  await serviceTierRepository.createSubscription({
    workspace_id: workspaceId,
    service_tier_id: serviceTierId,
    status: 'pending_payment', // Will be updated when subscription is created
    monthly_price: monthlyPrice,
    setup_fee_paid: setupFee,
    stripe_subscription_id: session.subscription as string,
    stripe_customer_id: session.customer as string
  })
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const workspaceId = subscription.metadata?.workspace_id
  const serviceTierId = subscription.metadata?.service_tier_id

  if (!workspaceId || !serviceTierId) {
    console.error('[Stripe] Missing metadata in subscription:', subscription.id)
    return
  }

  console.log('[Stripe] Subscription created:', subscription.id)

  // Update subscription status to active
  const existingSubscription = await serviceTierRepository.getSubscriptionByStripeId(subscription.id)

  if (existingSubscription) {
    await serviceTierRepository.updateSubscription(existingSubscription.id, {
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    })
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log('[Stripe] Subscription updated:', subscription.id)

  const existingSubscription = await serviceTierRepository.getSubscriptionByStripeId(subscription.id)

  if (!existingSubscription) {
    console.error('[Stripe] Subscription not found:', subscription.id)
    return
  }

  // Map Stripe status to our status
  let status = existingSubscription.status
  if (subscription.status === 'active') {
    status = 'active'
  } else if (subscription.status === 'canceled') {
    status = 'cancelled'
  } else if (subscription.status === 'past_due') {
    status = 'paused'
  }

  await serviceTierRepository.updateSubscription(existingSubscription.id, {
    status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end
  })
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log('[Stripe] Subscription deleted:', subscription.id)

  const existingSubscription = await serviceTierRepository.getSubscriptionByStripeId(subscription.id)

  if (!existingSubscription) {
    console.error('[Stripe] Subscription not found:', subscription.id)
    return
  }

  await serviceTierRepository.updateSubscription(existingSubscription.id, {
    status: 'cancelled'
  })
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  console.log('[Stripe] Invoice payment succeeded:', invoice.id)

  if (!invoice.subscription) {
    return
  }

  const existingSubscription = await serviceTierRepository.getSubscriptionByStripeId(invoice.subscription as string)

  if (!existingSubscription) {
    return
  }

  // Ensure subscription is marked as active
  if (existingSubscription.status !== 'active') {
    await serviceTierRepository.updateSubscription(existingSubscription.id, {
      status: 'active'
    })
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('[Stripe] Invoice payment failed:', invoice.id)

  if (!invoice.subscription) {
    return
  }

  const existingSubscription = await serviceTierRepository.getSubscriptionByStripeId(invoice.subscription as string)

  if (!existingSubscription) {
    return
  }

  // Mark subscription as paused
  await serviceTierRepository.updateSubscription(existingSubscription.id, {
    status: 'paused'
  })
}

/**
 * Cancel a service subscription
 */
export async function cancelServiceSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<void> {
  const subscription = await serviceTierRepository.getSubscriptionWithTier(subscriptionId)

  if (!subscription) {
    throw new Error('Subscription not found')
  }

  if (!subscription.stripe_subscription_id) {
    throw new Error('No Stripe subscription ID found')
  }

  if (cancelAtPeriodEnd) {
    // Cancel at period end (let them use it until the end)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    })

    await serviceTierRepository.cancelSubscriptionAtPeriodEnd(subscriptionId)
  } else {
    // Cancel immediately
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id)

    await serviceTierRepository.updateSubscription(subscriptionId, {
      status: 'cancelled'
    })
  }
}

/**
 * Get Stripe portal URL for managing subscription
 */
export async function createServicePortalSession(
  workspaceId: string,
  returnUrl?: string
): Promise<string> {
  const subscription = await serviceTierRepository.getWorkspaceActiveSubscription(workspaceId)

  if (!subscription || !subscription.stripe_customer_id) {
    throw new Error('No active subscription found')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: returnUrl || `${baseUrl}/services/manage`
  })

  return session.url
}
