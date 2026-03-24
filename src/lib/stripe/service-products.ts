/**
 * Stripe Service Product Configuration
 *
 * Maps service tier slugs to Stripe product and price IDs
 */

export interface ServiceStripeConfig {
  productId: string
  priceId: string
  setupFeePriceId?: string
}

/**
 * Service tier to Stripe product mapping
 */
export const SERVICE_STRIPE_PRODUCTS: Record<string, ServiceStripeConfig> = {
  'cursive-data': {
    productId: 'prod_Tuj1hv34tiOZv5',
    priceId: 'price_1SwtZGEmhKaqBpAE86k4dzrc', // $1,000/month
  },
  'cursive-outbound': {
    productId: 'prod_TujA4Je3snyEaz',
    priceId: 'price_1SwthrEmhKaqBpAERZJfx4MT', // $2,500/month
  },
  'cursive-pipeline': {
    productId: 'prod_TujEC1bvETTlHu',
    priceId: 'price_1SwtlhEmhKaqBpAE6KUXSKY9', // $5,000/month
  },
  // Cursive Venture Studio uses calendar booking, not Stripe checkout
}

/**
 * Get Stripe configuration for a service tier
 */
export function getStripeConfigForTier(tierSlug: string): ServiceStripeConfig | null {
  return SERVICE_STRIPE_PRODUCTS[tierSlug] || null
}

/**
 * Check if a tier supports direct checkout
 */
export function supportsDirectCheckout(tierSlug: string): boolean {
  return tierSlug in SERVICE_STRIPE_PRODUCTS
}

/**
 * Calendar booking URL for high-touch tiers
 */
export const VENTURE_STUDIO_CALENDAR_URL = 'https://cal.com/cursiveteam/30min'
