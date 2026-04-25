/**
 * Shopify webhook — app_subscriptions/update.
 *
 * Fired when a merchant's subscription state changes (CREATED, ACTIVE,
 * CANCELLED, FROZEN, EXPIRED). We map the Shopify status onto our
 * plan_tier column on app_installs and update trial_ends_at.
 */

export const runtime = 'nodejs'
export const maxDuration = 15

import { makeShopifyWebhookRoute } from '@/lib/marketplace/shopify/webhook-base'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

interface SubscriptionUpdatePayload {
  app_subscription: {
    admin_graphql_api_id: string // gid://shopify/AppSubscription/<id>
    name: string                  // matches one of SHOPIFY_PLANS[tier].name
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'FROZEN' | 'PENDING' | 'DECLINED'
    admin_graphql_api_shop_id?: string
    created_at: string
    updated_at: string
    currency: string
  }
}

function tierFromPlanName(name: string): 'trial' | 'starter' | 'growth' | 'scale' | null {
  const lower = name.toLowerCase()
  if (lower.includes('starter')) return 'starter'
  if (lower.includes('growth')) return 'growth'
  if (lower.includes('scale')) return 'scale'
  return null
}

export const POST = makeShopifyWebhookRoute(async (ctx) => {
  const payload = ctx.payload as SubscriptionUpdatePayload | null
  if (!payload?.app_subscription) {
    return { status: 'failed', error: 'malformed payload' }
  }

  const sub = payload.app_subscription
  const admin = createAdminClient()

  const { data: install } = await admin
    .from('app_installs')
    .select('id, plan_tier')
    .eq('source', 'shopify')
    .eq('external_id', ctx.shopDomain)
    .maybeSingle()

  if (!install) {
    safeError('[shopify app_subscriptions/update] no install for shop', { shop: ctx.shopDomain })
    return { status: 'skipped' }
  }

  // Map Shopify status → our plan_tier
  let planTier: string = install.plan_tier ?? 'trial'
  let trialEndsAt: string | null = null

  if (sub.status === 'ACTIVE') {
    const tier = tierFromPlanName(sub.name)
    if (tier) planTier = tier
  } else if (sub.status === 'CANCELLED' || sub.status === 'EXPIRED') {
    planTier = 'trial' // revert to trial-tier feature gating
  }

  // For PENDING/DECLINED/FROZEN we keep the existing tier — merchant hasn't
  // completed billing yet, so trial features stay available.

  const { error: updateErr } = await admin
    .from('app_installs')
    .update({
      plan_tier: planTier,
      stripe_subscription_id: sub.admin_graphql_api_id,
      trial_ends_at: trialEndsAt,
      metadata: {
        shopify_subscription_status: sub.status,
        shopify_subscription_name: sub.name,
        billing_updated_at: sub.updated_at,
      },
    })
    .eq('id', install.id)

  if (updateErr) {
    return { status: 'failed', error: updateErr.message }
  }

  return { status: 'processed' }
})
