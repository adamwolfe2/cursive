// Billing Portal API Route
// POST /api/billing/portal - Create Stripe Customer Portal session

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createPortalSession } from '@/lib/stripe/client'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Check if user has Stripe customer ID
    if (!(user as any).stripe_customer_id) {
      return badRequest('No active subscription found')
    }

    // 3. Create portal session
    const baseUrl = request.nextUrl.origin
    const session = await createPortalSession({
      customerId: (user as any).stripe_customer_id,
      returnUrl: `${baseUrl}/settings/billing`,
    })

    // 4. Return response
    return NextResponse.json({
      success: true,
      url: session.url,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
