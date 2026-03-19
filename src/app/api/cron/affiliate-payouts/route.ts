/**
 * GET /api/cron/affiliate-payouts
 * Monthly affiliate payout processing — runs 1st of month at 10:00 UTC
 * Protected by CRON_SECRET bearer token
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { sendPartnerPayoutSummary } from '@/lib/email/affiliate-emails'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { timingSafeEqual } from '@/lib/utils/crypto'

const MIN_PAYOUT_CENTS = 5000 // $50

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
  })
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Auth check
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !authHeader || !timingSafeEqual(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    processed: 0,
    transferred: 0,
    skipped_threshold: 0,
    skipped_no_stripe: 0,
    errors: 0,
  }

  try {
    const admin = createAdminClient()
    const stripe = getStripe()

    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    const periodLabel = periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    // Fetch all pending commissions
    const { data: pendingCommissions } = await admin
      .from('affiliate_commissions')
      .select('id, affiliate_id, commission_amount')
      .eq('status', 'pending')

    // Fetch all pending milestone bonuses
    const { data: pendingBonuses } = await admin
      .from('affiliate_milestone_bonuses')
      .select('id, affiliate_id, bonus_amount')
      .eq('status', 'pending')

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

      try {
        if (total < MIN_PAYOUT_CENTS) {
          results.skipped_threshold++
          safeLog(`[affiliate-payouts] Skipping ${affiliateId} — below threshold ($${(total / 100).toFixed(2)})`)
          continue
        }

        // Fetch affiliate details
        const { data: affiliate } = await admin
          .from('affiliates')
          .select('id, email, first_name, stripe_connect_account_id, stripe_onboarding_complete')
          .eq('id', affiliateId)
          .maybeSingle()

        if (!affiliate) continue

        if (!affiliate.stripe_onboarding_complete || !affiliate.stripe_connect_account_id) {
          // Record pending payout — no transfer yet
          await admin.from('affiliate_payouts').insert({
            affiliate_id: affiliateId,
            amount: total,
            status: 'pending',
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
          })
          results.skipped_no_stripe++
          continue
        }

        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: total,
          currency: 'usd',
          destination: affiliate.stripe_connect_account_id,
          metadata: {
            affiliateId,
            period: periodLabel,
            commissionIds: commissionIds.join(','),
            bonusIds: bonusIds.join(','),
          },
        })

        // Mark commissions paid
        if (commissionIds.length > 0) {
          await admin
            .from('affiliate_commissions')
            .update({
              status: 'paid',
              stripe_transfer_id: transfer.id,
              paid_at: now.toISOString(),
            })
            .in('id', commissionIds)
        }

        // Mark bonuses paid
        if (bonusIds.length > 0) {
          await admin
            .from('affiliate_milestone_bonuses')
            .update({
              status: 'paid',
              stripe_transfer_id: transfer.id,
              paid_at: now.toISOString(),
            })
            .in('id', bonusIds)
        }

        // Update total earnings (direct update — avoid RPC that may not exist)
        const { data: currentAffiliate } = await admin.from('affiliates').select('total_earnings').eq('id', affiliateId).single()
        if (currentAffiliate) {
          await admin.from('affiliates').update({ total_earnings: (currentAffiliate.total_earnings || 0) + total }).eq('id', affiliateId)
        }

        // Record payout
        await admin.from('affiliate_payouts').insert({
          affiliate_id: affiliateId,
          amount: total,
          stripe_payout_id: transfer.id,
          status: 'paid',
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
        })

        // Send payout email (non-blocking)
        sendPartnerPayoutSummary(
          affiliate.email,
          affiliate.first_name,
          total,
          periodLabel
        ).catch((err) => safeError('[affiliate-payouts] Payout email failed:', err))

        results.transferred++
        safeLog(`[affiliate-payouts] Transferred $${(total / 100).toFixed(2)} to ${affiliate.email}`)
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
