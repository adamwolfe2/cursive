import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeSupabase } from '@/lib/free-leads/__tests__/fake-supabase'

const db = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.current }))
const auth = vi.hoisted(() => ({ user: null as { id: string; email: string } | null }))
vi.mock('@/lib/free-leads/http', async (orig) => ({
  ...(await orig<typeof import('@/lib/free-leads/http')>()),
  sessionUser: async () => auth.user,
  isLimited: async () => false,
}))
const portal = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@/lib/stripe/client', () => ({ getStripeClient: () => ({ billingPortal: { sessions: { create: portal.create } } }) }))

import { POST } from '../billing/route'

beforeEach(() => {
  auth.user = { id: 'a-1', email: 'owner@acme.com' }
  portal.create.mockReset()
  portal.create.mockResolvedValue({ url: 'https://billing.stripe.com/p/1' })
  db.current = fakeSupabase({
    users: [{ id: 'u-1', auth_user_id: 'a-1', workspace_id: 'ws-1', role: 'owner' }, { id: 'u-2', auth_user_id: 'a-2', workspace_id: 'ws-1', role: 'member' }],
    funnel_orders: [
      { id: 'o-other', workspace_id: 'ws-2', stripe_customer_id: 'cus_other' },
      { id: 'o-1', workspace_id: 'ws-1', stripe_customer_id: 'cus_mine' },
    ],
  })
})

describe('POST /api/start/billing', () => {
  it("opens the billing portal for the caller's own workspace order only", async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: 'https://billing.stripe.com/p/1' })
    expect(portal.create.mock.calls[0][0].customer).toBe('cus_mine')
  })

  it('refuses a non-owner member of the same workspace', async () => {
    auth.user = { id: 'a-2', email: 'm@acme.com' }
    expect((await POST()).status).toBe(403)
    expect(portal.create).not.toHaveBeenCalled()
  })

  it('requires a session', async () => {
    auth.user = null
    expect((await POST()).status).toBe(401)
    expect(portal.create).not.toHaveBeenCalled()
  })

  it('404s when the workspace has no paid order', async () => {
    auth.user = { id: 'a-9', email: 'x@y.com' }
    ;(db.current as ReturnType<typeof fakeSupabase>).tables.users.push({ id: 'u-9', auth_user_id: 'a-9', workspace_id: 'ws-9', role: 'owner' })
    expect((await POST()).status).toBe(404)
    expect(portal.create).not.toHaveBeenCalled()
  })
})
