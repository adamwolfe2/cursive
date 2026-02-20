/**
 * Lead Purchase API - Create Payment Intent
 * POST /api/leads/[id]/purchase
 */


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeClient } from '@/lib/stripe/client'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const stripe = getStripeClient()
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // RATE LIMITING: Check purchase rate limit
    const rateLimitResult = await withRateLimit(request, 'marketplace-purchase')
    if (rateLimitResult) return rateLimitResult

    // Get user profile with subscription check
    const { data: user } = await supabase
      .from('users')
      .select('id, role, active_subscription, workspace_id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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

    // Get lead and verify not already sold
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, business_name, industry, uploaded_by_partner_id, status, marketplace_price')
      .eq('id', id)
      .maybeSingle()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.status === 'sold') {
      return NextResponse.json(
        { error: 'This lead has already been sold' },
        { status: 400 }
      )
    }

    // Use lead's marketplace price (fallback to $0.05 per lead)
    const priceInDollars = lead.marketplace_price || 0.05
    const amountInCents = Math.round(priceInDollars * 100)

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
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
