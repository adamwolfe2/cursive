// Credit Purchase API
// Creates Stripe checkout session for credit purchases


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
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

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('id, workspace_id, email')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userData?.workspace_id) {
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
        .eq('workspace_id', userData.workspace_id)
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
      workspaceId: userData.workspace_id,
      userId: userData.id,
      credits: validated.credits,
      packageName: validated.packageId,
      amountPaid: validated.amount,
      pricePerCredit: validated.amount / validated.credits,
    })

    // Create Stripe checkout session
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: userData.email || user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${validated.credits} Marketplace Credits`,
              description: `Purchase ${validated.credits} credits for lead marketplace`,
            },
            unit_amount: Math.round(validated.amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'credit_purchase',
        credit_purchase_id: creditPurchase.id,
        workspace_id: userData.workspace_id,
        user_id: userData.id,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create purchase' },
      { status: 500 }
    )
  }
}
