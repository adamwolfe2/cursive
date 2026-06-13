/**
 * Affiliate Commission Handler — Outbound Partner Ramp
 *
 * Called from the Stripe webhook on invoice.payment_succeeded for both:
 *   - Service-tier subscriptions ($1k–$5k/mo)  → keyed by workspace_id
 *   - Funnel VSL offers ($97/$197/$247/mo)      → keyed by customer email
 *
 * Commission rate scales with the partner's number of CURRENTLY paying
 * referrals (see src/lib/affiliate/ramp.ts): 15% → 40%. The first payment for a
 * referral atomically flips it to "paying" and bumps the partner's tier; every
 * subsequent renewal pays at the partner's live rate (retroactive whole-book).
 *
 * Payouts only auto-transfer once the partner has (a) signed the agreement and
 * (b) completed Stripe Connect onboarding. Otherwise the commission accrues as
 * 'pending' and is settled by the monthly payout cron.
 *
 * Every handler swallows its own errors — a webhook must never return non-200.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { sendPartnerCommissionEarned } from '@/lib/email/affiliate-emails'
import { rampRate } from '@/lib/affiliate/ramp'
import { isSelfReferral } from '@/lib/affiliate/guards'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

type AdminClient = ReturnType<typeof createAdminClient>

/** The workspace owned by an affiliate (via their linked auth user), or null. */
async function affiliateOwnWorkspaceId(
  admin: AdminClient,
  affiliateUserId: string | null | undefined
): Promise<string | null> {
  if (!affiliateUserId) return null
  try {
    const { data } = await admin
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', affiliateUserId)
      .maybeSingle()
    return data?.workspace_id ?? null
  } catch {
    return null
  }
}

interface ReferralRow {
  id: string
  affiliate_id: string
  status: string
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
  })
}

/**
 * Shared commission core. Given a matched referral and an invoice, computes the
 * ramp rate, records an idempotent commission row, and transfers it when the
 * partner is fully onboarded + signed.
 */
