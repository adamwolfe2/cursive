/**
 * Checkout API Route
 * Cursive Platform
 *
 * Creates Stripe checkout sessions for lead purchases.
 * Requires authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Stripe from 'stripe'
import { z } from 'zod'

// Request validation schema
const checkoutSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  buyerEmail: z.string().email('Invalid email address'),
  buyerName: z.string().optional(),
  companyName: z.string().optional(),
})

/**
 * Get authenticated user from session
 */
async function getAuthenticatedUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore - called from Server Component
          }
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  // Get user with workspace
  const { data: user } = await supabase
    .from('users')
    .select('id, workspace_id, email')
    .eq('auth_user_id', session.user.id)
    .single()

  return user
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate request body
    const body = await req.json()
    const validation = checkoutSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { leadId, buyerEmail, buyerName, companyName } = validation.data

    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })

    // Create admin Supabase client for database operations
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore
            }
          },
        },
      }
    )

    // Get lead details - ensure user has access to this lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

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
      .single()

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
      .single()

    if (existingCustomer?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(existingCustomer.stripe_customer_id)
    } else {
      customer = await stripe.customers.create({
        email: buyerEmail,
        name: buyerName || companyName,
        metadata: {
          company_name: companyName || '',
          buyer_email: buyerEmail,
          user_id: user.id,
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
        user_id: user.id,
        workspace_id: user.workspace_id,
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
  } catch (error: any) {
    console.error('[Checkout] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
