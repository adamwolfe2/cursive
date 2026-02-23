/**
 * Salesforce OAuth Authorization Route
 * Cursive Platform
 *
 * Initiates the OAuth flow for connecting Salesforce CRM accounts.
 * Stores credentials in crm_connections table for use by SalesforceService.
 */


import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'

// Salesforce OAuth Configuration
const SF_OAUTH_URL = 'https://login.salesforce.com/services/oauth2/authorize'

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized&redirect=/settings/integrations', req.url)
      )
    }

    // Validate Salesforce configuration
    const clientId = process.env.SALESFORCE_CLIENT_ID
    if (!clientId) {
      safeError('[Salesforce OAuth] Missing SALESFORCE_CLIENT_ID')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=sf_not_configured', req.url)
      )
    }

    // Generate state parameter for CSRF protection
    const state = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')

    // Store state in cookie for verification
    const cookieStore = await cookies()
    cookieStore.set('sf_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })

    // Store workspace info for callback
    cookieStore.set(
      'sf_oauth_context',
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
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/auth/salesforce/callback`
    const scopes = 'api refresh_token id'

    const oauthUrl = new URL(SF_OAUTH_URL)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('client_id', clientId)
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    oauthUrl.searchParams.set('scope', scopes)
    oauthUrl.searchParams.set('state', state)

    return NextResponse.redirect(oauthUrl.toString())
  } catch (error) {
    safeError('[Salesforce OAuth] Authorization error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=sf_oauth_failed', req.url)
    )
  }
}
