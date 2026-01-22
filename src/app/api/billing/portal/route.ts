// Billing Portal API Route
// POST /api/billing/portal - Create Stripe Customer Portal session

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createPortalSession } from '@/lib/stripe/client'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has Stripe customer ID
    if (!user.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Create portal session
    const baseUrl = request.nextUrl.origin
    const session = await createPortalSession({
      customerId: user.stripe_customer_id,
      returnUrl: `${baseUrl}/settings/billing`,
    })

    return NextResponse.json({
      success: true,
      url: session.url,
    })
  } catch (error: any) {
    console.error('[API] Portal error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
