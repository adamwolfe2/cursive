// Billing Checkout API Route
// POST /api/billing/checkout - Create Stripe Checkout session

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe/client'
import { z } from 'zod'

const checkoutSchema = z.object({
  priceId: z.string().optional(),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has active subscription
    if (user.plan === 'pro' && user.subscription_status === 'active') {
      return NextResponse.json(
        { error: 'You already have an active Pro subscription' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { priceId, billingPeriod } = checkoutSchema.parse(body)

    // Determine price ID based on billing period
    const finalPriceId =
      priceId ||
      (billingPeriod === 'yearly'
        ? STRIPE_PRICES.PRO_YEARLY
        : STRIPE_PRICES.PRO_MONTHLY)

    if (!finalPriceId) {
      return NextResponse.json(
        { error: 'Price ID not configured' },
        { status: 500 }
      )
    }

    // Create checkout session
    const baseUrl = request.nextUrl.origin
    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      workspaceId: user.workspace_id,
      priceId: finalPriceId,
      successUrl: `${baseUrl}/dashboard?checkout=success`,
      cancelUrl: `${baseUrl}/pricing?checkout=cancelled`,
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('[API] Checkout error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
