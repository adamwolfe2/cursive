/**
 * Service Request API Route Tests
 *
 * Tests the POST /api/service-request endpoint:
 * - Requires authentication
 * - Validates request_type and details fields
 * - Stores request in support_messages table
 * - Returns proper error messages
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================
// MOCKS
// ============================================

const mockGetUser = vi.fn()
const mockUserLookup = vi.fn()
const mockInsert = vi.fn()

function createChainMock(resolvedValue?: any) {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn((data: any) => {
    return mockInsert(data)
  })
  chain.update = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockImplementation(() => mockUserLookup())
  chain.maybeSingle = vi.fn().mockResolvedValue(resolvedValue ?? { data: null, error: null })
  return chain
}

// Mock @supabase/ssr — the service-request route creates its own client
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

// Mock admin client for DB operations
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'users') {
        return createChainMock()
      }
      if (table === 'support_messages') {
        const chain: any = {}
        chain.insert = vi.fn((data: any) => {
          return mockInsert(data)
        })
        return chain
      }
      return createChainMock()
    }),
  })),
}))

// Mock Slack alerts
vi.mock('@/lib/monitoring/alerts', () => ({
  sendSlackAlert: vi.fn().mockResolvedValue(undefined),
}))

// Import route AFTER mocks
import { POST } from '@/app/api/service-request/route'

// ============================================
// HELPERS
// ============================================

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/service-request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: 'sb-auth-token=test-token',
    },
    body: JSON.stringify(body),
  })
}

// ============================================
// TESTS
// ============================================

describe('POST /api/service-request', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-uid-1', email: 'user@acme.com' } },
      error: null,
    })

    // Default: user lookup succeeds
    mockUserLookup.mockResolvedValue({
      data: {
        id: 'usr-001',
        full_name: 'Test User',
        email: 'user@acme.com',
        workspace_id: 'ws-001',
      },
      error: null,
    })

    // Default: insert succeeds
    mockInsert.mockResolvedValue({ data: null, error: null })
  })

  // ============================================
  // Authentication
  // ============================================

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = makeRequest({
        request_type: 'GHL Setup',
        details: 'Need help setting up my GHL account',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when user record not found in users table', async () => {
      mockUserLookup.mockResolvedValue({
        data: null,
        error: { message: 'No rows' },
      })

      const request = makeRequest({
        request_type: 'GHL Setup',
        details: 'Need help',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })
  })

  // ============================================
  // Request body validation
  // ============================================

  describe('Request body validation', () => {
    it('should return 400 for missing request_type', async () => {
      const request = makeRequest({
        details: 'Some details',
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for empty request_type', async () => {
      const request = makeRequest({
        request_type: '',
        details: 'Some details',
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for missing details', async () => {
      const request = makeRequest({
        request_type: 'GHL Setup',
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for empty details', async () => {
      const request = makeRequest({
        request_type: 'GHL Setup',
        details: '',
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for request_type exceeding 100 characters', async () => {
      const request = makeRequest({
        request_type: 'A'.repeat(101),
        details: 'Some details',
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for details exceeding 2000 characters', async () => {
      const request = makeRequest({
        request_type: 'GHL Setup',
        details: 'A'.repeat(2001),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should accept valid request_type up to 100 characters', async () => {
      const request = makeRequest({
        request_type: 'A'.repeat(100),
        details: 'Valid details',
      })
      const response = await POST(request)

      // Should not be 400
      expect(response.status).not.toBe(400)
    })

    it('should accept valid details up to 2000 characters', async () => {
      const request = makeRequest({
        request_type: 'Setup',
        details: 'A'.repeat(2000),
      })
      const response = await POST(request)

      expect(response.status).not.toBe(400)
    })

    it('should accept optional metadata as record of strings', async () => {
      const request = makeRequest({
        request_type: 'GHL Setup',
        details: 'Need help setting up',
        metadata: { tier: 'professional', urgency: 'high' },
      })
      const response = await POST(request)

      expect(response.status).not.toBe(400)
    })
  })

  // ============================================
  // Storage in support_messages
  // ============================================

  describe('Storage in support_messages', () => {
    it('should insert into support_messages on valid request', async () => {
      const request = makeRequest({
        request_type: 'GHL Setup',
        details: 'Need help setting up my GHL account',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should include correct fields in support_messages insert', async () => {
      const request = makeRequest({
        request_type: 'GHL Setup',
        details: 'Need help setting up my GHL account',
      })
      await POST(request)

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
          email: 'user@acme.com',
          subject: 'Service Request: GHL Setup',
          priority: 'normal',
          status: 'unread',
          source: 'service_request',
        })
      )
    })

    it('should include metadata in message body when present', async () => {
      const request = makeRequest({
        request_type: 'GHL Setup',
        details: 'Need help',
        metadata: { tier: 'pro' },
      })
      await POST(request)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.message).toContain('Need help')
      expect(insertCall.message).toContain('Metadata:')
      expect(insertCall.message).toContain('tier')
    })

    it('should use email as name fallback when full_name is null', async () => {
      mockUserLookup.mockResolvedValue({
        data: {
          id: 'usr-001',
          full_name: null,
          email: 'user@acme.com',
          workspace_id: 'ws-001',
        },
        error: null,
      })

      const request = makeRequest({
        request_type: 'Support',
        details: 'Help please',
      })
      await POST(request)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.name).toBe('user@acme.com')
    })

    it('should return 500 when support_messages insert fails', async () => {
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      })

      const request = makeRequest({
        request_type: 'GHL Setup',
        details: 'Need help',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to submit')
    })
  })

  // ============================================
  // Success response
  // ============================================

  describe('Success response', () => {
    it('should return success with confirmation message', async () => {
      const request = makeRequest({
        request_type: 'GHL Setup',
        details: 'Need help setting up my GHL account',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('submitted')
    })
  })

  // ============================================
  // Slack notification
  // ============================================

  describe('Slack notification', () => {
    it('should call sendSlackAlert on successful request', async () => {
      const { sendSlackAlert } = await import('@/lib/monitoring/alerts')

      const request = makeRequest({
        request_type: 'GHL Setup',
        details: 'Need help setting up my GHL account',
      })
      await POST(request)

      expect(sendSlackAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'new_dfy_client',
          severity: 'info',
          message: expect.stringContaining('GHL Setup'),
        })
      )
    })

    it('should truncate long details in Slack notification', async () => {
      const { sendSlackAlert } = await import('@/lib/monitoring/alerts')

      const longDetails = 'A'.repeat(200)
      const request = makeRequest({
        request_type: 'Setup',
        details: longDetails,
      })
      await POST(request)

      const alertCall = (sendSlackAlert as any).mock.calls[0][0]
      expect(alertCall.metadata.details.length).toBeLessThanOrEqual(103) // 100 chars + '...'
    })
  })
})
