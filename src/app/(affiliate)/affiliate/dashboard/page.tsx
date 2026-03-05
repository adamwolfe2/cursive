/**
 * /affiliate/dashboard — Affiliate partner dashboard
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AffiliateDashboardClient } from './dashboard-client'

export default async function AffiliateDashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const admin = createAdminClient()

  // Get affiliate
  let affiliate: any = null
  const { data: byUserId } = await admin
    .from('affiliates')
    .select('*')
    .eq('user_id', authUser.id)
    .maybeSingle()
  affiliate = byUserId

  if (!affiliate) {
    const { data: byEmail } = await admin
      .from('affiliates')
      .select('*')
      .eq('email', authUser.email?.toLowerCase() || '')
      .maybeSingle()
    affiliate = byEmail
  }

  if (!affiliate) redirect('/affiliates/apply')

  // Fetch data in parallel
  const [referralsRes, commissionsRes, milestonesRes, payoutsRes] = await Promise.all([
    admin
      .from('affiliate_referrals')
      .select('id, referred_email, status, activated_at, attributed_at')
      .eq('affiliate_id', affiliate.id)
      .order('attributed_at', { ascending: false })
      .limit(5),
    admin
      .from('affiliate_commissions')
      .select('id, invoice_amount, commission_rate, commission_amount, status, created_at')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('affiliate_milestone_bonuses')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('tier', { ascending: true }),
    admin
      .from('affiliate_commissions')
      .select('commission_amount')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'pending'),
  ])

  const pendingCommissions = payoutsRes.data || []
  const pendingMilestonesRes = await admin
    .from('affiliate_milestone_bonuses')
    .select('bonus_amount')
    .eq('affiliate_id', affiliate.id)
    .eq('status', 'pending')

  const pendingAmount =
    pendingCommissions.reduce((sum: number, c: any) => sum + c.commission_amount, 0) +
    (pendingMilestonesRes.data || []).reduce((sum: number, m: any) => sum + m.bonus_amount, 0)

  return (
    <AffiliateDashboardClient
      affiliate={affiliate}
      recentReferrals={referralsRes.data || []}
      recentCommissions={commissionsRes.data || []}
      milestones={milestonesRes.data || []}
      pendingAmount={pendingAmount}
    />
  )
}
