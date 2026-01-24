import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount required' }, { status: 400 })
    }

    const supabase = await createServerClient()

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

    // Check if Stripe is connected
    if (!partner.stripe_account_id || !partner.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: 'Please connect your Stripe account first' },
        { status: 400 }
      )
    }

    // Validate amount against available balance
    const availableBalance = Number(partner.available_balance || 0)
    const payoutThreshold = Number(partner.payout_threshold || 50)

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: 'Amount exceeds available balance' },
        { status: 400 }
      )
    }

    if (amount < payoutThreshold) {
      return NextResponse.json(
        { error: `Minimum payout amount is $${payoutThreshold.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Check for pending payout requests
    const { data: pendingRequests } = await supabase
      .from('payout_requests')
      .select('id')
      .eq('partner_id', partner.id)
      .in('status', ['pending', 'approved', 'processing'])

    if (pendingRequests && pendingRequests.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending payout request' },
        { status: 400 }
      )
    }

    // Create payout request
    const { data: payoutRequest, error: insertError } = await supabase
      .from('payout_requests')
      .insert({
        partner_id: partner.id,
        amount: amount,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create payout request:', insertError)
      return NextResponse.json(
        { error: 'Failed to create payout request' },
        { status: 500 }
      )
    }

    // Deduct from available balance (will be added back if rejected)
    await supabase
      .from('partners')
      .update({
        available_balance: availableBalance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', partner.id)

    return NextResponse.json({
      success: true,
      payout_request: payoutRequest,
      message: 'Payout request submitted successfully',
    })
  } catch (error: any) {
    console.error('Payout request error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
