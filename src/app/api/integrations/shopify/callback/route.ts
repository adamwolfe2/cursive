/**
 * Shopify OAuth Callback Route
 * Cursive Platform
 *
 * Handles the OAuth redirect from Shopify after the merchant grants access.
 * Validates HMAC, exchanges the code for a permanent access token, and
 * stores the connection in crm_connections.
 *
 * Shopify HMAC verification:
 *   Shopify signs the callback query string with HMAC-SHA256 using
 *   SHOPIFY_API_SECRET. The `hmac` param is computed over all other params
 *   sorted alphabetically and joined as "key=value&key=value".
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'

interface OAuthContext {
  workspace_id: string
  user_id: string
  shop: string
}

interface ShopifyTokenResponse {
  access_token: string
  scope: string
  expires_in?: number
  associated_user_scope?: string
  associated_user?: unknown
}

/**
 * Verify Shopify HMAC signature on callback query params.
 * https://shopify.dev/docs/apps/auth/oauth/oauth-flow-callback#verify-a-request
 */
async function verifyHmac(searchParams: URLSearchParams): Promise<boolean> {
  const secret = process.env.SHOPIFY_API_SECRET
  if (!secret) {
    safeError('[Shopify OAuth] SHOPIFY_API_SECRET not configured')
    return false
  }

  const hmacParam = searchParams.get('hmac')
  if (!hmacParam) return false

  // Build message: all params except `hmac`, sorted, joined as key=value&...
  const pairs: string[] = []
  for (const [key, value] of searchParams.entries()) {
    if (key === 'hmac') continue
    // Shopify escapes `%` and `&` in values
    pairs.push(`${key}=${value.replace(/%/g, '%25').replace(/&/g, '%26')}`)
  }
  pairs.sort()
  const message = pairs.join('&')

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time compare
  if (computed.length !== hmacParam.length) return false
  let result = 0
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ hmacParam.charCodeAt(i)
  }
  return result === 0
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const shop = searchParams.get('shop')
  const state = searchParams.get('state')

  if (!code || !shop) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=shopify_no_code', req.url)
    )
  }

  try {
    // 1. Verify HMAC
    const hmacOk = await verifyHmac(searchParams)
    if (!hmacOk) {
      safeError('[Shopify OAuth] HMAC verification failed')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=shopify_invalid_hmac', req.url)
      )
    }

    // 2. Verify state (CSRF)
    const cookieStore = await cookies()
    const storedState = cookieStore.get('shopify_oauth_state')?.value
    if (!storedState || storedState !== state) {
      safeError('[Shopify OAuth] State mismatch')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=shopify_invalid_state', req.url)
      )
    }

    const contextCookie = cookieStore.get('shopify_oauth_context')?.value
    if (!contextCookie) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=shopify_session_expired', req.url)
      )
    }

    let context: OAuthContext
    try {
      context = JSON.parse(contextCookie)
    } catch {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=shopify_invalid_session', req.url)
      )
    }

    // Clear OAuth cookies
    cookieStore.delete('shopify_oauth_state')
    cookieStore.delete('shopify_oauth_context')

    // 3. Validate session matches authenticated user (defense-in-depth)
    const sessionUser = await getCurrentUser()
    if (
      !sessionUser ||
      context.user_id !== sessionUser.id ||
      context.workspace_id !== sessionUser.workspace_id
    ) {
      safeError('[Shopify OAuth] SECURITY: Cookie context mismatch vs authenticated session')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=shopify_invalid_session', req.url)
      )
    }

    // 4. Validate shop domain matches what we initiated
    if (context.shop !== shop) {
      safeError('[Shopify OAuth] Shop domain mismatch between initiation and callback')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=shopify_shop_mismatch', req.url)
      )
    }

    const apiKey = process.env.SHOPIFY_API_KEY
    const apiSecret = process.env.SHOPIFY_API_SECRET
    if (!apiKey || !apiSecret) {
      safeError('[Shopify OAuth] Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=shopify_not_configured', req.url)
      )
    }

    // 5. Exchange code for permanent access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: apiKey, client_secret: apiSecret, code }),
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text()
      safeError('[Shopify OAuth] Token exchange failed:', errText)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=shopify_token_failed', req.url)
      )
    }

    const tokens: ShopifyTokenResponse = await tokenResponse.json()

    // 6. Store connection (upsert pattern — allow reconnects)
    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('crm_connections')
      .select('id')
      .eq('workspace_id', context.workspace_id)
      .eq('provider', 'shopify')
      .maybeSingle()

    const connectionData = {
      workspace_id: context.workspace_id,
      provider: 'shopify',
      access_token: tokens.access_token,
      refresh_token: '',               // Shopify tokens don't expire; no refresh needed
      token_expires_at: null,
      status: 'active',
      metadata: {
        shop_domain: shop,
        scopes: tokens.scope.split(',').map((s) => s.trim()),
        connected_at: new Date().toISOString(),
      },
    }

    if (existing) {
      await supabase
        .from('crm_connections')
        .update({ ...connectionData, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('crm_connections').insert(connectionData)
    }

    // 7. Audit log
    await supabase.from('audit_logs').insert({
      workspace_id: context.workspace_id,
      user_id: context.user_id,
      action: 'integration_connected',
      resource_type: 'integration',
      metadata: { provider: 'shopify', shop_domain: shop },
      severity: 'info',
    })

    return NextResponse.redirect(
      new URL('/settings/integrations?success=shopify_connected', req.url)
    )
  } catch (error: unknown) {
    safeError('[Shopify OAuth] Callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=shopify_callback_failed', req.url)
    )
  }
}
