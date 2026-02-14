/**
 * Slack OAuth Callback Route
 * Cursive Platform
 *
 * Handles the OAuth callback from Slack after the user authorizes the app.
 * Exchanges the authorization code for an incoming webhook URL and stores it.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Slack OAuth Token URL
const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access'

interface SlackOAuthResponse {
  ok: boolean
  error?: string
  incoming_webhook?: {
    channel: string
    channel_id: string
    configuration_url: string
    url: string
  }
  team?: {
    id: string
    name: string
  }
  app_id?: string
  authed_user?: {
    id: string
  }
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

  // Handle OAuth errors (e.g., user denied access)
  if (error) {
    safeError('[Slack OAuth] Error from provider:', error)
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=slack_${error}`, req.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=slack_no_code', req.url)
    )
  }

  try {
    const cookieStore = await cookies()

    // Verify state parameter for CSRF protection
    const storedState = cookieStore.get('slack_oauth_state')?.value
    if (!storedState || storedState !== state) {
      safeError('[Slack OAuth] State mismatch')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=slack_invalid_state', req.url)
      )
    }

    // Get context from cookie
    const contextCookie = cookieStore.get('slack_oauth_context')?.value
    if (!contextCookie) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=slack_session_expired', req.url)
      )
    }

    let context: OAuthContext
    try {
      context = JSON.parse(contextCookie)
    } catch (parseError) {
      safeError('[Slack OAuth] Failed to parse context cookie:', parseError)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=slack_invalid_context', req.url)
      )
    }

    // CRITICAL: Validate context against authenticated user to prevent context injection
    const authSupabase = await createClient()
    const { data: { session } } = await authSupabase.auth.getSession()

    if (!session?.user) {
      safeError('[Slack OAuth] No authenticated session during callback')
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
      safeError('[Slack OAuth] User record not found for authenticated session')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=slack_user_not_found', req.url)
      )
    }

    // Validate context matches authenticated user
    if (context.user_id !== userData.id) {
      safeError('[Slack OAuth] SECURITY: Context user_id mismatch', {
        context_user_id: context.user_id,
        authenticated_user_id: userData.id,
      })
      return NextResponse.redirect(
        new URL('/settings/integrations?error=slack_invalid_session', req.url)
      )
    }

    if (context.workspace_id !== userData.workspace_id) {
      safeError('[Slack OAuth] SECURITY: Context workspace_id mismatch', {
        context_workspace_id: context.workspace_id,
        authenticated_workspace_id: userData.workspace_id,
      })
      return NextResponse.redirect(
        new URL('/settings/integrations?error=slack_invalid_session', req.url)
      )
    }

    // Clear OAuth cookies
    cookieStore.delete('slack_oauth_state')
    cookieStore.delete('slack_oauth_context')

    // Validate Slack configuration
    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      safeError('[Slack OAuth] Missing client credentials')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=slack_not_configured', req.url)
      )
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`

    const tokenResponse = await fetch(SLACK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      safeError('[Slack OAuth] Token exchange HTTP error:', errorData)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=slack_token_failed', req.url)
      )
    }

    const tokenData: SlackOAuthResponse = await tokenResponse.json()

    // Slack API returns ok: false on error even with HTTP 200
    if (!tokenData.ok) {
      safeError('[Slack OAuth] Token exchange API error:', tokenData.error)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=slack_token_failed', req.url)
      )
    }

    // Validate that we received the incoming webhook
    if (!tokenData.incoming_webhook?.url) {
      safeError('[Slack OAuth] No incoming webhook URL in response')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=slack_no_webhook', req.url)
      )
    }

    const webhookUrl = tokenData.incoming_webhook.url
    const channel = tokenData.incoming_webhook.channel
    const channelId = tokenData.incoming_webhook.channel_id
    const teamId = tokenData.team?.id ?? ''
    const teamName = tokenData.team?.name ?? ''

    // Store connection in database
    const supabase = createAdminClient()

    // Update the user's slack_webhook_url (this is what the UI checks)
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ slack_webhook_url: webhookUrl })
      .eq('id', context.user_id)

    if (userUpdateError) {
      safeError('[Slack OAuth] Failed to update user webhook URL:', userUpdateError)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=slack_save_failed', req.url)
      )
    }

    // Check if integration record already exists for this workspace
    const { data: existingIntegration } = await supabase
      .from('integrations')
      .select('id')
      .eq('workspace_id', context.workspace_id)
      .eq('type', 'slack')
      .single()

    const integrationData = {
      workspace_id: context.workspace_id,
      type: 'slack' as const,
      name: `Slack #${channel}`,
      status: 'active' as const,
      config: {
        webhook_url: webhookUrl,
        channel,
        channel_id: channelId,
        team_id: teamId,
        team_name: teamName,
        connected_at: new Date().toISOString(),
      },
      created_by: context.user_id,
    }

    if (existingIntegration) {
      const { error: updateError } = await supabase
        .from('integrations')
        .update({
          ...integrationData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingIntegration.id)

      if (updateError) {
        safeError('[Slack OAuth] Failed to update integration:', updateError)
        // Non-fatal: user webhook URL was already saved
      }
    } else {
      const { error: insertError } = await supabase
        .from('integrations')
        .insert(integrationData)

      if (insertError) {
        safeError('[Slack OAuth] Failed to save integration:', insertError)
        // Non-fatal: user webhook URL was already saved
      }
    }

    // Log the connection event
    await supabase.from('audit_logs').insert({
      workspace_id: context.workspace_id,
      user_id: context.user_id,
      action: 'integration_connected',
      resource_type: 'integration',
      metadata: {
        provider: 'slack',
        channel,
        channel_id: channelId,
        team_id: teamId,
        team_name: teamName,
      },
      severity: 'info',
    })

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/settings/integrations?success=slack_connected', req.url)
    )
  } catch (error: any) {
    safeError('[Slack OAuth] Callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=slack_callback_failed', req.url)
    )
  }
}
