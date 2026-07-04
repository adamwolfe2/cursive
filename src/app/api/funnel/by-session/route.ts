/**
 * GET /api/funnel/by-session?session_id=...
 *
 * Used by the checkout-success poller to learn when the webhook has created the
 * order + portal token. Returns a bounded readiness signal ONLY.
 *
 * SECURITY (P1): this endpoint is UNAUTHENTICATED and keyed only on a Stripe
 * session_id that rides in the success-page URL — it leaks via Referer headers
 * and browser history. It therefore must NEVER return the raw portal token /
 * portal_url, because that token IS a full login. We return readiness + a masked
 * email; the real portal + dashboard links are delivered by the confirmation
 * email to the buyer's mailbox.
 *
 * Returns 404 while waiting; never returns 5xx for "not yet" so the poller keeps
 * retrying.
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import {
  getOrderByStripeSession,
  getPortalTokenForOrder,
} from '@/lib/funnel/order.service'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { safeError } from '@/lib/utils/log-sanitizer'

/** Mask an email for display: j***@example.com. Never reveals the full local part. */
function maskEmail(raw: string): string {
  const [local, domain] = raw.split('@')
  if (!domain) return '***'
  const head = local.slice(0, 1)
  return `${head}***@${domain}`
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  return (fwd ? fwd.split(',')[0]?.trim() : '') || 'unknown'
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    // Rate limit per-IP: the legit poller fires ~30/min for one session; anything
    // materially faster is enumeration of session_ids and is rejected.
    const rl = checkRateLimit(`funnel_by_session:${clientIp(req)}`, {
      windowMs: 60 * 1000,
      max: 120,
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      )
    }

    const order = await getOrderByStripeSession(sessionId)
    if (!order) {
      return NextResponse.json({ ready: false }, { status: 404 })
    }

    const token = await getPortalTokenForOrder(order.id)
    if (!token) {
      return NextResponse.json({ ready: false }, { status: 404 })
    }

    // Ready — but return ONLY a readiness boolean + masked email. The actual
    // login link is emailed, never handed to this session-id-keyed URL.
    return NextResponse.json({
      ready: true,
      email_masked: maskEmail(order.customer_email),
    })
  } catch (err) {
    safeError('[funnel/by-session] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
