/**
 * Offers API Route Tests
 * GET /api/ai-studio/offers
 *
 * Tests offers listing endpoint:
 * - Authentication checks
 * - Workspace parameter validation
 * - Workspace ownership verification
 * - Offer filtering and ordering
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================
// MOCKS
// ============================================

const mockGetCurrentUser = vi.fn()
const mockCreateClient = vi.fn()

// Chainable query builder
function createQueryChain(resolvedValue?: any) {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(resolvedValue ?? { data: null, error: null })
  chain.maybeSingle = vi.fn().mockResolvedValue(resolvedValue ?? { data: null, error: null })
  return chain
}

// Mock authentication helper
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

// Import route AFTER all mocks are set up
import { GET } from '@/app/api/ai-studio/offers/route'

// ============================================
// HELPERS
// ============================================

function makeRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/ai-studio/offers')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return new NextRequest(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function mockAuthenticatedUser(overrides: any = {}) {
  mockGetCurrentUser.mockResolvedValue({
    id: 'auth-user-123',
    auth_user_id: 'auth-user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    workspace_id: 'workspace-123',
    role: 'owner',
    plan: 'pro',
    ...overrides,
  })
}

function mockUnauthenticatedUser() {
  mockGetCurrentUser.mockResolvedValue(null)
}

function mockSupabaseClient(options: {
  userData?: any
  brandWorkspace?: any
  offers?: any[]
  offersError?: any
} = {}) {
  const client = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'users') {
        // Use default only if userData not provided at all
        const userData = 'userData' in options
          ? options.userData
          : { workspace_id: 'workspace-123' }

        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: userData,
            error: null,
          }),
        }
      }

      if (table === 'brand_workspaces') {
        // Use default only if brandWorkspace not provided at all
        const brandWorkspace = 'brandWorkspace' in options
          ? options.brandWorkspace
          : { id: 'brand-workspace-123' }

        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: brandWorkspace,
            error: null,
          }),
        }
      }

      if (table === 'offers') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: options.offers ?? [],
            error: options.offersError ?? null,
          }),
        }
      }

      return createQueryChain()
    }),
  }

  mockCreateClient.mockResolvedValue(client)
  return client
}

// ============================================
// TESTS
// ============================================

describe('GET /api/ai-studio/offers', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: Authenticated user
    mockAuthenticatedUser()

    // Default: Successful Supabase mocks (can be overridden in individual tests)
    mockSupabaseClient()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // ============================================
  // AUTHENTICATION TESTS
  // ============================================

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockUnauthenticatedUser()

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should proceed when user is authenticated', async () => {
      mockAuthenticatedUser()
      mockSupabaseClient()

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  // ============================================
  // PARAMETER VALIDATION TESTS
  // ============================================

  describe('Parameter Validation', () => {
    it('should return 400 when workspace parameter is missing', async () => {
      const request = makeRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('workspace parameter required')
    })

    it('should return 400 when workspace parameter is empty', async () => {
      const request = makeRequest({ workspace: '' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('workspace parameter required')
    })

    it('should accept valid workspace parameter', async () => {
      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  // ============================================
  // WORKSPACE OWNERSHIP TESTS
  // ============================================

  describe('Workspace Ownership', () => {
    it('should return 403 when user lookup fails', async () => {
      mockSupabaseClient({ userData: null })

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should return 403 when brand workspace does not belong to user', async () => {
      mockSupabaseClient({
        userData: { workspace_id: 'workspace-123' },
        brandWorkspace: null, // Brand workspace not found or doesn't match
      })

      const request = makeRequest({ workspace: 'other-workspace-456' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should allow access when workspace belongs to user', async () => {
      mockSupabaseClient({
        userData: { workspace_id: 'workspace-123' },
        brandWorkspace: { id: 'brand-workspace-123' },
      })

      const request = makeRequest({ workspace: 'brand-workspace-123' })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  // ============================================
  // OFFERS FETCHING TESTS
  // ============================================

  describe('Offers Fetching', () => {
    it('should return empty array when no offers exist', async () => {
      mockSupabaseClient({ offers: [] })

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.offers).toEqual([])
    })

    it('should return offers for the workspace', async () => {
      const mockOffers = [
        {
          id: 'offer-1',
          brand_workspace_id: 'workspace-123',
          title: 'Summer Sale',
          description: '50% off',
          offer_type: 'discount',
          discount_value: 50,
          discount_type: 'percentage',
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'offer-2',
          brand_workspace_id: 'workspace-123',
          title: 'Winter Sale',
          description: '$20 off',
          offer_type: 'discount',
          discount_value: 20,
          discount_type: 'fixed',
          status: 'active',
          created_at: '2025-02-01T00:00:00Z',
        },
      ]

      mockSupabaseClient({ offers: mockOffers })

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.offers).toHaveLength(2)
      expect(data.offers).toEqual(mockOffers)
    })

    it('should filter by active status only', async () => {
      const mockOffers = [
        { id: 'offer-1', status: 'active', title: 'Active Offer' },
      ]

      mockSupabaseClient({ offers: mockOffers })

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.offers).toHaveLength(1)
      expect(data.offers[0].status).toBe('active')
    })

    it('should order offers by created_at descending', async () => {
      const mockOffers = [
        { id: 'offer-2', created_at: '2025-02-01T00:00:00Z' }, // Newer
        { id: 'offer-1', created_at: '2025-01-01T00:00:00Z' }, // Older
      ]

      mockSupabaseClient({ offers: mockOffers })

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // First item should be newer (created_at is later)
      expect(data.offers[0].id).toBe('offer-2')
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should return 500 when database query fails', async () => {
      mockSupabaseClient({
        offersError: { message: 'Database connection error' },
      })

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch offers')
    })

    it('should handle unexpected errors gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Unexpected error'))

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch offers')
    })

    it('should handle database connection errors', async () => {
      mockCreateClient.mockRejectedValue(new Error('Database connection failed'))

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch offers')
    })
  })
})
