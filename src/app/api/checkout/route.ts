import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    // Initialize Stripe only when the function is called
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia'
    })

    const { leadId, buyerEmail, buyerName, companyName } = await req.json()

    if (!leadId || !buyerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get lead details
    const supabase = createClient()
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from('lead_purchases')
      .select('id')
      .eq('lead_id', leadId)
      .single()

    if (existingPurchase) {
      return NextResponse.json({ error: 'Lead already purchased' }, { status: 400 })
    }

    // Create or get Stripe customer
    let customer
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
          buyer_email: buyerEmail
        }
      })

      // Update buyer with Stripe customer ID
      await supabase
        .from('buyers')
        .upsert({
          email: buyerEmail,
          company_name: companyName || 'Unknown',
          stripe_customer_id: customer.id,
          workspace_id: lead.workspace_id
        }, { onConflict: 'email' })
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
                industry: lead.company_industry || 'N/A'
              }
            },
            unit_amount: 5000 // $50.00
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?success=true&lead_id=${leadId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?canceled=true`,
      metadata: {
        lead_id: leadId,
        buyer_email: buyerEmail,
        company_name: companyName || ''
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
