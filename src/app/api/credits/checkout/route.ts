/**
 * Credit Purchase Checkout API
 * Creates Stripe checkout session for credit purchases
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'
import { STRIPE_CONFIG } from '@/lib/stripe/config'
import { CREDIT_PACKAGES } from '@/lib/constants/credit-packages'
import { z } from 'zod'
import Stripe from 'stripe'

// Lazy-load Stripe with Web Crypto provider for Edge runtime
let stripeClient: Stripe | null = null
function getStripe(): Stripe {
  if (!stripeClient) {
    if (!STRIPE_CONFIG.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeClient = new Stripe(STRIPE_CONFIG.secretKey, {
      apiVersion: STRIPE_CONFIG.apiVersion as Stripe.LatestApiVersion,
      httpClient: Stripe.createFetchHttpClient(),
    })
  }
  return stripeClient
}

// Valid package IDs derived from the shared constants
const VALID_PACKAGE_IDS = CREDIT_PACKAGES.map(p => p.id) as [string, ...string[]]

const checkoutSchema = z.object({
  packageId: z.enum(VALID_PACKAGE_IDS),
})

/**
 * POST /api/credits/checkout
 * Create Stripe checkout session for credit purchase
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { packageId } = checkoutSchema.parse(body)

    // Get package details
    const selectedPackage = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    const repo = new MarketplaceRepository()

    // Create credit purchase record
    const purchase = await repo.createCreditPurchase({
      workspaceId: user.workspace_id,
      userId: user.id,
      credits: selectedPackage.credits,
      packageName: selectedPackage.name,
      amountPaid: selectedPackage.price / 100, // Convert cents to dollars for DB
      pricePerCredit: selectedPackage.pricePerCredit,
    })

    safeLog('[Credit Checkout] Created purchase record:', {
      purchaseId: purchase.id,
      packageId: selectedPackage.id,
      credits: selectedPackage.credits,
    })

    // Create Stripe checkout session
    const stripe = getStripe()

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credit_purchase=success`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credit_purchase=cancelled`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${selectedPackage.name} Credit Package`,
              description: `${selectedPackage.credits} credits for lead generation`,
              images: [],
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'credit_purchase',
        credit_purchase_id: purchase.id,
        workspace_id: user.workspace_id,
        user_id: user.id,
        credits: selectedPackage.credits.toString(),
      },
      customer_email: user.email,
      allow_promotion_codes: true,
    })

    // Update purchase record with checkout session ID
    // Note: Using admin client since this is a backend operation
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    await adminClient
      .from('credit_purchases')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', purchase.id)

    safeLog('[Credit Checkout] Created Stripe session:', {
      sessionId: session.id,
      purchaseId: purchase.id,
    })

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    safeError('[Credit Checkout] Error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/credits/checkout
 * Get available credit packages
 */
export async function GET() {
  return NextResponse.json({
    packages: CREDIT_PACKAGES,
  })
}
