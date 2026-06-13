/**
 * GET /api/cron/affiliate-payouts
 * Monthly affiliate payout processing — runs 1st of month at 10:00 UTC
 * Protected by CRON_SECRET bearer token
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { sendPartnerPayoutSummary } from '@/lib/email/affiliate-emails'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { clampTransferCents } from '@/lib/affiliate/guards'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

export const maxDuration = 60

const MIN_PAYOUT_CENTS = 5000 // $50
const STRIPE_TIMEOUT_MS = 15_000

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    timeout: STRIPE_TIMEOUT_MS,
  })
}

type PayoutAdminClient = ReturnType<typeof createAdminClient>

/**
 * Revert a claim (blocker B4): clear the claim key from any rows still holding it
 * and still pending, so they return to the selectable pool next run. Only touches
 * rows whose stripe_transfer_id is exactly the claim key — never a real transfer id.
 */
async function releaseClaim(
  admin: PayoutAdminClient,
  claimKey: string,
  commissionIds: string[],
  bonusIds: string[]
): Promise<void> {
  try {
    if (commissionIds.length > 0) {
      await admin
        .from('affiliate_commissions')
        .update({ stripe_transfer_id: null })
        .in('id', commissionIds)
        .eq('stripe_transfer_id', claimKey)
        .eq('status', 'pending')
    }
    if (bonusIds.length > 0) {
      await admin
        .from('affiliate_milestone_bonuses')
        .update({ stripe_transfer_id: null })
        .in('id', bonusIds)
        .eq('stripe_transfer_id', claimKey)
        .eq('status', 'pending')
    }
  } catch (err) {
    safeError(`[affiliate-payouts] Failed to release claim ${claimKey}:`, err)
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Auth check
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    processed: 0,
    transferred: 0,
    skipped_threshold: 0,
    skipped_no_stripe: 0,
    skipped_unsigned: 0,
    skipped_clamped: 0,
    errors: 0,
  }

  try {
    const admin = createAdminClient()
    const stripe = getStripe()

    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    const periodLabel = periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    // Fetch all pending commissions that have NOT yet been claimed/transferred.
    // The `stripe_transfer_id IS NULL` filter is half of the claim-before-transfer
    // guard (blocker B4): a row whose transfer succeeded but whose "mark paid"
    // write was dropped keeps its claim key in stripe_transfer_id and is excluded
    // here, so it can never be re-paid.
    const { data: pendingCommissions } = await admin
      .from('affiliate_commissions')
      .select('id, affiliate_id, commission_amount')
      .eq('status', 'pending')
      .is('stripe_transfer_id', null)

    // Fetch all pending, unclaimed milestone bonuses
    const { data: pendingBonuses } = await admin
      .from('affiliate_milestone_bonuses')
      .select('id, affiliate_id, bonus_amount')
      .eq('status', 'pending')
      .is('stripe_transfer_id', null)

    // Group by affiliate_id
    const byAffiliate = new Map<string, {
      commissionIds: string[]
      bonusIds: string[]
      total: number
    }>()

    for (const c of pendingCommissions || []) {
      const existing = byAffiliate.get(c.affiliate_id) || { commissionIds: [], bonusIds: [], total: 0 }
      existing.commissionIds.push(c.id)
      existing.total += c.commission_amount
      byAffiliate.set(c.affiliate_id, existing)
    }

    for (const b of pendingBonuses || []) {
      const existing = byAffiliate.get(b.affiliate_id) || { commissionIds: [], bonusIds: [], total: 0 }
      existing.bonusIds.push(b.id)
      existing.total += b.bonus_amount
      byAffiliate.set(b.affiliate_id, existing)
    }

    // Process each affiliate
    for (const [affiliateId, { commissionIds, bonusIds, total }] of byAffiliate) {
      results.processed++

      // Claim key doubles as the Stripe transfer idempotency key AND the in-DB
      // claim marker (blocker B4). Stable per affiliate per payout period (YYYY-MM).
      const claimKey = `payout_${affiliateId}_${periodStart.toISOString().slice(0, 7)}`

      try {
        // Pre-filter on the grouped (carry-forward-netted) total so a partner whose
        // net is below threshold or ≤ 0 is skipped without churn. Negatives stay
        // pending and carry forward to next month (blocker B3).
        const clampedGroupTotal = clampTransferCents(total)
        if (clampedGroupTotal < MIN_PAYOUT_CENTS) {
          if (total <= 0) {
            results.skipped_clamped++
            safeLog(`[affiliate-payouts] Skipping ${affiliateId} — non-positive net ($${(total / 100).toFixed(2)}), carried forward`)
          } else {
            results.skipped_threshold++
            safeLog(`[affiliate-payouts] Skipping ${affiliateId} — below threshold ($${(total / 100).toFixed(2)})`)
          }
          continue
        }

        // Fetch affiliate details
        const { data: affiliate } = await admin
          .from('affiliates')
          .select('id, email, first_name, stripe_connect_account_id, stripe_onboarding_complete, agreement_accepted_at, status')
          .eq('id', affiliateId)
          .maybeSingle()

        if (!affiliate) continue

        // Never pay out before the partner has signed the agreement, or if their
        // account isn't active. Commissions stay pending until then.
        if (!affiliate.agreement_accepted_at || affiliate.status !== 'active') {
          results.skipped_unsigned++
          safeLog(`[affiliate-payouts] Skipping ${affiliateId} — unsigned agreement or inactive`)
          continue
        }

        if (!affiliate.stripe_onboarding_complete || !affiliate.stripe_connect_account_id) {
          // Record pending payout — no transfer, no claim yet (rows stay payable).
          await admin.from('affiliate_payouts').insert({
            affiliate_id: affiliateId,
            amount: clampedGroupTotal,
            status: 'pending',
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
          })
          results.skipped_no_stripe++
          continue
        }

        // ── CLAIM (atomic CAS) ────────────────────────────────────────────────
        // Mark the rows as claimed BEFORE transferring by stamping the claim key
        // into stripe_transfer_id, but only while still pending+unclaimed. The
        // RETURNING set is the authoritative list of what we actually own; we
        // recompute the total from it so a row claimed by a parallel run is excluded.
        const claimedCommissionIds: string[] = []
        const claimedPositiveCommissionIds: string[] = []
        const claimedNegativeCommissionIds: string[] = []
        const claimedBonusIds: string[] = []
        let claimedTotal = 0

        if (commissionIds.length > 0) {
          const { data: claimed } = await admin
            .from('affiliate_commissions')
            .update({ stripe_transfer_id: claimKey })
            .in('id', commissionIds)
            .eq('status', 'pending')
            .is('stripe_transfer_id', null)
            .select('id, commission_amount')
          for (const r of claimed || []) {
            claimedCommissionIds.push(r.id)
            claimedTotal += r.commission_amount
            // Negative rows are consumed carry-forward clawbacks — settle them to a
            // terminal 'reversed' state, not 'paid', so they never re-net or pollute
            // paid-this-month reporting.
            if (r.commission_amount < 0) claimedNegativeCommissionIds.push(r.id)
            else claimedPositiveCommissionIds.push(r.id)
          }
        }

        if (bonusIds.length > 0) {
          const { data: claimed } = await admin
            .from('affiliate_milestone_bonuses')
            .update({ stripe_transfer_id: claimKey })
            .in('id', bonusIds)
            .eq('status', 'pending')
            .is('stripe_transfer_id', null)
            .select('id, bonus_amount')
          for (const r of claimed || []) {
            claimedBonusIds.push(r.id)
            claimedTotal += r.bonus_amount
          }
        }

        const transferAmount = clampTransferCents(claimedTotal)

        // Nothing claimable (already claimed elsewhere) or net fell below threshold
        // after claiming → release the claim so the rows carry forward, and skip.
        if (transferAmount < MIN_PAYOUT_CENTS) {
          await releaseClaim(admin, claimKey, claimedCommissionIds, claimedBonusIds)
          if (claimedCommissionIds.length === 0 && claimedBonusIds.length === 0) {
            safeLog(`[affiliate-payouts] Nothing to claim for ${affiliateId} (already claimed) — skipping`)
          } else {
            results.skipped_clamped++
            safeLog(`[affiliate-payouts] Claimed net below threshold for ${affiliateId} ($${(claimedTotal / 100).toFixed(2)}) — released, carried forward`)
          }
          continue
        }

        // ── TRANSFER ──────────────────────────────────────────────────────────
        // Idempotency key == claim key, so a cron retry within the 24h window can
        // never pay the same affiliate twice for the same period.
        let transfer: Stripe.Transfer
        try {
          transfer = await stripe.transfers.create(
            {
              amount: transferAmount,
              currency: 'usd',
              destination: affiliate.stripe_connect_account_id,
              metadata: {
                affiliateId,
                period: periodLabel,
                commissionIds: claimedCommissionIds.join(','),
                bonusIds: claimedBonusIds.join(','),
              },
            },
            { idempotencyKey: claimKey }
          )
        } catch (transferErr) {
          // Transfer failed → revert the claim so the rows are retried next run.
          await releaseClaim(admin, claimKey, claimedCommissionIds, claimedBonusIds)
          safeError(`[affiliate-payouts] Transfer failed for ${affiliateId} — claim reverted:`, transferErr)
          results.errors++
          continue
        }

        // ── SETTLE ────────────────────────────────────────────────────────────
        // Promote the claimed rows (matched by the claim key) to paid with the real
        // transfer id. If any write fails, the rows STAY claimed (excluded from
        // next month) — never re-paid — and we alert for manual reconciliation.
        let dbWritesFailed = false

        if (claimedPositiveCommissionIds.length > 0) {
          try {
            await admin
              .from('affiliate_commissions')
              .update({ status: 'paid', stripe_transfer_id: transfer.id, paid_at: now.toISOString() })
              .eq('stripe_transfer_id', claimKey)
              .in('id', claimedPositiveCommissionIds)
          } catch (dbErr) {
            dbWritesFailed = true
            safeError(`[affiliate-payouts] CRITICAL: Failed to mark commissions paid for ${affiliateId} (transfer ${transfer.id}):`, dbErr)
          }
        }

        // Consumed negative carry-forward clawbacks → terminal 'reversed'.
        if (claimedNegativeCommissionIds.length > 0) {
          try {
            await admin
              .from('affiliate_commissions')
              .update({ status: 'reversed', stripe_transfer_id: transfer.id, paid_at: now.toISOString() })
              .eq('stripe_transfer_id', claimKey)
              .in('id', claimedNegativeCommissionIds)
          } catch (dbErr) {
            dbWritesFailed = true
            safeError(`[affiliate-payouts] CRITICAL: Failed to settle clawback rows for ${affiliateId} (transfer ${transfer.id}):`, dbErr)
          }
        }

        if (claimedBonusIds.length > 0) {
          try {
            await admin
              .from('affiliate_milestone_bonuses')
              .update({ status: 'paid', stripe_transfer_id: transfer.id, paid_at: now.toISOString() })
              .eq('stripe_transfer_id', claimKey)
              .in('id', claimedBonusIds)
          } catch (dbErr) {
            dbWritesFailed = true
            safeError(`[affiliate-payouts] CRITICAL: Failed to mark bonuses paid for ${affiliateId} (transfer ${transfer.id}):`, dbErr)
          }
        }

        // Update total earnings atomically (col = col + delta; race-safe).
        try {
          await admin.rpc('affiliate_add_earnings', { p_affiliate_id: affiliateId, p_delta: transferAmount })
        } catch (dbErr) {
          dbWritesFailed = true
          safeError(`[affiliate-payouts] CRITICAL: Failed to update total_earnings for ${affiliateId} (transfer ${transfer.id}):`, dbErr)
        }

        // Record payout
        try {
          await admin.from('affiliate_payouts').insert({
            affiliate_id: affiliateId,
            amount: transferAmount,
            stripe_payout_id: transfer.id,
            status: 'paid',
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
          })
        } catch (dbErr) {
          dbWritesFailed = true
          safeError(`[affiliate-payouts] CRITICAL: Failed to insert payout record for ${affiliateId} (transfer ${transfer.id}):`, dbErr)
        }

        // Alert if any DB write failed — manual reconciliation required
        if (dbWritesFailed) {
          await sendSlackAlert({
            type: 'system_event',
            severity: 'critical',
            message: `MANUAL RECONCILIATION REQUIRED: Stripe transfer succeeded but DB record write failed for affiliate ${affiliateId}`,
            metadata: {
              affiliate_id: affiliateId,
              affiliate_email: affiliate.email,
              stripe_transfer_id: transfer.id,
              claim_key: claimKey,
              amount_cents: String(transferAmount),
              period: periodLabel,
              commission_ids: claimedCommissionIds.join(','),
              bonus_ids: claimedBonusIds.join(','),
            },
          }).catch((alertErr) => safeError('[affiliate-payouts] Failed to send reconciliation alert:', alertErr))
        }

        // Send payout email (non-blocking)
        sendPartnerPayoutSummary(
          affiliate.email,
          affiliate.first_name,
          transferAmount,
          periodLabel
        ).catch((err) => safeError('[affiliate-payouts] Payout email failed:', err))

        results.transferred++
        safeLog(`[affiliate-payouts] Transferred $${(transferAmount / 100).toFixed(2)} to ${affiliate.email}`)
      } catch (err) {
        safeError(`[affiliate-payouts] Error processing ${affiliateId}:`, err)
        results.errors++
      }
    }

    return NextResponse.json({
      success: true,
      period: periodLabel,
      ...results,
    })
  } catch (error) {
    safeError('[affiliate-payouts] Fatal error:', error)
    return NextResponse.json({ error: 'Cron failed', ...results }, { status: 500 })
  }
}
