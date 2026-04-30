/**
 * Gmail OAuth Service
 * -------------------
 * Pure HTTP helpers for Google's OAuth 2.0 web-server flow:
 *   - getAuthorizeUrl()       — build the consent URL
 *   - exchangeCodeForTokens() — POST /token (authorization_code grant)
 *   - refreshAccessToken()    — POST /token (refresh_token grant)
 *   - getUserInfo()           — GET /userinfo (returns email + sub)
 *   - signState() / verifyState() — HMAC CSRF token
 *
 * All functions throw on failure with a sanitized message.
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *
 * Scopes requested:
 *   - userinfo.email   — to read the user's Gmail address
 *   - userinfo.profile — to read display name
 *   - gmail.send       — to send mail (Phase 2 needs this)
 *
 * Phase 1 launched 2026-04-08.
 */

import { createHmac, timingSafeEqual } from 'crypto'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.send',
]

export interface OAuthTokenResponse {
  access_token: string
  expires_in: number // seconds
  refresh_token?: string // only present on first auth (or when prompt=consent)
  scope: string
  token_type: 'Bearer'
  id_token?: string
}

export interface GoogleUserInfo {
  id: string // Google's stable subject ID
  email: string
  verified_email?: boolean
  name?: string
  picture?: string
}

// ============================================================================
// CONFIG
// ============================================================================

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} environment variable is not set`)
  return v
}

function getClientId(): string {
  return requireEnv('GOOGLE_CLIENT_ID')
}

function getClientSecret(): string {
  return requireEnv('GOOGLE_CLIENT_SECRET')
}

/**
 * Returns the absolute callback URL Google will POST to.
 * Uses NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL — whichever is set.
 */
export function getRedirectUri(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  return `${base.replace(/\/$/, '')}/api/integrations/gmail/callback`
}

// ============================================================================
// STATE TOKEN (CSRF)
// ============================================================================

/**
 * State payload format:
 *   base64url(JSON({ wid, uid, returnTo, ts })).hmac
 *
 * The HMAC binds the payload to our server secret, preventing forgery.
 * Used by callback route to recover workspace_id + user_id without trusting
 * the client.
 */
export interface OAuthStatePayload {
  wid: string
  uid: string
  returnTo: string
  ts: number
}

function getStateSecret(): Buffer {
  // Reuse OAUTH_TOKEN_ENCRYPTION_KEY as HMAC key — it's already a 32-byte secret
  // and rotates together with token storage.
  const raw = process.env.OAUTH_TOKEN_ENCRYPTION_KEY
  if (!raw) throw new Error('OAUTH_TOKEN_ENCRYPTION_KEY is not set')
  return Buffer.from(raw, 'base64')
}

export function signState(payload: OAuthStatePayload): string {
  const json = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const mac = createHmac('sha256', getStateSecret()).update(json).digest('base64url')
  return `${json}.${mac}`
}

export function verifyState(state: string): OAuthStatePayload {
  const dot = state.indexOf('.')
  if (dot < 0) throw new Error('Malformed OAuth state')
  const body = state.slice(0, dot)
  const sig = state.slice(dot + 1)
  const expected = createHmac('sha256', getStateSecret()).update(body).digest('base64url')
  // Constant-time comparison
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('OAuth state signature invalid')
  }
  let parsed: OAuthStatePayload
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    throw new Error('OAuth state payload corrupt')
  }
  // Reject states older than 10 minutes
  if (Date.now() - parsed.ts > 10 * 60 * 1000) {
    throw new Error('OAuth state expired (try again)')
  }
  return parsed
}

// ============================================================================
// AUTHORIZE
// ============================================================================

export function getAuthorizeUrl(payload: OAuthStatePayload): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: GMAIL_SCOPES.join(' '),
    access_type: 'offline', // request refresh_token
    prompt: 'consent', // always show consent so we ALWAYS get a refresh_token
    include_granted_scopes: 'true',
    state: signState(payload),
  })
  return `${AUTH_URL}?${params.toString()}`
}

// ============================================================================
// TOKEN EXCHANGE
// ============================================================================

export async function exchangeCodeForTokens(code: string): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: getClientId(),
    client_secret: getClientSecret(),
    redirect_uri: getRedirectUri(),
    grant_type: 'authorization_code',
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Google token exchange failed: ${res.status} ${errBody.slice(0, 200)}`)
  }

  const json = (await res.json()) as OAuthTokenResponse
  if (!json.access_token) throw new Error('Google token exchange returned no access_token')
  if (!json.refresh_token) {
    // This should never happen because we set prompt=consent + access_type=offline
    throw new Error('Google did not return a refresh_token. Try disconnecting and reconnecting.')
  }
  return json
}

// ============================================================================
// REFRESH
// ============================================================================

export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: getClientId(),
    client_secret: getClientSecret(),
    grant_type: 'refresh_token',
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Google token refresh failed: ${res.status} ${errBody.slice(0, 200)}`)
  }

  return (await res.json()) as OAuthTokenResponse
}

// ============================================================================
// USERINFO
// ============================================================================

export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Google userinfo fetch failed: ${res.status}`)
  }
  return (await res.json()) as GoogleUserInfo
}
