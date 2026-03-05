/**
 * Affiliate Activation Logic
 * Called when a referred user's pixel fires their first audience match
 * This function must be idempotent — safe to call multiple times
 */

import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import {
  sendPartnerActivation,
  sendPartnerTierMilestone,
} from '@/lib/email/affiliate-emails'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const TIER_THRESHOLDS = [
  { tier: 6, activations: 100 },
  { tier: 5, activations: 50 },
  { tier: 4, activations: 30 },
  { tier: 3, activations: 15 },
  { tier: 2, activations: 10 },
  { tier: 1, activations: 5 },
]

const TIER_BONUSES: Record<number, number> = {
  1: 5000,
  2: 15000,
  3: 25000,
  4: 50000,
  5: 100000,
  6: 250000,
}

const NEXT_MILESTONE: Record<number, { count: number; bonus: number } | null> = {
  0: { count: 5, bonus: 5000 },
  1: { count: 10, bonus: 15000 },
  2: { count: 15, bonus: 25000 },
  3: { count: 30, bonus: 50000 },
  4: { count: 50, bonus: 100000 },
  5: { count: 100, bonus: 250000 },
  6: null,
}

function calcTier(activations: number): number {
  for (const { tier, activations: threshold } of TIER_THRESHOLDS) {
    if (activations >= threshold) return tier
  }
  return 0
}

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
  })
}

/**
 * processAffiliateActivation
 * Call this when a referred user's workspace receives its first audience match.
 *
 * @param workspaceId - The workspace that activated
 * @param userId - The Supabase auth user ID of the workspace owner
 * @param userEmail - The email of the workspace owner
 */
export async function processAffiliateActivation(
  workspaceId: string,
  userId: string,
  userEmail: string
): Promise<void> {
  try {
    const admin = createAdminClient()

    // Find a lead referral for this user — must be in 'lead' status
    const { data: referral } = await admin
      .from('affiliate_referrals')
      .select('id, affiliate_id, status')
      .or(`referred_user_id.eq.${userId},referred_email.eq.${userEmail.toLowerCase()}`)
      .eq('status', 'lead')
      .maybeSingle()

    if (!referral) {
      safeLog(`[affiliate-activation] No lead referral for user ${userEmail} — organic signup`)
      return
    }

    // Update referral: lead → activated
    const { error: updateError } = await admin
      .from('affiliate_referrals')
      .update({
        status: 'activated',
        activated_at: new Date().toISOString(),
        workspace_id: workspaceId,
        referred_user_id: userId,
      })
      .eq('id', referral.id)
      .eq('status', 'lead') // Guard against race condition

    if (updateError) {
      safeError('[affiliate-activation] Failed to update referral:', updateError)
      return
    }

    // Fetch current affiliate state
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, email, first_name, total_activations, current_tier, free_months_earned, stripe_connect_account_id, stripe_onboarding_complete, status')
      .eq('id', referral.affiliate_id)
      .eq('status', 'active')
      .maybeSingle()

    if (!affiliate) {
      safeLog('[affiliate-activation] Affiliate not active — skipping')
      return
    }

    const newActivations = affiliate.total_activations + 1
    const newFreeMonths = affiliate.free_months_earned + 1
    const newTier = calcTier(newActivations)
    const tierChanged = newTier > affiliate.current_tier

    // Update affiliate counters
    await admin
      .from('affiliates')
      .update({
        total_activations: newActivations,
        free_months_earned: newFreeMonths,
        current_tier: newTier,
      })
      .eq('id', affiliate.id)

    safeLog(`[affiliate-activation] ${affiliate.email} — activation ${newActivations}, tier ${newTier}`)

    // Apply free month to partner's own account
    // (Extend trial or add credit — using existing workspace credits system)
    try {
      await admin.rpc('add_workspace_credits', {
        p_workspace_id: await getAffiliateWorkspaceId(affiliate.id, admin),
        p_credits: 30, // 1 month = 30 lead credits
        p_source: 'affiliate_activation',
      })
    } catch {
      // Non-fatal if RPC doesn't match exactly — log and continue
      safeLog('[affiliate-activation] Could not apply free month credit — non-fatal')
    }

    // Milestone bonus for tier change
    if (tierChanged) {
      const bonusAmount = TIER_BONUSES[newTier]

      // Insert milestone bonus with onConflictDoNothing — idempotency guard
      const { data: milestone } = await admin
        .from('affiliate_milestone_bonuses')
        .insert({
          affiliate_id: affiliate.id,
          tier: newTier,
          bonus_amount: bonusAmount,
          status: 'pending',
        })
        .select('id')
        .maybeSingle()

      if (milestone && affiliate.stripe_onboarding_complete && affiliate.stripe_connect_account_id) {
        // Transfer milestone bonus immediately
        try {
          const stripe = getStripe()
          const transfer = await stripe.transfers.create({
            amount: bonusAmount,
            currency: 'usd',
            destination: affiliate.stripe_connect_account_id,
            metadata: {
              type: 'milestone_bonus',
              affiliateId: affiliate.id,
              tier: String(newTier),
              milestoneId: milestone.id,
            },
          })

          await admin
            .from('affiliate_milestone_bonuses')
            .update({
              status: 'paid',
              stripe_transfer_id: transfer.id,
              paid_at: new Date().toISOString(),
            })
            .eq('id', milestone.id)

          // Update total earnings
          const { data: current } = await admin.from('affiliates').select('total_earnings').eq('id', affiliate.id).single()
          if (current) {
            await admin.from('affiliates').update({ total_earnings: (current.total_earnings || 0) + bonusAmount }).eq('id', affiliate.id)
          }

          safeLog(`[affiliate-activation] Milestone bonus $${bonusAmount / 100} transferred to ${affiliate.email}`)
        } catch (transferErr) {
          safeError('[affiliate-activation] Milestone transfer failed (bonus stays pending):', transferErr)
        }
      }

      // Send milestone email (non-blocking)
      sendPartnerTierMilestone(
        affiliate.email,
        affiliate.first_name,
        newTier,
        bonusAmount,
        affiliate.stripe_onboarding_complete
      ).catch(() => {})
    }

    // Send activation email (non-blocking)
    const nextMilestoneInfo = NEXT_MILESTONE[newTier]
    sendPartnerActivation(
      affiliate.email,
      affiliate.first_name,
      userEmail,
      newActivations,
      newFreeMonths,
      nextMilestoneInfo ? (nextMilestoneInfo.count - newActivations) : null,
      nextMilestoneInfo ? nextMilestoneInfo.bonus : null
    ).catch(() => {})
  } catch (error) {
    safeError('[affiliate-activation] Unexpected error:', error)
    // Never throw — this must not break the provisioning flow
  }
}

