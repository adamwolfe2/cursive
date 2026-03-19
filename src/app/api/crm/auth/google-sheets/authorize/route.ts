/**
 * Google Sheets OAuth Authorization Route
 * Cursive Platform
 *
 * Initiates the OAuth flow for connecting Google Sheets.
 * Stores credentials in crm_connections table for use by GoogleSheetsService.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'

// Google OAuth Configuration
const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized&redirect=/settings/integrations', req.url)
      )
    }

    // Validate Google configuration
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      safeError('[Google Sheets OAuth] Missing GOOGLE_CLIENT_ID')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=gs_not_configured', req.url)
      )
    }

    // Generate state parameter for CSRF protection
    const state = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')

    // Store state in cookie for verification
    const cookieStore = await cookies()
    cookieStore.set('gs_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })

    // Store workspace info for callback
    cookieStore.set(
      'gs_oauth_context',
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
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/auth/google-sheets/callback`
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ].join(' ')

    const oauthUrl = new URL(GOOGLE_OAUTH_URL)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('client_id', clientId)
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    oauthUrl.searchParams.set('scope', scopes)
    oauthUrl.searchParams.set('state', state)
    oauthUrl.searchParams.set('access_type', 'offline')
    oauthUrl.searchParams.set('prompt', 'consent')

    return NextResponse.redirect(oauthUrl.toString())
  } catch (error) {
    safeError('[Google Sheets OAuth] Authorization error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=gs_oauth_failed', req.url)
    )
  }
}
