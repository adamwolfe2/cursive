import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocked admin client (S1 security-boundary integration tests). Tracks every
// DB op so we can prove a collision performs NO writes. Defined via vi.hoisted
// so the vi.mock factory can reference it.
const mockAdmin = vi.hoisted(() => {
  const state = {
    existingUserRow: null as { id: string } | null,
    orderWorkspaceId: null as string | null,
    linkUpdateError: false,
    ops: [] as Array<{ table: string; op: string; payload?: unknown }>,
  }
  const createUser = vi.fn(async () => ({
    data: { user: { id: 'new-auth' } },
    error: null,
  }))
  const deleteUser = vi.fn(async () => ({ data: null, error: null }))

  function resolve(table: string, op: string, payload: any) {
    if (table === 'funnel_orders' && op === 'select')
      return { data: { workspace_id: state.orderWorkspaceId }, error: null }
    if (table === 'funnel_orders' && op === 'update') {
      if (state.linkUpdateError)
        return { data: null, error: { message: 'link update failed' } }
      return { data: { workspace_id: payload?.workspace_id ?? null }, error: null }
    }
    if (table === 'users' && op === 'select')
      return { data: state.existingUserRow, error: null }
    if (table === 'users' && op === 'insert')
      return { data: { id: 'user-1' }, error: null }
    if (table === 'workspaces' && op === 'insert')
      return { data: { id: 'ws-1' }, error: null }
    return { data: null, error: null }
  }

  function createAdminClient() {
    function from(table: string) {
      const s = { op: 'select' as string, payload: undefined as unknown }
      const chain: any = {
        select: vi.fn(() => chain),
        insert: vi.fn((p: unknown) => {
          s.op = 'insert'
          s.payload = p
          state.ops.push({ table, op: 'insert', payload: p })
          return chain
        }),
        update: vi.fn((p: unknown) => {
          s.op = 'update'
          s.payload = p
          state.ops.push({ table, op: 'update', payload: p })
          return chain
        }),
        delete: vi.fn(() => {
          s.op = 'delete'
          state.ops.push({ table, op: 'delete' })
          return chain
        }),
        eq: vi.fn(() => chain),
        is: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        maybeSingle: vi.fn(async () => resolve(table, s.op, s.payload)),
        single: vi.fn(async () => resolve(table, s.op, s.payload)),
      }
      return chain
    }
    return { from, auth: { admin: { createUser, deleteUser } } }
  }

  return { state, createUser, deleteUser, createAdminClient }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mockAdmin.createAdminClient,
}))

// Keep the module graph shallow — stub heavy collaborators so the boundary
// test exercises provisioning logic, not the full order.service/inngest graph.
vi.mock('./order.service', () => ({
  normalizeEmail: (e: string) => (e || '').toLowerCase().trim(),
  markAudiencePushed: vi.fn(),
}))
vi.mock('@/inngest/client', () => ({ inngest: { send: vi.fn() } }))

import {
  slugifyWorkspace,
  workspaceNameForOrder,
  decideFunnelProvision,
  isExistingAuthUserError,
  provisionFunnelWorkspace,
} from './workspace-provision'

describe('slugifyWorkspace', () => {
  it('derives a slug stem from a domain and drops the TLD', () => {
    expect(slugifyWorkspace('acme.com')).toMatch(/^acme-[0-9a-f]{6}$/)
  })

  it('strips protocol + www', () => {
    expect(slugifyWorkspace('https://www.acme.io')).toMatch(
      /^www-acme-[0-9a-f]{6}$/
    )
  })

  it('uses the local part of an email', () => {
    expect(slugifyWorkspace('jane.doe@acme.com')).toMatch(
      /^jane-doe-[0-9a-f]{6}$/
    )
  })

  it('falls back to "workspace" for empty input', () => {
    expect(slugifyWorkspace('')).toMatch(/^workspace-[0-9a-f]{6}$/)
  })

  it('produces a unique suffix per call', () => {
    const a = slugifyWorkspace('acme.com')
    const b = slugifyWorkspace('acme.com')
    expect(a).not.toBe(b)
  })

  it('caps the stem length', () => {
    const long = 'a'.repeat(100)
    const slug = slugifyWorkspace(long)
    const stem = slug.replace(/-[0-9a-f]{6}$/, '')
    expect(stem.length).toBeLessThanOrEqual(40)
  })
})

describe('workspaceNameForOrder', () => {
  it('prefers the pixel domain', () => {
    expect(
      workspaceNameForOrder({
        pixel_domain: 'acme.com',
        customer_name: 'Jane',
        customer_email: 'jane@acme.com',
      })
    ).toBe('acme.com')
  })

  it('falls back to customer name when no domain', () => {
    expect(
      workspaceNameForOrder({
        pixel_domain: null,
        customer_name: 'Jane Doe',
        customer_email: 'jane@acme.com',
      })
    ).toBe('Jane Doe')
  })

  it('falls back to email when no domain or name', () => {
    expect(
      workspaceNameForOrder({
        pixel_domain: null,
        customer_name: '   ',
        customer_email: 'jane@acme.com',
      })
    ).toBe('jane@acme.com')
  })
})

