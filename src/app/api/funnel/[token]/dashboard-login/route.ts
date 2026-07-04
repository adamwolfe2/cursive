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
import { sendMagicLoginLinkEmail } from '@/lib/email/templates/magic-login-link'
import { APP_URL } from '@/lib/config/urls'
import { safeError } from '@/lib/utils/log-sanitizer'

function loginError(reason: string): NextResponse {
  return NextResponse.redirect(new URL(`/login?error=${reason}`, APP_URL))
}

/**
 * Deliver a REAL magic link to the buyer's mailbox (Supabase generateLink +
 * our email template), rather than server-consuming it and handing the session
 * to whoever holds the portal token. Used for any order NOT bound to a
 * funnel-provisioned workspace — so an unverified Stripe email can never obtain
 * a session for a pre-existing (marketplace/admin) account.
 */
async function sendMailboxMagicLink(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<void> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) {
    safeError('[funnel/dashboard-login] mailbox generateLink failed:', error)
    return
  }
  const loginUrl = `${APP_URL}/auth/confirm?token_hash=${encodeURIComponent(
    tokenHash
  )}&next=/dashboard`
  await sendMagicLoginLinkEmail({ to: email, loginUrl })
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

    const { order } = result.data

    const email = normalizeEmail(order.customer_email)
    const admin = createAdminClient()

    // Ensure the dashboard workspace + auth user exist (idempotent). Covers
    // orders created before provisioning ran, or a provisioning hiccup at
    // checkout. Returns null when provisioning REFUSES (email already owns a
    // non-funnel workspace — see workspace-provision P0 fix).
    let workspaceId = order.workspace_id
    if (!workspaceId) {
      const provisioned = await provisionFunnelWorkspace(order)
      workspaceId = provisioned?.workspaceId ?? null
    }

    // SECURITY (P0 account-takeover fix): a server-consumed one-click session is
    // only safe when this order is bound to a workspace THIS funnel flow
    // provisioned (settings.source === 'funnel_order'). The Stripe email is
    // buyer-controlled and unverified, so for a pre-existing (marketplace/admin)
    // workspace — or when provisioning refused/failed — we must NOT hand the
    // browser a session. Instead deliver a REAL magic link to the mailbox so
    // only its owner can authenticate.
    let funnelSourced = false
    if (workspaceId) {
      const { data: ws } = await admin
        .from('workspaces')
        .select('settings')
        .eq('id', workspaceId)
        .maybeSingle()
      funnelSourced =
        (ws?.settings as { source?: string } | null)?.source === 'funnel_order'
    }

    if (!funnelSourced) {
      await sendMailboxMagicLink(admin, email).catch((e) =>
        safeError('[funnel/dashboard-login] mailbox magic link failed:', e)
      )
      return NextResponse.redirect(
        new URL('/login?reason=magic_link_sent', APP_URL)
      )
    }

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
