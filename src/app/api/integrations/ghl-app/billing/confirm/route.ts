/**
 * GHL marketplace — billing confirmation hook.
 *
 * Hit by Stripe Checkout's success_url with session_id. We:
 *   1. Validate the Stripe session was paid
 *   2. POST to GHL's billing webhook to authorize the install
 *   3. Redirect the user to /api/integrations/ghl-app/authorize so OAuth
 *      can complete normally
 *
 * Per GHL docs, the GHL billing webhook is POST to:
 *   https://services.leadconnectorhq.com/oauth/billing/webhook
 *   Headers: x-ghl-client-key, x-ghl-client-secret
 *   Body: { clientId, authType ('location'|'company'), locationId|companyId }
 */

export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe/client'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const GHL_BILLING_WEBHOOK = 'https://services.leadconnectorhq.com/oauth/billing/webhook'

interface GhlBillingContext {
  clientId: string
  installType: 'company' | 'location' | string
  companyId: string | null
  locationId: string | null
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const sessionId = url.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(new URL('/?error=ghl_billing_no_session', url))
  }

  let context: GhlBillingContext | null = null
  try {
    const cookieValue = req.cookies.get('ghl_billing_context')?.value
    if (cookieValue) context = JSON.parse(cookieValue) as GhlBillingContext
  } catch {
    // Malformed cookie — fall through with null context
  }

  if (!context) {
    return NextResponse.redirect(new URL('/?error=ghl_billing_no_context', url))
  }

  // Validate Stripe session
  try {
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      safeError('[ghl-app billing/confirm] session not paid', {
        sessionId,
        status: session.status,
        paymentStatus: session.payment_status,
      })
      return NextResponse.redirect(new URL('/?error=ghl_billing_unpaid', url))
    }
  } catch (err) {
    safeError('[ghl-app billing/confirm] stripe retrieve failed', err)
    return NextResponse.redirect(new URL('/?error=ghl_billing_stripe_lookup_failed', url))
  }

  // POST to GHL billing webhook to authorize install
  const clientKey = process.env.GHL_APP_CLIENT_ID
  const clientSecret = process.env.GHL_APP_CLIENT_SECRET

  if (!clientKey || !clientSecret) {
    safeError('[ghl-app billing/confirm] GHL credentials not configured')
    return NextResponse.redirect(new URL('/?error=ghl_billing_not_configured', url))
  }

  const ghlBody: Record<string, string> = {
    clientId: context.clientId,
    authType: context.installType === 'company' ? 'company' : 'location',
  }
  if (context.locationId) ghlBody.locationId = context.locationId
  if (context.companyId) ghlBody.companyId = context.companyId

  try {
    const ghlRes = await fetch(GHL_BILLING_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ghl-client-key': clientKey,
        'x-ghl-client-secret': clientSecret,
      },
      body: JSON.stringify(ghlBody),
    })

    if (!ghlRes.ok) {
      const text = await ghlRes.text().catch(() => '')
      safeError('[ghl-app billing/confirm] GHL webhook failed', { status: ghlRes.status, text })
      return NextResponse.redirect(new URL('/?error=ghl_billing_webhook_failed', url))
    }

    safeLog('[ghl-app billing/confirm] GHL billing authorized', {
      installType: context.installType,
      companyId: context.companyId,
      locationId: context.locationId,
    })
  } catch (err) {
    safeError('[ghl-app billing/confirm] GHL webhook threw', err)
    return NextResponse.redirect(new URL('/?error=ghl_billing_webhook_threw', url))
  }

  // Clear the context cookie + redirect to OAuth authorize
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com').replace(/\/$/, '')
  const response = NextResponse.redirect(`${baseUrl}/api/integrations/ghl-app/authorize`)
  response.cookies.set('ghl_billing_context', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