async function recordCommissionForReferral(
  admin: AdminClient,
  referral: ReferralRow,
  invoice: Stripe.Invoice,
  meta: { packageSlug?: string | null; mrrAmount?: number | null }
): Promise<void> {
  const invoiceId = invoice.id
  if (!invoiceId) return

  const invoiceAmount = invoice.amount_paid || 0
  if (invoiceAmount <= 0) return

  // Load the affiliate — must be active.
  const { data: affiliate } = await admin
    .from('affiliates')
    .select(
      'id, email, first_name, user_id, total_earnings, stripe_connect_account_id, stripe_onboarding_complete, active_paying_referrals, current_commission_rate, agreement_accepted_at, status'
    )
    .eq('id', referral.affiliate_id)
    .eq('status', 'active')
    .maybeSingle()

  if (!affiliate) return

  // Self-referral backstop (B2): defense-in-depth behind the attribution-time
  // guards and the DB trigger. If a self-referral row ever slips through, never
  // record/pay a commission on it — and churn it so it stops matching renewals.
  const { data: refDetail } = await admin
    .from('affiliate_referrals')
    .select('referred_email, referred_user_id, workspace_id')
    .eq('id', referral.id)
    .maybeSingle()

  if (refDetail) {
    const ownWorkspaceId = await affiliateOwnWorkspaceId(admin, affiliate.user_id)
    if (
      isSelfReferral(
        { email: affiliate.email, userId: affiliate.user_id, workspaceId: ownWorkspaceId },
        {
          email: refDetail.referred_email,
          userId: refDetail.referred_user_id,
          workspaceId: refDetail.workspace_id,
        }
      )
    ) {
      safeError(
        `[affiliate-commission] BLOCKED self-referral commission — affiliate ${affiliate.id}, referral ${referral.id}`
      )
      await admin.from('affiliate_referrals').update({ status: 'churned' }).eq('id', referral.id)
      return
    }
  }

  // Determine the rate. First payment → atomically flip to 'paying' and bump
  // the tier (the RPC is idempotent: a webhook retry won't double-count because
  // the referral is already 'paying'). Recurring → use the partner's live rate.
  let rate: number
  if (referral.status !== 'paying') {
    const { data: rpcRows, error: rpcError } = await admin.rpc('affiliate_mark_paying', {
      p_referral_id: referral.id,
      p_package_slug: meta.packageSlug ?? null,
      p_mrr_amount: meta.mrrAmount ?? null,
    })
    const result = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows
    if (rpcError || !result) {
      safeError('[affiliate-commission] mark_paying RPC failed — falling back to stored rate:', rpcError)
      rate = affiliate.current_commission_rate || rampRate(0)
    } else {
      rate = result.rate
      safeLog(
        `[affiliate-commission] ${affiliate.email} first payment for referral ${referral.id} — active=${result.active_paying}, rate=${result.rate}%`
      )
    }
  } else {
    // Recurring renewal: compute the rate LIVE from the current active-paying
    // count (retroactive whole-book) rather than trusting the cached column.
    rate = rampRate(affiliate.active_paying_referrals ?? 0)
  }

  const commissionAmount = Math.floor((invoiceAmount * rate) / 100)
  if (commissionAmount <= 0) return

  // Idempotency guard — UNIQUE(stripe_invoice_id). Null result = webhook retry.
  const { data: commission } = await admin
    .from('affiliate_commissions')
    .insert({
      affiliate_id: affiliate.id,
      referral_id: referral.id,
      stripe_invoice_id: invoiceId,
      invoice_amount: invoiceAmount,
      commission_rate: rate,
      commission_amount: commissionAmount,
      status: 'pending',
    })
    .select('id')
    .maybeSingle()

  if (!commission) {
    safeLog(`[affiliate-commission] Invoice ${invoiceId} already processed — skipping (webhook retry)`)
    return
  }

  safeLog(
    `[affiliate-commission] Created $${(commissionAmount / 100).toFixed(2)} (${rate}%) for ${affiliate.email} on invoice ${invoiceId}`
  )

  // Auto-transfer only when signed AND Stripe-onboarded. Otherwise it accrues
  // as 'pending' for the monthly cron.
  const eligibleToTransfer =
    !!affiliate.agreement_accepted_at &&
    affiliate.stripe_onboarding_complete &&
    !!affiliate.stripe_connect_account_id

  if (!eligibleToTransfer) {
    safeLog(
      `[affiliate-commission] ${affiliate.email} not payout-eligible yet (signed=${!!affiliate.agreement_accepted_at}, onboarded=${affiliate.stripe_onboarding_complete}) — commission stays pending`
    )
    return
  }

  // Claim-before-transfer (blocker B4): stamp the claim key into stripe_transfer_id
  // BEFORE transferring, only while still pending+unclaimed. The monthly cron only
  // selects rows with stripe_transfer_id IS NULL, so a dropped post-transfer write
  // can never leave this row re-selectable → no cross-month double-pay.
  const claimKey = `comm_transfer_${commission.id}`
  const { data: claimed } = await admin
    .from('affiliate_commissions')
    .update({ stripe_transfer_id: claimKey })
    .eq('id', commission.id)
    .eq('status', 'pending')
    .is('stripe_transfer_id', null)
    .select('id')
    .maybeSingle()

  if (!claimed) {
    safeLog(`[affiliate-commission] Commission ${commission.id} already claimed — skipping immediate transfer`)
    return
  }

  try {
    const stripe = getStripe()
    const transfer = await stripe.transfers.create(
      {
        amount: commissionAmount,
        currency: 'usd',
        destination: affiliate.stripe_connect_account_id as string,
        metadata: { commissionId: commission.id, affiliateId: affiliate.id, invoiceId },
      },
      // Idempotency: Stripe dedupes retries of this exact key (24h window). Equal
      // to the in-DB claim key, so retries can never double-pay the same commission.
      { idempotencyKey: claimKey }
    )

    await admin
      .from('affiliate_commissions')
      .update({ status: 'paid', stripe_transfer_id: transfer.id, paid_at: new Date().toISOString() })
      .eq('id', commission.id)
      .eq('stripe_transfer_id', claimKey)

    // Atomic increment — never a JS read-modify-write (concurrent invoices).
    await admin.rpc('affiliate_add_earnings', { p_affiliate_id: affiliate.id, p_delta: commissionAmount })

    sendPartnerCommissionEarned(
      affiliate.email,
      affiliate.first_name,
      commissionAmount,
      (affiliate.total_earnings || 0) + commissionAmount
    ).catch((err) => safeError('[affiliate-commission] Commission earned email failed:', err))

    safeLog(`[affiliate-commission] Transferred $${(commissionAmount / 100).toFixed(2)} to ${affiliate.email}`)
  } catch (transferErr) {
    // Revert the claim so the monthly cron retries this commission.
    await admin
      .from('affiliate_commissions')
      .update({ stripe_transfer_id: null })
      .eq('id', commission.id)
      .eq('stripe_transfer_id', claimKey)
      .eq('status', 'pending')
    safeError('[affiliate-commission] Transfer failed — claim reverted, commission stays pending:', transferErr)
  }
}

