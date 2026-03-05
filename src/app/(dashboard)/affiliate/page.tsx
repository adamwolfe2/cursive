/**
 * Partner Hub — /affiliate
 *
 * Shows affiliate stats, tier progress, referrals table, and commissions
 * for users who are part of the affiliate program.
 *
 * Non-affiliates see a "Join Partner Program" CTA.
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PartnerHubClient } from './partner-hub-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Partner Hub | Cursive',
}

export default async function AffiliatePage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) return null

  const admin = createAdminClient()

  // Look up affiliate record
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, email, first_name, partner_code, status, stripe_onboarding_complete, total_activations, current_tier, free_months_earned, total_earnings, agreement_accepted_at')
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (!affiliate || !affiliate.agreement_accepted_at || affiliate.status === 'terminated') {
    return (
      <Suspense fallback={null}>
        <PartnerHubClient affiliate={null} referrals={[]} commissions={[]} milestones={[]} />
      </Suspense>
    )
  }

  // Fetch referrals and commissions in parallel
  const [referralsRes, commissionsRes, milestonesRes] = await Promise.all([
    admin
      .from('affiliate_referrals')
      .select('id, referred_email, status, attributed_at, activated_at')
      .eq('affiliate_id', affiliate.id)
      .order('attributed_at', { ascending: false })
      .limit(50),
    admin
      .from('affiliate_commissions')
      .select('id, invoice_amount, commission_rate, commission_amount, status, created_at')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('affiliate_milestone_bonuses')
      .select('id, tier, bonus_amount, status, created_at')
      .eq('affiliate_id', affiliate.id)
      .order('tier', { ascending: true }),
  ])

  return (
    <Suspense fallback={null}>
      <PartnerHubClient
        affiliate={affiliate}
        referrals={referralsRes.data || []}
        commissions={commissionsRes.data || []}
        milestones={milestonesRes.data || []}
      />
    </Suspense>
  )
}
