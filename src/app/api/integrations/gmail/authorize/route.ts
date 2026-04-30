/**
 * GET /api/integrations/gmail/authorize?return_to=/outbound/[id]
 *
 * Auth-required. Builds the Google consent URL with a signed state token
 * and 302-redirects the user to Google. Phase 1 of per-workspace email send.
 *
 * Debug mode: append `?debug=1` to get JSON output of every step instead
 * of the redirect. Use this to diagnose `-` status responses in Vercel logs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { getAuthorizeUrl, getRedirectUri } from '@/lib/services/gmail/oauth.service'

// Force a longer max duration so a slow getCurrentUser() can't be killed
// before it returns. Default is ~10s.
export const maxDuration = 30

// Force Node.js runtime (not edge) — same reason the middleware uses nodejs
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const steps: Array<{ step: string; ok: boolean; ms: number; detail?: string }> = []
  const startTotal = Date.now()
  const isDebug = new URL(request.url).searchParams.get('debug') === '1'

  function record(step: string, ok: boolean, startedAt: number, detail?: string) {
    steps.push({ step, ok, ms: Date.now() - startedAt, detail })
  }

  try {
    // Step 1 — auth check
    let s = Date.now()
    let user
    try {
      user = await getCurrentUser()
      record('getCurrentUser', !!user, s, user ? `userId=${user.id} workspaceId=${user.workspace_id}` : 'null')
    } catch (e) {
      record('getCurrentUser', false, s, (e as Error).message)
      throw e
    }

    if (!user || !user.workspace_id) {
      if (isDebug) return NextResponse.json({ ok: false, reason: 'unauthorized', steps }, { status: 401 })
      return unauthorized()
    }

    // Step 2 — env var presence (without leaking values)
    s = Date.now()
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET
    const hasEncryptionKey = !!process.env.OAUTH_TOKEN_ENCRYPTION_KEY
    record('env-vars', hasClientId && hasClientSecret && hasEncryptionKey, s,
      `clientId=${hasClientId} secret=${hasClientSecret} key=${hasEncryptionKey}`)

    if (!hasClientId || !hasClientSecret || !hasEncryptionKey) {
      const msg = `Missing env: clientId=${hasClientId} secret=${hasClientSecret} key=${hasEncryptionKey}`
      if (isDebug) return NextResponse.json({ ok: false, reason: msg, steps }, { status: 500 })
      throw new Error(msg)
    }

    // Step 3 — parse return_to
    s = Date.now()
    const { searchParams } = new URL(request.url)
    const rawReturn = searchParams.get('return_to') || '/settings/email-accounts'
    const returnTo =
      rawReturn.startsWith('/') && !rawReturn.startsWith('//') ? rawReturn : '/settings/email-accounts'
    record('parse-return-to', true, s, returnTo)

    // Step 4 — build authorize URL
    s = Date.now()
    let url: string
    try {
      url = getAuthorizeUrl({
        wid: user.workspace_id,
        uid: user.id,
        returnTo,
        ts: Date.now(),
      })
      record('getAuthorizeUrl', true, s, `url-length=${url.length}`)
    } catch (e) {
      record('getAuthorizeUrl', false, s, (e as Error).message)
      throw e
    }

    if (isDebug) {
      return NextResponse.json({
        ok: true,
        total_ms: Date.now() - startTotal,
        steps,
        redirect_uri: getRedirectUri(),
        authorize_url_preview: url.slice(0, 200) + '...',
      })
    }

    // Step 5 — return redirect.
    // IMPORTANT: NextResponse.redirect() to EXTERNAL URLs silently fails
    // in Next.js 15 route handlers (it passes a same-origin check internally
    // and returns a malformed/empty response). Return a raw 302 with an
    // explicit Location header instead — this works regardless of Next.js
    // version and is the canonical way to redirect to a third-party URL.
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: url,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    if (isDebug) {
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
          total_ms: Date.now() - startTotal,
          steps,
        },
        { status: 500 }
      )
    }
    return handleApiError(error)
  }
}