/**
 * Service-tier path. workspaceId: the workspace that paid. Finds the referral
 * attributed to that workspace and records commission.
 */
export async function handleAffiliateInvoicePayment(
  workspaceId: string,
  invoice: Stripe.Invoice
): Promise<void> {
  try {
    const admin = createAdminClient()

    const { data: referral } = await admin
      .from('affiliate_referrals')
      .select('id, affiliate_id, status')
      .eq('workspace_id', workspaceId)
      .in('status', ['lead', 'activated', 'paying'])
      .maybeSingle()

    if (!referral) return

    // Best-effort package slug from the subscription/line metadata.
    const packageSlug =
      (invoice.lines?.data?.[0]?.price?.metadata?.service_tier_slug as string | undefined) ?? null

    await recordCommissionForReferral(admin, referral, invoice, {
      packageSlug,
      mrrAmount: invoice.amount_paid || null,
    })
  } catch (error) {
    safeError('[affiliate-commission] Unexpected error (service):', error)
  }
}

/**
 * Funnel path. The funnel buyer has no workspace at purchase time, so we match
 * the referral by email (and workspace_id once provisioned).
 */
export async function handleAffiliateFunnelInvoice(
  order: {
    customer_email: string
    offer_slug: string
    workspace_id: string | null
    affiliate_partner_code: string | null
  },
  invoice: Stripe.Invoice
): Promise<void> {
  try {
    const admin = createAdminClient()
    const email = order.customer_email?.toLowerCase()
    if (!email) return

    // Resolve the partner from the code stamped on the order at checkout. This
    // is the authoritative attribution — never an ambiguous bare-email match
    // (the same email can be referred by multiple partners).
    let affiliateId: string | null = null
    if (order.affiliate_partner_code) {
      const { data: aff } = await admin
        .from('affiliates')
        .select('id')
        .eq('partner_code', order.affiliate_partner_code.toUpperCase())
        .eq('status', 'active')
        .maybeSingle()
      affiliateId = aff?.id ?? null
    }
    if (!affiliateId) return // organic / no attributable partner

    // Find this partner's referral for the buyer (workspace first, else email —
    // both scoped to the affiliate, so UNIQUE(affiliate_id, referred_email) makes
    // the lookup unambiguous).
    let referral: ReferralRow | null = null
    if (order.workspace_id) {
      const { data } = await admin
        .from('affiliate_referrals')
        .select('id, affiliate_id, status')
        .eq('affiliate_id', affiliateId)
        .eq('workspace_id', order.workspace_id)
        .in('status', ['lead', 'activated', 'paying'])
        .maybeSingle()
      referral = data ?? null
    }
    if (!referral) {
      const { data } = await admin
        .from('affiliate_referrals')
        .select('id, affiliate_id, status')
        .eq('affiliate_id', affiliateId)
        .eq('referred_email', email)
        .in('status', ['lead', 'activated', 'paying'])
        .maybeSingle()
      referral = data ?? null
    }

    // Self-sufficient: if checkout-completion attribution hasn't created the
    // referral yet (event-ordering race), create it now so the payment still
    // credits the partner. UNIQUE(affiliate_id, referred_email) keeps it safe.
    if (!referral) {
      await admin
        .from('affiliate_referrals')
        .insert({ affiliate_id: affiliateId, referred_email: email, status: 'lead' })
        .select('id')
        .maybeSingle()
      const { data: again } = await admin
        .from('affiliate_referrals')
        .select('id, affiliate_id, status')
        .eq('affiliate_id', affiliateId)
        .eq('referred_email', email)
        .in('status', ['lead', 'activated', 'paying'])
        .maybeSingle()
      referral = again ?? null
    }

    if (!referral) return

    await recordCommissionForReferral(admin, referral, invoice, {
      packageSlug: order.offer_slug,
      mrrAmount: invoice.amount_paid || null,
    })
  } catch (error) {
    safeError('[affiliate-commission] Unexpected error (funnel):', error)
  }
}

