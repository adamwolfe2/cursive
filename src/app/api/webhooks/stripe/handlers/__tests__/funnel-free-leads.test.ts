import { beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'

const m = vi.hoisted(() => ({
  session: null as unknown as Stripe.Checkout.Session,
  bind: vi.fn(),
  provision: vi.fn(),
  notify: vi.fn(),
  email: vi.fn(),
}))
vi.mock('../types', async (orig) => ({
  ...(await orig<typeof import('../types')>()),
  getStripe: () => ({
    checkout: { sessions: { retrieve: async () => m.session } },
    subscriptions: { retrieve: async () => ({ trial_end: null }), update: async () => ({ status: 'active' }) },
  }),
}))
vi.mock('@/lib/funnel/order.service', () => ({
  createOrderFromCheckoutSession: async () => ({
    order: { id: 'ord-1', customer_email: 'owner@acme.com', stripe_subscription_id: null, offer_slug: 'audience_197' },
    portalUrl: 'https://leads.meetcursive.com/funnel/tok123',
  }),
  countPriorOrdersForEmail: async () => 0,
  setTrialEndsAt: async () => undefined,
}))
vi.mock('@/lib/email/service', () => ({ sendEmail: vi.fn(), sendPurchaseConfirmationEmail: vi.fn(), sendCreditPurchaseConfirmationEmail: vi.fn() }))
vi.mock('@/inngest/client', () => ({ inngest: { send: vi.fn() } }))
vi.mock('@/lib/funnel/workspace-provision', () => ({ bindOrderToFreeLeadsWorkspace: m.bind, provisionFunnelWorkspace: m.provision }))
vi.mock('@/lib/free-leads/notify', () => ({ notifySales: m.notify }))
vi.mock('@/lib/email/templates/funnel-confirmation', () => ({ sendFunnelConfirmationEmail: m.email }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: () => ({ update: () => ({ eq: () => ({ is: async () => ({ error: null }) }) }) }) }),
}))

import { handleCheckoutSessionCompleted } from '../checkout-session'

const event = { data: { object: { id: 'cs_1' } } } as unknown as Stripe.Event
const session = (metadata: Record<string, string>) => ({ id: 'cs_1', metadata }) as unknown as Stripe.Checkout.Session

beforeEach(() => {
  for (const f of [m.bind, m.provision, m.notify, m.email]) f.mockReset()
  m.email.mockResolvedValue(undefined)
})

describe('funnel_order checkout with a free-leads workspace', () => {
  it('binds to the workspace from server-set metadata and never provisions a new one', async () => {
    m.session = session({ type: 'funnel_order', offer_slug: 'audience_197', free_leads_workspace_id: 'ws-free' })
    m.bind.mockResolvedValue({ workspaceId: 'ws-free', userId: 'u', authUserId: 'a', created: false })
    await handleCheckoutSessionCompleted(event)
    expect(m.bind).toHaveBeenCalledWith(expect.objectContaining({ id: 'ord-1' }), 'ws-free')
    expect(m.provision).not.toHaveBeenCalled()
    expect(m.notify).not.toHaveBeenCalled()
    expect(m.email.mock.calls[0][0].dashboardUrl).toMatch(/\/dashboard$/)
  })

  it('alerts sales when the bind is refused, and still sends the receipt email', async () => {
    m.session = session({ type: 'funnel_order', offer_slug: 'audience_197', free_leads_workspace_id: 'ws-free' })
    m.bind.mockResolvedValue(null)
    await handleCheckoutSessionCompleted(event)
    expect(m.notify).toHaveBeenCalledTimes(1)
    expect(m.provision).not.toHaveBeenCalled()
    expect(m.email).toHaveBeenCalledTimes(1)
    expect(m.email.mock.calls[0][0].dashboardUrl).toBeUndefined()
  })

  it('alerts sales when the bind throws', async () => {
    m.session = session({ type: 'funnel_order', offer_slug: 'audience_197', free_leads_workspace_id: 'ws-free' })
    m.bind.mockRejectedValue(new Error('db down'))
    await handleCheckoutSessionCompleted(event)
    expect(m.notify).toHaveBeenCalledTimes(1)
  })

  it('leaves pay-first funnel orders on the existing provisioning path', async () => {
    m.session = session({ type: 'funnel_order', offer_slug: 'audience_197' })
    m.provision.mockResolvedValue({ workspaceId: 'ws-new', userId: 'u', authUserId: 'a', created: true })
    await handleCheckoutSessionCompleted(event)
    expect(m.provision).toHaveBeenCalledTimes(1)
    expect(m.bind).not.toHaveBeenCalled()
    expect(m.email.mock.calls[0][0].dashboardUrl).toContain('/api/funnel/tok123/dashboard-login')
  })
})
