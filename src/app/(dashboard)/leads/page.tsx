/**
 * Daily Leads Dashboard
 * Shows leads delivered daily
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DailyLeadsView } from '@/components/leads/daily-leads-view'

export default async function DailyLeadsPage() {
  const supabase = await createClient()

  // Get authenticated user (getUser validates the JWT server-side, more reliable than getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile with segment info
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, workspace_id, industry_segment, location_segment, daily_lead_limit, plan')
    .eq('auth_user_id', user.id)
    .single()

  if (!userProfile?.workspace_id) {
    redirect('/welcome')
  }

  // Parallelize all lead queries
  const today = new Date().toISOString().split('T')[0]
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const weekStart = startOfWeek.toISOString().split('T')[0]
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  const monthStart = startOfMonth.toISOString().split('T')[0]

  const [todaysLeadsResult, weekCountResult, monthCountResult] = await Promise.all([
    // Today's leads (need full data for display)
    supabase
      .from('leads')
      .select('id, first_name, last_name, full_name, email, phone, company_name, company_domain, job_title, city, state, country, delivered_at, intent_score_calculated, freshness_score, enrichment_status, verification_status, status, tags, source', { count: 'exact' })
      .eq('workspace_id', userProfile.workspace_id)
      .gte('delivered_at', `${today}T00:00:00`)
      .lte('delivered_at', `${today}T23:59:59`)
      .order('delivered_at', { ascending: false }),
    // This week's count (head-only)
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', userProfile.workspace_id)
      .gte('delivered_at', `${weekStart}T00:00:00`),
    // This month's count (head-only)
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', userProfile.workspace_id)
      .gte('delivered_at', `${monthStart}T00:00:00`),
  ])

  const todaysLeads = todaysLeadsResult.data
  const count = todaysLeadsResult.count
  const weekCount = weekCountResult.count
  const monthCount = monthCountResult.count

  return (
    <DailyLeadsView
      leads={todaysLeads || []}
      todayCount={count || 0}
      weekCount={weekCount || 0}
      monthCount={monthCount || 0}
      dailyLimit={userProfile.daily_lead_limit || 10}
      plan={userProfile.plan || 'free'}
      industrySegment={userProfile.industry_segment}
      locationSegment={userProfile.location_segment}
    />
  )
}