/**
 * Resolve the Stripe invoice id behind a charge (used for chargebacks, where the
 * dispute event only carries the charge id). Returns null if the charge has no
 * associated invoice or can't be retrieved.
 */
export async function resolveInvoiceIdForCharge(chargeId: string): Promise<string | null> {
  try {
    const stripe = getStripe()
    const charge = await stripe.charges.retrieve(chargeId)
    const invoice = (charge as Stripe.Charge).invoice
    return typeof invoice === 'string' ? invoice : invoice?.id ?? null
  } catch (error) {
    safeError('[affiliate-clawback] Failed to resolve invoice for charge:', error)
    return null
  }
}

/**
 * handleAffiliateClawback
 * Called from charge.refunded, charge.dispute.created (chargeback), and
 * invoice.voided / invoice.marked_uncollectible. Recovers the commission for an
 * invoice whose revenue was reversed. A clawback is NOT a churn — tier unaffected.
 *
 * For an already-PAID commission we attempt a real cash reversal
 * (`transfers.createReversal`) against the stored transfer so the money actually
 * comes back. If the partner's connected balance can't cover it (already paid
 * out), we fall back to an accounting carry-forward: a negative `pending`
 * commission that nets against their next payout (blocker B3).
 *
 * Idempotent: the UNIQUE(stripe_invoice_id) on `clawback_<invoiceId>` is the
 * lock — a duplicate refund/dispute/void webhook inserts nothing and we never
 * reverse earnings or cash twice.
 */
export async function handleAffiliateClawback(invoiceId: string): Promise<void> {
  try {
    const admin = createAdminClient()

    const { data: commission } = await admin
      .from('affiliate_commissions')
      .select('id, affiliate_id, referral_id, commission_amount, status, stripe_transfer_id')
      .eq('stripe_invoice_id', invoiceId)
      .maybeSingle()

    if (!commission) return

    // Never clawback the synthetic clawback rows themselves.
    if (commission.commission_amount < 0) return

    if (commission.status === 'pending') {
      // Not yet paid out — just void it so the cron never pays it.
      await admin.from('affiliate_commissions').update({ status: 'failed' }).eq('id', commission.id)
      safeLog(`[affiliate-clawback] Marked pending commission ${commission.id} as failed`)
      return
    }

    if (commission.status !== 'paid') return

    // Insert the negative clawback row FIRST — it is our idempotency lock
    // (UNIQUE(stripe_invoice_id) on `clawback_<invoiceId>`). Starts 'pending'
    // (carry-forward); promoted to 'reversed' below if we recover the cash.
    const { data: clawRow } = await admin
      .from('affiliate_commissions')
      .insert({
        affiliate_id: commission.affiliate_id,
        referral_id: commission.referral_id,
        stripe_invoice_id: `clawback_${invoiceId}`,
        invoice_amount: 0,
        commission_rate: 0,
        commission_amount: -commission.commission_amount,
        status: 'pending',
      })
      .select('id')
      .maybeSingle()

    if (!clawRow) {
      safeLog(`[affiliate-clawback] Duplicate clawback for invoice ${invoiceId} — already processed`)
      return
    }

    // Attempt to actually pull the cash back from the partner's connected balance.
    //
    // EARNINGS ACCOUNTING (must debit exactly once):
    //  - cash-reversed path: the negative row becomes terminal ('reversed') and is
    //    NEVER consumed by the cron, so we debit lifetime earnings explicitly here.
    //  - carry-forward path: the negative row stays 'pending' and the monthly cron
    //    nets it into a future transferAmount (which credits earnings by the NET),
    //    so we must NOT also debit earnings here — that would double-count.
    if (commission.stripe_transfer_id) {
      try {
        const stripe = getStripe()
        const reversal = await stripe.transfers.createReversal(
          commission.stripe_transfer_id,
          {
            amount: commission.commission_amount,
            metadata: {
              type: 'commission_clawback',
              commissionId: commission.id,
              affiliateId: commission.affiliate_id,
              invoiceId,
            },
          },
          // One reversal per commission, ever — a duplicate webhook can't double-reverse.
          { idempotencyKey: `reversal_${commission.id}` }
        )

        // Cash recovered → settle the negative row as 'reversed' (terminal) so it
        // does NOT also net against a future payout (which would double-claw).
        await admin
          .from('affiliate_commissions')
          .update({ status: 'reversed', stripe_transfer_id: reversal.id, paid_at: new Date().toISOString() })
          .eq('id', clawRow.id)

        // Debit lifetime earnings once (this row is terminal — cron won't net it).
        await admin.rpc('affiliate_add_earnings', {
          p_affiliate_id: commission.affiliate_id,
          p_delta: -commission.commission_amount,
        })

        safeLog(
          `[affiliate-clawback] Reversed $${(commission.commission_amount / 100).toFixed(2)} cash for commission ${commission.id}`
        )
        return
      } catch (revErr) {
        // Insufficient balance / already withdrawn — leave the negative row
        // 'pending' so it carries forward and nets against the next payout. Do NOT
        // touch earnings here; the cron's net credit accounts for it.
        safeError(
          `[affiliate-clawback] Cash reversal failed for commission ${commission.id} — carrying clawback forward:`,
          revErr
        )
      }
    }

    safeLog(`[affiliate-clawback] Created carry-forward clawback for paid commission ${commission.id}`)
  } catch (error) {
    safeError('[affiliate-clawback] Error:', error)
  }
}

