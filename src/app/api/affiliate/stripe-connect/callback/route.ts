/**
 * GET /api/affiliate/stripe-connect/callback
 * Handles return from Stripe Connect onboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { safeError } from '@/lib/utils/log-sanitizer'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
  })
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const admin = createAdminClient()

    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, stripe_connect_account_id')
      .eq('user_id', authUser.id)
      .maybeSingle()

    if (!affiliate?.stripe_connect_account_id) {
      return NextResponse.redirect(new URL('/affiliate/settings', request.url))
    }

    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(affiliate.stripe_connect_account_id)

    if (account.charges_enabled) {
      await admin
        .from('affiliates')
        .update({ stripe_onboarding_complete: true })
        .eq('id', affiliate.id)
    }

    return NextResponse.redirect(new URL('/affiliate/dashboard?stripe=connected', request.url))
  } catch (error) {
    safeError('[affiliate/stripe-connect/callback] Error:', error)
    return NextResponse.redirect(new URL('/affiliate/settings?error=stripe_callback_failed', request.url))
  }
}
