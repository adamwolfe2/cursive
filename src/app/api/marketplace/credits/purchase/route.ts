// Credit Purchase API
// Creates Stripe checkout session for credit purchases

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import { validateCreditPurchase } from '@/lib/constants/credit-packages'
import { getStripeClient } from '@/lib/stripe/client'
import { safeError } from '@/lib/utils/log-sanitizer'

const purchaseSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
  credits: z.number()
    .int('Credits must be a whole number')
    .positive('Credits must be positive')
    .max(1000000, 'Credits amount exceeds maximum'),
  amount: z.number()
    .positive('Amount must be positive')
    .finite('Amount must be a valid number')
    .max(1000000, 'Amount exceeds maximum limit'),
})

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return unauthorized()
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = purchaseSchema.parse(body)

    // Idempotency check: prevent duplicate purchases within 30 seconds
    const requestId = request.headers.get('x-request-id')
    if (requestId) {
      const { data: recentPurchase } = await supabase
        .from('credit_purchases')
        .select('id')
        .eq('workspace_id', user.workspace_id)
        .eq('package_name', validated.packageId)
        .gte('created_at', new Date(Date.now() - 30_000).toISOString())
        .limit(1)
        .maybeSingle()

      if (recentPurchase) {
        return NextResponse.json(
          { error: 'Duplicate purchase detected. Please wait before trying again.' },
          { status: 409 }
        )
      }
    }

    // SECURITY: Validate against predefined packages to prevent price tampering
    const validPackage = validateCreditPurchase({
      packageId: validated.packageId,
      credits: validated.credits,
      amount: validated.amount,
    })

    if (!validPackage) {
      return NextResponse.json(
        {
          error: 'Invalid package',
          message: 'The requested package does not match available credit packages',
        },
        { status: 400 }
      )
    }

    // Create credit purchase record
    const repo = new MarketplaceRepository()
    const creditPurchase = await repo.createCreditPurchase({
      workspaceId: user.workspace_id,
      userId: user.id,
      credits: validated.credits,
      packageName: validated.packageId,
      amountPaid: validated.amount,
      pricePerCredit: validated.amount / validated.credits,
    })

    // Create Stripe checkout session
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${validated.credits} Marketplace Credits`,
              description: `Purchase ${validated.credits} credits for lead marketplace`,
            },
            // SECURITY: Use canonical package price, not client-sent amount
            // (validateCreditPurchase already ensures they match, but defense-in-depth)
            unit_amount: Math.round(validPackage.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'credit_purchase',
        credit_purchase_id: creditPurchase.id,
        workspace_id: user.workspace_id,
        user_id: user.id,
        credits: String(validated.credits),
      },
      success_url: `${origin}/marketplace/credits?success=true&credits=${validated.credits}`,
      cancel_url: `${origin}/marketplace/credits?canceled=true`,
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    safeError('Failed to create credit purchase:', error)
    return handleApiError(error)
  }
}
