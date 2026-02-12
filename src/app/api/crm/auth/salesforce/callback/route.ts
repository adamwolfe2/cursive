/**
 * Salesforce OAuth Callback Route
 * Cursive Platform
 *
 * Handles OAuth callback from Salesforce and stores credentials
 * in the crm_connections table for use by SalesforceService.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

// Salesforce OAuth Token URL
const SF_TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token'

interface SalesforceTokenResponse {
  access_token: string
  refresh_token: string
  instance_url: string
  id: string
  token_type: string
  issued_at: string
  scope?: string
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

  // Handle OAuth errors from Salesforce
  if (error) {
    const errorDescription = searchParams.get('error_description') || error
    safeError('[Salesforce OAuth] Error from provider:', errorDescription)
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=sf_${error}`, req.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=sf_no_code', req.url)
    )
  }

  try {
    const cookieStore = await cookies()

    // Verify state parameter
    const storedState = cookieStore.get('sf_oauth_state')?.value
    if (!storedState || storedState !== state) {
      safeError('[Salesforce OAuth] State mismatch')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=sf_invalid_state', req.url)
      )
    }

    // Get context from cookie
    const contextCookie = cookieStore.get('sf_oauth_context')?.value
    if (!contextCookie) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=sf_session_expired', req.url)
      )
    }

    const context: OAuthContext = JSON.parse(contextCookie)

    // Clear OAuth cookies
    cookieStore.delete('sf_oauth_state')
    cookieStore.delete('sf_oauth_context')

    // Validate Salesforce configuration
    const clientId = process.env.SALESFORCE_CLIENT_ID
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      safeError('[Salesforce OAuth] Missing client credentials')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=sf_not_configured', req.url)
      )
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/auth/salesforce/callback`

    const tokenResponse = await fetch(SF_TOKEN_URL, {
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
      safeError('[Salesforce OAuth] Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=sf_token_failed', req.url)
      )
    }

    const tokens: SalesforceTokenResponse = await tokenResponse.json()

    // Calculate token expiration (Salesforce access tokens last ~2 hours)
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

    // Store connection in database using admin client
    const supabase = createAdminClient()

    // Check if connection already exists for this workspace
    const { data: existingConnection } = await supabase
      .from('crm_connections')
      .select('id')
      .eq('workspace_id', context.workspace_id)
      .eq('provider', 'salesforce')
      .single()

    const connectionData = {
      workspace_id: context.workspace_id,
      provider: 'salesforce' as const,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      instance_url: tokens.instance_url,
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
        safeError('[Salesforce OAuth] Failed to update connection:', updateError)
        return NextResponse.redirect(
          new URL('/settings/integrations?error=sf_save_failed', req.url)
        )
      }
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('crm_connections')
        .insert(connectionData)

      if (insertError) {
        safeError('[Salesforce OAuth] Failed to save connection:', insertError)
        return NextResponse.redirect(
          new URL('/settings/integrations?error=sf_save_failed', req.url)
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
        provider: 'salesforce',
        instance_url: tokens.instance_url,
      },
      severity: 'info',
    })

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/settings/integrations?success=salesforce_connected', req.url)
    )
  } catch (error: any) {
    safeError('[Salesforce OAuth] Callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=sf_callback_failed', req.url)
    )
  }
}
