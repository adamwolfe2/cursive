// Stripe Client Setup
// Server-side Stripe client for API operations
//
// SETUP INSTRUCTIONS:
// 1. Go to Stripe Dashboard > Products
// 2. Create a product called "Cursive Pro"
// 3. Add a price: $50.00 USD / month (recurring)
// 4. Copy the Price ID (starts with price_)
// 5. Set STRIPE_PRO_MONTHLY_PRICE_ID in your .env file
//
// Required environment variables:
// - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_xxx or sk_test_xxx)
// - STRIPE_PRO_MONTHLY_PRICE_ID: Price ID for Pro monthly plan (price_xxx)
// - STRIPE_PRO_YEARLY_PRICE_ID: (Optional) Price ID for Pro yearly plan
// - STRIPE_WEBHOOK_SECRET: Webhook signing secret for verifying events

import Stripe from 'stripe'

// Helper to get Stripe client - only initializes when called
const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  })
}

// Stripe Product IDs (set these in Stripe Dashboard)
export const STRIPE_PRODUCTS = {
  FREE: process.env.STRIPE_FREE_PRODUCT_ID || '',
  PRO: process.env.STRIPE_PRO_PRODUCT_ID || '',
}

// Stripe Price IDs (set these in Stripe Dashboard)
// Create in Stripe Dashboard: Products > Add Product > "Cursive Pro" > $50/month
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
}

// Plan configurations
export const PLAN_CONFIGS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '3 credits per day',
      '1 active query',
      '3 email reveals per day',
      'Basic support',
      'Email delivery',
    ],
    limits: {
      daily_credits: 3,
      max_queries: 1,
      max_saved_searches: 5,
      export_limit: 100,
    },
  },
  pro: {
    name: 'Pro',
    price: 50,
    features: [
      '1000 credits per day',
      '5 active queries',
      'Unlimited email reveals',
      'Priority support',
      'Multi-channel delivery (Email, Slack, Webhooks)',
      'CSV exports',
      'API access',
      'Advanced filters',
    ],
    limits: {
      daily_credits: 1000,
      max_queries: 5,
      max_saved_searches: 50,
      export_limit: 10000,
    },
  },
}

/**
 * Create a Stripe Checkout session for Pro subscription
 */
export async function createCheckoutSession(params: {
  userId: string
  userEmail: string
  workspaceId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient()
  const { userId, userEmail, workspaceId, priceId, successUrl, cancelUrl } =
    params

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      user_id: userId,
      workspace_id: workspaceId,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        workspace_id: workspaceId,
      },
    },
    allow_promotion_codes: true,
  })

  return session
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function createPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripeClient()
  const { customerId, returnUrl } = params

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Get subscription details for a customer
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripeClient()
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch (error) {
    console.error('Failed to retrieve subscription:', error)
    return null
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })

  return subscription
}

/**
 * Resume a cancelled subscription
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })

  return subscription
}

/**
 * Get plan configuration based on subscription status
 */
export function getPlanConfig(plan: 'free' | 'pro') {
  return PLAN_CONFIGS[plan]
}

/**
 * Check if user has exceeded plan limits
 */
export function hasExceededLimit(
  plan: 'free' | 'pro',
  limitType: keyof typeof PLAN_CONFIGS.free.limits,
  currentUsage: number
): boolean {
  const config = PLAN_CONFIGS[plan]
  const limit = config.limits[limitType]
  return currentUsage >= limit
}
