import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    const supabase = await createClient()

    // Validate partner
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Get payout history
    const { data: payoutHistory } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('partner_id', partner.id)
      .order('requested_at', { ascending: false })
      .limit(50)

    // Calculate lifetime paid
    const { data: completedPayouts } = await supabase
      .from('payout_requests')
      .select('amount')
      .eq('partner_id', partner.id)
      .eq('status', 'completed')

    const lifetimePaid = completedPayouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

    return NextResponse.json({
      success: true,
      partner_name: partner.name,
      stats: {
        total_earnings: Number(partner.total_earnings || 0),
        pending_balance: Number(partner.pending_balance || 0),
        available_balance: Number(partner.available_balance || 0),
        lifetime_paid: lifetimePaid,
        payout_threshold: Number(partner.payout_threshold || 50),
        stripe_connected: !!partner.stripe_account_id && partner.stripe_onboarding_complete,
      },
      payout_history: payoutHistory || [],
    })
  } catch (error: any) {
    console.error('Partner payouts error:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}
