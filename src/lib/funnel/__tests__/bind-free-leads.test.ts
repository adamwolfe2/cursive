import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeSupabase } from '@/lib/free-leads/__tests__/fake-supabase'
import type { FunnelOrder } from '../order.service'

const db = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.current }))

import { bindOrderToFreeLeadsWorkspace } from '../workspace-provision'

const WS = 'ws-free'
const order = (over: Partial<FunnelOrder> = {}) =>
  ({ id: 'ord-1', customer_email: 'Owner@Acme.com', offer_slug: 'audience_197', ...over }) as FunnelOrder
const tables = () => (db.current as ReturnType<typeof fakeSupabase>).tables

beforeEach(() => {
  db.current = fakeSupabase({
    workspaces: [
      { id: WS, settings: { source: 'free_leads' } },
      { id: 'ws-marketplace', settings: { source: 'signup' } },
    ],
    users: [
      { id: 'u-1', auth_user_id: 'a-1', workspace_id: WS, email: 'owner@acme.com', role: 'owner' },
      { id: 'u-4', auth_user_id: 'a-4', workspace_id: WS, email: 'member@acme.com', role: 'member' },
      { id: 'u-2', auth_user_id: 'a-2', workspace_id: 'ws-marketplace', email: 'owner@acme.com', role: 'owner' },
    ],
    funnel_orders: [{ id: 'ord-1', workspace_id: null }],
  })
})

describe('bindOrderToFreeLeadsWorkspace', () => {
  it('links the paid order to the free-leads workspace its owner checked out from', async () => {
    const res = await bindOrderToFreeLeadsWorkspace(order(), WS)
    expect(res).toMatchObject({ workspaceId: WS, userId: 'u-1', authUserId: 'a-1', created: false })
    expect(tables().funnel_orders[0].workspace_id).toBe(WS)
  })

  it('refuses a workspace that did not come from the free-leads flow', async () => {
    expect(await bindOrderToFreeLeadsWorkspace(order(), 'ws-marketplace')).toBeNull()
    expect(tables().funnel_orders[0].workspace_id).toBeNull()
  })

  it('refuses when the checkout email is not a member of that workspace', async () => {
    expect(await bindOrderToFreeLeadsWorkspace(order({ customer_email: 'attacker@evil.com' }), WS)).toBeNull()
    expect(tables().funnel_orders[0].workspace_id).toBeNull()
  })

  it('refuses a non-owner member of the workspace', async () => {
    expect(await bindOrderToFreeLeadsWorkspace(order({ customer_email: 'member@acme.com' }), WS)).toBeNull()
    expect(tables().funnel_orders[0].workspace_id).toBeNull()
  })

  it('refuses an unknown workspace id', async () => {
    expect(await bindOrderToFreeLeadsWorkspace(order(), 'ws-missing')).toBeNull()
  })

  it('never moves an order that is already bound to another workspace (replayed webhook)', async () => {
    tables().funnel_orders[0].workspace_id = 'ws-other'
    expect(await bindOrderToFreeLeadsWorkspace(order(), WS)).toBeNull()
    expect(tables().funnel_orders[0].workspace_id).toBe('ws-other')
  })

  it('is idempotent when the same webhook is replayed for the same workspace', async () => {
    await bindOrderToFreeLeadsWorkspace(order(), WS)
    expect(await bindOrderToFreeLeadsWorkspace(order(), WS)).toMatchObject({ workspaceId: WS })
  })
})
