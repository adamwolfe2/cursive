// Stripe Connect Onboarding API
// POST /api/partner/connect - Initiate Stripe Connect account creation

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe/client'
import { z } from 'zod'

const connectSchema = z.object({
  partnerId: z.string().uuid('Invalid partner ID'),
})

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    // Validate input
    const body = await request.json()
    const { partnerId } = connectSchema.parse(body)

    const supabase = createAdminClient()

    // Get partner details
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, email, company_name, stripe_account_id')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    let accountId = partner.stripe_account_id

    // Create Stripe Connect Express account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: partner.email,
        business_type: 'company',
        company: {
          name: partner.company_name || undefined,
        },
        capabilities: {
          transfers: { requested: true },
        },
        metadata: {
          partner_id: partner.id,
        },
      })

      accountId = account.id

      // Save account ID to database
      await supabase
        .from('partners')
        .update({
          stripe_account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', partner.id)

    }

    // Create Account Link for onboarding
    const baseUrl = request.nextUrl.origin
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/partner/register?refresh=true`,
      return_url: `${baseUrl}/partner/connect/success?partner_id=${partner.id}`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId,
    })
  } catch (error: any) {
    console.error('[Stripe Connect] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors.map(e => e.message).join(', '),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to create Stripe Connect account',
      },
      { status: 500 }
    )
  }
}
