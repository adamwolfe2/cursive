/**
 * HubSpot OAuth Callback Route
 * Cursive Platform
 *
 * Handles OAuth callback from HubSpot and stores credentials
 * in the crm_connections table for use by HubSpotService.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

// HubSpot OAuth Token URL
const HS_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token'

interface HubSpotTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
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

  // Handle OAuth errors from HubSpot
  if (error) {
    const errorDescription = searchParams.get('error_description') || error
    safeError('[HubSpot OAuth] Error from provider:', errorDescription)
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=hs_${error}`, req.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=hs_no_code', req.url)
    )
  }

  try {
    const cookieStore = await cookies()

    // Verify state parameter
    const storedState = cookieStore.get('hs_oauth_state')?.value
    if (!storedState || storedState !== state) {
      safeError('[HubSpot OAuth] State mismatch')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=hs_invalid_state', req.url)
      )
    }

    // Get context from cookie
    const contextCookie = cookieStore.get('hs_oauth_context')?.value
    if (!contextCookie) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=hs_session_expired', req.url)
      )
    }

    const context: OAuthContext = JSON.parse(contextCookie)

    // Clear OAuth cookies
    cookieStore.delete('hs_oauth_state')
    cookieStore.delete('hs_oauth_context')

    // Validate HubSpot configuration
    const clientId = process.env.HUBSPOT_CLIENT_ID
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      safeError('[HubSpot OAuth] Missing client credentials')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=hs_not_configured', req.url)
      )
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/auth/hubspot/callback`

    const tokenResponse = await fetch(HS_TOKEN_URL, {
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
      safeError('[HubSpot OAuth] Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=hs_token_failed', req.url)
      )
    }

    const tokens: HubSpotTokenResponse = await tokenResponse.json()

    // Calculate token expiration from HubSpot's expires_in (seconds)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Store connection in database using admin client
    const supabase = createAdminClient()

    // Check if connection already exists for this workspace
    const { data: existingConnection } = await supabase
      .from('crm_connections')
      .select('id')
      .eq('workspace_id', context.workspace_id)
      .eq('provider', 'hubspot')
      .single()

    const connectionData = {
      workspace_id: context.workspace_id,
      provider: 'hubspot' as const,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      status: 'active',
      field_mappings: {},
    }

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('crm_connections')
        .update({
          ...connectionData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id)

      if (updateError) {
        safeError('[HubSpot OAuth] Failed to update connection:', updateError)
        return NextResponse.redirect(
          new URL('/settings/integrations?error=hs_save_failed', req.url)
        )
      }
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('crm_connections')
        .insert(connectionData)

      if (insertError) {
        safeError('[HubSpot OAuth] Failed to save connection:', insertError)
        return NextResponse.redirect(
          new URL('/settings/integrations?error=hs_save_failed', req.url)
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
        provider: 'hubspot',
      },
      severity: 'info',
    })

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/settings/integrations?success=hubspot_connected', req.url)
    )
  } catch (error: any) {
    safeError('[HubSpot OAuth] Callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=hs_callback_failed', req.url)
    )
  }
}
