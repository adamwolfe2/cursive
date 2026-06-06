/**
 * POST /api/auth/magic-link  { email }
 *
 * Passwordless login: emails the requester a one-time login link. Designed for
 * buyers provisioned without a password (e.g. funnel buyers) so they can return
 * to the dashboard any time, not just via the original portal email.
 *
 * Always returns a generic success (never reveals whether an account exists),
 * and is rate-limited to prevent abuse / email bombing.
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  withRateLimit,
  getRequestIdentifier,
} from '@/lib/middleware/rate-limiter'
import { sendMagicLoginLinkEmail } from '@/lib/email/templates/magic-login-link'
import { APP_URL } from '@/lib/config/urls'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const schema = z.object({
  email: z
    .string()
    .email()
    .transform((e) => e.trim().toLowerCase()),
})

// Generic response - identical whether or not the account exists. A factory
// (not a shared instance) so each request gets its own Response object.
const generic = () =>
  NextResponse.json({
    ok: true,
    message: "If an account exists for that email, we've sent a login link.",
  })

export async function POST(request: NextRequest) {
  try {
    const limited = await withRateLimit(
      request,
      'auth-login',
      getRequestIdentifier(request)
    )
    if (limited) return limited

    const body = await request.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      )
    }
    const { email } = parsed.data

    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    const tokenHash = data?.properties?.hashed_token
    if (error || !tokenHash) {
      // No such user, or generateLink failed - stay generic, don't leak.
      safeLog('[auth/magic-link] no link issued (generic response returned)')
      return generic()
    }

    const loginUrl = `${APP_URL}/auth/confirm?token_hash=${encodeURIComponent(
      tokenHash
    )}&next=/dashboard`

    await sendMagicLoginLinkEmail({ to: email, loginUrl })
    safeLog('[auth/magic-link] login link sent')
    return generic()
  } catch (err) {
    safeError('[auth/magic-link] error:', err)
    // Still generic to the caller - don't expose internals.
    return generic()
  }
}
