// Partner Stripe Connect API
// Creates Stripe Connect account link for partner onboarding

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { PartnerRepository } from '@/lib/repositories/partner.repository'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is linked to a partner
    if (!user.linked_partner_id) {
      return NextResponse.json(
        { error: 'Not a partner account' },
        { status: 403 }
      )
    }

    const repo = new PartnerRepository()
    const partner = await repo.findById(user.linked_partner_id)

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Check if already has a Stripe account
    let accountId = partner.stripe_account_id

    if (!accountId) {
      // Create new Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: partner.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          name: partner.company_name || partner.name,
          support_email: partner.email,
        },
      })

      accountId = account.id

      // Update partner with Stripe account ID
      await repo.update(user.linked_partner_id, {
        stripeAccountId: accountId,
      })
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/partner/settings`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/partner/settings?stripe_connected=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Error creating Stripe Connect link:', error)
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect link' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user || !user.linked_partner_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repo = new PartnerRepository()
    const partner = await repo.findById(user.linked_partner_id)

    if (!partner || !partner.stripe_account_id) {
      return NextResponse.json(
        { error: 'No Stripe account connected' },
        { status: 404 }
      )
    }

    // Get Stripe account details
    const account = await stripe.accounts.retrieve(
      partner.stripe_account_id
    )

    return NextResponse.json({
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    })
  } catch (error) {
    console.error('Error fetching Stripe Connect status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Stripe Connect status' },
      { status: 500 }
    )
  }
}
