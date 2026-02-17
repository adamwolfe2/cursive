/**
 * Daily Leads Dashboard
 * Shows leads delivered daily from Audience Labs
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DailyLeadsView } from '@/components/leads/daily-leads-view'

export default async function DailyLeadsPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Get user profile with segment info
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, workspace_id, industry_segment, location_segment, daily_lead_limit, plan')
    .eq('auth_user_id', session.user.id)
    .single()

  if (!userProfile?.workspace_id) {
    redirect('/welcome')
  }

  // Get today's delivered leads
  const today = new Date().toISOString().split('T')[0]
  const { data: todaysLeads, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('workspace_id', userProfile.workspace_id)
    .gte('delivered_at', `${today}T00:00:00`)
    .lte('delivered_at', `${today}T23:59:59`)
    .order('delivered_at', { ascending: false })

  // Get this week's total
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const weekStart = startOfWeek.toISOString().split('T')[0]

  const { count: weekCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', userProfile.workspace_id)
    .gte('delivered_at', `${weekStart}T00:00:00`)

  // Get this month's total
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  const monthStart = startOfMonth.toISOString().split('T')[0]

  const { count: monthCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', userProfile.workspace_id)
    .gte('delivered_at', `${monthStart}T00:00:00`)

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
