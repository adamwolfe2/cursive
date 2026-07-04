// API endpoint for lead statistics

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

// Statuses counted as "contacted" for the headline metric.
const CONTACTED_STATUSES = ['contacted', 'qualified', 'negotiation']

// Cap for the row-based breakdown/chart fetches. Headline totals below use
// exact COUNT aggregates (uncapped); only the status-proportion pie and the
// 30-day trend chart read rows, and 50k comfortably covers a month/30 days of
// a single workspace's volume.
const ROW_FETCH_CAP = 50000

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    if (!user.workspace_id) {
      return NextResponse.json(
        { error: 'User workspace not found' },
        { status: 404 }
      )
    }

    const workspaceId = user.workspace_id

    // RLS-scoped client for leads queries
    const supabase = await createClient()

    // Get current month start and last month start dates
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Headline totals use count:'exact', head:true so they reflect ALL matching
    // rows. The previous implementation fetched up to 5000 rows and used
    // `.length`, so any workspace exceeding 5000 leads/month reported exactly
    // 5000 and a fabricated 0%/negative growth once capped.
    const currentBase = () =>
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('created_at', currentMonthStart.toISOString())
    const lastBase = () =>
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())

    const [
      currentTotalRes,
      lastTotalRes,
      currentContactedRes,
      lastContactedRes,
      currentQualifiedRes,
      lastQualifiedRes,
      currentHotRes,
      lastHotRes,
      statusRowsRes,
      growthRes,
    ] = await Promise.all([
      currentBase(),
      lastBase(),
      currentBase().in('status', CONTACTED_STATUSES),
      lastBase().in('status', CONTACTED_STATUSES),
      currentBase().eq('status', 'qualified'),
      lastBase().eq('status', 'qualified'),
      currentBase().eq('status', 'hot'),
      lastBase().eq('status', 'hot'),
      // Status breakdown (current month) — read only the status column and group
      // in JS so arbitrary/legacy status values are preserved.
      supabase
        .from('leads')
        .select('status')
        .eq('workspace_id', workspaceId)
        .gte('created_at', currentMonthStart.toISOString())
        .limit(ROW_FETCH_CAP),
      // 30-day growth chart — most-recent-first so the visible trailing window
      // is always captured (the old code ordered ascending + limit 2000, which
      // dropped the most recent days once a workspace crossed 2000 leads/30d).
      supabase
        .from('leads')
        .select('created_at')
        .eq('workspace_id', workspaceId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(ROW_FETCH_CAP),
    ])

    // A wrong headline number is worse than a surfaced error.
    for (const res of [
      currentTotalRes,
      lastTotalRes,
      currentContactedRes,
      lastContactedRes,
      currentQualifiedRes,
      lastQualifiedRes,
      currentHotRes,
      lastHotRes,
      statusRowsRes,
      growthRes,
    ]) {
      if (res.error) throw res.error
    }

    const currentTotal = currentTotalRes.count ?? 0
    const lastTotal = lastTotalRes.count ?? 0
    const currentContacted = currentContactedRes.count ?? 0
    const lastContacted = lastContactedRes.count ?? 0
    const currentQualified = currentQualifiedRes.count ?? 0
    const lastQualified = lastQualifiedRes.count ?? 0
    const currentHot = currentHotRes.count ?? 0
    const lastHot = lastHotRes.count ?? 0

    // Calculate percentage changes
    const calculateChange = (current: number, last: number) => {
      if (last === 0) return current > 0 ? 100 : 0
      return Math.round(((current - last) / last) * 100)
    }

    // Status breakdown (null status counts as 'new', matching prior behavior)
    const statusCounts: Record<string, number> = {}
    ;(statusRowsRes.data ?? []).forEach((lead) => {
      const status = lead.status || 'new'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // Group growth data by day for the chart
    const dailyCounts: Record<string, number> = {}
    ;(growthRes.data ?? []).forEach((lead) => {
      const date = new Date(lead.created_at)
      const dateKey = date.toISOString().split('T')[0]
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1
    })

    const chartData = Object.entries(dailyCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        label: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        value: count,
        fullDate: new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      }))

    return NextResponse.json({
      stats: {
        totalLeads: currentTotal,
        totalLeadsChange: calculateChange(currentTotal, lastTotal),
        totalLeadsChangeValue: currentTotal - lastTotal,
        contactedLeads: currentContacted,
        contactedLeadsChange: calculateChange(currentContacted, lastContacted),
        contactedLeadsChangeValue: currentContacted - lastContacted,
        qualifiedLeads: currentQualified,
        qualifiedLeadsChange: calculateChange(currentQualified, lastQualified),
        qualifiedLeadsChangeValue: currentQualified - lastQualified,
        hotLeads: currentHot,
        hotLeadsChange: calculateChange(currentHot, lastHot),
        hotLeadsChangeValue: currentHot - lastHot,
      },
      statusBreakdown: statusCounts,
      chartData,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
