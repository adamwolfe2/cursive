/**
 * Lead Purchase API - Create Payment Intent
 * POST /api/leads/[id]/purchase
 */


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { unauthorized } from '@/lib/utils/api-error-handler'
import { getStripeClient } from '@/lib/stripe/client'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { safeError } from '@/lib/utils/log-sanitizer'
import { isStripeError } from '@/lib/utils/error-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const stripe = getStripeClient()
    const supabase = await createClient()

    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // RATE LIMITING: Check purchase rate limit
    const rateLimitResult = await withRateLimit(request, 'marketplace-purchase')
    if (rateLimitResult) return rateLimitResult

    // Verify business user with active subscription
    if (!['owner', 'admin', 'member'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only business users can purchase leads' },
        { status: 403 }
      )
    }

    if (!user.active_subscription) {
      return NextResponse.json(
        { error: 'Active subscription required to purchase leads' },
        { status: 403 }
      )
    }

    // Get lead and verify it is marketplace-listed, not already sold, and not owned by the buyer
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, business_name, industry, uploaded_by_partner_id, status, marketplace_price, is_marketplace_listed, sold_at, workspace_id')
      .eq('id', id)
      .eq('is_marketplace_listed', true)
      .maybeSingle()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Prevent purchasing a lead that has already been sold
    if (lead.sold_at !== null || lead.status === 'sold') {
      return NextResponse.json(
        { error: 'This lead has already been sold' },
        { status: 400 }
      )
    }

    // Prevent a workspace from purchasing its own leads
    if (lead.workspace_id && lead.workspace_id === user.workspace_id) {
      return NextResponse.json(
        { error: 'You cannot purchase leads from your own workspace' },
        { status: 403 }
      )
    }

    // Use lead's marketplace price (fallback to $0.05 per lead)
    const priceInDollars = lead.marketplace_price || 0.05
    const amountInCents = Math.round(priceInDollars * 100)

    // Create Stripe payment intent
    let paymentIntent
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: {
          type: 'lead_purchase',
          lead_id: id,
          buyer_user_id: user.id,
          buyer_workspace_id: user.workspace_id,
          partner_id: lead.uploaded_by_partner_id || 'none',
          company_name: lead.business_name || 'Unknown',
        },
        description: `Lead purchase: ${lead.business_name || 'Unknown'} (${lead.industry || 'N/A'})`,
      })
    } catch (stripeErr: unknown) {
      if (isStripeError(stripeErr) && stripeErr.type.startsWith('Stripe')) {
        safeError('[Lead Purchase] Stripe error:', stripeErr.message)
        return NextResponse.json(
          { error: 'Payment processing failed. Please try again or contact support.' },
          { status: 400 }
        )
      }
      throw stripeErr
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    safeError('[Lead Purchase] Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
