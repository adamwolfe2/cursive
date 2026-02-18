
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceCheckout } from '@/lib/stripe/service-checkout'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

const checkoutSchema = z.object({
  tier_slug: z.string().min(1, 'Tier slug is required'),
  negotiated_monthly_price: z.number()
    .positive('Price must be positive')
    .finite('Price must be a valid number')
    .max(1000000, 'Price exceeds maximum limit')
    .optional(),
  success_url: z.string().url('Invalid success URL').optional(),
  cancel_url: z.string().url('Invalid cancel URL').optional()
})

/**
 * POST /api/services/checkout
 * Create a Stripe Checkout session for purchasing a service tier
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

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id, workspaces(billing_email)')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData || !userData.workspace_id) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const workspaceId = userData.workspace_id

    // Check if workspace already has an active subscription
    const existingSubscription = await serviceTierRepository.getWorkspaceActiveSubscription(workspaceId)
    if (existingSubscription) {
      return NextResponse.json(
        { error: 'You already have an active service subscription. Please cancel it before purchasing a new one.' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validated = checkoutSchema.parse(body)

    // Verify tier is public (or user has permission)
    const tier = await serviceTierRepository.getTierBySlug(validated.tier_slug)

    if (!tier) {
      return NextResponse.json(
        { error: 'Service tier not found' },
        { status: 404 }
      )
    }

    if (!tier.is_public) {
      return NextResponse.json(
        { error: 'This service tier requires contacting sales' },
        { status: 403 }
      )
    }

    // Get billing email
    const billingEmail = (userData.workspaces as any)?.billing_email || user.email

    // Create Stripe Checkout session
    const checkoutResult = await createServiceCheckout({
      workspaceId,
      userId: user.id,
      serviceTierSlug: validated.tier_slug,
      negotiatedMonthlyPrice: validated.negotiated_monthly_price,
      billingEmail: billingEmail || undefined,
      successUrl: validated.success_url,
      cancelUrl: validated.cancel_url
    })

    return NextResponse.json({
      success: true,
      checkout_url: checkoutResult.checkout_url,
      session_id: checkoutResult.session_id
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    safeError('[Service Checkout] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
