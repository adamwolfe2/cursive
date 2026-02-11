/**
 * Pixel Provisioning API Route Tests
 *
 * Tests the POST /api/pixel/provision endpoint:
 * - URL validation (rejects localhost, IPs, missing TLD)
 * - Authentication required
 * - Role enforcement (owner/admin only)
 * - Idempotent return of existing pixel
 * - Successful provisioning flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================
// HOISTED MOCKS — vi.hoisted runs before vi.mock
// ============================================

const {
  mockGetUser,
  userChain,
  adminPixelChain,
  createChainMock,
} = vi.hoisted(() => {
  const _vi = {
    fn: (impl?: any) => {
      const f: any = impl ? impl : () => undefined
      f.mockReturnValue = (v: any) => { f._returnValue = v; const wrapped: any = (...args: any[]) => f._returnValue; Object.assign(wrapped, f); return wrapped }
      f.mockResolvedValue = (v: any) => { f._resolvedValue = v; return f }
      f.mockImplementation = (fn: any) => { Object.assign(f, fn); return f }
      f.mockReturnThis = () => f
      return f
    },
  }

  // We can't use vi inside vi.hoisted, so we store state and configure in beforeEach
  return {
    mockGetUser: null as any, // Placeholder — set up via the mock factory
    userChain: null as any,
    adminPixelChain: null as any,
    createChainMock: null as any,
  }
})

// Track mock state via module-level variables set in mock factories
let _mockGetUser: ReturnType<typeof vi.fn>
let _userChainSingle: ReturnType<typeof vi.fn>
let _adminPixelChainMaybeSingle: ReturnType<typeof vi.fn>
let _adminPixelChainInsert: ReturnType<typeof vi.fn>
let _adminPixelChainSelect: ReturnType<typeof vi.fn>
let _adminPixelChainEq: ReturnType<typeof vi.fn>

// Supabase server client (auth client — uses cookies)
vi.mock('@/lib/supabase/server', () => {
  const _mockGetUser = vi.fn()
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn()

  // Expose for test use via module-level setter
  ;(globalThis as any).__pixelTest_mockGetUser = _mockGetUser
  ;(globalThis as any).__pixelTest_userChainSingle = chain.single
  ;(globalThis as any).__pixelTest_userChainSelect = chain.select
  ;(globalThis as any).__pixelTest_userChainEq = chain.eq

  return {
    createClient: vi.fn().mockResolvedValue({
      auth: { getUser: _mockGetUser },
      from: vi.fn((table: string) => {
        if (table === 'users') return chain
        const fallback: any = {}
        fallback.select = vi.fn().mockReturnValue(fallback)
        fallback.eq = vi.fn().mockReturnValue(fallback)
        fallback.single = vi.fn().mockResolvedValue({ data: null, error: null })
        return fallback
      }),
    }),
  }
})

// Supabase admin client (service role — bypasses RLS)
vi.mock('@/lib/supabase/admin', () => {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn()
  chain.maybeSingle = vi.fn()

  ;(globalThis as any).__pixelTest_adminPixelChainMaybeSingle = chain.maybeSingle
  ;(globalThis as any).__pixelTest_adminPixelChainInsert = chain.insert
  ;(globalThis as any).__pixelTest_adminPixelChainSelect = chain.select
  ;(globalThis as any).__pixelTest_adminPixelChainEq = chain.eq

  return {
    createAdminClient: vi.fn(() => ({
      from: vi.fn((table: string) => {
        if (table === 'audiencelab_pixels') return chain
        const fallback: any = {}
        fallback.select = vi.fn().mockReturnValue(fallback)
        fallback.eq = vi.fn().mockReturnValue(fallback)
        fallback.single = vi.fn().mockResolvedValue({ data: null, error: null })
        fallback.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
        return fallback
      }),
    })),
  }
})

// Mock AudienceLab API client
vi.mock('@/lib/audiencelab/api-client', () => ({
  provisionCustomerPixel: vi.fn().mockResolvedValue({
    pixel_id: 'al-pixel-001',
    install_url: 'https://sp.audiencelab.io/pixel/al-pixel-001.js',
    script: '<script src="https://sp.audiencelab.io/pixel/al-pixel-001.js" async></script>',
  }),
}))

// Mock Slack alerts
vi.mock('@/lib/monitoring/alerts', () => ({
  sendSlackAlert: vi.fn().mockResolvedValue(undefined),
}))

// Import the route handler AFTER mocks
import { POST } from '@/app/api/pixel/provision/route'

// ============================================
// HELPERS
// ============================================

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/pixel/provision', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

// Access the mock functions created inside vi.mock factories
function getMockGetUser() {
  return (globalThis as any).__pixelTest_mockGetUser as ReturnType<typeof vi.fn>
}

function getUserChainSingle() {
  return (globalThis as any).__pixelTest_userChainSingle as ReturnType<typeof vi.fn>
}

function getAdminPixelChainMaybeSingle() {
  return (globalThis as any).__pixelTest_adminPixelChainMaybeSingle as ReturnType<typeof vi.fn>
}

function getAdminPixelChainInsert() {
  return (globalThis as any).__pixelTest_adminPixelChainInsert as ReturnType<typeof vi.fn>
}

function createInsertChainMock() {
  const selectFn = vi.fn()
  const singleFn = vi.fn().mockResolvedValue({ data: null, error: null })
  selectFn.mockReturnValue({ single: singleFn })
  return { select: selectFn, single: singleFn }
}

// ============================================
// TESTS
// ============================================

describe('POST /api/pixel/provision', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: authenticated user with admin role
    getMockGetUser().mockResolvedValue({
      data: { user: { id: 'auth-uid-1', email: 'admin@acme.com' } },
      error: null,
    })

    getUserChainSingle().mockResolvedValue({
      data: { workspace_id: 'ws-1', full_name: 'Admin User', role: 'admin' },
      error: null,
    })

    // Default: no existing pixel
    getAdminPixelChainMaybeSingle().mockResolvedValue({ data: null, error: null })

    // Default: insert succeeds
    const insertResult = createInsertChainMock()
    getAdminPixelChainInsert().mockReturnValue(insertResult)
  })

  // ============================================
  // Authentication
  // ============================================

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      getMockGetUser().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = makeRequest({ website_url: 'https://acme.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 when user has no workspace', async () => {
      getUserChainSingle().mockResolvedValue({
        data: null,
        error: { message: 'No rows' },
      })

      const request = makeRequest({ website_url: 'https://acme.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No workspace found')
    })
  })

  // ============================================
  // Role enforcement
  // ============================================

  describe('Role enforcement', () => {
    it('should return 403 for member role', async () => {
      getUserChainSingle().mockResolvedValue({
        data: { workspace_id: 'ws-1', full_name: 'Member', role: 'member' },
        error: null,
      })

      const request = makeRequest({ website_url: 'https://acme.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('owners or admins')
    })

    it('should return 403 for viewer role', async () => {
      getUserChainSingle().mockResolvedValue({
        data: { workspace_id: 'ws-1', full_name: 'Viewer', role: 'viewer' },
        error: null,
      })

      const request = makeRequest({ website_url: 'https://acme.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
    })

    it('should allow owner role', async () => {
      getUserChainSingle().mockResolvedValue({
        data: { workspace_id: 'ws-1', full_name: 'Owner', role: 'owner' },
        error: null,
      })

      getAdminPixelChainMaybeSingle().mockResolvedValue({ data: null, error: null })
      const insertResult = createInsertChainMock()
      getAdminPixelChainInsert().mockReturnValue(insertResult)

      const request = makeRequest({ website_url: 'https://acme.com' })
      const response = await POST(request)

      expect(response.status).not.toBe(403)
    })

    it('should allow admin role', async () => {
      // Default setup has admin role
      getAdminPixelChainMaybeSingle().mockResolvedValue({ data: null, error: null })
      const insertResult = createInsertChainMock()
      getAdminPixelChainInsert().mockReturnValue(insertResult)

      const request = makeRequest({ website_url: 'https://acme.com' })
      const response = await POST(request)

      expect(response.status).not.toBe(403)
    })

    it('should allow users with null role (legacy users)', async () => {
      getUserChainSingle().mockResolvedValue({
        data: { workspace_id: 'ws-1', full_name: 'Legacy User', role: null },
        error: null,
      })

      getAdminPixelChainMaybeSingle().mockResolvedValue({ data: null, error: null })
      const insertResult = createInsertChainMock()
      getAdminPixelChainInsert().mockReturnValue(insertResult)

      const request = makeRequest({ website_url: 'https://acme.com' })
      const response = await POST(request)

      // null role passes: `userData.role && !['owner', 'admin'].includes(userData.role)`
      // null is falsy, so the condition short-circuits → allowed
      expect(response.status).not.toBe(403)
    })
  })

  // ============================================
  // URL Validation
  // ============================================

  describe('URL validation', () => {
    it('should reject localhost URLs', async () => {
      const request = makeRequest({ website_url: 'https://localhost:3000' })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject 127.0.0.1 URLs', async () => {
      const request = makeRequest({ website_url: 'http://127.0.0.1:8080' })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject raw IP addresses', async () => {
      const request = makeRequest({ website_url: 'http://192.168.1.1/admin' })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject hostnames without TLD (no dot)', async () => {
      const request = makeRequest({ website_url: 'https://intranet/page' })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject non-URL strings', async () => {
      const request = makeRequest({ website_url: 'not-a-url' })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject empty website_url', async () => {
      const request = makeRequest({ website_url: '' })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject missing website_url', async () => {
      const request = makeRequest({})
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should accept valid public URLs', async () => {
      getAdminPixelChainMaybeSingle().mockResolvedValue({ data: null, error: null })
      const insertResult = createInsertChainMock()
      getAdminPixelChainInsert().mockReturnValue(insertResult)

      const request = makeRequest({ website_url: 'https://www.acme.com' })
      const response = await POST(request)

      expect(response.status).not.toBe(400)
    })

    it('should accept URLs with subdomains', async () => {
      getAdminPixelChainMaybeSingle().mockResolvedValue({ data: null, error: null })
      const insertResult = createInsertChainMock()
      getAdminPixelChainInsert().mockReturnValue(insertResult)

      const request = makeRequest({ website_url: 'https://app.example.co.uk' })
      const response = await POST(request)

      expect(response.status).not.toBe(400)
    })
  })

  // ============================================
  // Idempotent pixel return
  // ============================================

  describe('Idempotent pixel return', () => {
    it('should return existing pixel without creating a new one', async () => {
      const existingPixel = {
        pixel_id: 'existing-px-1',
        domain: 'acme.com',
        is_active: true,
        snippet: '<script src="..."></script>',
        install_url: 'https://sp.audiencelab.io/pixel/existing-px-1.js',
        label: 'Acme',
        created_at: '2026-01-15T00:00:00Z',
      }

      getAdminPixelChainMaybeSingle().mockResolvedValue({ data: existingPixel, error: null })

      const request = makeRequest({ website_url: 'https://acme.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pixel_id).toBe('existing-px-1')
      expect(data.existing).toBe(true)
      expect(data.domain).toBe('acme.com')
    })
  })
})
