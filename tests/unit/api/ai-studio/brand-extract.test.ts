/**
 * Brand Extract API Route Tests
 * POST /api/ai-studio/brand/extract
 *
 * Tests brand extraction endpoint:
 * - Authentication checks
 * - Input validation (URL format)
 * - Environment variable validation
 * - Duplicate workspace detection
 * - Background processing initialization
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================
// MOCKS
// ============================================

const mockGetCurrentUser = vi.fn()
const mockCreateClient = vi.fn()
const mockExtractBrandDNA = vi.fn()
const mockGenerateKnowledgeBase = vi.fn()
const mockGenerateCustomerProfiles = vi.fn()
const mockIsValidUrl = vi.fn()
const mockSupabaseFrom = vi.fn()

// Chainable query builder
function createQueryChain(resolvedValue?: any) {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
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

// Mock Firecrawl functions
vi.mock('@/lib/ai-studio/firecrawl', () => ({
  extractBrandDNA: (url: string) => mockExtractBrandDNA(url),
  isValidUrl: (url: string) => mockIsValidUrl(url),
}))

// Mock knowledge generation
vi.mock('@/lib/ai-studio/knowledge', () => ({
  generateKnowledgeBase: (markdown: string, brandData: any) =>
    mockGenerateKnowledgeBase(markdown, brandData),
  generateCustomerProfiles: (knowledgeBase: any) =>
    mockGenerateCustomerProfiles(knowledgeBase),
}))

// Import route AFTER all mocks are set up
import { POST } from '@/app/api/ai-studio/brand/extract/route'

// ============================================
// HELPERS
// ============================================

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/ai-studio/brand/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

function mockAuthenticatedUser() {
  mockGetCurrentUser.mockResolvedValue({
    id: 'user-123',
    auth_user_id: 'auth-user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    workspace_id: 'workspace-123',
    role: 'owner',
    plan: 'pro',
  })
}

function mockUnauthenticatedUser() {
  mockGetCurrentUser.mockResolvedValue(null)
}

function mockSupabaseClient(options: {
  existingWorkspace?: any
  workspaceInsertResult?: any
  workspaceInsertError?: any
} = {}) {
  // Create a factory function for brand_workspaces chains
  const createBrandWorkspaceChain = () => {
    let wasInsertCalled = false

    const chain: any = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.insert = vi.fn().mockImplementation((data) => {
      wasInsertCalled = true
      return chain
    })
    chain.update = vi.fn().mockReturnValue(chain)
    chain.delete = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockImplementation(() => {
      if (wasInsertCalled) {
        // INSERT query - return newly created workspace
        return Promise.resolve({
          data: options.workspaceInsertResult ?? {
            id: 'workspace-new-123',
            name: 'Processing...',
          },
          error: options.workspaceInsertError ?? null,
        })
      } else {
        // SELECT query - return existing workspace or null
        return Promise.resolve({
          data: options.existingWorkspace ?? null,
          error: null,
        })
      }
    })

    return chain
  }

  const client = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'brand_workspaces') {
        return createBrandWorkspaceChain()
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

describe('POST /api/ai-studio/brand/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: Set environment variables
    vi.stubEnv('FIRECRAWL_API_KEY', 'test-firecrawl-key')
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key')

    // Default: URLs are valid
    mockIsValidUrl.mockReturnValue(true)

    // Default: Authenticated user
    mockAuthenticatedUser()

    // Default: No existing workspace
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

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should proceed when user is authenticated', async () => {
      mockAuthenticatedUser()
      mockSupabaseClient()

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  // ============================================
  // ENVIRONMENT VARIABLE TESTS
  // ============================================

  describe('Environment Variables', () => {
    it('should return 500 when FIRECRAWL_API_KEY is missing', async () => {
      vi.unstubAllEnvs()
      vi.stubEnv('OPENAI_API_KEY', 'test-openai-key')

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Required service not configured')
    })

    it('should return 500 when both ANTHROPIC_API_KEY and OPENAI_API_KEY are missing', async () => {
      vi.unstubAllEnvs()
      vi.stubEnv('FIRECRAWL_API_KEY', 'test-firecrawl-key')

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Required service not configured')
    })

    it('should accept OPENAI_API_KEY when ANTHROPIC_API_KEY is missing', async () => {
      vi.unstubAllEnvs()
      vi.stubEnv('FIRECRAWL_API_KEY', 'test-firecrawl-key')
      vi.stubEnv('OPENAI_API_KEY', 'test-openai-key')

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should accept ANTHROPIC_API_KEY when OPENAI_API_KEY is missing', async () => {
      vi.unstubAllEnvs()
      vi.stubEnv('FIRECRAWL_API_KEY', 'test-firecrawl-key')
      vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key')

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  // ============================================
  // INPUT VALIDATION TESTS
  // ============================================

  describe('Input Validation', () => {
    it('should return 400 when url is missing', async () => {
      const request = makeRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should return 400 when url is empty string', async () => {
      const request = makeRequest({ url: '' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should return 400 when url is not a valid URL format', async () => {
      const request = makeRequest({ url: 'not-a-url' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should return 400 when isValidUrl() returns false', async () => {
      mockIsValidUrl.mockReturnValue(false)

      const request = makeRequest({ url: 'https://invalid-site.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid URL format')
    })

    it('should accept valid https URL', async () => {
      mockIsValidUrl.mockReturnValue(true)

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should accept valid http URL if isValidUrl passes', async () => {
      mockIsValidUrl.mockReturnValue(true)

      const request = makeRequest({ url: 'http://localhost:3000' })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  // ============================================
  // DUPLICATE PREVENTION TESTS
  // ============================================

  describe('Duplicate Prevention', () => {
    it('should return existing workspace if URL already extracted', async () => {
      const existingWorkspace = {
        id: 'existing-workspace-123',
        name: 'Stripe',
        extraction_status: 'completed',
      }

      mockSupabaseClient({ existingWorkspace })

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.workspaceId).toBe('existing-workspace-123')
      expect(data.name).toBe('Stripe')
      expect(data.status).toBe('completed')
      expect(data.message).toContain('already exists')
    })

    it('should return existing workspace even if extraction is still processing', async () => {
      const existingWorkspace = {
        id: 'processing-workspace-123',
        name: 'Processing...',
        extraction_status: 'processing',
      }

      mockSupabaseClient({ existingWorkspace })

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.workspaceId).toBe('processing-workspace-123')
      expect(data.status).toBe('processing')
    })

    it('should return existing workspace even if extraction failed', async () => {
      const existingWorkspace = {
        id: 'failed-workspace-123',
        name: 'Failed Extraction',
        extraction_status: 'error',
      }

      mockSupabaseClient({ existingWorkspace })

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('error')
    })
  })

  // ============================================
  // WORKSPACE CREATION TESTS
  // ============================================

  describe('Workspace Creation', () => {
    it('should create new workspace with processing status', async () => {
      mockSupabaseClient()

      const request = makeRequest({ url: 'https://newsite.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.workspaceId).toBe('workspace-new-123')
      expect(data.status).toBe('processing')
      expect(data.message).toContain('Brand extraction started')
    })

    it('should return 500 when workspace creation fails', async () => {
      mockSupabaseClient({
        workspaceInsertError: { message: 'Database error' },
        workspaceInsertResult: null,
      })

      const request = makeRequest({ url: 'https://newsite.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to extract brand DNA')
    })

    it('should include user_id and workspace_id in workspace record', async () => {
      const insertMock = vi.fn().mockReturnThis()
      const client = {
        from: (table: string) => {
          if (table === 'brand_workspaces') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
              insert: insertMock,
            }
          }
          return createQueryChain()
        },
      }

      mockCreateClient.mockResolvedValue(client)
      insertMock.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'ws-123', name: 'Processing...' },
          error: null,
        }),
      })

      const request = makeRequest({ url: 'https://example.com' })
      await POST(request)

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'auth-user-123',
          workspace_id: 'workspace-123',
          url: 'https://example.com',
          extraction_status: 'processing',
        })
      )
    })
  })

  // ============================================
  // BACKGROUND PROCESSING TESTS
  // ============================================

  describe('Background Processing', () => {
    it('should return immediately without waiting for extraction', async () => {
      // Simulate slow extraction
      mockExtractBrandDNA.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 5000))
      )

      const request = makeRequest({ url: 'https://stripe.com' })

      const startTime = Date.now()
      const response = await POST(request)
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      // Should return in less than 1 second (not waiting for the 5s extraction)
      expect(duration).toBeLessThan(1000)
    })

    it('should return workspace ID before extraction completes', async () => {
      mockExtractBrandDNA.mockResolvedValue({
        markdown: 'content',
        brandData: {},
      })

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.workspaceId).toBe('workspace-new-123')
      expect(data.status).toBe('processing')
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should handle Zod validation errors', async () => {
      const request = makeRequest({ url: 123 }) // Invalid type
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should handle unexpected errors gracefully', async () => {
      // Force getCurrentUser to throw an unexpected error
      mockGetCurrentUser.mockRejectedValue(new Error('Unexpected error'))

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to extract brand DNA')
    })

    it('should handle database connection errors', async () => {
      mockCreateClient.mockRejectedValue(new Error('Database connection failed'))

      const request = makeRequest({ url: 'https://stripe.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to extract brand DNA')
    })
  })
})
