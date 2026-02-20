
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { safeError } from '@/lib/utils/log-sanitizer'

// Lazy-load Stripe to avoid build-time initialization
let stripeClient: Stripe | null = null
function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
  }
  return stripeClient
}

const portalSchema = z.object({
  workspace_id: z.string().uuid()
})

/**
 * POST /api/services/customer-portal
 * Create Stripe Customer Portal session
 * Allows customer to manage payment method and cancel subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validated = portalSchema.parse(body)

    // Verify user has access to this workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userData || userData.workspace_id !== validated.workspace_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get subscription to find Stripe customer ID
    const { data: subscription } = await supabase
      .from('service_subscriptions')
      .select('stripe_customer_id')
      .eq('workspace_id', validated.workspace_id)
      .maybeSingle()

    if (!subscription || !subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Create Stripe Customer Portal session
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/services/manage`,
    })

    return NextResponse.json({
      url: portalSession.url
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    safeError('[Customer Portal] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
