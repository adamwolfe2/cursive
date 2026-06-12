/**
 * Partner Portal — server-side data access.
 *
 * Resolves the affiliate record for the signed-in user (auto-linking by email
 * the first time they log in after approval) and builds the aggregate summary
 * the portal renders: live rate, active payers, MRR driven, balances, next-tier
 * progress, payout schedule, and onboarding/agreement status.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { rampRate, nextTier, currentTier, MAX_RATE, type NextTierInfo } from '@/lib/affiliate/ramp'
import { safeError } from '@/lib/utils/log-sanitizer'

type AdminClient = ReturnType<typeof createAdminClient>

export interface AffiliateRecord {
  id: string
  email: string
  first_name: string
  last_name: string
  partner_code: string
  status: string
  active_paying_referrals: number
  lifetime_paying_referrals: number
  current_commission_rate: number
  total_earnings: number
  stripe_connect_account_id: string | null
  stripe_onboarding_complete: boolean
  agreement_accepted_at: string | null
  agreement_version: string | null
  created_at: string
}

const AFFILIATE_COLUMNS =
  'id, email, first_name, last_name, partner_code, status, active_paying_referrals, lifetime_paying_referrals, current_commission_rate, total_earnings, stripe_connect_account_id, stripe_onboarding_complete, agreement_accepted_at, agreement_version, created_at'

/**
 * Resolve the affiliate for an authenticated user. Links the affiliate row to
 * the auth user (by matching a VERIFIED email) on first access.
 *
 * SECURITY: the email auto-link is the claim mechanism for a partner account,
 * so it is hardened against takeover:
 *   - the email must be confirmed (emailConfirmed) — an unverified signup with
 *     someone else's email cannot claim their partner record.
 *   - the link is one-time: we only set user_id when it is currently NULL
 *     (`.is('user_id', null)`). An already-claimed affiliate can never be
 *     re-bound to a different auth user.
 */
export async function getAffiliateForUser(
  authUserId: string,
  email: string | null | undefined,
  emailConfirmed = false
): Promise<AffiliateRecord | null> {
  const admin = createAdminClient()

  const { data: byUser } = await admin
    .from('affiliates')
    .select(AFFILIATE_COLUMNS)
    .eq('user_id', authUserId)
    .maybeSingle()

  if (byUser) return byUser as AffiliateRecord

  const lower = email?.toLowerCase()
  if (!lower || !emailConfirmed) return null

  const { data: byEmail } = await admin
    .from('affiliates')
    .select('id, user_id')
    .eq('email', lower)
    .maybeSingle()

  if (!byEmail) return null

  // Already claimed by a different auth user → deny (never re-bind).
  if (byEmail.user_id && byEmail.user_id !== authUserId) return null

  // First login after approval — claim the row, but only if still unclaimed.
  const { data: linked } = await admin
    .from('affiliates')
    .update({ user_id: authUserId })
    .eq('id', byEmail.id)
    .is('user_id', null)
    .select(AFFILIATE_COLUMNS)
    .maybeSingle()

  // If the conditional update matched nothing, re-read (race: claimed in parallel).
  if (linked) return linked as AffiliateRecord

  const { data: reread } = await admin
    .from('affiliates')
    .select(AFFILIATE_COLUMNS)
    .eq('id', byEmail.id)
    .eq('user_id', authUserId)
    .maybeSingle()

  return (reread as AffiliateRecord) ?? null
}

export interface PortalSummary {
  rate: number
  isMaxTier: boolean
  tierLabel: string
  next: NextTierInfo | null
  activePaying: number
  lifetimePaying: number
  counts: { leads: number; paying: number; churned: number; total: number }
  clicks: number
  signups: number
  conversions: number
  ctr: number // signups / clicks, %
  conversionRate: number // paying / signups, %
  mrrDrivenCents: number
  lifetimeEarningsCents: number
  pendingBalanceCents: number
  paidThisMonthCents: number
  nextPayoutDateISO: string
  signed: boolean
  stripeOnboarded: boolean
  payoutEligible: boolean
}

function startOfThisMonthISO(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

function firstOfNextMonthISO(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 10, 0, 0)).toISOString()
}

/**
 * Build the aggregate portal summary. `now` is injected for testability.
 */
export async function buildPortalSummary(
  affiliate: AffiliateRecord,
  now: Date = new Date()
): Promise<PortalSummary> {
  const admin: AdminClient = createAdminClient()

  const [referralsRes, pendingRes, paidThisMonthRes, clicksRes] = await Promise.all([
    admin
      .from('affiliate_referrals')
      .select('status, mrr_amount')
      .eq('affiliate_id', affiliate.id),
    admin
      .from('affiliate_commissions')
      .select('commission_amount')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'pending'),
    admin
      .from('affiliate_commissions')
      .select('commission_amount')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'paid')
      .gte('paid_at', startOfThisMonthISO(now)),
    admin
      .from('affiliate_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliate.id),
  ])

  const referrals = referralsRes.data || []
  const counts = { leads: 0, paying: 0, churned: 0, total: referrals.length }
  let mrrDrivenCents = 0
  for (const r of referrals) {
    if (r.status === 'paying') {
      counts.paying++
      mrrDrivenCents += r.mrr_amount || 0
    } else if (r.status === 'churned') counts.churned++
    else counts.leads++
  }

  const pendingBalanceCents = (pendingRes.data || []).reduce((s, c) => s + (c.commission_amount || 0), 0)
  const paidThisMonthCents = (paidThisMonthRes.data || []).reduce((s, c) => s + (c.commission_amount || 0), 0)

  const clicks = clicksRes.count || 0
  const signups = counts.total
  const conversions = counts.paying
  const ctr = clicks > 0 ? Math.round((signups / clicks) * 1000) / 10 : 0
  const conversionRate = signups > 0 ? Math.round((conversions / signups) * 1000) / 10 : 0

  const activePaying = affiliate.active_paying_referrals || 0
  // Prefer stored rate but reconcile against the ramp (defensive).
  const rate = affiliate.current_commission_rate || rampRate(activePaying)

  return {
    rate,
    isMaxTier: rate >= MAX_RATE,
    tierLabel: currentTier(activePaying).label,
    next: nextTier(activePaying),
    activePaying,
    lifetimePaying: affiliate.lifetime_paying_referrals || 0,
    counts,
    clicks,
    signups,
    conversions,
    ctr,
    conversionRate,
    mrrDrivenCents,
    lifetimeEarningsCents: affiliate.total_earnings || 0,
    pendingBalanceCents,
    paidThisMonthCents,
    nextPayoutDateISO: firstOfNextMonthISO(now),
    signed: !!affiliate.agreement_accepted_at,
    stripeOnboarded: affiliate.stripe_onboarding_complete,
    payoutEligible: !!affiliate.agreement_accepted_at && affiliate.stripe_onboarding_complete,
  }
}

/** Safe wrapper for route handlers — returns null instead of throwing. */
export async function tryBuildPortalSummary(affiliate: AffiliateRecord): Promise<PortalSummary | null> {
  try {
    return await buildPortalSummary(affiliate)
  } catch (error) {
    safeError('[affiliate-portal] buildPortalSummary failed:', error)
    return null
  }
}
