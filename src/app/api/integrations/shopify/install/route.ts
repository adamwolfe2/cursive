/**
 * Shopify App Install Route
 * Cursive Platform
 *
 * Handles Shopify-initiated install redirects. Shopify hits this URL when a
 * merchant installs the app from the App Store or a direct install link:
 *
 *   GET application_url?shop=mystore.myshopify.com&hmac=...&timestamp=...
 *
 * Unlike /authorize (which requires a logged-in Cursive user), this route
 * handles unauthenticated installs so Shopify's automated review checks pass.
 *
 * Flow:
 *   1. Verify HMAC + timestamp from Shopify's install params
 *   2. Set CSRF state + install-mode context cookies
 *   3. Redirect to Shopify OAuth (no Cursive session required)
 *   4. Callback detects install_mode and redirects to /login with shop hint
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { safeError } from '@/lib/utils/log-sanitizer'

const SHOPIFY_SCOPES =
  process.env.SHOPIFY_SCOPES ||
  'read_customers,read_orders,read_products,write_customers'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const shop = searchParams.get('shop')
  const hmac = searchParams.get('hmac')
  const timestamp = searchParams.get('timestamp')

  // No install params — direct navigation, redirect to app
  if (!shop || !hmac || !timestamp) {
    return NextResponse.redirect(new URL('/settings/integrations', req.url))
  }

  const apiSecret = process.env.SHOPIFY_API_SECRET
  const apiKey = process.env.SHOPIFY_API_KEY
  if (!apiSecret || !apiKey) {
    safeError('[Shopify Install] Missing SHOPIFY_API_SECRET or SHOPIFY_API_KEY')
    return NextResponse.redirect(
      new URL('/settings/integrations?error=shopify_not_configured', req.url)
    )
  }

  // 1. Verify HMAC over all params except `hmac`, sorted alphabetically
  const params: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'hmac') params[key] = value
  }
  const message = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')

  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time compare
  if (computed.length !== hmac.length) {
    safeError('[Shopify Install] HMAC length mismatch')
    return NextResponse.redirect(
      new URL('/settings/integrations?error=shopify_invalid_hmac', req.url)
    )
  }
  let diff = 0
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ hmac.charCodeAt(i)
  }
  if (diff !== 0) {
    safeError('[Shopify Install] HMAC verification failed')
    return NextResponse.redirect(
      new URL('/settings/integrations?error=shopify_invalid_hmac', req.url)
    )
  }

  // 2. Verify timestamp is within 5 minutes
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    safeError('[Shopify Install] Timestamp expired or invalid')
    return NextResponse.redirect(
      new URL('/settings/integrations?error=shopify_expired', req.url)
    )
  }

  // 3. Validate shop domain format
  const normalizedShop = shop.trim().toLowerCase()
  if (!normalizedShop.endsWith('.myshopify.com')) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=shopify_invalid_shop', req.url)
    )
  }

  // 4. Generate CSRF state token
  const state = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const cookieStore = await cookies()
  cookieStore.set('shopify_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  // install_mode: true — no workspace_id yet; callback will redirect to login
  cookieStore.set(
    'shopify_oauth_context',
    JSON.stringify({ shop: normalizedShop, install_mode: true }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    }
  )

  // 5. Redirect to Shopify OAuth
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/shopify/callback`
  const authUrl = new URL(`https://${normalizedShop}/admin/oauth/authorize`)
  authUrl.searchParams.set('client_id', apiKey)
  authUrl.searchParams.set('scope', SHOPIFY_SCOPES)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
