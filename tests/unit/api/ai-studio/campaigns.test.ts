/**
 * Campaign API Route Tests
 * GET /api/ai-studio/campaigns/[id]
 *
 * Tests campaign details endpoint:
 * - Authentication checks
 * - Route parameter parsing
 * - Workspace ownership via inner join
 * - Campaign fetching
 * - Error handling (404, 500)
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
import { GET } from '@/app/api/ai-studio/campaigns/[id]/route'

// ============================================
// HELPERS
// ============================================

function makeRequest(campaignId: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/ai-studio/campaigns/${campaignId}`, {
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
  campaign?: any
  campaignError?: any
} = {}) {
  const client = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'ad_campaigns') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: options.campaign ?? null,
            error: options.campaignError ?? null,
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

describe('GET /api/ai-studio/campaigns/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: Authenticated user
    mockAuthenticatedUser()

    // Default: Successful mocks (can be overridden in individual tests)
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

      const request = makeRequest('campaign-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'campaign-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should proceed when user is authenticated', async () => {
      mockAuthenticatedUser()
      mockSupabaseClient({
        campaign: {
          id: 'campaign-123',
          name: 'Summer Campaign',
          brand_workspaces: { id: 'ws-123', workspace_id: 'workspace-123' },
        },
      })

      const request = makeRequest('campaign-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'campaign-123' }),
      })

      expect(response.status).toBe(200)
    })
  })

  // ============================================
  // ROUTE PARAMETER TESTS
  // ============================================

  describe('Route Parameters', () => {
    it('should parse campaign ID from params', async () => {
      mockSupabaseClient({
        campaign: {
          id: 'campaign-abc-123',
          name: 'Test Campaign',
          brand_workspaces: { workspace_id: 'workspace-123' },
        },
      })

      const request = makeRequest('campaign-abc-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'campaign-abc-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.campaign.id).toBe('campaign-abc-123')
    })

    it('should handle UUID-format campaign IDs', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      mockSupabaseClient({
        campaign: {
          id: uuid,
          name: 'UUID Campaign',
          brand_workspaces: { workspace_id: 'workspace-123' },
        },
      })

      const request = makeRequest(uuid)
      const response = await GET(request, {
        params: Promise.resolve({ id: uuid }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.campaign.id).toBe(uuid)
    })
  })

  // ============================================
  // WORKSPACE ISOLATION TESTS
  // ============================================

  describe('Workspace Isolation', () => {
    it('should return 404 when campaign does not exist', async () => {
      mockSupabaseClient({ campaign: null })

      const request = makeRequest('nonexistent-campaign')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'nonexistent-campaign' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should return 404 when campaign belongs to different workspace', async () => {
      // Simulate database error (no rows match the workspace filter)
      mockSupabaseClient({
        campaignError: { code: 'PGRST116', message: 'No rows found' },
      })

      const request = makeRequest('other-workspace-campaign')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'other-workspace-campaign' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Campaign not found')
    })

    it('should allow access when campaign belongs to user workspace', async () => {
      const mockCampaign = {
        id: 'campaign-123',
        name: 'My Campaign',
        status: 'active',
        brand_workspaces: {
          id: 'brand-ws-123',
          name: 'My Brand',
          workspace_id: 'workspace-123', // Matches user's workspace
        },
      }

      mockSupabaseClient({ campaign: mockCampaign })

      const request = makeRequest('campaign-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'campaign-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.campaign.id).toBe('campaign-123')
      expect(data.campaign.brand_workspaces.workspace_id).toBe('workspace-123')
    })
  })

  // ============================================
  // CAMPAIGN FETCHING TESTS
  // ============================================

  describe('Campaign Fetching', () => {
    it('should return campaign with joined workspace data', async () => {
      const mockCampaign = {
        id: 'campaign-123',
        name: 'Summer 2025 Campaign',
        status: 'active',
        budget: 5000,
        start_date: '2025-06-01',
        end_date: '2025-08-31',
        brand_workspaces: {
          id: 'brand-ws-123',
          name: 'Acme Corp',
          workspace_id: 'workspace-123',
        },
      }

      mockSupabaseClient({ campaign: mockCampaign })

      const request = makeRequest('campaign-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'campaign-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.campaign).toEqual(mockCampaign)
      expect(data.campaign.brand_workspaces.name).toBe('Acme Corp')
    })

    it('should handle campaigns with minimal data', async () => {
      const mockCampaign = {
        id: 'campaign-minimal',
        brand_workspaces: {
          id: 'ws-123',
          workspace_id: 'workspace-123',
        },
      }

      mockSupabaseClient({ campaign: mockCampaign })

      const request = makeRequest('campaign-minimal')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'campaign-minimal' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.campaign.id).toBe('campaign-minimal')
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should return 404 when database query fails with error', async () => {
      mockSupabaseClient({
        campaignError: { message: 'Database error' },
      })

      const request = makeRequest('campaign-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'campaign-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Campaign not found')
    })

    it('should return 500 when unexpected error occurs', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Unexpected error'))

      const request = makeRequest('campaign-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'campaign-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch campaign')
    })

    it('should return 500 when database connection fails', async () => {
      mockCreateClient.mockRejectedValue(new Error('Database connection failed'))

      const request = makeRequest('campaign-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'campaign-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch campaign')
    })

    it('should return 404 when campaign is null despite no error', async () => {
      // Edge case: query succeeds but returns null
      mockSupabaseClient({
        campaign: null,
        campaignError: null,
      })

      const request = makeRequest('campaign-123')
      const response = await GET(request, {
        params: Promise.resolve({ id: 'campaign-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })
  })
})
