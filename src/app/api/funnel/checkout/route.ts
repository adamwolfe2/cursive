/**
 * Funnel Checkout — creates a Stripe Checkout session for one of three
 * funnel offers (pixel_97 / audience_197 / bundle_247).
 *
 * Pay-first, no auth. Stripe collects email at checkout. The
 * checkout.session.completed webhook handler creates the funnel_orders row
 * and emails the buyer a portal link.
 *
 * Stays on Node.js runtime — Stripe SDK + crypto.
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import {
  FUNNEL_PORTAL_BASE_URL,
  getFunnelOffer,
} from '@/lib/stripe/funnel-products'
import { checkRateLimit } from '@/lib/middleware/rate-limiter'
import { safeError } from '@/lib/utils/log-sanitizer'

// ─── Stripe client (lazy) ────────────────────────────────────────────────
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

const bodySchema = z.object({
  offer: z.enum(['pixel_97', 'audience_197', 'bundle_247']),
})

export async function POST(req: NextRequest) {
  try {
    // Distributed rate limit (Upstash with in-memory fallback) — uses the
    // 'write' tier (30/min/IP). Pre-payment endpoint, no auth.
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    const rl = await checkRateLimit(`funnel-checkout:${ip}`, 'write', 60)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      )
    }

    const json = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid offer selection.' },
        { status: 400 }
      )
    }

    const offer = getFunnelOffer(parsed.data.offer)
    if (!offer) {
      return NextResponse.json({ error: 'Unknown offer.' }, { status: 400 })
    }
    if (!offer.stripePriceId) {
      safeError(
        `[funnel/checkout] Missing Stripe price id for offer ${offer.slug}`
      )
      return NextResponse.json(
        { error: 'This offer is not available right now.' },
        { status: 503 }
      )
    }

    const successUrl = `${FUNNEL_PORTAL_BASE_URL}/funnel/checkout-success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${FUNNEL_PORTAL_BASE_URL}/get-leads?status=cancelled`

    // Note: in `mode: 'subscription'`, Stripe always creates a Customer, so
    // `customer_creation` is not required (and rejected on newer API versions).
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: offer.stripePriceId, quantity: 1 }],
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      metadata: {
        // CRITICAL: webhook handler routes on this exact value
        type: 'funnel_order',
        offer_slug: offer.slug,
        monthly_price_cents: String(offer.monthlyPriceCents),
      },
      subscription_data: {
        metadata: {
          type: 'funnel_order',
          offer_slug: offer.slug,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'Could not create checkout session.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url, session_id: session.id })
  } catch (err) {
    safeError('[funnel/checkout] error:', err)
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 500 }
    )
  }
}
