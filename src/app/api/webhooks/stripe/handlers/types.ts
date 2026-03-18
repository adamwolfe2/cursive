import Stripe from 'stripe'
import { z } from 'zod'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

// Validation schemas for webhook metadata
export const creditPurchaseMetadataSchema = z.object({
  type: z.literal('credit_purchase'),
  credit_purchase_id: z.string().uuid('Invalid credit purchase ID'),
  workspace_id: z.string().uuid('Invalid workspace ID'),
  user_id: z.string().uuid('Invalid user ID'),
  credits: z.string().regex(/^\d+$/, 'Invalid credits format'),
})

export const leadPurchaseMetadataSchema = z.object({
  type: z.literal('lead_purchase'),
  purchase_id: z.string().uuid('Invalid purchase ID'),
  workspace_id: z.string().uuid('Invalid workspace ID'),
  user_id: z.string().uuid('Invalid user ID'),
  lead_count: z.string().regex(/^\d+$/, 'Invalid lead count format'),
})

// Lazy-load Stripe client (shared across all handlers)
let stripeClient: Stripe | null = null
export function getStripe(): Stripe {
  if (!stripeClient) {
    if (!STRIPE_CONFIG.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeClient = new Stripe(STRIPE_CONFIG.secretKey, {
      apiVersion: STRIPE_CONFIG.apiVersion as Stripe.LatestApiVersion,
    })
  }
  return stripeClient
}
