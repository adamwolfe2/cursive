/**
 * GHL marketplace — external billing entry point.
 *
 * Per PRD §F8 + GHL marketplace billing docs, when an agency clicks Install
 * on a paid GHL marketplace app with External Billing, GHL redirects them
 * here BEFORE the OAuth consent flow.
 *
 * Query params from GHL:
 *   clientId      — our app's GHL client ID
 *   installType   — 'company' or 'location'
 *   companyId     — agency company ID (for agency install)
 *   locationId    — sub-account ID (for location install)
 *
 * We:
 *   1. Persist the install context in a short-lived cookie
 *   2. Redirect to Stripe Checkout for the appropriate plan
 *   3. On Stripe success, /billing/confirm POSTs to GHL's billing webhook
 *      to authorize the install, then redirects to OAuth authorize.
 */

export const runtime = 'nodejs'
export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/client'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const clientId = url.searchParams.get('clientId')
  const installType = url.searchParams.get('installType')
  const companyId = url.searchParams.get('companyId')
  const locationId = url.searchParams.get('locationId')

  if (!clientId || !installType) {
    return NextResponse.json(
      { error: 'Missing required GHL billing params' },
      { status: 400 },
    )
  }

  if (clientId !== process.env.GHL_APP_CLIENT_ID) {
    safeError('[ghl-app billing] clientId mismatch', { clientId })
    return NextResponse.json({ error: 'clientId mismatch' }, { status: 400 })
  }

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com').replace(/\/$/, '')
  const stripePriceId = process.env.STRIPE_PRICE_GHL_AGENCY
  const billingEmail = `${(companyId ?? locationId ?? 'install')}@ghl-install.meetcursive.com`

  if (!stripePriceId) {
    safeError('[ghl-app billing] STRIPE_PRICE_GHL_AGENCY not configured')
    return NextResponse.json(
      { error: 'GHL billing not configured. Set STRIPE_PRICE_GHL_AGENCY.' },
      { status: 503 },
    )
  }

  // Persist GHL install context — read by /billing/confirm after Stripe success
  const ghlContext = JSON.stringify({
    clientId,
    installType,
    companyId: companyId ?? null,
    locationId: locationId ?? null,
  })

  try {
    const session = await createCheckoutSession({
      userId: 'pending-ghl-install',
      userEmail: billingEmail,
      workspaceId: 'pending-ghl-install',
      priceId: stripePriceId,
      successUrl: `${baseUrl}/api/integrations/ghl-app/billing/confirm?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/api/integrations/ghl-app/billing/cancel`,
    })

    if (!session.url) {
      throw new Error('Stripe Checkout session has no url')
    }

    const response = NextResponse.redirect(session.url)
    response.cookies.set('ghl_billing_context', ghlContext, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 1800, // 30 minutes
      path: '/',
    })

    return response
  } catch (err) {
    safeError('[ghl-app billing] checkout creation failed', err)
    return NextResponse.redirect(new URL('/?error=ghl_billing_failed', url))
  }
}
