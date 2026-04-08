import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeadsPageTabs } from '@/components/leads/leads-page-tabs'
import { safeError } from '@/lib/utils/log-sanitizer'

export const metadata: Metadata = { title: 'Leads | Cursive' }

export default async function LeadsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('id, workspace_id, industry_segment, location_segment, daily_lead_limit, plan, full_name, email')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (profileError) {
    safeError('[LeadsPage]', 'Failed to fetch user profile:', profileError)
  }

  if (!userProfile?.workspace_id) {
    redirect('/welcome')
  }

  const today = new Date().toISOString().split('T')[0]
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const weekStart = startOfWeek.toISOString().split('T')[0]
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  const monthStart = startOfMonth.toISOString().split('T')[0]

  const [todaysLeadsResult, weekCountResult, monthCountResult] = await Promise.all([
    supabase
      .from('leads')
      .select('id, first_name, last_name, full_name, email, phone, company_name, company_domain, job_title, city, state, country, delivered_at, intent_score_calculated, freshness_score, enrichment_status, verification_status, status, tags, source', { count: 'exact' })
      .eq('workspace_id', userProfile.workspace_id)
      .gte('delivered_at', `${today}T00:00:00`)
      .lte('delivered_at', `${today}T23:59:59`)
      .order('delivered_at', { ascending: false })
      .limit(500),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', userProfile.workspace_id)
      .gte('delivered_at', `${weekStart}T00:00:00`),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', userProfile.workspace_id)
      .gte('delivered_at', `${monthStart}T00:00:00`),
  ])

  return (
    <LeadsPageTabs
      dailyLeadsProps={{
        leads: todaysLeadsResult.data || [],
        todayCount: todaysLeadsResult.count || 0,
        weekCount: weekCountResult.count || 0,
        monthCount: monthCountResult.count || 0,
        dailyLimit: userProfile.daily_lead_limit || 10,
        plan: userProfile.plan || 'free',
        industrySegment: userProfile.industry_segment,
        locationSegment: userProfile.location_segment,
      }}
      assignedLeadsProps={{
        userId: userProfile.id,
        workspaceId: userProfile.workspace_id,
      }}
      allLeadsProps={{
        workspaceId: userProfile.workspace_id,
      }}
    />
  )
}
