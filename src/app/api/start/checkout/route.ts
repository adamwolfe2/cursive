/**
 * POST /api/start/checkout (session required) -> { url }
 *
 * Starts "25 new leads every Monday" (the existing audience_197 offer with its free trial) for the
 * signed-in owner of a free-leads workspace. The workspace, price and email all come from the
 * server: the session user, their own users row, and the offer config. The request body is ignored.
 * The Stripe webhook binds the paid order back to this workspace (bindOrderToFreeLeadsWorkspace).
 */
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { APP_URL } from '@/lib/config/urls'
import { findLatestClaimByEmail } from '@/lib/free-leads/claims'
import { recordStep } from '@/lib/free-leads/funnel'
import { isLimited, rateLimited, serverError, sessionUser } from '@/lib/free-leads/http'
import { getStripeClient } from '@/lib/stripe/client'
import { FUNNEL_TRIAL_DAYS, getFunnelOffer } from '@/lib/stripe/funnel-products'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const OFFER = 'audience_197'
const LIVE_STATES = ['active', 'past_due', 'paused', 'incomplete']

export async function POST() {
  const user = await sessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (await isLimited('free-leads-checkout', `user:${user.id}`)) return rateLimited()

  const offer = getFunnelOffer(OFFER)
  if (!offer?.stripePriceId) {
    safeError('[start/checkout] missing Stripe price for weekly leads')
    return NextResponse.json({ error: 'Weekly leads are not available right now.' }, { status: 503 })
  }

  // Service role: workspaces.settings and funnel_orders are read server-side only, scoped to the
  // workspace of the verified session user (looked up by auth id, never by request input).
  const admin = createAdminClient()
  try {
    const { data: member, error: memberError } = await admin
      .from('users')
      .select('workspace_id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    if (memberError) throw new Error(`member lookup failed: ${memberError.message}`)
    const { workspace_id: workspaceId, role } = (member ?? {}) as { workspace_id?: string | null; role?: string }
    if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 403 })
    if (role !== 'owner') return NextResponse.json({ error: 'Only the workspace owner can change billing.' }, { status: 403 })

    const { data: ws, error: wsError } = await admin.from('workspaces').select('settings').eq('id', workspaceId).maybeSingle()
    if (wsError) throw new Error(`workspace lookup failed: ${wsError.message}`)
    if ((ws?.settings as { source?: string } | null)?.source !== 'free_leads') {
      return NextResponse.json({ error: 'Not available for this workspace' }, { status: 403 })
    }

    const { data: live, error: liveError } = await admin
      .from('funnel_orders')
      .select('id')
      .eq('workspace_id', workspaceId)
      .in('subscription_state', LIVE_STATES)
      .limit(1)
    if (liveError) throw new Error(`order lookup failed: ${liveError.message}`)
    if (live && live.length > 0) {
      return NextResponse.json({ error: 'Weekly leads are already on for this workspace.' }, { status: 409 })
    }

    const meta = { type: 'funnel_order', offer_slug: offer.slug, free_leads_workspace_id: workspaceId }
    // Two quick clicks reuse one session instead of opening two subscriptions (10-minute window).
    const idempotencyKey = `fl-checkout:${workspaceId}:${Math.floor(Date.now() / 600_000)}`
    const session = await getStripeClient().checkout.sessions.create({
      mode: 'subscription',
      // Locked at Checkout: the order email is the verified session email (the bind re-checks it).
      customer_email: user.email,
      line_items: [{ price: offer.stripePriceId, quantity: 1 }],
      allow_promotion_codes: true,
      // The shared Stripe product copy describes the VSL funnel's Sheets delivery; say where these land.
      custom_text: {
        submit: {
          message:
            'Every Monday, 25 new people who match the profile you approved land in your Cursive workspace. Cancel during the trial and you pay nothing.',
        },
      },
      metadata: { ...meta, monthly_price_cents: String(offer.monthlyPriceCents) },
      subscription_data: {
        ...(FUNNEL_TRIAL_DAYS > 0 ? { trial_period_days: FUNNEL_TRIAL_DAYS } : {}),
        metadata: meta,
      },
      success_url: `${APP_URL}/dashboard?weekly=started`,
      cancel_url: `${APP_URL}/dashboard`,
    }, { idempotencyKey })
    if (!session.url) throw new Error('Stripe returned no checkout url')

    const claim = await findLatestClaimByEmail(user.email, admin)
    await recordStep(claim?.session_id ?? null, 'upgrade_weekly_leads')
    safeLog('[start/checkout] session created', { workspace_id: workspaceId })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    safeError('[start/checkout] failed', err)
    return serverError('We could not open checkout. Please try again.')
  }
}
