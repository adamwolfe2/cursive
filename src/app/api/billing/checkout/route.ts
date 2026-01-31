// Billing Checkout API Route
// POST /api/billing/checkout - Create Stripe Checkout session

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createCheckoutSession } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const checkoutSchema = z.object({
  priceId: z.string().optional(),
  planName: z.string().optional(),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input with Zod
    const body = await request.json()
    const { priceId, planName, billingPeriod } = checkoutSchema.parse(body)

    // 3. Get price ID - either from request or from database plan
    let finalPriceId = priceId

    if (!finalPriceId && planName) {
      // Look up price ID from subscription_plans table
      const supabase = await createClient()
      const priceColumn = billingPeriod === 'monthly'
        ? 'stripe_price_id_monthly'
        : 'stripe_price_id_yearly'

      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select(`name, ${priceColumn}`)
        .eq('name', planName)
        .single()

      if (planError || !plan) {
        return NextResponse.json(
          { error: 'Plan not found' },
          { status: 404 }
        )
      }

      finalPriceId = billingPeriod === 'monthly'
        ? plan.stripe_price_id_monthly
        : plan.stripe_price_id_yearly
    }

    if (!finalPriceId) {
      return NextResponse.json(
        {
          error: 'Stripe Price ID not configured for this plan. Please contact support.',
          details: 'The administrator needs to configure Stripe Price IDs in the subscription_plans table.'
        },
        { status: 500 }
      )
    }

    // 4. Check if user already has an active subscription
    const supabase = await createClient()
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('status, plan_id')
      .eq('workspace_id', user.workspace_id)
      .in('status', ['active', 'trialing'])
      .single()

    if (existingSubscription) {
      return badRequest('You already have an active subscription. Please manage your subscription from the billing page.')
    }

    // 5. Create checkout session
    const baseUrl = request.nextUrl.origin
    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      workspaceId: user.workspace_id,
      priceId: finalPriceId,
      successUrl: `${baseUrl}/dashboard?checkout=success`,
      cancelUrl: `${baseUrl}/pricing?checkout=cancelled`,
    })

    // 6. Return response
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
