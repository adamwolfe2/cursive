/**
 * GET /api/affiliate/stripe-connect
 * Initiates Stripe Connect Express onboarding for affiliates
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

    // Look up affiliate by user_id
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, stripe_connect_account_id, stripe_onboarding_complete')
      .eq('user_id', authUser.id)
      .maybeSingle()

    if (!affiliate) {
      return NextResponse.redirect(new URL('/affiliates/apply', request.url))
    }

    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'

    let accountId = affiliate.stripe_connect_account_id

    if (!accountId) {
      // Create Stripe Express account
      const account = await stripe.accounts.create({
        type: 'express',
        email: (await admin.from('affiliates').select('email').eq('id', affiliate.id).single()).data?.email,
      })
      accountId = account.id

      await admin
        .from('affiliates')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', affiliate.id)
    }

    // Create account link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/api/affiliate/stripe-connect`,
      return_url: `${appUrl}/api/affiliate/stripe-connect/callback`,
      type: 'account_onboarding',
    })

    return NextResponse.redirect(accountLink.url)
  } catch (error) {
    safeError('[affiliate/stripe-connect] Error:', error)
    return NextResponse.redirect(new URL('/affiliate/settings?error=stripe_connect_failed', request.url))
  }
}
