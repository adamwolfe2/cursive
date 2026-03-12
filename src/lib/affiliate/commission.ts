/**
 * Affiliate Commission Handler
 * Called from the Stripe webhook handleInvoicePaymentSucceeded
 * Handles: commission creation, clawback, and churn tracking
 */

import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { sendPartnerCommissionEarned } from '@/lib/email/affiliate-emails'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
  })
}

/**
 * handleAffiliateInvoicePayment
 * Called after the main subscription logic in handleInvoicePaymentSucceeded
 * workspaceId: the workspace that made the payment
 * invoice: the Stripe invoice object
 */
export async function handleAffiliateInvoicePayment(
  workspaceId: string,
  invoice: Stripe.Invoice
): Promise<void> {
  try {
    const admin = createAdminClient()
    const invoiceId = invoice.id
    if (!invoiceId) return

    const invoiceAmount = invoice.amount_paid || 0
    if (invoiceAmount <= 0) return

    // Find referral for this workspace — lead or activated
    const { data: referral } = await admin
      .from('affiliate_referrals')
      .select('id, affiliate_id, status')
      .eq('workspace_id', workspaceId)
      .in('status', ['lead', 'activated'])
      .maybeSingle()

    if (!referral) return

    // If still 'lead', first payment converts to 'activated'
    if (referral.status === 'lead') {
      await admin
        .from('affiliate_referrals')
        .update({ status: 'activated', activated_at: new Date().toISOString() })
        .eq('id', referral.id)
    }

    // Look up affiliate — must be active AND have >= 50 activations (tier 5+)
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, email, first_name, total_activations, total_earnings, stripe_connect_account_id, stripe_onboarding_complete, status')
      .eq('id', referral.affiliate_id)
      .eq('status', 'active')
      .maybeSingle()

    if (!affiliate) return

    // Commission only for tier 5+ (50+ activations)
    if (affiliate.total_activations < 50) {
      safeLog(`[affiliate-commission] ${affiliate.email} has ${affiliate.total_activations} activations — no commission yet`)
      return
    }

    // Determine rate: 100+ activations = 20%, else 10%
    const commissionRate = affiliate.total_activations >= 100 ? 20 : 10
    const commissionAmount = Math.floor(invoiceAmount * commissionRate / 100)
    if (commissionAmount <= 0) return

    // Insert with onConflictDoNothing — critical idempotency guard
    const { data: commission } = await admin
      .from('affiliate_commissions')
      .insert({
        affiliate_id: affiliate.id,
        referral_id: referral.id,
        stripe_invoice_id: invoiceId,
        invoice_amount: invoiceAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'pending',
      })
      .select('id')
      .maybeSingle()

    // If commission is null — this invoice was already processed (webhook retry)
    // Exit immediately. Do NOT transfer. Do NOT update anything.
    if (!commission) {
      safeLog(`[affiliate-commission] Invoice ${invoiceId} already processed — skipping (webhook retry)`)
      return
    }

    safeLog(`[affiliate-commission] Created commission $${commissionAmount / 100} for ${affiliate.email}`)

    // Transfer immediately if Stripe Connect is complete
    if (affiliate.stripe_onboarding_complete && affiliate.stripe_connect_account_id) {
      try {
        const stripe = getStripe()
        const transfer = await stripe.transfers.create({
          amount: commissionAmount,
          currency: 'usd',
          destination: affiliate.stripe_connect_account_id,
          metadata: {
            commissionId: commission.id,
            affiliateId: affiliate.id,
            invoiceId,
          },
        })

        await admin
          .from('affiliate_commissions')
          .update({
            status: 'paid',
            stripe_transfer_id: transfer.id,
            paid_at: new Date().toISOString(),
          })
          .eq('id', commission.id)

        // Update total earnings
        await admin
          .from('affiliates')
          .update({ total_earnings: affiliate.total_earnings + commissionAmount })
          .eq('id', affiliate.id)

        sendPartnerCommissionEarned(
          affiliate.email,
          affiliate.first_name,
          commissionAmount,
          affiliate.total_earnings + commissionAmount
        ).catch((err) => safeError('[affiliate-commission] Commission earned email failed:', err))

        safeLog(`[affiliate-commission] Transferred $${commissionAmount / 100} to ${affiliate.email}`)
      } catch (transferErr) {
        safeError('[affiliate-commission] Transfer failed — commission stays pending:', transferErr)
        // Commission stays 'pending' — will be retried in monthly cron
      }
    }
  } catch (error) {
    safeError('[affiliate-commission] Unexpected error:', error)
    // Never throw — must not cause webhook to return non-200
  }
}

/**
 * handleAffiliateClawback
 * Called from charge.refunded or invoice.voided
 * invoiceId: the Stripe invoice ID that was refunded
 */
export async function handleAffiliateClawback(invoiceId: string): Promise<void> {
  try {
    const admin = createAdminClient()

    const { data: commission } = await admin
      .from('affiliate_commissions')
      .select('id, affiliate_id, commission_amount, status')
      .eq('stripe_invoice_id', invoiceId)
      .maybeSingle()

    if (!commission) return

    if (commission.status === 'pending') {
      // Just mark as failed — never paid, no money moved
      await admin
        .from('affiliate_commissions')
        .update({ status: 'failed' })
        .eq('id', commission.id)

      safeLog(`[affiliate-clawback] Marked pending commission ${commission.id} as failed`)
    } else if (commission.status === 'paid') {
      // Insert a negative commission to net out in next payout
      await admin
        .from('affiliate_commissions')
        .insert({
          affiliate_id: commission.affiliate_id,
          referral_id: commission.id, // Reference original commission ID (no strict FK needed)
          stripe_invoice_id: `clawback_${invoiceId}`,
          invoice_amount: 0,
          commission_rate: 0,
          commission_amount: -commission.commission_amount,
          status: 'pending',
        })
        .select('id')
        .maybeSingle()

      safeLog(`[affiliate-clawback] Created clawback for paid commission ${commission.id}`)
    }
  } catch (error) {
    safeError('[affiliate-clawback] Error:', error)
  }
}

/**
 * handleAffiliateChurn
 * Called from customer.subscription.deleted
 * workspaceId: the workspace whose subscription was deleted
 */
export async function handleAffiliateChurn(workspaceId: string): Promise<void> {
  try {
    const admin = createAdminClient()

    await admin
      .from('affiliate_referrals')
      .update({ status: 'churned' })
      .eq('workspace_id', workspaceId)
      .in('status', ['lead', 'activated'])

    safeLog(`[affiliate-churn] Marked referrals churned for workspace ${workspaceId}`)
  } catch (error) {
    safeError('[affiliate-churn] Error:', error)
  }
}

/**
 * handleAffiliateStripeAccountUpdated
 * Called from account.updated webhook
 * account: the Stripe Connect account
 */
export async function handleAffiliateStripeAccountUpdated(
  account: Stripe.Account
): Promise<void> {
  try {
    if (!account.charges_enabled) return

    const admin = createAdminClient()

    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, stripe_onboarding_complete')
      .eq('stripe_connect_account_id', account.id)
      .maybeSingle()

    if (affiliate && !affiliate.stripe_onboarding_complete) {
      await admin
        .from('affiliates')
        .update({ stripe_onboarding_complete: true })
        .eq('id', affiliate.id)

      safeLog(`[affiliate-stripe] Marked onboarding complete for ${affiliate.id}`)
    }
  } catch (error) {
    safeError('[affiliate-stripe] account.updated error:', error)
  }
}
