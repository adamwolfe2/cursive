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
import { createClient } from '@/lib/supabase/server'

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

    let context: OAuthContext
    try {
      context = JSON.parse(contextCookie)
    } catch (parseError) {
      safeError('[HubSpot OAuth] Failed to parse context cookie:', parseError)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=hs_invalid_context', req.url)
      )
    }

    // CRITICAL: Validate context against authenticated user to prevent context injection
    const authSupabase = await createClient()
    const { data: { session } } = await authSupabase.auth.getSession()

    if (!session?.user) {
      safeError('[HubSpot OAuth] No authenticated session during callback')
      return NextResponse.redirect(
        new URL('/login?error=unauthorized&redirect=/settings/integrations', req.url)
      )
    }

    // Get authenticated user's workspace
    const { data: userData } = await authSupabase
      .from('users')
      .select('id, workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!userData) {
      safeError('[HubSpot OAuth] User record not found for authenticated session')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=hs_user_not_found', req.url)
      )
    }

    // Validate context matches authenticated user
    if (context.user_id !== userData.id) {
      safeError('[HubSpot OAuth] SECURITY: Context user_id mismatch', {
        context_user_id: context.user_id,
        authenticated_user_id: userData.id,
      })
      return NextResponse.redirect(
        new URL('/settings/integrations?error=hs_invalid_session', req.url)
      )
    }

    if (context.workspace_id !== userData.workspace_id) {
      safeError('[HubSpot OAuth] SECURITY: Context workspace_id mismatch', {
        context_workspace_id: context.workspace_id,
        authenticated_workspace_id: userData.workspace_id,
      })
      return NextResponse.redirect(
        new URL('/settings/integrations?error=hs_invalid_session', req.url)
      )
    }

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

    let tokens: HubSpotTokenResponse
    try {
      const parsed = await tokenResponse.json()
      if (!parsed.access_token || !parsed.refresh_token) {
        throw new Error('Missing required token fields')
      }
      tokens = parsed
    } catch (tokenParseError) {
      safeError('[HubSpot OAuth] Failed to parse tokens:', tokenParseError)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=hs_invalid_tokens', req.url)
      )
    }

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
