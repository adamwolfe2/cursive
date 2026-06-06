/**
 * GET /auth/confirm?token_hash=...&next=/dashboard
 *
 * Consumes a magic-login link emailed by /api/auth/magic-link. Verifies the
 * Supabase OTP token_hash and sets the session cookies, then redirects.
 *
 * This is the passwordless return-login path for buyers who were provisioned
 * without a password (e.g. funnel buyers) - so they can get back into the
 * dashboard any time, not just via the original portal email.
 */
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { APP_URL } from '@/lib/config/urls'
import { safeError } from '@/lib/utils/log-sanitizer'

function sanitizeNext(path: string | null): string {
  if (
    !path ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\')
  ) {
    return '/dashboard'
  }
  const lower = path.toLowerCase()
  if (lower.includes('javascript:') || lower.includes('data:'))
    return '/dashboard'
  return path
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get('token_hash')
  const next = sanitizeNext(url.searchParams.get('next'))

  if (!tokenHash) {
    return NextResponse.redirect(new URL('/login?error=invalid_link', APP_URL))
  }

  const response = NextResponse.redirect(new URL(next, APP_URL))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
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

  const { error } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  })

  if (error) {
    safeError('[auth/confirm] verifyOtp failed:', error.message)
    return NextResponse.redirect(new URL('/login?error=link_expired', APP_URL))
  }

  return response
}
