/**
 * Funnel Checkout Redirect — form-submission-friendly Stripe session creator.
 *
 * Sibling to /api/funnel/checkout (JSON). The difference: this route accepts
 * form-encoded body and returns a 303 redirect straight to the Stripe URL,
 * so it can be invoked from a <form method="POST" target="_blank"> — which
 * browsers treat as a primary user gesture and never popup-block.
 *
 * Same auth model (none — pay-first), same rate-limit, same metadata shape.
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  FUNNEL_PORTAL_BASE_URL,
  getFunnelOffer,
} from '@/lib/stripe/funnel-products'
import { checkRateLimit } from '@/lib/middleware/rate-limiter'
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

async function handleCheckoutRedirect(req: NextRequest, offerSlug: string): Promise<NextResponse> {
  // Same Upstash rate-limit as the JSON route — 30/min/IP write tier.
  const forwardedFor = req.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
  const rl = await checkRateLimit(`funnel-checkout:${ip}`, 'write', 60)
  if (!rl.success) {
    return redirectToLandingWithError('rate_limit')
  }

  const offer = getFunnelOffer(offerSlug)
    if (!offer) {
      return redirectToLandingWithError('unknown_offer')
    }
    if (!offer.stripePriceId) {
      safeError(
        `[funnel/checkout-redirect] Missing Stripe price id for offer ${offer.slug}`
      )
      return redirectToLandingWithError('unavailable')
    }

    const successUrl = `${FUNNEL_PORTAL_BASE_URL}/funnel/checkout-success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${FUNNEL_PORTAL_BASE_URL}/get-leads?status=cancelled`

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: offer.stripePriceId, quantity: 1 }],
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      metadata: {
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
      return redirectToLandingWithError('session_create_failed')
    }

  // 303 See Other: after a POST, redirect with GET. Browsers handle this
  // cleanly and the new tab lands directly on Stripe Checkout.
  return NextResponse.redirect(session.url, 303)
}

// POST: invoked by the <form method="POST" target="_blank"> on /get-leads.
// Form submission with target="_blank" is the most popup-blocker-resistant
// way to open a new tab — browsers treat it as a primary user gesture.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData().catch(() => null)
    const offerSlug = form?.get('offer')?.toString() ?? ''
    return await handleCheckoutRedirect(req, offerSlug)
  } catch (err) {
    safeError('[funnel/checkout-redirect POST] error:', err)
    return redirectToLandingWithError('internal')
  }
}

// GET: same-tab fallback. If the new-tab form submit gets blocked by a
// hardened browser/extension/corporate policy, the page shows a fallback
// link that hits this route as a plain navigation. No popup blocker can
// stop a regular <a href> click.
export async function GET(req: NextRequest) {
  try {
    const offerSlug = req.nextUrl.searchParams.get('offer') ?? ''
    return await handleCheckoutRedirect(req, offerSlug)
  } catch (err) {
    safeError('[funnel/checkout-redirect GET] error:', err)
    return redirectToLandingWithError('internal')
  }
}

function redirectToLandingWithError(code: string): NextResponse {
  return NextResponse.redirect(
    `${FUNNEL_PORTAL_BASE_URL}/get-leads?error=${encodeURIComponent(code)}`,
    303
  )
}
