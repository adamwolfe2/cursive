/**
 * Marketplace lead fulfilment.
 *
 * Extracted so the buyer's browser is no longer the only thing that can
 * complete a paid purchase. `/api/leads/[id]/confirm-purchase` is called by
 * BuyLeadButton roughly a second after the charge is captured; close the tab
 * in that window and the money is taken with no purchase row, no partner
 * credit, no lead delivered and no server-side record that any of it happened.
 * The `payment_intent.succeeded` webhook now runs the same code, so the
 * browser call is an optimisation rather than the system of record.
 *
 * Both callers must land on identical money, which is why the split lives
 * here as a pure function rather than inline in a route.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { PartnerRepository } from '@/lib/db/repositories/partner.repository'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

/**
 * Marketplace lead sales pay the sourcing partner 70%.
 *
 * NOTE: this disagrees with `COMMISSION_CONFIG` (30% base / 50% max), which
 * governs affiliate commission on subscription revenue. Two different
 * programmes, but the collision is worth knowing about before either moves —
 * see AUTONOMOUS_IMPROVEMENT_LOG.md.
 */
export const PARTNER_COMMISSION_RATE = 0.7

export type LeadPurchaseSplit = {
  purchasePrice: number
  partnerCommission: number
  platformFee: number
}

/** Split a captured Stripe amount (in cents) into partner and platform shares. */
export function computeLeadPurchaseSplit(
  amountInCents: number,
  hasPartner: boolean
): LeadPurchaseSplit {
  const purchasePrice = amountInCents / 100
  const partnerCommission = hasPartner
    ? Math.round(purchasePrice * PARTNER_COMMISSION_RATE * 100) / 100
    : 0
  const platformFee = Math.round((purchasePrice - partnerCommission) * 100) / 100

  return { purchasePrice, partnerCommission, platformFee }
}

export type LeadFulfilmentResult =
  /** A purchase row already existed for this payment intent. */
  | { status: 'already_recorded' }
  /** Purchase recorded, partner credited, lead handed to the buyer. */
  | { status: 'fulfilled'; purchaseId: string }
  /**
   * Someone else claimed the lead first. The buyer has been charged and the
   * partner credited; neither is reversed here, because moving money back is
   * a decision a human makes. See AUTONOMOUS_IMPROVEMENT_LOG.md.
   */
  | { status: 'double_sell'; purchaseId: string }

export type LeadFulfilmentInput = {
  /** Admin client from a webhook, or the caller's RLS client from the route. */
  supabase: SupabaseClient<any, any, any>
  paymentIntentId: string
  leadId: string
  buyerUserId: string
  buyerWorkspaceId: string
  /** Stripe metadata carries the string 'none' when the lead has no partner. */
  partnerId: string | null
  amountInCents: number
}

export async function fulfilLeadPurchase(
  input: LeadFulfilmentInput
): Promise<LeadFulfilmentResult> {
  const {
    supabase,
    paymentIntentId,
    leadId,
    buyerUserId,
    buyerWorkspaceId,
    amountInCents,
  } = input
  const partnerId = input.partnerId && input.partnerId !== 'none' ? input.partnerId : null

  // Idempotency. Both the browser call and the webhook reach this, often for
  // the same payment, and Stripe redelivers.
  const { data: existingPurchase, error: existingError } = await supabase
    .from('lead_purchases')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  // supabase-js RESOLVES on a PostgREST failure, so an unchecked error here
  // would read as "no purchase yet" and record a second one.
  if (existingError) {
    safeError('[Lead Fulfilment] Failed to check for an existing purchase:', existingError)
    throw new Error('Failed to check for an existing lead purchase')
  }

  if (existingPurchase) return { status: 'already_recorded' }

  const { purchasePrice, partnerCommission, platformFee } = computeLeadPurchaseSplit(
    amountInCents,
    partnerId !== null
  )

  const partnerRepo = new PartnerRepository()
  const purchase = await partnerRepo.recordLeadPurchase(
    {
      lead_id: leadId,
      buyer_user_id: buyerUserId,
      partner_id: partnerId,
      purchase_price: purchasePrice,
      partner_commission: partnerCommission,
      platform_fee: platformFee,
      stripe_payment_intent_id: paymentIntentId,
    },
    supabase
  )

  // Hand the lead over, guarding against a double sell. `.select()` is
  // load-bearing: an UPDATE matching zero rows is not an error in PostgREST,
  // so the sold_at guard only tells us anything if we count what came back.
  const { data: claimedLeads, error: updateError } = await supabase
    .from('leads')
    .update({
      workspace_id: buyerWorkspaceId,
      status: 'new',
      assigned_user_id: buyerUserId,
      sold_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .is('sold_at', null)
    .select('id')

  if (updateError) {
    safeError('[Lead Fulfilment] Failed to assign the lead to the buyer:', updateError)
    throw new Error('Failed to assign purchased lead to buyer')
  }

  if (!claimedLeads || claimedLeads.length === 0) {
    // The sold_at check at PaymentIntent-creation time lets two buyers hold a
    // valid intent for one lead, and idempotency above is keyed on the payment
    // intent (different per buyer), so both get here.
    safeError(
      `[Lead Fulfilment] DOUBLE-SELL: lead ${leadId} was already sold; buyer ${buyerUserId} was charged on payment intent ${paymentIntentId} and needs a refund. Purchase row ${purchase.id} also credited the partner.`
    )
    return { status: 'double_sell', purchaseId: purchase.id }
  }

  safeLog('[Lead Fulfilment] Lead purchase fulfilled', {
    leadId,
    purchaseId: purchase.id,
    paymentIntentId,
  })

  return { status: 'fulfilled', purchaseId: purchase.id }
}
