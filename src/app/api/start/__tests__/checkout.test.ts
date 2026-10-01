import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { fakeSupabase } from '@/lib/free-leads/__tests__/fake-supabase'

const db = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.current }))
const auth = vi.hoisted(() => ({ user: null as { id: string; email: string } | null, limited: false }))
vi.mock('@/lib/free-leads/http', async (orig) => ({
  ...(await orig<typeof import('@/lib/free-leads/http')>()),
  sessionUser: async () => auth.user,
  isLimited: async () => auth.limited,
}))
const stripe = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@/lib/stripe/client', () => ({ getStripeClient: () => ({ checkout: { sessions: { create: stripe.create } } }) }))
vi.mock('@/lib/stripe/funnel-products', async (orig) => {
  const real = await orig<typeof import('@/lib/stripe/funnel-products')>()
  return {
    ...real,
    FUNNEL_TRIAL_DAYS: 14,
    getFunnelOffer: (slug: string) => {
      const o = real.getFunnelOffer(slug)
      return o ? { ...o, stripePriceId: 'price_test_197' } : null
    },
  }
})

import { POST } from '../checkout/route'

const WS = 'ws-free'
const post = (body: unknown = {}) =>
  POST(new NextRequest('http://localhost/api/start/checkout', { method: 'POST', body: JSON.stringify(body) }))

beforeEach(() => {
  auth.user = { id: 'a-1', email: 'owner@acme.com' }
  auth.limited = false
  stripe.create.mockReset()
  stripe.create.mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' })
  db.current = fakeSupabase({
    users: [
      { id: 'u-1', auth_user_id: 'a-1', workspace_id: WS, email: 'owner@acme.com', role: 'owner' },
      { id: 'u-3', auth_user_id: 'a-3', workspace_id: 'ws-market', email: 'x@market.com', role: 'owner' },
    ],
    workspaces: [
      { id: WS, settings: { source: 'free_leads' } },
      { id: 'ws-market', settings: { source: 'signup' } },
    ],
    funnel_orders: [],
  })
})

describe('POST /api/start/checkout', () => {
  it('starts a weekly-leads trial checkout bound to the caller\'s own workspace and email', async () => {
    const res = await post({ workspace_id: 'ws-someone-else', price: 1, email: 'evil@x.com' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.com/c/cs_1' })
    const args = stripe.create.mock.calls[0][0]
    expect(args.mode).toBe('subscription')
    expect(args.line_items).toEqual([{ price: 'price_test_197', quantity: 1 }])
    expect(args.customer_email).toBe('owner@acme.com')
    expect(args.metadata).toMatchObject({ type: 'funnel_order', offer_slug: 'audience_197', free_leads_workspace_id: WS })
    expect(args.subscription_data).toMatchObject({ trial_period_days: 14, metadata: { free_leads_workspace_id: WS } })
  })

  it('requires a signed-in user', async () => {
    auth.user = null
    expect((await post()).status).toBe(401)
    expect(stripe.create).not.toHaveBeenCalled()
  })

  it('refuses workspaces that did not come from the free-leads flow', async () => {
    auth.user = { id: 'a-3', email: 'x@market.com' }
    expect((await post()).status).toBe(403)
    expect(stripe.create).not.toHaveBeenCalled()
  })

  it('does not open a second subscription for a workspace that already has a live one', async () => {
    ;(db.current as ReturnType<typeof fakeSupabase>).tables.funnel_orders.push({ id: 'o-1', workspace_id: WS, subscription_state: 'active' })
    const res = await post()
    expect(res.status).toBe(409)
    expect(stripe.create).not.toHaveBeenCalled()
  })

  it('lets a workspace whose earlier subscription was cancelled start again', async () => {
    ;(db.current as ReturnType<typeof fakeSupabase>).tables.funnel_orders.push({ id: 'o-1', workspace_id: WS, subscription_state: 'cancelled' })
    expect((await post()).status).toBe(200)
  })

  it('respects the rate limit', async () => {
    auth.limited = true
    expect((await post()).status).toBe(429)
    expect(stripe.create).not.toHaveBeenCalled()
  })

  it('reports a Stripe failure without leaking it', async () => {
    stripe.create.mockRejectedValue(new Error('sk_live_secret exploded'))
    const res = await post()
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('sk_live')
  })
})
