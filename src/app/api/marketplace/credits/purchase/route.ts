// Credit Purchase API
// Creates Stripe checkout session for credit purchases

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

const purchaseSchema = z.object({
  packageId: z.string(),
  credits: z.number().positive(),
  amount: z.number().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('id, workspace_id, email')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = purchaseSchema.parse(body)

    // Create credit purchase record
    const repo = new MarketplaceRepository()
    const creditPurchase = await repo.createCreditPurchase({
      workspaceId: userData.workspace_id,
      userId: userData.id,
      credits: validated.credits,
      packageName: validated.packageId,
      amountPaid: validated.amount,
      pricePerCredit: validated.amount / validated.credits,
    })

    // Create Stripe checkout session
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: userData.email || user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${validated.credits} Marketplace Credits`,
              description: `Purchase ${validated.credits} credits for lead marketplace`,
            },
            unit_amount: Math.round(validated.amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'credit_purchase',
        credit_purchase_id: creditPurchase.id,
        workspace_id: userData.workspace_id,
        user_id: userData.id,
        credits: String(validated.credits),
      },
      success_url: `${origin}/marketplace/credits?success=true&credits=${validated.credits}`,
      cancel_url: `${origin}/marketplace/credits?canceled=true`,
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Failed to create credit purchase:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create purchase' },
      { status: 500 }
    )
  }
}
