/**
 * Stripe Configuration
 * Centralized Stripe settings and API version management
 */

export const STRIPE_CONFIG = {
  /**
   * Stripe API version
   * Can be overridden via STRIPE_API_VERSION environment variable
   */
  apiVersion: (process.env.STRIPE_API_VERSION || '2024-12-18.acacia') as const,

  /**
   * Publishable key for client-side usage
   */
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,

  /**
   * Secret key for server-side API calls
   */
  secretKey: process.env.STRIPE_SECRET_KEY!,

  /**
   * Webhook secret for signature verification
   */
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
} as const

/**
 * Validates that all required Stripe environment variables are set
 * @throws Error if any required variable is missing
 */
export function validateStripeConfig(): void {
  const missing: string[] = []

  if (!STRIPE_CONFIG.secretKey) {
    missing.push('STRIPE_SECRET_KEY')
  }

  if (!STRIPE_CONFIG.webhookSecret) {
    missing.push('STRIPE_WEBHOOK_SECRET')
  }

  if (!STRIPE_CONFIG.publishableKey) {
    missing.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe environment variables: ${missing.join(', ')}`
    )
  }
}
