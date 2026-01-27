import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { z } from 'zod'

// Input validation schema
const querySchema = z.object({
  range: z.enum(['7d', '30d', '90d', '365d']).default('30d'),
})

export async function GET(request: NextRequest) {
  try {
    // Check admin access (throws if not admin)
    await requireAdmin()

    const { searchParams } = new URL(request.url)

    // Validate input
    const parseResult = querySchema.safeParse({
      range: searchParams.get('range') || '30d',
    })

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid range parameter' }, { status: 400 })
    }

    const { range } = parseResult.data

    const supabase = await createClient()

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

    // Run all independent queries in parallel for better performance
    const [
      // Overview counts
      { count: totalLeads },
      { count: previousLeads },
      { count: totalWorkspaces },
      { count: activeWorkspaces },
      { count: totalPartners },
      // Leads data for charts
      { data: leadsByDayRaw },
      { data: leadsByIndustryRaw },
      { data: leadsByRegionRaw },
      // Partners data
      { data: partners },
      // Conversion funnel
      { count: delivered },
      { count: opened },
      { count: clicked },
      { count: replied },
      { count: converted },
    ] = await Promise.all([
      // Overview counts
      supabase.from('leads').select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString()),
      supabase.from('leads').select('*', { count: 'exact', head: true })
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString()),
      supabase.from('workspaces').select('*', { count: 'exact', head: true }),
      supabase.from('workspaces').select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase.from('partners').select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      // Leads data for charts (single query with all needed fields)
      supabase.from('leads').select('created_at, company_industry, company_location')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true }),
      // Dummy for industryRaw - we'll process from leadsByDayRaw
      Promise.resolve({ data: null }),
      // Dummy for regionRaw - we'll process from leadsByDayRaw
      Promise.resolve({ data: null }),
      // Partners data
      supabase.from('partners').select('id, name, total_leads_uploaded, total_earnings')
        .eq('is_active', true)
        .order('total_leads_uploaded', { ascending: false })
        .limit(10),
      // Conversion funnel
      supabase.from('leads').select('*', { count: 'exact', head: true })
        .eq('delivery_status', 'delivered')
        .gte('created_at', startDate.toISOString()),
      supabase.from('email_sends').select('*', { count: 'exact', head: true })
        .not('opened_at', 'is', null)
        .gte('created_at', startDate.toISOString()),
      supabase.from('email_sends').select('*', { count: 'exact', head: true })
        .not('clicked_at', 'is', null)
        .gte('created_at', startDate.toISOString()),
      supabase.from('email_sends').select('*', { count: 'exact', head: true })
        .not('replied_at', 'is', null)
        .gte('created_at', startDate.toISOString()),
      supabase.from('leads').select('*', { count: 'exact', head: true })
        .not('converted_at', 'is', null)
        .gte('created_at', startDate.toISOString()),
    ])

    // Estimate revenue: leads * average price
    const avgLeadPrice = 25
    const totalRevenue = (totalLeads || 0) * avgLeadPrice
    const previousRevenue = (previousLeads || 0) * avgLeadPrice

    // Calculate change percentages
    const leadsChange = previousLeads && previousLeads > 0
      ? ((totalLeads || 0) - previousLeads) / previousLeads * 100
      : 0

    const revenueChange = previousRevenue > 0
      ? (totalRevenue - previousRevenue) / previousRevenue * 100
      : 0

    // Aggregate leads data from single query (process in memory for efficiency)
    const leadsByDayMap: Record<string, number> = {}
    const industryMap: Record<string, number> = {}
    const regionMap: Record<string, number> = {}

    leadsByDayRaw?.forEach((lead: any) => {
      // By day
      const date = new Date(lead.created_at).toISOString().split('T')[0]
      leadsByDayMap[date] = (leadsByDayMap[date] || 0) + 1

      // By industry
      const industry = lead.company_industry || 'Unknown'
      industryMap[industry] = (industryMap[industry] || 0) + 1

      // By region
      const location = lead.company_location as any
      const state = location?.state || 'Unknown'
      regionMap[state] = (regionMap[state] || 0) + 1
    })

    const leadsByDay = Object.entries(leadsByDayMap).map(([date, count]) => ({
      date,
      count,
    }))

    const leadsByIndustry = Object.entries(industryMap)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)

    const leadsByRegion = Object.entries(regionMap)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)

    const topPartners = partners?.map((p) => ({
      name: p.name,
      leads: p.total_leads_uploaded || 0,
      earnings: Number(p.total_earnings || 0),
    })) || []

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