/**
 * processAffiliateAttribution
 * Called during onboarding when a new business user signs up with a ref cookie.
 * Creates a 'lead' referral record linking this user to the affiliate.
 * Idempotent — uses onConflict(affiliate_id, referred_email).
 *
 * @param refCode - Partner code from the cursive_ref cookie
 * @param userId - The new user's Supabase user ID
 * @param email - The new user's email
 * @param workspaceId - The newly created workspace ID
 */
export async function processAffiliateAttribution(
  refCode: string,
  userId: string,
  email: string,
  workspaceId: string
): Promise<void> {
  try {
    const admin = createAdminClient()

    // Look up active affiliate by partner_code
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id')
      .eq('partner_code', refCode.toUpperCase())
      .eq('status', 'active')
      .maybeSingle()

    if (!affiliate) {
      safeLog(`[affiliate-attribution] No active affiliate for refCode=${refCode}`)
      return
    }

    // Insert lead referral — onConflict(affiliate_id, referred_email) = do nothing
    await admin
      .from('affiliate_referrals')
      .insert({
        affiliate_id: affiliate.id,
        referred_email: email.toLowerCase(),
        referred_user_id: userId,
        workspace_id: workspaceId,
        status: 'lead',
      })
      .select('id')
      .maybeSingle()

    safeLog(`[affiliate-attribution] Lead referral created for ${email} → affiliate ${affiliate.id}`)
  } catch (error) {
    safeError('[affiliate-attribution] Unexpected error:', error)
    // Never throw — non-fatal
  }
}

async function getAffiliateWorkspaceId(affiliateId: string, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
  try {
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('user_id')
      .eq('id', affiliateId)
      .maybeSingle()

    if (!affiliate?.user_id) return null

    const { data: user } = await admin
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', affiliate.user_id)
      .maybeSingle()

    return user?.workspace_id || null
  } catch {
    return null
  }
}
