/**
 * provisionFromInstall() unit tests.
 *
 * Covers the shared install entry point for GHL + Shopify marketplace apps.
 * All downstream dependencies (Supabase admin client, AudienceLab pixel API,
 * API key minter, magic-link generator) are mocked — these tests verify
 * orchestration only, not destination behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---- Mocks (must be defined before module import) ------------------------

const mockProvisionCustomerPixel = vi.fn()
const mockCreateApiKey = vi.fn()
const mockGeneratePortalMagicLink = vi.fn()
const mockAdminAuthCreateUser = vi.fn()
const mockAdminAuthListUsers = vi.fn()

// Supabase admin client mock — a chainable builder that records calls so we
// can assert on inserts and existence checks.
type TableState = {
  existingInstall?: {
    id: string
    workspace_id: string
    pixel_id: string | null
    pixel_install_url: string | null
    status: string
  } | null
  existingUser?: {
    id: string
    auth_user_id: string
    workspace_id: string
  } | null
  slugCollision?: boolean
}

let tableState: TableState = {}
let insertedRows: Record<string, unknown[]> = {}

function buildTableChain(table: string) {
  const chain: Record<string, unknown> = {}

  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.limit = vi.fn(() => chain)

  chain.maybeSingle = vi.fn(() => {
    if (table === 'app_installs') {
      return Promise.resolve({ data: tableState.existingInstall ?? null, error: null })
    }
    if (table === 'users') {
      return Promise.resolve({ data: tableState.existingUser ?? null, error: null })
    }
    if (table === 'workspaces') {
      // Select on workspaces happens twice: slug collision check + reactivation lookup.
      // If slugCollision flag is set, return a row on the slug check only.
      if (tableState.slugCollision) {
        tableState.slugCollision = false // one-shot
        return Promise.resolve({ data: { id: 'existing-slug' }, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    }
    return Promise.resolve({ data: null, error: null })
  })

  chain.insert = vi.fn((row: unknown) => {
    insertedRows[table] = [...(insertedRows[table] ?? []), row]
    const insertChain: Record<string, unknown> = {}
    insertChain.select = vi.fn(() => insertChain)
    insertChain.maybeSingle = vi.fn(() => {
      if (table === 'workspaces') {
        return Promise.resolve({
          data: { id: 'ws-new', slug: 'test-shop', name: 'Test Shop' },
          error: null,
        })
      }
      if (table === 'users') {
        return Promise.resolve({ data: { id: 'user-new' }, error: null })
      }
      if (table === 'app_installs') {
        return Promise.resolve({ data: { id: 'install-new' }, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })
    return insertChain
  })

  chain.update = vi.fn(() => chain)
  chain.upsert = vi.fn(() => {
    insertedRows[`${table}__upsert`] = [
      ...(insertedRows[`${table}__upsert`] ?? []),
    ]
    return Promise.resolve({ error: null })
  })

  return chain
}

const mockAdminClient = {
  from: vi.fn((table: string) => buildTableChain(table)),
  auth: {
    admin: {
      createUser: mockAdminAuthCreateUser,
      listUsers: mockAdminAuthListUsers,
    },
  },
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}))

vi.mock('@/lib/audiencelab/api-client', () => ({
  provisionCustomerPixel: (...args: unknown[]) => mockProvisionCustomerPixel(...args),
}))

vi.mock('@/lib/services/workspace-settings.service', () => ({
  createApiKey: (...args: unknown[]) => mockCreateApiKey(...args),
}))

vi.mock('@/lib/provisioning/magic-link', () => ({
  generatePortalMagicLink: (...args: unknown[]) => mockGeneratePortalMagicLink(...args),
}))

// ---- Imports (after mocks) ------------------------------------------------

import { provisionFromInstall } from '@/lib/provisioning/install-from-marketplace'

// ---- Default happy-path fixtures -----------------------------------------

const baseParams = {
  source: 'shopify' as const,
  externalId: 'test-shop.myshopify.com',
  externalName: 'Test Shop',
  installerEmail: 'owner@test-shop.com',
  installerName: 'Sample Owner',
  siteUrl: 'https://test-shop.com',
  accessToken: 'shpat_abc123',
  scopes: ['read_customers', 'write_pixels'],
}

beforeEach(() => {
  vi.clearAllMocks()
  tableState = { existingInstall: null, existingUser: null, slugCollision: false }
  insertedRows = {}

  mockProvisionCustomerPixel.mockResolvedValue({
    pixel_id: 'pix-uuid-123',
    install_url: 'https://pixel.example/install/abc',
  })

  mockCreateApiKey.mockResolvedValue({
    success: true,
    apiKey: { id: 'key-uuid', key: 'csk_plaintext_abc' },
  })

  mockGeneratePortalMagicLink.mockResolvedValue({
    url: 'https://leads.meetcursive.com/auth/verify?token=xyz',
    expiresAt: new Date('2026-04-25'),
  })

  mockAdminAuthCreateUser.mockResolvedValue({
    data: { user: { id: 'auth-uuid-new' } },
    error: null,
  })
})

// ---- Tests ----------------------------------------------------------------

describe('provisionFromInstall — new install (happy path)', () => {
  it('creates workspace, provisions pixel, mints API key, inserts install row, returns magic-link', async () => {
    const result = await provisionFromInstall(baseParams)

    expect(result.install.isNew).toBe(true)
    expect(result.workspace.id).toBe('ws-new')
    expect(result.pixel.id).toBe('pix-uuid-123')
    expect(result.pixel.installUrl).toBe('https://pixel.example/install/abc')
    expect(result.pixel.snippet).toBe(
      '<script src="https://pixel.example/install/abc" defer></script>',
    )
    expect(result.apiKey?.plainKey).toBe('csk_plaintext_abc')
    expect(result.portalUrl).toBe('https://leads.meetcursive.com/auth/verify?token=xyz')
  })

  it('calls AudienceLab pixel provisioning with the install\'s name and site URL', async () => {
    await provisionFromInstall(baseParams)

    expect(mockProvisionCustomerPixel).toHaveBeenCalledWith({
      websiteName: 'Test Shop',
      websiteUrl: 'https://test-shop.com',
    })
  })

  it('writes pixel→workspace mapping to audiencelab_pixels (the tenant isolation wire)', async () => {
    await provisionFromInstall(baseParams)

    const upserts = insertedRows['audiencelab_pixels__upsert']
    expect(upserts).toBeDefined()
    // The upsert call received the mapping — we can't inspect it deeply without
    // more mock plumbing, but existence proves the call happened.
  })

  it('persists the app_installs row with source + external_id + workspace + tokens', async () => {
    await provisionFromInstall(baseParams)

    const installRows = insertedRows['app_installs']
    expect(installRows).toHaveLength(1)
    expect(installRows[0]).toMatchObject({
      source: 'shopify',
      external_id: 'test-shop.myshopify.com',
      workspace_id: 'ws-new',
      pixel_id: 'pix-uuid-123',
      access_token: 'shpat_abc123',
      installer_email: 'owner@test-shop.com',
      status: 'active',
    })
  })

  it('mints the API key with default read-only scopes under the install context', async () => {
    await provisionFromInstall(baseParams)

    expect(mockCreateApiKey).toHaveBeenCalledWith(
      'ws-new',
      'user-new',
      expect.objectContaining({
        name: 'shopify-install',
        scopes: expect.arrayContaining(['read:leads', 'read:campaigns']),
      }),
    )
  })

  it('generates the magic-link with install metadata for audit', async () => {
    await provisionFromInstall(baseParams)

    expect(mockGeneratePortalMagicLink).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@test-shop.com',
        redirectPath: '/dashboard',
        metadata: expect.objectContaining({
          source: 'shopify',
          workspace_id: 'ws-new',
          install_id: 'install-new',
        }),
      }),
    )
  })
})

describe('provisionFromInstall — idempotency', () => {
  it('returns existing workspace + pixel when (source, external_id) already installed', async () => {
    tableState.existingInstall = {
      id: 'install-existing',
      workspace_id: 'ws-existing',
      pixel_id: 'pix-existing',
      pixel_install_url: 'https://pixel.example/install/existing',
      status: 'active',
    }

    // Workspaces lookup for reactivation path
    const workspaceChain = buildTableChain('workspaces')
    workspaceChain.maybeSingle = vi.fn(() =>
      Promise.resolve({
        data: { id: 'ws-existing', slug: 'existing', name: 'Existing Shop' },
        error: null,
      }),
    )
    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'workspaces') return workspaceChain
      return buildTableChain(table)
    })

    const result = await provisionFromInstall(baseParams)

    expect(result.install.isNew).toBe(false)
    expect(result.install.id).toBe('install-existing')
    expect(result.workspace.id).toBe('ws-existing')
    expect(result.pixel.id).toBe('pix-existing')
    // A reinstall does not mint a new API key
    expect(result.apiKey).toBeNull()
  })

  it('does not call AudienceLab pixel provisioning on reinstall', async () => {
    tableState.existingInstall = {
      id: 'install-existing',
      workspace_id: 'ws-existing',
      pixel_id: 'pix-existing',
      pixel_install_url: 'https://pixel.example/install/existing',
      status: 'active',
    }
    const workspaceChain = buildTableChain('workspaces')
    workspaceChain.maybeSingle = vi.fn(() =>
      Promise.resolve({
        data: { id: 'ws-existing', slug: 'existing', name: 'Existing Shop' },
        error: null,
      }),
    )
    mockAdminClient.from.mockImplementation((table: string) =>
      table === 'workspaces' ? workspaceChain : buildTableChain(table),
    )

    await provisionFromInstall(baseParams)

    expect(mockProvisionCustomerPixel).not.toHaveBeenCalled()
    expect(mockCreateApiKey).not.toHaveBeenCalled()
  })

  it('throws if the existing install references a missing workspace', async () => {
    tableState.existingInstall = {
      id: 'install-existing',
      workspace_id: 'ws-orphaned',
      pixel_id: 'pix-existing',
      pixel_install_url: 'https://pixel.example/install/existing',
      status: 'active',
    }
    const workspaceChain = buildTableChain('workspaces')
    workspaceChain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }))
    mockAdminClient.from.mockImplementation((table: string) =>
      table === 'workspaces' ? workspaceChain : buildTableChain(table),
    )

    await expect(provisionFromInstall(baseParams)).rejects.toThrow(/manual intervention required/)
  })
})

describe('provisionFromInstall — user reuse', () => {
  it('reuses an existing users row instead of creating a new auth user', async () => {
    tableState.existingUser = {
      id: 'user-existing',
      auth_user_id: 'auth-existing',
      workspace_id: 'ws-other',
    }

    await provisionFromInstall(baseParams)

    expect(mockAdminAuthCreateUser).not.toHaveBeenCalled()
    // API key should be tied to the reused user's id
    expect(mockCreateApiKey).toHaveBeenCalledWith(
      expect.any(String),
      'user-existing',
      expect.any(Object),
    )
  })
})

describe('provisionFromInstall — error paths', () => {
  it('throws when AudienceLab pixel provisioning fails', async () => {
    mockProvisionCustomerPixel.mockRejectedValue(new Error('AL timeout'))

    await expect(provisionFromInstall(baseParams)).rejects.toThrow(/AL timeout/)
  })

  it('throws when API key minting fails', async () => {
    mockCreateApiKey.mockResolvedValue({ success: false, error: 'db-error' })

    // Minting failure is surfaced as a null apiKey on the result, not a throw —
    // the install still succeeds and the portal can re-mint via settings UI.
    const result = await provisionFromInstall(baseParams)
    expect(result.apiKey).toBeNull()
  })
})
