// Stripe Client
// Lazy initialization to avoid build-time errors

import Stripe from 'stripe'
import { logger } from '@/lib/monitoring/logger'

let stripeClient: Stripe | null = null

/**
 * Get Stripe client instance (lazy initialization)
 * Throws error if STRIPE_SECRET_KEY is not set
 */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    stripeClient = new Stripe(apiKey, {
      apiVersion: '2025-02-24.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    })
  }
  return stripeClient
}

/**
 * Reset Stripe client (useful for testing)
 */
export function resetStripeClient() {
  stripeClient = null
}

/**
 * Create a Stripe Checkout session
 */
export async function createCheckoutSession(params: {
  userId: string
  userEmail: string
  workspaceId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  try {
    const stripe = getStripeClient()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: params.userEmail,
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: params.userId,
        workspace_id: params.workspaceId,
      },
      subscription_data: {
        metadata: {
          user_id: params.userId,
          workspace_id: params.workspaceId,
        },
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    })

    return session
  } catch (error) {
    logger.error('[Stripe] Failed to create checkout session', { error: error instanceof Error ? error.message : String(error) })
    throw new Error(`Stripe checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Cancel a Stripe subscription at the end of the billing period
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    const stripe = getStripeClient()

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    return subscription
  } catch (error) {
    logger.error('[Stripe] Failed to cancel subscription', { error: error instanceof Error ? error.message : String(error) })
    throw new Error(`Stripe cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Resume a canceled Stripe subscription (undo cancel_at_period_end)
 */
export async function resumeSubscription(subscriptionId: string) {
  try {
    const stripe = getStripeClient()

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    return subscription
  } catch (error) {
    logger.error('[Stripe] Failed to resume subscription', { error: error instanceof Error ? error.message : String(error) })
    throw new Error(`Stripe resume failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(params: {
  customerId: string
  returnUrl: string
}) {
  try {
    const stripe = getStripeClient()

    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    })

    return session
  } catch (error) {
    logger.error('[Stripe] Failed to create portal session', { error: error instanceof Error ? error.message : String(error) })
    throw new Error(`Stripe portal session failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
