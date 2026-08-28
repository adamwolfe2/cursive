/**
 * P0 regression: funnel provisioning must never auto-link a paid order to a
 * pre-existing NON-funnel workspace on the strength of the Stripe checkout
 * email, which is buyer-controlled and unverified.
 *
 * The attack this locks out: pay for the offer, type a victim's email at
 * checkout, pull the portal token from /api/funnel/by-session using your own
 * Stripe session id, then call /dashboard-login and receive a real dashboard
 * session as the victim.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLinkUpdate = vi.fn()

/** Chainable Supabase stub driven by `state`. */
let state: {
  orderWorkspaceId: string | null
  existingUser: { id: string; auth_user_id: string; workspace_id: string } | null
  workspaceSettings: Record<string, unknown> | null
}

function chainFor(table: string) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.is = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.limit = vi.fn(() => chain)
  chain.update = vi.fn((vals: unknown) => {
    mockLinkUpdate({ table, vals })
    return chain
  })
  chain.maybeSingle = vi.fn(async () => {
    if (table === 'funnel_orders')
      return { data: { workspace_id: state.orderWorkspaceId }, error: null }
    if (table === 'users') return { data: state.existingUser, error: null }
    if (table === 'workspaces')
      return { data: { settings: state.workspaceSettings }, error: null }
    return { data: null, error: null }
  })
  return chain
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: (t: string) => chainFor(t) }),
}))
vi.mock('@/lib/utils/log-sanitizer', () => ({
  safeLog: vi.fn(),
  safeError: vi.fn(),
}))

import { provisionFunnelWorkspace } from './workspace-provision'

const order = {
  id: 'order-1',
  customer_email: 'victim@company.com',
  customer_name: 'Victim',
  pixel_domain: null,
} as unknown as Parameters<typeof provisionFunnelWorkspace>[0]

beforeEach(() => {
  mockLinkUpdate.mockClear()
  state = {
    orderWorkspaceId: null,
    existingUser: null,
    workspaceSettings: null,
  }
})

describe('provisionFunnelWorkspace — unverified-email takeover guard', () => {
  it('REFUSES to link a paid order to a pre-existing non-funnel workspace', async () => {
    state.existingUser = {
      id: 'victim-user',
      auth_user_id: 'victim-auth',
      workspace_id: 'victim-workspace',
    }
    state.workspaceSettings = {} // marketplace workspace: no source marker

    const result = await provisionFunnelWorkspace(order)

    expect(result).toBeNull()
    expect(mockLinkUpdate).not.toHaveBeenCalled()
  })

  it('REFUSES for an explicitly non-funnel source', async () => {
    state.existingUser = {
      id: 'victim-user',
      auth_user_id: 'victim-auth',
      workspace_id: 'victim-workspace',
    }
    state.workspaceSettings = { source: 'marketplace' }

    expect(await provisionFunnelWorkspace(order)).toBeNull()
    expect(mockLinkUpdate).not.toHaveBeenCalled()
  })

  it('allows reuse only when the workspace is itself funnel-sourced', async () => {
    state.existingUser = {
      id: 'buyer-user',
      auth_user_id: 'buyer-auth',
      workspace_id: 'funnel-workspace',
    }
    state.workspaceSettings = { source: 'funnel_order' }

    const result = await provisionFunnelWorkspace(order)

    expect(result).not.toBeNull()
    expect(result?.workspaceId).toBe('funnel-workspace')
    expect(result?.created).toBe(false)
  })
})
