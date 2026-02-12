/**
 * Customer Profiles API Route Tests
 * GET /api/ai-studio/profiles
 *
 * Tests customer profiles listing endpoint:
 * - Authentication checks
 * - Workspace parameter validation
 * - Workspace ownership verification
 * - Profile fetching and ordering
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
import { GET } from '@/app/api/ai-studio/profiles/route'

// ============================================
// HELPERS
// ============================================

function makeRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/ai-studio/profiles')
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
  profiles?: any[]
  profilesError?: any
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

      if (table === 'customer_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: options.profiles ?? [],
            error: options.profilesError ?? null,
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

describe('GET /api/ai-studio/profiles', () => {
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
  // PROFILES FETCHING TESTS
  // ============================================

  describe('Profiles Fetching', () => {
    it('should return empty array when no profiles exist', async () => {
      mockSupabaseClient({ profiles: [] })

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.profiles).toEqual([])
    })

    it('should return customer profiles for the workspace', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          brand_workspace_id: 'workspace-123',
          name: 'Tech Enthusiast',
          email: 'tech@example.com',
          demographics: { age: '25-35', location: 'SF' },
          engagement_score: 85,
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'profile-2',
          brand_workspace_id: 'workspace-123',
          name: 'Budget Shopper',
          email: 'budget@example.com',
          demographics: { age: '35-45', location: 'NYC' },
          engagement_score: 72,
          created_at: '2025-02-01T00:00:00Z',
        },
      ]

      mockSupabaseClient({ profiles: mockProfiles })

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.profiles).toHaveLength(2)
      expect(data.profiles).toEqual(mockProfiles)
    })

    it('should order profiles by created_at descending', async () => {
      const mockProfiles = [
        { id: 'profile-2', created_at: '2025-02-01T00:00:00Z' }, // Newer
        { id: 'profile-1', created_at: '2025-01-01T00:00:00Z' }, // Older
      ]

      mockSupabaseClient({ profiles: mockProfiles })

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // First item should be newer (created_at is later)
      expect(data.profiles[0].id).toBe('profile-2')
    })

    it('should return all profiles without status filtering', async () => {
      // Unlike offers, profiles don't filter by status
      const mockProfiles = [
        { id: 'profile-1', name: 'Active Profile' },
        { id: 'profile-2', name: 'Inactive Profile' },
      ]

      mockSupabaseClient({ profiles: mockProfiles })

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.profiles).toHaveLength(2)
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should return 500 when database query fails', async () => {
      mockSupabaseClient({
        profilesError: { message: 'Database connection error' },
      })

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch profiles')
    })

    it('should handle unexpected errors gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Unexpected error'))

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch profiles')
    })

    it('should handle database connection errors', async () => {
      mockCreateClient.mockRejectedValue(new Error('Database connection failed'))

      const request = makeRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch profiles')
    })
  })
})