/**
 * handleAffiliateChurn
 * Called from customer.subscription.deleted (service path). Marks the
 * workspace's referrals churned and decrements the partner's active-paying
 * count via RPC (which can demote their rate).
 */
export async function handleAffiliateChurn(workspaceId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.rpc('affiliate_record_churn', { p_workspace_id: workspaceId })
    if (error) {
      safeError('[affiliate-churn] RPC failed:', error)
      return
    }
    safeLog(`[affiliate-churn] Recorded churn for workspace ${workspaceId}`)
  } catch (error) {
    safeError('[affiliate-churn] Error:', error)
  }
}

/**
 * handleAffiliateFunnelChurn
 * Funnel path churn — matched by email when the buyer has no workspace. Marks
 * the referral churned and decrements the partner's active-paying count.
 */
export async function handleAffiliateFunnelChurn(order: {
  customer_email: string
  workspace_id: string | null
  affiliate_partner_code: string | null
}): Promise<void> {
  try {
    const admin = createAdminClient()
    if (!order.affiliate_partner_code) return

    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id')
      .eq('partner_code', order.affiliate_partner_code.toUpperCase())
      .maybeSingle()
    if (!affiliate) return

    const email = order.customer_email?.toLowerCase()

    // Find the specific paying referral for this partner+buyer.
    let query = admin
      .from('affiliate_referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'paying')
    query = order.workspace_id ? query.eq('workspace_id', order.workspace_id) : query.eq('referred_email', email)
    const { data: referral } = await query.maybeSingle()
    if (!referral) return

    // Atomic single-referral churn (locks affiliate, decrements, recomputes rate).
    await admin.rpc('affiliate_churn_referral', { p_referral_id: referral.id })
    safeLog(`[affiliate-churn] Recorded funnel churn for partner ${order.affiliate_partner_code}`)
  } catch (error) {
    safeError('[affiliate-churn] Funnel error:', error)
  }
}

/**
 * handleAffiliateStripeAccountUpdated
 * Called from account.updated webhook — marks onboarding complete.
 */
export async function handleAffiliateStripeAccountUpdated(account: Stripe.Account): Promise<void> {
  try {
    if (!account.charges_enabled) return
    const admin = createAdminClient()

    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, stripe_onboarding_complete')
      .eq('stripe_connect_account_id', account.id)
      .maybeSingle()

    if (affiliate && !affiliate.stripe_onboarding_complete) {
      await admin.from('affiliates').update({ stripe_onboarding_complete: true }).eq('id', affiliate.id)
      safeLog(`[affiliate-stripe] Marked onboarding complete for ${affiliate.id}`)
    }
  } catch (error) {
    safeError('[affiliate-stripe] account.updated error:', error)
  }
}