// ─── S1: account-takeover containment ────────────────────────────────────────
// Stripe collects an UNVERIFIED email at funnel checkout. An attacker can pay
// with a victim's email; without these guards, provisioning would link the
// order to the victim's existing workspace and dashboard-login would mint the
// victim's session. The decision MUST never auto-provision/auto-login onto a
// pre-existing account.

describe('decideFunnelProvision', () => {
  it('reuses ONLY this order\'s already-linked workspace (own data, safe)', () => {
    expect(
      decideFunnelProvision({ orderAlreadyLinked: true, emailMatchesExistingAccount: false })
    ).toEqual({ action: 'reuse_order_workspace' })
  })

  it('still reuses the order\'s own workspace even if the email matches an account', () => {
    // The order is already bound to its own workspace — reusing it is not a
    // collision, it is idempotency. The email match is irrelevant here.
    expect(
      decideFunnelProvision({ orderAlreadyLinked: true, emailMatchesExistingAccount: true })
    ).toEqual({ action: 'reuse_order_workspace' })
  })

  it('BLOCKS when an unlinked order\'s email matches an existing account (takeover guard)', () => {
    expect(
      decideFunnelProvision({ orderAlreadyLinked: false, emailMatchesExistingAccount: true })
    ).toEqual({ action: 'block_email_collision' })
  })

  it('provisions fresh for a brand-new email with no existing account', () => {
    expect(
      decideFunnelProvision({ orderAlreadyLinked: false, emailMatchesExistingAccount: false })
    ).toEqual({ action: 'create_fresh' })
  })
})

describe('isExistingAuthUserError', () => {
  it.each([
    'User already registered',
    'A user with this email address has already been registered',
    'Email address already exists',
    'duplicate key value violates unique constraint "users_email_key"',
  ])('treats "%s" as an existing-account collision', (msg) => {
    expect(isExistingAuthUserError(msg)).toBe(true)
  })

  it.each(['rate limit exceeded', 'network error', 'invalid email', '', null, undefined])(
    'does NOT treat "%s" as a collision',
    (msg) => {
      expect(isExistingAuthUserError(msg as string | null | undefined)).toBe(false)
    }
  )
})

describe('provisionFunnelWorkspace — security boundary', () => {
  const baseOrder = {
    id: 'order-1',
    customer_email: 'jane@acme.com',
    customer_name: 'Jane',
    pixel_domain: 'acme.com',
    pixel_website_url: null,
    offer_slug: 'pixel_97',
    stripe_customer_id: null,
    stripe_subscription_id: null,
  } as unknown as Parameters<typeof provisionFunnelWorkspace>[0]

  beforeEach(() => {
    mockAdmin.state.existingUserRow = null
    mockAdmin.state.orderWorkspaceId = null
    mockAdmin.state.linkUpdateError = false
    mockAdmin.state.ops.length = 0
    mockAdmin.createUser.mockClear()
    mockAdmin.deleteUser.mockClear()
  })

  it('TAKEOVER GUARD: an email matching an existing account returns null and writes NOTHING', async () => {
    mockAdmin.state.existingUserRow = { id: 'victim-user' }

    const res = await provisionFunnelWorkspace(baseOrder)

    expect(res).toBeNull()
    // Never create an auth user for a colliding email…
    expect(mockAdmin.createUser).not.toHaveBeenCalled()
    // …and never insert a workspace or users row.
    const writes = mockAdmin.state.ops.filter(
      (o) => o.op === 'insert' && (o.table === 'workspaces' || o.table === 'users')
    )
    expect(writes).toHaveLength(0)
  })

  it('fresh email provisions a new funnel workspace stamped with this order id', async () => {
    const res = await provisionFunnelWorkspace(baseOrder)

    expect(res?.workspaceId).toBe('ws-1')
    expect(res?.created).toBe(true)
    expect(mockAdmin.createUser).toHaveBeenCalledTimes(1)
    const wsInsert = mockAdmin.state.ops.find(
      (o) => o.table === 'workspaces' && o.op === 'insert'
    )
    expect((wsInsert?.payload as { settings?: { funnel_order_id?: string } })?.settings?.funnel_order_id).toBe('order-1')
  })

  it('a failed order→workspace link rolls back the partial provision and returns null', async () => {
    mockAdmin.state.linkUpdateError = true

    const res = await provisionFunnelWorkspace(baseOrder)

    expect(res).toBeNull()
    // The just-created auth user is rolled back so a retry can re-provision.
    expect(mockAdmin.deleteUser).toHaveBeenCalledTimes(1)
    // The orphaned workspace is rolled back too.
    const wsDelete = mockAdmin.state.ops.find(
      (o) => o.table === 'workspaces' && o.op === 'delete'
    )
    expect(wsDelete).toBeTruthy()
  })
})
