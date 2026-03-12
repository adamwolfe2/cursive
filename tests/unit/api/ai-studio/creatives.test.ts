/**
 * Ad Creatives API Route Tests
 * GET /api/ai-studio/creatives - List creatives
 * POST /api/ai-studio/creatives - Generate new creative
 *
 * Tests creatives endpoints:
 * - Authentication checks (GET & POST)
 * - Workspace parameter/input validation
 * - Workspace ownership verification
 * - Creative fetching with joins (GET)
 * - Creative generation and saving (POST)
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================
// MOCKS
// ============================================

const mockGetCurrentUser = vi.fn()
const mockCreateClient = vi.fn()
const mockGenerateAdCreative = vi.fn()

// Chainable query builder
function createQueryChain(resolvedValue?: any) {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(resolvedValue ?? { data: null, error: null })
  chain.maybeSingle = vi.fn().mockResolvedValue(resolvedValue ?? { data: null, error: null })
  chain.then = (resolve: any) => resolve(resolvedValue ?? { data: null, error: null })
  return chain
}

// Mock fast-auth (creatives route uses fastAuth, not getCurrentUser)
vi.mock('@/lib/auth/fast-auth', () => ({
  fastAuth: (request: any) => mockGetCurrentUser(),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

// Mock image generation
vi.mock('@/lib/ai-studio/image-generation', () => ({
  generateAdCreative: (options: any) => mockGenerateAdCreative(options),
}))

// Import routes AFTER all mocks are set up
import { GET, POST } from '@/app/api/ai-studio/creatives/route'

// ============================================
// HELPERS
// ============================================

function makeGetRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/ai-studio/creatives')
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

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/ai-studio/creatives', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

function mockAuthenticatedUser(overrides: any = {}) {
  mockGetCurrentUser.mockResolvedValue({
    userId: 'auth-user-123',
    workspaceId: 'workspace-123',
    email: 'test@example.com',
    ...overrides,
  })
}

function mockUnauthenticatedUser() {
  mockGetCurrentUser.mockResolvedValue(null)
}

function mockSupabaseClientForGet(options: {
  brandWorkspace?: any
  creatives?: any[]
  creativesError?: any
} = {}) {
  const client = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'brand_workspaces') {
        const brandWorkspace = 'brandWorkspace' in options
          ? options.brandWorkspace
          : { id: 'brand-workspace-123' }

        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: brandWorkspace,
            error: null,
          }),
        }
      }

      if (table === 'ad_creatives') {
        const resolved = {
          data: options.creatives ?? [],
          error: options.creativesError ?? null,
        }
        const creativesChain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: (resolve: any, reject?: any) => Promise.resolve(resolved).then(resolve, reject),
        }
        return creativesChain
      }

      return createQueryChain()
    }),
  }

  mockCreateClient.mockResolvedValue(client)
  return client
}

function mockSupabaseClientForPost(options: {
  workspace?: any
  workspaceError?: any
  creative?: any
  creativeError?: any
} = {}) {
  let isInsertOperation = false

  // Create chain object first
  const chain: any = {}

  // Then populate it with methods that reference it
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockImplementation(() => {
    isInsertOperation = true
    return chain
  })
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  const resolveQuery = () => {
    if (isInsertOperation) {
      // INSERT creative
      return Promise.resolve({
        data: options.creative ?? {
          id: 'creative-123',
          brand_workspace_id: 'workspace-123',
          image_url: 'https://example.com/image.jpg',
          prompt: 'Test prompt',
          format: 'square',
          generation_status: 'completed',
        },
        error: options.creativeError ?? null,
      })
    }
    // SELECT workspace - use 'in' operator to handle explicit null
    const workspace = 'workspace' in options
      ? options.workspace
      : {
          id: 'workspace-123',
          brand_data: {},
          knowledge_base: {},
          customer_profiles: [],
          offers: [],
        }

    return Promise.resolve({
      data: workspace,
      error: options.workspaceError ?? null,
    })
  }
  chain.single = vi.fn().mockImplementation(resolveQuery)
  chain.maybeSingle = vi.fn().mockImplementation(resolveQuery)
  chain.then = (resolve: any, reject?: any) => resolveQuery().then(resolve, reject)

  const client = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'brand_workspaces' || table === 'ad_creatives') {
        return chain
      }

      return createQueryChain()
    }),
  }

  mockCreateClient.mockResolvedValue(client)
  return client
}

// ============================================
// GET TESTS
// ============================================

describe('GET /api/ai-studio/creatives', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticatedUser()
    mockSupabaseClientForGet()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockUnauthenticatedUser()

      const request = makeGetRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should proceed when user is authenticated', async () => {
      mockAuthenticatedUser()
      mockSupabaseClientForGet()

      const request = makeGetRequest({ workspace: 'workspace-123' })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Parameter Validation', () => {
    it('should return 400 when workspace parameter is missing', async () => {
      const request = makeGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('workspace parameter required')
    })

    it('should accept valid workspace parameter', async () => {
      const request = makeGetRequest({ workspace: 'workspace-123' })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Workspace Ownership', () => {
    it('should return 403 when brand workspace not found', async () => {
      mockSupabaseClientForGet({ brandWorkspace: null })

      const request = makeGetRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should return 403 when brand workspace does not belong to user', async () => {
      mockSupabaseClientForGet({ brandWorkspace: null })

      const request = makeGetRequest({ workspace: 'other-workspace' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })

  describe('Creatives Fetching', () => {
    it('should return empty array when no creatives exist', async () => {
      mockSupabaseClientForGet({ creatives: [] })

      const request = makeGetRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.creatives).toEqual([])
    })

    it('should return creatives with joined data', async () => {
      const mockCreatives = [
        {
          id: 'creative-1',
          image_url: 'https://example.com/1.jpg',
          prompt: 'Summer sale',
          customer_profiles: { name: 'Tech Enthusiast' },
          offers: { name: 'Summer Offer' },
          created_at: '2025-01-01T00:00:00Z',
        },
      ]

      mockSupabaseClientForGet({ creatives: mockCreatives })

      const request = makeGetRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.creatives).toHaveLength(1)
      expect(data.creatives[0].customer_profiles.name).toBe('Tech Enthusiast')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when database query fails', async () => {
      mockSupabaseClientForGet({
        creativesError: { message: 'Database error' },
      })

      const request = makeGetRequest({ workspace: 'workspace-123' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch creatives')
    })
  })
})

// ============================================
// POST TESTS
// ============================================

describe('POST /api/ai-studio/creatives', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticatedUser()
    mockSupabaseClientForPost()

    // Default: successful generation
    mockGenerateAdCreative.mockResolvedValue({
      imageUrl: 'https://example.com/generated.jpg',
    })
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockUnauthenticatedUser()

      const request = makePostRequest({
        workspaceId: 'workspace-123',
        prompt: 'Test prompt',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Input Validation', () => {
    it('should return 400 when workspaceId is missing', async () => {
      const request = makePostRequest({ prompt: 'Test' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should return 400 when prompt is missing', async () => {
      const request = makePostRequest({ workspaceId: 'workspace-123' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should return 400 when prompt is empty', async () => {
      const request = makePostRequest({
        workspaceId: 'workspace-123',
        prompt: '',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should return 400 for invalid format', async () => {
      const request = makePostRequest({
        workspaceId: 'workspace-123',
        prompt: 'Test',
        format: 'invalid',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should accept valid input with required fields only', async () => {
      const request = makePostRequest({
        workspaceId: 'workspace-123',
        prompt: 'Summer sale creative',
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should accept valid input with all optional fields', async () => {
      const request = makePostRequest({
        workspaceId: 'workspace-123',
        prompt: 'Summer sale creative',
        stylePreset: 'Write with Elegance',
        format: 'story',
        icpId: 'icp-123',
        offerId: 'offer-123',
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Workspace Ownership', () => {
    it('should return 403 when workspace does not belong to user', async () => {
      mockSupabaseClientForPost({ workspace: null })

      const request = makePostRequest({
        workspaceId: 'other-workspace',
        prompt: 'Test',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })

  describe('Creative Generation', () => {
    it('should call generateAdCreative with brand intelligence', async () => {
      const workspace = {
        id: 'workspace-123',
        brand_data: { colors: { primary: '#FF0000' } },
        knowledge_base: { company_overview: 'Test company' },
        customer_profiles: [],
        offers: [],
      }

      mockSupabaseClientForPost({ workspace })

      const request = makePostRequest({
        workspaceId: 'workspace-123',
        prompt: 'Summer sale',
      })

      await POST(request)

      expect(mockGenerateAdCreative).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Summer sale',
          brandData: workspace.brand_data,
          knowledgeBase: workspace.knowledge_base,
          format: 'square',
          quality: 'high',
        })
      )
    })

    it('should include ICP when provided', async () => {
      const workspace = {
        id: 'workspace-123',
        brand_data: {},
        knowledge_base: {},
        customer_profiles: [
          { id: 'icp-123', name: 'Tech Enthusiast' },
        ],
        offers: [],
      }

      mockSupabaseClientForPost({ workspace })

      const request = makePostRequest({
        workspaceId: 'workspace-123',
        prompt: 'Test',
        icpId: 'icp-123',
      })

      await POST(request)

      expect(mockGenerateAdCreative).toHaveBeenCalledWith(
        expect.objectContaining({
          icp: { id: 'icp-123', name: 'Tech Enthusiast' },
        })
      )
    })

    it('should include offer when provided', async () => {
      const workspace = {
        id: 'workspace-123',
        brand_data: {},
        knowledge_base: {},
        customer_profiles: [],
        offers: [
          { id: 'offer-123', name: 'Summer Sale' },
        ],
      }

      mockSupabaseClientForPost({ workspace })

      const request = makePostRequest({
        workspaceId: 'workspace-123',
        prompt: 'Test',
        offerId: 'offer-123',
      })

      await POST(request)

      expect(mockGenerateAdCreative).toHaveBeenCalledWith(
        expect.objectContaining({
          offer: { id: 'offer-123', name: 'Summer Sale' },
        })
      )
    })

    it('should save creative to database after generation', async () => {
      mockGenerateAdCreative.mockResolvedValue({
        imageUrl: 'https://example.com/generated.jpg',
      })

      const request = makePostRequest({
        workspaceId: 'workspace-123',
        prompt: 'Summer sale',
        format: 'story',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.creative).toBeDefined()
      expect(data.message).toBe('Creative generated successfully')
    })

    it('should return 500 when creative save fails', async () => {
      mockSupabaseClientForPost({
        creativeError: { message: 'Save failed' },
      })

      const request = makePostRequest({
        workspaceId: 'workspace-123',
        prompt: 'Test',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      // Save error is caught and re-thrown, then caught by outer handler
      expect(data.error).toBe('Failed to save creative')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when generation fails', async () => {
      mockGenerateAdCreative.mockRejectedValue(new Error('Generation failed'))

      const request = makePostRequest({
        workspaceId: 'workspace-123',
        prompt: 'Test',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })

    it('should handle unexpected errors gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Unexpected error'))

      const request = makePostRequest({
        workspaceId: 'workspace-123',
        prompt: 'Test',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })
})
