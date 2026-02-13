// Verify Stripe Connect Onboarding
// GET /api/partner/connect/verify?partner_id=xxx

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe/client'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stripe = getStripeClient()
    const partnerId = request.nextUrl.searchParams.get('partner_id')

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Missing partner_id parameter' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // First verify the partner exists and belongs to this user
    const { data: userData, error: userError } = await supabaseAuth
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get partner with Stripe account ID and verify ownership
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, stripe_account_id, stripe_onboarding_complete, workspace_id')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Verify user owns this partner
    if (partner.workspace_id !== userData.workspace_id) {
      safeError('[Verify Connect] Unauthorized access attempt:', {
        userId: user.id,
        partnerId,
        userWorkspace: userData.workspace_id,
        partnerWorkspace: partner.workspace_id
      })
      return NextResponse.json(
        { error: 'Forbidden: You do not own this partner account' },
        { status: 403 }
      )
    }

    if (!partner.stripe_account_id) {
      return NextResponse.json({
        onboardingComplete: false,
        message: 'Stripe account not connected',
      })
    }

    const account = await stripe.accounts.retrieve(partner.stripe_account_id)

    // Check if onboarding is complete - require all three conditions from Stripe
    const onboardingComplete =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled

    // Only activate partner if Stripe confirms the account is fully onboarded
    if (onboardingComplete && !partner.stripe_onboarding_complete) {
      await supabase
        .from('partners')
        .update({
          stripe_onboarding_complete: true,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', partner.id)
    }

    // If onboarding is not complete, return status without activating
    if (!onboardingComplete) {
      return NextResponse.json({
        onboardingComplete: false,
        accountId: partner.stripe_account_id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        message: 'Stripe onboarding is incomplete. Please complete all required steps in Stripe before your account can be activated.',
      })
    }

    return NextResponse.json({
      onboardingComplete,
      accountId: partner.stripe_account_id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    })
  } catch (error: any) {
    safeError('[Verify Connect] Error:', error)
    return NextResponse.json(
      { error: 'Failed to verify account' },
      { status: 500 }
    )
  }
}
