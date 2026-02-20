/**
 * GoHighLevel OAuth Callback Route
 * Cursive Platform
 *
 * Handles OAuth callback from GoHighLevel and stores credentials.
 */


import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

// GHL OAuth Token URL
const GHL_TOKEN_URL = 'https://services.leadconnectorhq.com/oauth/token'

interface GHLTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
  locationId: string
  companyId?: string
  userId?: string
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
    safeError('[GHL OAuth] Error from provider:', error)
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=ghl_${error}`, req.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=ghl_no_code', req.url)
    )
  }

  try {
    const cookieStore = await cookies()

    // Verify state parameter
    const storedState = cookieStore.get('ghl_oauth_state')?.value
    if (!storedState || storedState !== state) {
      safeError('[GHL OAuth] State mismatch')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=ghl_invalid_state', req.url)
      )
    }

    // Get context from cookie
    const contextCookie = cookieStore.get('ghl_oauth_context')?.value
    if (!contextCookie) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=ghl_session_expired', req.url)
      )
    }

    const context: OAuthContext = JSON.parse(contextCookie)

    // Clear OAuth cookies
    cookieStore.delete('ghl_oauth_state')
    cookieStore.delete('ghl_oauth_context')

    // Validate GHL configuration
    const clientId = process.env.GHL_CLIENT_ID
    const clientSecret = process.env.GHL_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      safeError('[GHL OAuth] Missing client credentials')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=ghl_not_configured', req.url)
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GHL_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/ghl/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      safeError('[GHL OAuth] Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=ghl_token_failed', req.url)
      )
    }

    const tokens: GHLTokenResponse = await tokenResponse.json()

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Store connection in database
    const supabase = createAdminClient()

    // Store GHL connection in crm_connections table (OAuth-based CRM integration)
    const { data: existingConnection } = await supabase
      .from('crm_connections')
      .select('id')
      .eq('workspace_id', context.workspace_id)
      .eq('provider', 'gohighlevel')
      .maybeSingle()

    const connectionData = {
      workspace_id: context.workspace_id,
      provider: 'gohighlevel',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      status: 'active',
      metadata: {
        location_id: tokens.locationId,
        company_id: tokens.companyId,
        ghl_user_id: tokens.userId,
        scopes: tokens.scope.split(' '),
        connected_at: new Date().toISOString(),
      },
    }

    if (existingConnection) {
      const { error: updateError } = await supabase
        .from('crm_connections')
        .update({
          ...connectionData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id)

      if (updateError) {
        safeError('[GHL OAuth] Failed to update connection:', updateError)
        return NextResponse.redirect(
          new URL('/settings/integrations?error=ghl_save_failed', req.url)
        )
      }
    } else {
      const { error: insertError } = await supabase
        .from('crm_connections')
        .insert(connectionData)

      if (insertError) {
        safeError('[GHL OAuth] Failed to save connection:', insertError)
        return NextResponse.redirect(
          new URL('/settings/integrations?error=ghl_save_failed', req.url)
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
        provider: 'gohighlevel',
        location_id: tokens.locationId,
      },
      severity: 'info',
    })

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/settings/integrations?success=ghl_connected', req.url)
    )
  } catch (error: any) {
    safeError('[GHL OAuth] Callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=ghl_callback_failed', req.url)
    )
  }
}
