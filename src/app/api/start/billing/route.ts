/**
 * POST /api/start/billing (session required) -> { url }
 * Stripe billing portal (cancel, card, invoices) for the weekly-leads order of the caller's own
 * workspace. The customer id is read server-side from that workspace's order, never from input.
 */
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { APP_URL } from '@/lib/config/urls'
import { isLimited, rateLimited, serverError, sessionUser } from '@/lib/free-leads/http'
import { getStripeClient } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST() {
  const user = await sessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (await isLimited('free-leads-checkout', `user:${user.id}`)) return rateLimited()

  // Service role: funnel_orders is server-only (RLS, no policies); scoped to the session user's workspace.
  const admin = createAdminClient()
  try {
    const { data: member, error: memberError } = await admin
      .from('users')
      .select('workspace_id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    if (memberError) throw new Error(`member lookup failed: ${memberError.message}`)
    const { workspace_id: workspaceId, role } = (member ?? {}) as { workspace_id?: string | null; role?: string }
    if (!workspaceId) return NextResponse.json({ error: 'No billing account' }, { status: 404 })
    if (role !== 'owner') return NextResponse.json({ error: 'Only the workspace owner can manage billing.' }, { status: 403 })

    const { data: order, error: orderError } = await admin
      .from('funnel_orders')
      .select('stripe_customer_id')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (orderError) throw new Error(`order lookup failed: ${orderError.message}`)
    const customer = (order as { stripe_customer_id: string | null } | null)?.stripe_customer_id
    if (!customer) return NextResponse.json({ error: 'No billing account' }, { status: 404 })

    const session = await getStripeClient().billingPortal.sessions.create({ customer, return_url: `${APP_URL}/dashboard` })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    safeError('[start/billing] failed', err)
    return serverError('We could not open billing. Please try again.')
  }
}
