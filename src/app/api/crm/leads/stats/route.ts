// API endpoint for lead statistics

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user and workspace (server-verified)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User workspace not found' },
        { status: 404 }
      )
    }

    const workspaceId = userData.workspace_id

    // Get current month start and last month start dates
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch current month stats
    const { data: currentMonthLeads, error: currentError } = await supabase
      .from('leads')
      .select('status, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', currentMonthStart.toISOString())

    if (currentError) {
      throw currentError
    }

    // Fetch last month stats for comparison
    const { data: lastMonthLeads, error: lastError } = await supabase
      .from('leads')
      .select('status, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString())

    if (lastError) {
      throw lastError
    }

    // Calculate stats
    const currentTotal = currentMonthLeads?.length || 0
    const lastTotal = lastMonthLeads?.length || 0

    const currentContacted =
      currentMonthLeads?.filter((l) =>
        ['contacted', 'qualified', 'negotiation'].includes(l.status || '')
      ).length || 0
    const lastContacted =
      lastMonthLeads?.filter((l) =>
        ['contacted', 'qualified', 'negotiation'].includes(l.status || '')
      ).length || 0

    const currentQualified =
      currentMonthLeads?.filter((l) => l.status === 'qualified').length || 0
    const lastQualified =
      lastMonthLeads?.filter((l) => l.status === 'qualified').length || 0

    const currentHot =
      currentMonthLeads?.filter((l) => l.status === 'hot').length || 0
    const lastHot =
      lastMonthLeads?.filter((l) => l.status === 'hot').length || 0

    // Calculate percentage changes
    const calculateChange = (current: number, last: number) => {
      if (last === 0) return current > 0 ? 100 : 0
      return Math.round(((current - last) / last) * 100)
    }

    // Get status breakdown
    const statusCounts: Record<string, number> = {}
    currentMonthLeads?.forEach((lead) => {
      const status = lead.status || 'new'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // Fetch lead growth data (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: growthData, error: growthError } = await supabase
      .from('leads')
      .select('created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    if (growthError) {
      throw growthError
    }

    // Group by day for chart
    const dailyCounts: Record<string, number> = {}
    growthData?.forEach((lead) => {
      const date = new Date(lead.created_at)
      const dateKey = date.toISOString().split('T')[0]
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1
    })

    const chartData = Object.entries(dailyCounts).map(([date, count]) => ({
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
    safeError('Error fetching lead stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead statistics' },
      { status: 500 }
    )
  }
}
