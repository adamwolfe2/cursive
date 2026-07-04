/**
 * Website Visitors Page — Hybrid SSR
 *
 * Stats + pixel info are fetched server-side so they render immediately
 * on first paint (no skeleton). The visitor table loads client-side via
 * React Query for pagination and filtering.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { WebsiteVisitorsClient } from './WebsiteVisitorsClient'

export const metadata: Metadata = {
  title: 'Website Visitors | Cursive',
}

export default async function WebsiteVisitorsPage() {
  const supabase = await createClient()

  // Server-verified auth — prevents expired JWT issues
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get workspace ID from user profile
  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  const workspaceId = userData?.workspace_id
  if (!workspaceId) redirect('/welcome')

  const admin = createAdminClient()
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  // Fetch stats + pixel server-side in parallel (renders immediately on first paint)
  const [
    { count: total },
    { count: enriched },
    { count: thisWeek },
    { data: scoreData },
    { data: pixel },
    { data: initialVisitorRows },
  ] = await Promise.all([
    admin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .or('source.ilike.%pixel%,source.ilike.%superpixel%')
      .gte('created_at', since30),
    admin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .or('source.ilike.%pixel%,source.ilike.%superpixel%')
      .gte('created_at', since30)
      .eq('enrichment_status', 'enriched'),
    admin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .or('source.ilike.%pixel%,source.ilike.%superpixel%')
      .gte('created_at', weekAgo),
    admin
      .from('leads')
      .select('intent_score_calculated')
      .eq('workspace_id', workspaceId)
      .or('source.ilike.%pixel%,source.ilike.%superpixel%')
      .gte('created_at', since30)
      .not('intent_score_calculated', 'is', null)
      .limit(500),
    // Filter to the ACTIVE pixel + newest-first-limit-1: a workspace that ever
    // changed its pixel/domain keeps the old row (deactivated), so an unfiltered
    // maybeSingle() errors to null on multiple rows and falsely shows "no pixel"
    // to a live workspace. Mirrors the dashboard's sibling query.
    admin
      .from('audiencelab_pixels')
      .select('pixel_id, domain, trial_status, trial_ends_at, is_active')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Server-render the first page of visitors too — the client-side /api/visitors
    // fetch was unreliable (cookie dependency), leaving the list blank while the
    // stats showed data. This guarantees the table renders on first paint.
    admin
      .from('leads')
      .select('id, first_name, last_name, full_name, email, phone, company_name, company_domain, job_title, city, state, country, intent_score_calculated, enrichment_status, created_at, source, linkedin_url')
      .eq('workspace_id', workspaceId)
      .or('source.ilike.*pixel*,source.ilike.*superpixel*')
      .gte('created_at', since30)
      .order('created_at', { ascending: false })
      .limit(25),
  ])

  const scores = (scoreData ?? [])
    .map((l) => l.intent_score_calculated)
    .filter((s): s is number => s !== null)
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  const totalVal = total ?? 0
  const enrichedVal = enriched ?? 0

  const initialStats = {
    total: totalVal,
    this_week: thisWeek ?? 0,
    enriched: enrichedVal,
    avg_score: avgScore,
    match_rate: totalVal > 0 ? Math.round((enrichedVal / totalVal) * 100) : 0,
  }

  return (
    <WebsiteVisitorsClient
      initialStats={initialStats}
      initialPixel={pixel ?? null}
      initialVisitors={initialVisitorRows ?? []}
    />
  )
}
