/**
 * Shopify Marketplace App — OAuth authorize.
 *
 * Entry point for Shopify install flow. Validates shop domain (defense
 * against open redirect / SSRF), builds the consent URL with our scopes,
 * sets a state cookie for CSRF, redirects to Shopify.
 *
 * Per PRD §F1 — final scope list, all justified:
 *   read_customers     — PCD Level 2; resolve visitor profiles + metafields
 *   read_orders        — suppression: detect checkout_completed conversions
 *   write_pixels       — webPixelCreate / webPixelUpdate / webPixelDelete
 *   read_products      — category matching at install
 *   write_customers    — customer metafield writeback (intent_score)
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { isValidShopDomain } from '@/lib/marketplace/shopify/client'

const SHOPIFY_SCOPES = [
  'read_customers',
  'read_orders',
  'write_pixels',
  'read_products',
  'write_customers',
]

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const shop = url.searchParams.get('shop')

  if (!isValidShopDomain(shop)) {
    return NextResponse.json(
      { error: 'Invalid or missing shop parameter' },
      { status: 400 },
    )
  }

  const apiKey = process.env.SHOPIFY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Shopify marketplace app not configured. Set SHOPIFY_API_KEY.' },
      { status: 503 },
    )
  }

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com').replace(/\/$/, '')
  const redirectUri = `${baseUrl}/api/integrations/shopify-app/callback`

  // CSRF nonce
  const state = crypto.randomUUID()

  const consentParams = new URLSearchParams({
    client_id: apiKey,
    scope: SHOPIFY_SCOPES.join(','),
    redirect_uri: redirectUri,
    state,
    'grant_options[]': 'per-user',
  })

  // We deliberately request OFFLINE access (default when grant_options is empty)
  consentParams.delete('grant_options[]')

  const consentUrl = `https://${shop}/admin/oauth/authorize?${consentParams.toString()}`
  const response = NextResponse.redirect(consentUrl)

  response.cookies.set('shopify_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  response.cookies.set('shopify_oauth_shop', shop!, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}
