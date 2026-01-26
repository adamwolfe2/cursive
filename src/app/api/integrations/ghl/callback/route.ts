/**
 * GoHighLevel OAuth Callback Route
 * Cursive Platform
 *
 * Handles OAuth callback from GoHighLevel and stores credentials.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

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

/**
 * Create admin Supabase client
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('[GHL OAuth] Error from provider:', error)
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
      console.error('[GHL OAuth] State mismatch')
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
      console.error('[GHL OAuth] Missing client credentials')
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
      console.error('[GHL OAuth] Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=ghl_token_failed', req.url)
      )
    }

    const tokens: GHLTokenResponse = await tokenResponse.json()

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Store connection in database
    const supabase = getSupabaseAdmin()

    // Check if connection already exists for this workspace
    const { data: existingConnection } = await supabase
      .from('integrations')
      .select('id')
      .eq('workspace_id', context.workspace_id)
      .eq('provider', 'gohighlevel')
      .single()

    const connectionData = {
      workspace_id: context.workspace_id,
      user_id: context.user_id,
      provider: 'gohighlevel',
      provider_account_id: tokens.locationId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      scopes: tokens.scope.split(' '),
      metadata: {
        location_id: tokens.locationId,
        company_id: tokens.companyId,
        ghl_user_id: tokens.userId,
        connected_at: new Date().toISOString(),
      },
      status: 'active',
    }

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('integrations')
        .update(connectionData)
        .eq('id', existingConnection.id)

      if (updateError) {
        console.error('[GHL OAuth] Failed to update connection:', updateError)
        return NextResponse.redirect(
          new URL('/settings/integrations?error=ghl_save_failed', req.url)
        )
      }
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('integrations')
        .insert(connectionData)

      if (insertError) {
        console.error('[GHL OAuth] Failed to save connection:', insertError)
        return NextResponse.redirect(
          new URL('/settings/integrations?error=ghl_save_failed', req.url)
        )
      }
    }

    // Log the connection event
    await supabase.from('activity_logs').insert({
      workspace_id: context.workspace_id,
      activity_type: 'integration_connected',
      description: 'GoHighLevel integration connected',
      metadata: {
        provider: 'gohighlevel',
        location_id: tokens.locationId,
      },
    })

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/settings/integrations?success=ghl_connected', req.url)
    )
  } catch (error: any) {
    console.error('[GHL OAuth] Callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=ghl_callback_failed', req.url)
    )
  }
}
