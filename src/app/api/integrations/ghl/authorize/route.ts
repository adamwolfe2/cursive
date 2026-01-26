/**
 * GoHighLevel OAuth Authorization Route
 * Cursive Platform
 *
 * Initiates the OAuth flow for connecting GoHighLevel accounts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import crypto from 'crypto'

// GHL OAuth Configuration
const GHL_OAUTH_URL = 'https://marketplace.gohighlevel.com/oauth/chooselocation'

/**
 * Get authenticated user from session
 */
async function getAuthenticatedUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, workspace_id, email')
    .eq('auth_user_id', session.user.id)
    .single()

  return user
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized&redirect=/settings/integrations', req.url)
      )
    }

    // Validate GHL configuration
    const clientId = process.env.GHL_CLIENT_ID
    if (!clientId) {
      console.error('[GHL OAuth] Missing GHL_CLIENT_ID')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=ghl_not_configured', req.url)
      )
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex')

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
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/ghl/callback`
    const scopes = [
      'contacts.readonly',
      'contacts.write',
      'opportunities.readonly',
      'opportunities.write',
      'locations.readonly',
      'workflows.readonly',
    ].join(' ')

    const oauthUrl = new URL(GHL_OAUTH_URL)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('client_id', clientId)
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    oauthUrl.searchParams.set('scope', scopes)
    oauthUrl.searchParams.set('state', state)

    return NextResponse.redirect(oauthUrl.toString())
  } catch (error: any) {
    console.error('[GHL OAuth] Authorization error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=oauth_failed', req.url)
    )
  }
}
