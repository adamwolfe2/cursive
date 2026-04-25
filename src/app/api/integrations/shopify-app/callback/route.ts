/**
 * Shopify Marketplace App — OAuth callback.
 *
 * 1. Verifies state nonce + HMAC on query params (Shopify-required).
 * 2. Validates shop domain.
 * 3. Exchanges code for access token.
 * 4. Provisions Cursive workspace + pixel via provisionFromInstall().
 * 5. Auto-injects pixel via webPixelCreate (the Shopify advantage —
 *    no theme edits, fires within seconds storefront-wide).
 * 6. Subscribes to mandatory webhooks (GDPR + checkout + uninstall).
 * 7. Magic-link redirect into Cursive portal.
 */

export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { provisionFromInstall } from '@/lib/provisioning/install-from-marketplace'
import {
  exchangeShopifyCode,
  createWebPixel,
  getShopInfo,
  createWebhookSubscription,
  isValidShopDomain,
  type ShopifyWebhookTopic,
} from '@/lib/marketplace/shopify/client'
import { verifyShopifyOAuthHmac } from '@/lib/marketplace/signature-verify'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const MANDATORY_WEBHOOKS: Array<{ topic: ShopifyWebhookTopic; path: string }> = [
  // GDPR — hard requirement
  { topic: 'CUSTOMERS_DATA_REQUEST', path: '/api/webhooks/shopify-app/gdpr/customers-data-request' },
  { topic: 'CUSTOMERS_REDACT', path: '/api/webhooks/shopify-app/gdpr/customers-redact' },
  { topic: 'SHOP_REDACT', path: '/api/webhooks/shopify-app/gdpr/shop-redact' },
  // Lifecycle
  { topic: 'APP_UNINSTALLED', path: '/api/webhooks/shopify-app/app-uninstalled' },
  // Billing
  { topic: 'APP_SUBSCRIPTIONS_UPDATE', path: '/api/webhooks/shopify-app/app-subscriptions-update' },
  // Suppression on conversion
  { topic: 'ORDERS_PAID', path: '/api/webhooks/shopify-app/orders-paid' },
]

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const shop = url.searchParams.get('shop')
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (!isValidShopDomain(shop)) {
    return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 })
  }

  // CSRF state check
  const cookieState = req.cookies.get('shopify_oauth_state')?.value
  if (state && cookieState && state !== cookieState) {
    safeError('[shopify-app callback] state mismatch')
    return NextResponse.redirect(new URL('/dashboard?error=shopify_install_state_mismatch', url))
  }

  // HMAC check on query params
  const apiSecret = process.env.SHOPIFY_API_SECRET
  if (!apiSecret) {
    return NextResponse.json({ error: 'Shopify marketplace app not configured' }, { status: 503 })
  }
  if (!verifyShopifyOAuthHmac(url.searchParams, apiSecret)) {
    safeError('[shopify-app callback] HMAC verification failed')
    return NextResponse.redirect(new URL('/dashboard?error=shopify_install_hmac_failed', url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?error=shopify_install_no_code', url))
  }

  const apiKey = process.env.SHOPIFY_API_KEY!
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com').replace(/\/$/, '')

  try {
    // 1. Exchange code → access token
    const tokenResp = await exchangeShopifyCode({
      shop: shop!,
      code,
      apiKey,
      apiSecret,
    })

    safeLog('[shopify-app callback] token exchange ok', { shop, scope: tokenResp.scope })

    // 2. Look up shop details for name + installer email
    const shopInfo = await getShopInfo({
      shop: shop!,
      accessToken: tokenResp.access_token,
    })

    const installerEmail = shopInfo.email || `shop+install@meetcursive.com`

    // 3. Provision Cursive workspace + pixel
    const result = await provisionFromInstall({
      source: 'shopify',
      externalId: shopInfo.domain, // canonical *.myshopify.com
      externalName: shopInfo.name,
      installerEmail,
      siteUrl: `https://${shopInfo.primaryDomainHost}`,
      accessToken: tokenResp.access_token,
      // Shopify offline tokens (legacy) don't expire; Jan 2026 model adds
      // refresh, which token-refresh.ts will handle when applicable.
      scopes: tokenResp.scope.split(','),
      metadata: {
        shopify_shop: shopInfo.domain,
        primary_domain: shopInfo.primaryDomainHost,
        install_type: 'shopify_marketplace',
      },
    })

    // 4. Auto-inject pixel via webPixelCreate (the Shopify advantage)
    let webPixelId: string | null = null
    let pixelDeploymentStatus: 'active' | 'manual_required' = 'active'
    try {
      const wp = await createWebPixel({
        shop: shop!,
        accessToken: tokenResp.access_token,
        pixelId: result.pixel.id,
      })
      if (wp.webPixelId) {
        webPixelId = wp.webPixelId
        pixelDeploymentStatus = 'active'
      } else {
        // userErrors — known edge case, fall back to manual embed
        safeError('[shopify-app callback] webPixelCreate userErrors', wp.errors)
        pixelDeploymentStatus = 'manual_required'
      }
    } catch (pixelErr) {
      safeError('[shopify-app callback] webPixelCreate threw', pixelErr)
      pixelDeploymentStatus = 'manual_required'
    }

    // Persist deployment state + Shopify-specific metadata on the install row
    const admin = createAdminClient()
    await admin
      .from('app_installs')
      .update({
        pixel_deployment_status: pixelDeploymentStatus,
        metadata: {
          shopify_shop: shopInfo.domain,
          primary_domain: shopInfo.primaryDomainHost,
          web_pixel_id: webPixelId,
          install_type: 'shopify_marketplace',
        },
      })
      .eq('id', result.install.id)

    // 5. Subscribe to mandatory webhooks (GDPR + lifecycle + suppression)
    for (const wh of MANDATORY_WEBHOOKS) {
      try {
        const sub = await createWebhookSubscription({
          shop: shop!,
          accessToken: tokenResp.access_token,
          topic: wh.topic,
          callbackUrl: `${baseUrl}${wh.path}`,
        })
        if (sub.errors.length > 0) {
          safeError('[shopify-app callback] webhook subscribe errors', {
            topic: wh.topic,
            errors: sub.errors,
          })
        }
      } catch (whErr) {
        safeError('[shopify-app callback] webhook subscribe threw', {
          topic: wh.topic,
          err: whErr instanceof Error ? whErr.message : String(whErr),
        })
      }
    }

    // 6. Magic-link redirect into Cursive portal
    return NextResponse.redirect(result.portalUrl)
  } catch (err) {
    safeError('[shopify-app callback] failure', err)
    void sendSlackAlert({
      type: 'system_event',
      severity: 'error',
      message: `Shopify marketplace install failed: ${err instanceof Error ? err.message : String(err)}`,
    })
    return NextResponse.redirect(new URL('/dashboard?error=shopify_install_failed', url))
  }
}
