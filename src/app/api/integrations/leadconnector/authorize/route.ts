/**
 * GoHighLevel OAuth Authorization Route
 * Cursive Platform
 *
 * Initiates the OAuth flow for connecting GoHighLevel accounts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'

// GHL OAuth Configuration
const GHL_OAUTH_URL = 'https://marketplace.gohighlevel.com/oauth/chooselocation'

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized&redirect=/settings/integrations', req.url)
      )
    }

    // Validate GHL configuration
    const clientId = process.env.GHL_CLIENT_ID
    if (!clientId) {
      safeError('[GHL OAuth] Missing GHL_CLIENT_ID')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=ghl_not_configured', req.url)
      )
    }

    // Generate state parameter for CSRF protection
    const state = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')

    // Store state in cookie for verification
    const cookieStore = await cookies()
    cookieStore.set('ghl_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })

    // Store workspace info for callback
    cookieStore.set(
      'ghl_oauth_context',
      JSON.stringify({
        workspace_id: user.workspace_id,
        user_id: user.id,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
      }
    )

    // Build OAuth URL
    // Scope set must match what's enabled on the GHL Marketplace app, otherwise
    // the consent screen errors. Conversations + calendar scopes are required
    // for InboundMessage / OutboundMessage / CallStatusUpdate webhooks to fire.
    //
    // NOTE: route is /leadconnector/, not /ghl/. GHL Marketplace's white-label
    // policy rejects any redirect URL containing 'ghl' or 'highlevel' as a
    // substring (uses LeadConnector as their neutral brand on third-party
    // installs). Same applies to the inbound webhook URL.
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/leadconnector/callback`
    const scopes = [
      'contacts.readonly',
      'contacts.write',
      'opportunities.readonly',
      'opportunities.write',
      'locations.readonly',
      'workflows.readonly',
      'conversations.readonly',
      'conversations.write',
      'conversations/message.readonly',
      'conversations/message.write',
      'calendars/events.readonly',
    ].join(' ')

    const oauthUrl = new URL(GHL_OAUTH_URL)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('client_id', clientId)
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    oauthUrl.searchParams.set('scope', scopes)
    oauthUrl.searchParams.set('state', state)

    return NextResponse.redirect(oauthUrl.toString())
  } catch (error: unknown) {
    safeError('[GHL OAuth] Authorization error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=oauth_failed', req.url)
    )
  }
}
