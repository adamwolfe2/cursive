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
    // checkout. Provisioning is collision-safe (S1): if the checkout email
    // matches a pre-existing account it returns null and we fall back to the
    // token portal — never auto-login onto someone else's account.
    if (!order.workspace_id) {
      const provisioned = await provisionFunnelWorkspace(order)
      if (!provisioned) {
        // Can't reach the dashboard — fall back to the token portal, which
        // delivers fulfillment without an account.
        return NextResponse.redirect(new URL(portalUrlForToken(token), APP_URL))
      }
    }

    const admin = createAdminClient()

    // S1 takeover gate (defense in depth): only mint a session into a workspace
    // that THIS funnel order provisioned. Re-read the order's workspace and
    // confirm it is funnel-sourced for this exact order id. This blocks any
    // legacy order that the old email-reuse path linked to a pre-existing /
    // marketplace workspace from ever minting that account's session.
    const { data: freshOrderRow } = await admin
      .from('funnel_orders')
      .select('workspace_id')
      .eq('id', order.id)
      .maybeSingle()
    const wsId =
      (freshOrderRow as { workspace_id: string | null } | null)?.workspace_id ?? null
    if (!wsId) {
      return NextResponse.redirect(new URL(portalUrlForToken(token), APP_URL))
    }
    const { data: wsRow } = await admin
      .from('workspaces')
      .select('settings')
      .eq('id', wsId)
      .maybeSingle()
    const wsFunnelOrderId = (
      wsRow?.settings as { funnel_order_id?: string } | null
    )?.funnel_order_id
    if (wsFunnelOrderId !== order.id) {
      safeError(
        '[funnel/dashboard-login] blocked: order workspace was not provisioned for this order — refusing auto-login',
        { order_id: order.id }
      )
      return NextResponse.redirect(new URL(portalUrlForToken(token), APP_URL))
    }

    // Bind the session to the workspace's OWNER identity — never to a
    // free-floating email string. Resolve the owner's auth_user_id, then
    // confirm that auth account's CURRENT verified email still equals this
    // order's buyer email. This guarantees the magic link we mint authenticates
    // exactly the account that owns this funnel workspace (not whoever a
    // reassigned/garbled email might point at later).
    const orderEmail = normalizeEmail(order.customer_email)

    const { data: ownerRow } = await admin
      .from('users')
      .select('auth_user_id')
      .eq('workspace_id', wsId)
      .eq('role', 'owner')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    const ownerAuthUserId =
      (ownerRow as { auth_user_id: string | null } | null)?.auth_user_id ?? null

    if (!ownerAuthUserId) {
      safeError(
        '[funnel/dashboard-login] blocked: no owner for order workspace — refusing auto-login',
        { order_id: order.id }
      )
      return NextResponse.redirect(new URL(portalUrlForToken(token), APP_URL))
    }

    const { data: ownerAuth } = await admin.auth.admin.getUserById(ownerAuthUserId)
    const ownerEmail = ownerAuth?.user?.email
      ? normalizeEmail(ownerAuth.user.email)
      : null
    // The owner's auth email must be CONFIRMED — never mint a session for an
    // account whose email ownership was never verified.
    const ownerEmailConfirmed = !!ownerAuth?.user?.email_confirmed_at

    if (!ownerEmail || ownerEmail !== orderEmail || !ownerEmailConfirmed) {
      // The workspace owner's auth account no longer matches this order's buyer
      // (or its email is unconfirmed) — refuse rather than mint a session for a
      // drifted/unverified identity.
      safeError(
        '[funnel/dashboard-login] blocked: workspace owner identity not a verified match for order buyer — refusing auto-login',
        { order_id: order.id }
      )
      return NextResponse.redirect(new URL(portalUrlForToken(token), APP_URL))
    }

    const email = ownerEmail

    // Mint a single-use magic link for the verified workspace owner.
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
    const { data: verifiedData, error: verifyErr } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: tokenHash,
    })
    if (verifyErr) {
      safeError('[funnel/dashboard-login] verifyOtp failed:', verifyErr)
      return NextResponse.redirect(new URL(portalUrlForToken(token), APP_URL))
    }

    // FINAL binding check: the session we just minted MUST belong to the exact
    // workspace owner we resolved by id. Defends against a concurrent email
    // reassignment between resolution and mint (TOCTOU) — the session cookies
    // were written onto `response`, which we DISCARD on mismatch, so the bad
    // session is never delivered to the browser.
    if (verifiedData?.user?.id !== ownerAuthUserId) {
      safeError(
        '[funnel/dashboard-login] blocked: minted session identity != resolved workspace owner — refusing',
        { order_id: order.id }
      )
      return NextResponse.redirect(new URL(portalUrlForToken(token), APP_URL))
    }

    return response
  } catch (err) {
    safeError('[funnel/dashboard-login] error:', err)
    return loginError('login_failed')
  }
}
