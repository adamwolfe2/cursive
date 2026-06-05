/**
 * GET /api/funnel/[token]/dashboard-login
 *
 * One-click, passwordless login into the full dashboard for a funnel buyer.
 * The portal token IS the authorization (256-bit, unguessable, revocable,
 * expiring) — so we exchange it for a Supabase session server-side:
 *
 *   1. validate the portal token → resolve the order + buyer email
 *   2. ensure the buyer's workspace/auth user exist (provision on demand)
 *   3. mint a magic link (admin.generateLink) and CONSUME it in the same
 *      request via verifyOtp(token_hash) — so no token is ever emailed or
 *      left dangling for link-scanners to burn
 *   4. set the session cookies on a redirect to /dashboard
 *
 * Node runtime: uses the service-role admin client + Supabase auth admin.
 */
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getOrderByToken,
  normalizeEmail,
  portalUrlForToken,
} from '@/lib/funnel/order.service'
import { provisionFunnelWorkspace } from '@/lib/funnel/workspace-provision'
import { APP_URL } from '@/lib/config/urls'
import { safeError } from '@/lib/utils/log-sanitizer'

function loginError(reason: string): NextResponse {
  return NextResponse.redirect(new URL(`/login?error=${reason}`, APP_URL))
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const result = await getOrderByToken(token)
    if (!result.ok) {
      // Expired/revoked/not-found — send them somewhere sane.
      return loginError(
        result.error === 'expired' ? 'link_expired' : 'invalid_link'
      )
    }

    let { order } = result.data

    // Ensure the dashboard workspace + auth user exist (idempotent). Covers
    // orders created before provisioning ran, or a provisioning hiccup at
    // checkout.
    if (!order.workspace_id) {
      const provisioned = await provisionFunnelWorkspace(order)
      if (!provisioned) {
        // Can't reach the dashboard — fall back to the token portal, which
        // delivers fulfillment without an account.
        return NextResponse.redirect(new URL(portalUrlForToken(token), APP_URL))
      }
    }

    const email = normalizeEmail(order.customer_email)
    const admin = createAdminClient()

    // Mint a single-use magic link for this buyer.
    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })
    const tokenHash = linkData?.properties?.hashed_token
    if (linkErr || !tokenHash) {
      safeError('[funnel/dashboard-login] generateLink failed:', linkErr)
      return NextResponse.redirect(new URL(portalUrlForToken(token), APP_URL))
    }

    // Build the redirect first so the SSR client can write session cookies onto it.
    const response = NextResponse.redirect(new URL('/dashboard', APP_URL))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return _req.cookies.getAll()
          },
          setAll(
            cookiesToSet: {
              name: string
              value: string
              options?: Record<string, unknown>
            }[]
          ) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(
                name,
                value,
                options as Parameters<typeof response.cookies.set>[2]
              )
            )
          },
        },
      }
    )

    // Consume the magic link immediately → sets the session on `response`.
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: tokenHash,
    })
    if (verifyErr) {
      safeError('[funnel/dashboard-login] verifyOtp failed:', verifyErr)
      return NextResponse.redirect(new URL(portalUrlForToken(token), APP_URL))
    }

    return response
  } catch (err) {
    safeError('[funnel/dashboard-login] error:', err)
    return loginError('login_failed')
  }
}
