import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { api_key } = await request.json()

    if (!api_key) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Validate API key and get partner
    const { data: partner, error } = await supabase
      .from('partners')
      .select('*')
      .eq('api_key', api_key)
      .eq('is_active', true)
      .single()

    if (error || !partner) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Get stats
    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)

    const { count: thisMonthLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partner.id)
      .gte('created_at', thisMonthStart.toISOString())

    // Calculate this month's earnings
    const thisMonthEarnings = (thisMonthLeads || 0) * Number(partner.payout_rate)

    return NextResponse.json({
      success: true,
      partner_name: partner.name,
      stats: {
        total_leads: partner.total_leads_uploaded,
        this_month_leads: thisMonthLeads || 0,
        total_earnings: Number(partner.total_earnings),
        this_month_earnings: thisMonthEarnings,
      },
    })
  } catch (error: any) {
    console.error('Partner auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
