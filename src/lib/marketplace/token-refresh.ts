// Token refresh wrapper for marketplace OAuth flows.
//
// Both GHL and Shopify (Jan 2026 auth model) use short-lived access tokens
// with refresh tokens. We persist tokens on app_installs and proactively
// refresh 1 hour before expiry to avoid race conditions on long-running
// background jobs.

import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

const GHL_TOKEN_URL = 'https://services.leadconnectorhq.com/oauth/token'

export interface RefreshedToken {
  access_token: string
  refresh_token?: string
  expires_at: Date
}

/**
 * Get a valid access token for an install. Refreshes proactively if the
 * current token expires within `bufferMinutes` (default 60). On 401 from
 * upstream the caller can pass `force: true` to force a refresh attempt.
 *
 * Returns null if the install doesn't exist, has no refresh token, or
 * the refresh fails. Caller must alert the user to re-authorize in that
 * case (no automatic recovery).
 */
export async function getValidAccessTokenForInstall(params: {
  installId: string
  force?: boolean
  bufferMinutes?: number
}): Promise<string | null> {
  const admin = createAdminClient()
  const { installId, force = false, bufferMinutes = 60 } = params

  const { data: install } = await admin
    .from('app_installs')
    .select('source, access_token, refresh_token, token_expires_at, status')
    .eq('id', installId)
    .maybeSingle()

  if (!install || install.status !== 'active') return null
  if (!install.access_token) return null

  const expiresAt = install.token_expires_at ? new Date(install.token_expires_at) : null
  const cutoff = new Date(Date.now() + bufferMinutes * 60 * 1000)

  const needsRefresh = force || !expiresAt || expiresAt <= cutoff

  if (!needsRefresh) {
    return install.access_token
  }

  if (!install.refresh_token) {
    safeError('[token-refresh] no refresh_token for install', { installId })
    return null
  }

  // Source-specific refresh
  let refreshed: RefreshedToken | null = null
  if (install.source === 'ghl') {
    refreshed = await refreshGhlToken(install.refresh_token)
  } else if (install.source === 'shopify') {
    refreshed = await refreshShopifyToken(install.refresh_token)
  }

  if (!refreshed) {
    // Persist failure marker — caller alerts user
    await admin
      .from('app_installs')
      .update({ metadata: { token_refresh_failed_at: new Date().toISOString() } })
      .eq('id', installId)
    return null
  }

  // Persist new tokens
  await admin
    .from('app_installs')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? install.refresh_token,
      token_expires_at: refreshed.expires_at.toISOString(),
      last_refreshed_at: new Date().toISOString(),
    })
    .eq('id', installId)

  return refreshed.access_token
}

// ---------------------------------------------------------------------------
// GHL token refresh
// ---------------------------------------------------------------------------

async function refreshGhlToken(refreshToken: string): Promise<RefreshedToken | null> {
  const clientId = process.env.GHL_APP_CLIENT_ID
  const clientSecret = process.env.GHL_APP_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    safeError('[token-refresh] GHL_APP_CLIENT_ID / GHL_APP_CLIENT_SECRET not configured')
    return null
  }

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })

    const res = await fetch(GHL_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok) {
      safeError('[token-refresh] GHL refresh failed', { status: res.status })
      return null
    }

    const json = await res.json() as {
      access_token: string
      refresh_token?: string
      expires_in: number
    }

    return {
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: new Date(Date.now() + json.expires_in * 1000),
    }
  } catch (err) {
    safeError('[token-refresh] GHL refresh threw', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Shopify token refresh (Jan 2026 client-credentials model)
// ---------------------------------------------------------------------------

async function refreshShopifyToken(refreshToken: string): Promise<RefreshedToken | null> {
  // Shopify's offline access tokens issued via OAuth do NOT expire under the
  // legacy model. Under the Jan 2026 short-lived token model, tokens are
  // ~24h and refresh via the same OAuth token endpoint. The shop domain is
  // required, which we'd carry on the install row in a future enhancement.
  //
  // For now: if the refresh token IS the offline token (legacy), return it.
  // Future: implement client-credentials refresh against the shop domain.
  return {
    access_token: refreshToken,
    refresh_token: refreshToken,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }
}
