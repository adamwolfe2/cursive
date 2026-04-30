/**
 * Shopify OAuth Authorization Route
 * Cursive Platform
 *
 * Initiates the Shopify OAuth flow. The merchant enters their shop domain
 * and we redirect to Shopify's authorize URL. On return, Shopify calls
 * /api/integrations/shopify/callback with an authorization code.
 *
 * Shopify HMAC validation:
 *   On the initial install, Shopify sends a GET with query params including
 *   `hmac`. We skip HMAC on the authorize step (merchant-initiated) and
 *   validate it in the callback (Shopify-initiated).
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'

const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES ||
  'read_customers,read_orders,read_products,write_customers'

/**
 * GET /api/integrations/shopify/authorize?shop=mystore.myshopify.com
 * Also handles Shopify's install redirect (same endpoint).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized&redirect=/settings/integrations', req.url)
      )
    }

    const apiKey = process.env.SHOPIFY_API_KEY
    if (!apiKey) {
      safeError('[Shopify OAuth] Missing SHOPIFY_API_KEY')
      return NextResponse.redirect(
        new URL('/settings/integrations?error=shopify_not_configured', req.url)
      )
    }

    // Shop domain — comes from query param (merchant-initiated) or
    // from the crm_connections row for reconnects.
    const rawShop = req.nextUrl.searchParams.get('shop') || ''
    const shop = normalizeShopDomain(rawShop)

    if (!shop) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=shopify_missing_shop', req.url)
      )
    }

    // CSRF state token
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
    cookieStore.set(
      'shopify_oauth_context',
      JSON.stringify({ workspace_id: user.workspace_id, user_id: user.id, shop }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
      }
    )

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/shopify/callback`

    const authUrl = new URL(`https://${shop}/admin/oauth/authorize`)
    authUrl.searchParams.set('client_id', apiKey)
    authUrl.searchParams.set('scope', SHOPIFY_SCOPES)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
  } catch (error: unknown) {
    safeError('[Shopify OAuth] Authorization error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=shopify_oauth_failed', req.url)
    )
  }
}

/**
 * Normalize a shop domain to the myshopify.com format.
 * Accepts: "mystore", "mystore.myshopify.com", "https://mystore.myshopify.com"
 */
function normalizeShopDomain(input: string): string {
  const cleaned = input.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

  // Already in correct format
  if (cleaned.endsWith('.myshopify.com')) return cleaned

  // Bare subdomain — append
  if (cleaned && !cleaned.includes('.')) return `${cleaned}.myshopify.com`

  // Could be a custom domain — reject (we need the myshopify.com domain for API calls)
  return ''
}
