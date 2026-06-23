
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceCheckout } from '@/lib/stripe/service-checkout'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

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
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const workspaceId = user.workspace_id

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

    // Affiliate attribution: pass the cursive_ref cookie so the partner is credited
    // for this service subscription (first payment AND renewals). Previously this was
    // never passed, so service purchases silently earned the referring partner nothing.
    const affiliateRefCode = request.cookies.get('cursive_ref')?.value || undefined

    // Create Stripe Checkout session
    const checkoutResult = await createServiceCheckout({
      workspaceId,
      userId: user.auth_user_id,
      serviceTierSlug: validated.tier_slug,
      negotiatedMonthlyPrice: validated.negotiated_monthly_price,
      billingEmail: user.email || undefined,
      successUrl: validated.success_url,
      cancelUrl: validated.cancel_url,
      affiliateRefCode,
    })

    return NextResponse.json({
      success: true,
      checkout_url: checkoutResult.checkout_url,
      session_id: checkoutResult.session_id
    })
  } catch (error) {
    return handleApiError(error)
  }
}
