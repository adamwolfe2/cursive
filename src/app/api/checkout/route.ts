/**
 * Checkout API Route
 * Cursive Platform
 *
 * Creates Stripe checkout sessions for lead purchases.
 * Requires authenticated user.
 */


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { getStripeClient } from '@/lib/stripe/client'
import type Stripe from 'stripe'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

// Request validation schema
const checkoutSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  buyerEmail: z.string().email('Invalid email address'),
  buyerName: z.string().optional(),
  companyName: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await fastAuth(req)
    if (!user) return unauthorized()

    const stripe = getStripeClient()
    const supabase = await createClient()

    // Validate request body
    const body = await req.json()
    const { leadId, buyerEmail, buyerName, companyName } = checkoutSchema.parse(body)

    // Get lead details - ensure user has access to this lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, workspace_id, company_name, company_industry, company_location')
      .eq('id', leadId)
      .eq('workspace_id', user.workspaceId)
      .maybeSingle()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from('lead_purchases')
      .select('id')
      .eq('lead_id', leadId)
      .maybeSingle()

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'Lead already purchased' },
        { status: 400 }
      )
    }

    // Create or get Stripe customer
    let customer: Stripe.Customer | Stripe.DeletedCustomer
    const { data: existingCustomer } = await supabase
      .from('buyers')
      .select('stripe_customer_id')
      .eq('email', buyerEmail)
      .maybeSingle()

    if (existingCustomer?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(existingCustomer.stripe_customer_id)
    } else {
      customer = await stripe.customers.create({
        email: buyerEmail,
        name: buyerName || companyName,
        metadata: {
          company_name: companyName || '',
          buyer_email: buyerEmail,
          user_id: user.userId,
        },
      })

      // Update buyer with Stripe customer ID
      await supabase
        .from('buyers')
        .upsert(
          {
            email: buyerEmail,
            company_name: companyName || 'Unknown',
            stripe_customer_id: customer.id,
            workspace_id: lead.workspace_id,
          },
          { onConflict: 'email' }
        )
    }

    // Read affiliate ref code from cookie for attribution fallback
    const affiliateRefCode = req.cookies.get('cursive_ref')?.value ?? ''

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Lead: ${lead.company_name}`,
              description: `${lead.company_industry || 'Industry'} - ${lead.company_location?.state || 'N/A'}`,
              metadata: {
                lead_id: leadId,
                company_name: lead.company_name,
                industry: lead.company_industry || 'N/A',
              },
            },
            unit_amount: 5000, // $50.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?success=true&lead_id=${leadId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?canceled=true`,
      metadata: {
        lead_id: leadId,
        buyer_email: buyerEmail,
        company_name: companyName || '',
        user_id: user.userId,
        workspace_id: user.workspaceId,
        affiliate_ref_code: affiliateRefCode,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
