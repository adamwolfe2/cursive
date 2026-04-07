/**
 * GET /api/integrations/gmail/callback?code=…&state=…
 *
 * Google's redirect target. Verifies the state, exchanges the code for
 * tokens, persists an encrypted email_accounts row, and redirects the
 * user back to wherever they started (return_to).
 *
 * Errors are surfaced via query params on the return URL so the page
 * can show a toast: ?gmail_connected=1 or ?gmail_error=…
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { verifyState } from '@/lib/services/gmail/oauth.service'
import { connectGmailAccount } from '@/lib/services/gmail/email-account.service'
import { safeError } from '@/lib/utils/log-sanitizer'

export const maxDuration = 30

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
      return NextResponse.redirect(
        buildReturnUrl(returnTo, { gmail_error: oauthError })
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        buildReturnUrl(returnTo, { gmail_error: 'missing_code_or_state' })
      )
    }

    // Verify state — extracts wid + uid + returnTo securely
    const payload = verifyState(state)
    returnTo = payload.returnTo || returnTo

    // Sanity-check the user is still logged in AND matches the state
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) {
      return NextResponse.redirect(
        buildReturnUrl(returnTo, { gmail_error: 'not_logged_in' })
      )
    }
    if (user.workspace_id !== payload.wid) {
      return NextResponse.redirect(
        buildReturnUrl(returnTo, { gmail_error: 'workspace_mismatch' })
      )
    }

    // Exchange code → tokens → upsert email_accounts row
    const account = await connectGmailAccount({
      workspaceId: user.workspace_id,
      userId: user.id,
      code,
    })

    return NextResponse.redirect(
      buildReturnUrl(returnTo, {
        gmail_connected: '1',
        email: account.email_address,
      })
    )
  } catch (err) {
    safeError('[gmail] callback failed:', err)
    const message =
      err instanceof Error ? err.message.slice(0, 200) : 'Unknown error during Gmail connect'
    return NextResponse.redirect(
      buildReturnUrl(returnTo, { gmail_error: message })
    )
  }
}
