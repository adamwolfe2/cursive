import Stripe from 'stripe'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { fulfilLeadPurchase } from '@/lib/marketplace/lead-fulfilment'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

/**
 * Metadata written by `POST /api/leads/[id]/purchase`.
 *
 * Deliberately strict: `checkout.session.completed` carries a different
 * `lead_purchase` shape (purchase_id / lead_count) for bulk orders, and this
 * handler must never act on one. Requiring lead_id + buyer_user_id keeps the
 * two apart no matter which event a session decides to emit.
 */
const marketplaceLeadPurchaseMetadataSchema = z.object({
  type: z.literal('lead_purchase'),
  lead_id: z.string().uuid(),
  buyer_user_id: z.string().uuid(),
  buyer_workspace_id: z.string().uuid(),
  partner_id: z.string().optional(),
})

/**
 * Fallback fulfilment for marketplace lead purchases.
 *
 * The browser calls `confirm-purchase` about a second after the charge is
 * captured. Close the tab in that window — or lose the network, or hit a 500 —
 * and the money is gone with nothing recorded on our side. This makes the
 * webhook the system of record and the browser call an optimisation.
 *
 * Idempotency is handled inside fulfilLeadPurchase (keyed on the payment
 * intent), so running both is safe and so is a Stripe redelivery.
 */
export async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent

  const parsed = marketplaceLeadPurchaseMetadataSchema.safeParse(paymentIntent.metadata)
  if (!parsed.success) {
    // Every other payment intent on the account lands here — credit top-ups,
    // subscriptions, funnel orders — all fulfilled by their own handlers.
    return
  }

  const { lead_id, buyer_user_id, buyer_workspace_id, partner_id } = parsed.data

  const result = await fulfilLeadPurchase({
    supabase: createAdminClient(),
    paymentIntentId: paymentIntent.id,
    leadId: lead_id,
    buyerUserId: buyer_user_id,
    buyerWorkspaceId: buyer_workspace_id,
    partnerId: partner_id ?? null,
    amountInCents: paymentIntent.amount_received || paymentIntent.amount,
  })

  if (result.status === 'double_sell') {
    // Already logged with the refund details inside fulfilLeadPurchase. Do not
    // throw: a 500 makes Stripe redeliver, and every redelivery would find the
    // purchase row from this attempt and stop at already_recorded anyway.
    safeError('[Stripe Webhook] Lead purchase hit a double sell', {
      leadId: lead_id,
      paymentIntentId: paymentIntent.id,
    })
    return
  }

  safeLog('[Stripe Webhook] Marketplace lead purchase settled via webhook', {
    leadId: lead_id,
    paymentIntentId: paymentIntent.id,
    outcome: result.status,
  })
}
