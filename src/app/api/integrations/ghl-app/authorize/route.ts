/**
 * GHL Marketplace App — OAuth authorize.
 *
 * Entry point for the GHL marketplace install flow. Builds the redirect URL
 * to GHL's consent screen with our client_id and the scopes the app needs.
 *
 * GHL marketplace flow:
 *   1. User clicks "Install" on marketplace.gohighlevel.com → GHL redirects here
 *   2. We build the consent URL → 302 to GHL
 *   3. User approves → GHL redirects to /api/integrations/ghl-app/callback
 *
 * Scopes per PRD §F1:
 *   oauth.readonly                    — required for /oauth/installedLocations
 *   oauth.write                       — required for /oauth/locationToken
 *   locations/customValues.readonly   — read existing custom values
 *   locations/customValues.write      — write our 6 pixel custom values
 *   contacts.readonly                 — search before upsert
 *   contacts.write                    — upsert visitors as contacts
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'

const GHL_AUTHORIZE_URL = 'https://marketplace.gohighlevel.com/oauth/chooselocation'

const GHL_SCOPES = [
  'oauth.readonly',
  'oauth.write',
  'locations/customValues.readonly',
  'locations/customValues.write',
  'contacts.readonly',
  'contacts.write',
]

export async function GET(req: NextRequest) {
  const clientId = process.env.GHL_APP_CLIENT_ID
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com').replace(/\/$/, '')
  const redirectUri = `${baseUrl}/api/integrations/ghl-app/callback`

  if (!clientId) {
    return NextResponse.json(
      { error: 'GHL marketplace app not configured. Set GHL_APP_CLIENT_ID.' },
      { status: 503 },
    )
  }

  // CSRF state — cryptographically random, verified on callback
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: redirectUri,
    client_id: clientId,
    scope: GHL_SCOPES.join(' '),
    state,
  })

  const consentUrl = `${GHL_AUTHORIZE_URL}?${params.toString()}`
  const response = NextResponse.redirect(consentUrl)

  // Store state in a short-lived signed cookie for callback verification
  response.cookies.set('ghl_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  return response
}
