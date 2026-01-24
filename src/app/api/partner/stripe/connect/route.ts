import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
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

    // Check if partner already has Stripe account
    let stripeAccountId = partner.stripe_account_id

    if (!stripeAccountId) {
      // Create new Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: partner.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          partner_id: partner.id,
        },
      })

      stripeAccountId = account.id

      // Save Stripe account ID
      await supabase
        .from('partners')
        .update({
          stripe_account_id: stripeAccountId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', partner.id)
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://meetcursive.com'}/partner/payouts?stripe=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://meetcursive.com'}/partner/payouts?stripe=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      url: accountLink.url,
    })
  } catch (error: any) {
    console.error('Stripe Connect error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Stripe connection' },
      { status: 500 }
    )
  }
}

// Handle Stripe Connect status check
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    const supabase = await createServerClient()

    // Validate partner
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    if (!partner.stripe_account_id) {
      return NextResponse.json({
        success: true,
        connected: false,
        onboarding_complete: false,
      })
    }

    // Check account status from Stripe
    const account = await stripe.accounts.retrieve(partner.stripe_account_id)

    const isComplete = account.details_submitted && account.payouts_enabled

    // Update status if changed
    if (isComplete !== partner.stripe_onboarding_complete) {
      await supabase
        .from('partners')
        .update({
          stripe_onboarding_complete: isComplete,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_account_id', partner.stripe_account_id)
    }

    return NextResponse.json({
      success: true,
      connected: true,
      onboarding_complete: isComplete,
      payouts_enabled: account.payouts_enabled,
    })
  } catch (error: any) {
    console.error('Stripe status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check Stripe status' },
      { status: 500 }
    )
  }
}
