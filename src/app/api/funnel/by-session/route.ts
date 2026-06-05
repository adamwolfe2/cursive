/**
 * GET /api/funnel/by-session?session_id=...
 *
 * Used by the checkout-success poller. Returns the portal URL for a given
 * Stripe session_id once the webhook has created the order + token.
 * Returns 404 while waiting; never returns 5xx for "not yet" so the poller
 * keeps retrying.
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import {
  getOrderByStripeSession,
  getPortalTokenForOrder,
  portalUrlForToken,
} from '@/lib/funnel/order.service'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    const order = await getOrderByStripeSession(sessionId)
    if (!order) {
      return NextResponse.json({ ready: false }, { status: 404 })
    }

    const token = await getPortalTokenForOrder(order.id)
    if (!token) {
      return NextResponse.json({ ready: false }, { status: 404 })
    }

    return NextResponse.json({ portal_url: portalUrlForToken(token.token) })
  } catch (err) {
    safeError('[funnel/by-session] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
