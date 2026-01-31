// Verify Stripe Connect Onboarding
// GET /api/partner/connect/verify?partner_id=xxx

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  try {
    const partnerId = request.nextUrl.searchParams.get('partner_id')

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Missing partner_id parameter' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get partner with Stripe account ID
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, stripe_account_id, stripe_onboarding_complete')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    if (!partner.stripe_account_id) {
      return NextResponse.json({
        onboardingComplete: false,
        message: 'Stripe account not connected',
      })
    }

    // Check Stripe account status
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })

    const account = await stripe.accounts.retrieve(partner.stripe_account_id)

    // Check if onboarding is complete
    const onboardingComplete =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled

    // Update database if onboarding status changed
    if (onboardingComplete && !partner.stripe_onboarding_complete) {
      await supabase
        .from('partners')
        .update({
          stripe_onboarding_complete: true,
          status: 'active', // Activate partner once onboarding complete
          updated_at: new Date().toISOString(),
        })
        .eq('id', partner.id)

      console.log(`✅ Partner ${partner.id} onboarding completed`)
    }

    return NextResponse.json({
      onboardingComplete,
      accountId: partner.stripe_account_id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    })
  } catch (error: any) {
    console.error('[Verify Connect] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify account' },
      { status: 500 }
    )
  }
}
