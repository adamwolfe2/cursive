/**
 * Shopify billing — merchant picks a plan tier.
 *
 * Body: { install_id, tier }
 * Returns: { confirmationUrl } — merchant redirected to Shopify to confirm
 * the recurring charge. On confirmation, Shopify fires the
 * `app_subscriptions/update` webhook which lifts the install's plan_tier.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { getValidAccessTokenForInstall } from '@/lib/marketplace/token-refresh'
import { appSubscriptionCreate, SHOPIFY_PLANS } from '@/lib/marketplace/shopify/billing'

const BodySchema = z.object({
  install_id: z.string().uuid(),
  tier: z.enum(['starter', 'growth', 'scale']),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await req.json()
    const { install_id, tier } = BodySchema.parse(body)

    const admin = createAdminClient()

    const { data: install } = await admin
      .from('app_installs')
      .select('id, workspace_id, source, external_id')
      .eq('id', install_id)
      .maybeSingle()

    if (!install || install.workspace_id !== user.workspace_id) {
      return NextResponse.json({ error: 'Install not found' }, { status: 404 })
    }

    if (install.source !== 'shopify') {
      return NextResponse.json({ error: 'Wrong source' }, { status: 400 })
    }

    const accessToken = await getValidAccessTokenForInstall({ installId: install.id })
    if (!accessToken) {
      return NextResponse.json({ error: 'No valid access token' }, { status: 400 })
    }

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com').replace(/\/$/, '')
    const returnUrl = `${baseUrl}/integrations/shopify?billing_confirmed=1`

    // Test mode for development stores
    const isTestStore = install.external_id.includes('test') || process.env.SHOPIFY_BILLING_TEST_MODE === 'true'

    const result = await appSubscriptionCreate({
      shop: install.external_id,
      accessToken,
      plan: SHOPIFY_PLANS[tier],
      returnUrl,
      test: isTestStore,
    })

    if (!result.confirmationUrl || result.errors.length > 0) {
      return NextResponse.json(
        { error: 'Failed to create subscription', details: result.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({
      confirmation_url: result.confirmationUrl,
      subscription_id: result.appSubscriptionId,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
