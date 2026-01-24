import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    const supabase = await createServerClient()

    // Calculate date range
    const now = new Date()
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '365d': 365,
    }
    const days = daysMap[range] || 30
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)

    // Get overview stats
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    const { count: previousLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())

    const { count: totalWorkspaces } = await supabase
      .from('workspaces')
      .select('*', { count: 'exact', head: true })

    const { count: activeWorkspaces } = await supabase
      .from('workspaces')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: totalPartners } = await supabase
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Calculate revenue (from completed payouts or lead prices)
    const { data: revenueData } = await supabase
      .from('leads')
      .select('lead_score')
      .gte('created_at', startDate.toISOString())

    // Estimate revenue: leads * average price
    const avgLeadPrice = 25
    const totalRevenue = (totalLeads || 0) * avgLeadPrice

    const { data: previousRevenueData } = await supabase
      .from('leads')
      .select('lead_score')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())

    const previousRevenue = (previousLeads || 0) * avgLeadPrice

    // Calculate change percentages
    const leadsChange = previousLeads && previousLeads > 0
      ? ((totalLeads || 0) - previousLeads) / previousLeads * 100
      : 0

    const revenueChange = previousRevenue > 0
      ? (totalRevenue - previousRevenue) / previousRevenue * 100
      : 0

    // Get leads by day
    const { data: leadsByDayRaw } = await supabase
      .from('leads')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Aggregate leads by day
    const leadsByDayMap: Record<string, number> = {}
    leadsByDayRaw?.forEach((lead) => {
      const date = new Date(lead.created_at).toISOString().split('T')[0]
      leadsByDayMap[date] = (leadsByDayMap[date] || 0) + 1
    })

    const leadsByDay = Object.entries(leadsByDayMap).map(([date, count]) => ({
      date,
      count,
    }))

    // Get leads by industry
    const { data: leadsByIndustryRaw } = await supabase
      .from('leads')
      .select('company_industry')
      .gte('created_at', startDate.toISOString())

    const industryMap: Record<string, number> = {}
    leadsByIndustryRaw?.forEach((lead) => {
      const industry = lead.company_industry || 'Unknown'
      industryMap[industry] = (industryMap[industry] || 0) + 1
    })

    const leadsByIndustry = Object.entries(industryMap)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)

    // Get leads by region
    const { data: leadsByRegionRaw } = await supabase
      .from('leads')
      .select('company_location')
      .gte('created_at', startDate.toISOString())

    const regionMap: Record<string, number> = {}
    leadsByRegionRaw?.forEach((lead) => {
      const location = lead.company_location as any
      const state = location?.state || 'Unknown'
      regionMap[state] = (regionMap[state] || 0) + 1
    })

    const leadsByRegion = Object.entries(regionMap)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)

    // Get top partners
    const { data: partners } = await supabase
      .from('partners')
      .select('id, name, total_leads_uploaded, total_earnings')
      .eq('is_active', true)
      .order('total_leads_uploaded', { ascending: false })
      .limit(10)

    const topPartners = partners?.map((p) => ({
      name: p.name,
      leads: p.total_leads_uploaded || 0,
      earnings: Number(p.total_earnings || 0),
    })) || []

    // Get conversion funnel
    const { count: delivered } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'delivered')
      .gte('created_at', startDate.toISOString())

    const { count: opened } = await supabase
      .from('email_sends')
      .select('*', { count: 'exact', head: true })
      .not('opened_at', 'is', null)
      .gte('created_at', startDate.toISOString())

    const { count: clicked } = await supabase
      .from('email_sends')
      .select('*', { count: 'exact', head: true })
      .not('clicked_at', 'is', null)
      .gte('created_at', startDate.toISOString())

    const { count: replied } = await supabase
      .from('email_sends')
      .select('*', { count: 'exact', head: true })
      .not('replied_at', 'is', null)
      .gte('created_at', startDate.toISOString())

    const { count: converted } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .not('converted_at', 'is', null)
      .gte('created_at', startDate.toISOString())

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_leads: totalLeads || 0,
          total_leads_change: leadsChange,
          total_workspaces: totalWorkspaces || 0,
          active_workspaces: activeWorkspaces || 0,
          total_partners: totalPartners || 0,
          total_revenue: totalRevenue,
          revenue_change: revenueChange,
        },
        leadsByDay,
        leadsByIndustry,
        leadsByRegion,
        topPartners,
        conversionFunnel: {
          delivered: delivered || 0,
          opened: opened || 0,
          clicked: clicked || 0,
          replied: replied || 0,
          converted: converted || 0,
        },
      },
    })
  } catch (error: any) {
    console.error('Admin analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
