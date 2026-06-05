/**
 * POST /api/funnel/[token]/billing-portal
 *
 * Returns a Stripe Customer Portal session URL so funnel buyers can
 * self-serve card updates, invoice downloads, and cancellation.
 * Token-gated: looks up the order by portal token, then creates a session
 * scoped to that order's Stripe customer.
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  getOrderByToken,
  portalUrlForToken,
} from '@/lib/funnel/order.service'
import { safeError } from '@/lib/utils/log-sanitizer'

let stripeClient: Stripe | null = null
function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
  }
  return stripeClient
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const lookup = await getOrderByToken(token)

    if (!lookup.ok) {
      return NextResponse.json(
        { error: 'Link no longer valid' },
        { status: lookup.error === 'not_found' ? 404 : 403 }
      )
    }

    const { order } = lookup.data

    if (!order.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account on this order.' },
        { status: 409 }
      )
    }

    // Customer Portal returns the buyer to their funnel portal after they're done
    const returnUrl = portalUrlForToken(token)

    const session = await getStripe().billingPortal.sessions.create({
      customer: order.stripe_customer_id,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    safeError('[funnel/billing-portal] error:', err)
    return NextResponse.json(
      { error: 'Could not open billing portal. Please try again.' },
      { status: 500 }
    )
  }
}
