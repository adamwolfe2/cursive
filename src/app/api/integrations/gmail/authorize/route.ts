/**
 * GET /api/integrations/gmail/authorize?return_to=/outbound/[id]
 *
 * Auth-required. Builds the Google consent URL with a signed state token
 * and 302-redirects the user to Google. Phase 1 of per-workspace email send.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { getAuthorizeUrl } from '@/lib/services/gmail/oauth.service'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const { searchParams } = new URL(request.url)
    const rawReturn = searchParams.get('return_to') || '/settings/email-accounts'
    // Only allow same-origin returns to prevent open-redirect
    const returnTo = rawReturn.startsWith('/') && !rawReturn.startsWith('//')
      ? rawReturn
      : '/settings/email-accounts'

    const url = getAuthorizeUrl({
      wid: user.workspace_id,
      uid: user.id,
      returnTo,
      ts: Date.now(),
    })

    return NextResponse.redirect(url)
  } catch (error) {
    return handleApiError(error)
  }
}
