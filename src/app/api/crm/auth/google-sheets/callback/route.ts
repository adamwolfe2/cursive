/**
 * Google Sheets OAuth Callback Route
 * Cursive Platform
 *
 * Handles OAuth callback from Google and stores credentials
 * in the crm_connections table for use by GoogleSheetsService.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

// Google OAuth Token URL
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

interface GoogleTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

interface OAuthContext {
  workspace_id: string
  user_id: string
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    safeError('[Google Sheets OAuth] Error from provider:', error)
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=gs_${error}`, req.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=gs_no_code', req.url)
    )
  }

  try {
    const cookieStore = await cookies()

    // Verify state parameter
    const storedState = cookieStore.get('gs_oauth_state')?.value
    if (!storedState || storedState !== state) {
      safeError('[Google Sheets OAuth] State mismatch')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=gs_invalid_state', req.url)
      )
    }

    // Get context from cookie
    const contextCookie = cookieStore.get('gs_oauth_context')?.value
    if (!contextCookie) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=gs_session_expired', req.url)
      )
    }

    const context: OAuthContext = JSON.parse(contextCookie)

    // Clear OAuth cookies
    cookieStore.delete('gs_oauth_state')
    cookieStore.delete('gs_oauth_context')

    // Validate Google configuration
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      safeError('[Google Sheets OAuth] Missing client credentials')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=gs_not_configured', req.url)
      )
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/auth/google-sheets/callback`

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      safeError('[Google Sheets OAuth] Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=gs_token_failed', req.url)
      )
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Store connection in database
    const supabase = createAdminClient()

    // Check if connection already exists for this workspace
    const { data: existingConnection } = await supabase
      .from('crm_connections')
      .select('id')
      .eq('workspace_id', context.workspace_id)
      .eq('provider', 'google_sheets')
      .single()

    const connectionData = {
      workspace_id: context.workspace_id,
      provider: 'google_sheets',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      status: 'active',
    }

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('crm_connections')
        .update(connectionData)
        .eq('id', existingConnection.id)

      if (updateError) {
        safeError('[Google Sheets OAuth] Failed to update connection:', updateError)
        return NextResponse.redirect(
          new URL('/settings/integrations?error=gs_save_failed', req.url)
        )
      }
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('crm_connections')
        .insert(connectionData)

      if (insertError) {
        safeError('[Google Sheets OAuth] Failed to save connection:', insertError)
        return NextResponse.redirect(
          new URL('/settings/integrations?error=gs_save_failed', req.url)
        )
      }
    }

    // Log the connection event
    await supabase.from('audit_logs').insert({
      workspace_id: context.workspace_id,
      user_id: context.user_id,
      action: 'integration_connected',
      resource_type: 'integration',
      metadata: {
        provider: 'google_sheets',
      },
      severity: 'info',
    })

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/settings/integrations?success=google_sheets_connected', req.url)
    )
  } catch (error: any) {
    safeError('[Google Sheets OAuth] Callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=gs_callback_failed', req.url)
    )
  }
}
