/**
 * GET /api/integrations/gmail/callback?code=…&state=…
 *
 * Google's redirect target. Verifies the state, exchanges the code for
 * tokens, persists an encrypted email_accounts row, and redirects the
 * user back to wherever they started (return_to).
 *
 * Errors are surfaced via query params on the return URL so the page
 * can show a toast: ?gmail_connected=1 or ?gmail_error=…
 *
 * IMPORTANT: All redirects use raw 302 + Location header rather than
 * NextResponse.redirect(). The latter has a known silent-failure issue
 * with route handlers in Next.js 15.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { verifyState } from '@/lib/services/gmail/oauth.service'
import { connectGmailAccount } from '@/lib/services/gmail/email-account.service'
import { safeError } from '@/lib/utils/log-sanitizer'

export const maxDuration = 30
export const runtime = 'nodejs'

function buildReturnUrl(returnTo: string, params: Record<string, string>): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  const url = new URL(returnTo, base)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return url.toString()
}

/**
 * Raw 302 redirect — works for both same-origin and external URLs and
 * bypasses the Next.js 15 NextResponse.redirect() silent-failure bug.
 */
function redirect(url: string): NextResponse {
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: url,
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const oauthError = searchParams.get('error')

  // Default fallback return target
  let returnTo = '/settings/email-accounts'

  try {
    // Google sent us back with an error (user denied, scope issue, etc.)
    if (oauthError) {
      return redirect(buildReturnUrl(returnTo, { gmail_error: oauthError }))
    }

    if (!code || !state) {
      return redirect(buildReturnUrl(returnTo, { gmail_error: 'missing_code_or_state' }))
    }

    // Verify state — extracts wid + uid + returnTo securely
    const payload = verifyState(state)
    returnTo = payload.returnTo || returnTo

    // Sanity-check the user is still logged in AND matches the state
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) {
      return redirect(buildReturnUrl(returnTo, { gmail_error: 'not_logged_in' }))
    }
    if (user.workspace_id !== payload.wid) {
      return redirect(buildReturnUrl(returnTo, { gmail_error: 'workspace_mismatch' }))
    }

    // Exchange code → tokens → upsert email_accounts row
    const account = await connectGmailAccount({
      workspaceId: user.workspace_id,
      userId: user.id,
      code,
    })

    return redirect(
      buildReturnUrl(returnTo, {
        gmail_connected: '1',
        email: account.email_address,
      })
    )
  } catch (err) {
    safeError('[gmail] callback failed:', err)
    const message =
      err instanceof Error ? err.message.slice(0, 200) : 'Unknown error during Gmail connect'
    return redirect(buildReturnUrl(returnTo, { gmail_error: message }))
  }
}
