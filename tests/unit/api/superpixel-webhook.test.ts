/**
 * SuperPixel Webhook Handler Tests
 *
 * Tests the POST /api/webhooks/audiencelab/superpixel endpoint:
 * - Rejects invalid content type
 * - Rejects invalid/missing secret
 * - Rejects oversized payloads
 * - Stores events for unknown pixel_id without processing
 * - Routes events to correct workspace by pixel_id
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================
// MOCKS
// ============================================

// Track all supabase calls for assertions
const insertedEvents: any[] = []
const pixelLookups: Map<string, string | null> = new Map()

function createChainMock(resolvedValue?: any) {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn((data: any) => {
    insertedEvents.push(data)
    return chain
  })
  chain.update = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(resolvedValue ?? { data: { id: 'evt-001' }, error: null })
  chain.maybeSingle = vi.fn().mockResolvedValue(resolvedValue ?? { data: null, error: null })
  chain.contains = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  return chain
}

let mockPixelLookup = vi.fn()
let mockEventInsert = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => {
    const fromMock = vi.fn((table: string) => {
      if (table === 'audiencelab_pixels') {
        const chain = createChainMock()
        chain.single.mockImplementation(() => {
          return mockPixelLookup()
        })
        return chain
      }
      if (table === 'audiencelab_events') {
        const chain = createChainMock()
        chain.insert.mockImplementation((data: any) => {
          insertedEvents.push(data)
          const innerChain = createChainMock()
          innerChain.single.mockImplementation(() => {
            return mockEventInsert(data)
          })
          return innerChain
        })
        return chain
      }
      if (table === 'audiencelab_identities') {
        return createChainMock({ data: null, error: { code: 'PGRST116' } })
      }
      if (table === 'leads') {
        return createChainMock({ data: null, error: { code: 'PGRST116' } })
      }
      if (table === 'user_targeting') {
        return createChainMock({ data: [], error: null })
      }
      return createChainMock()
    })
    return { from: fromMock }
  }),
}))

vi.mock('@/lib/audiencelab/edge-processor', () => ({
  processEventInline: vi.fn().mockResolvedValue({ success: true, lead_id: 'lead-001' }),
}))

vi.mock('@/lib/monitoring/alerts', () => ({
  sendSlackAlert: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/utils/log-sanitizer', () => ({
  safeLog: vi.fn(),
  safeError: vi.fn(),
}))

// Import route AFTER mocks
import { POST } from '@/app/api/webhooks/audiencelab/superpixel/route'

// ============================================
// HELPERS
// ============================================

const VALID_SECRET = 'test-webhook-secret-123'

function makeWebhookRequest(
  body: unknown,
  options: {
    contentType?: string
    secret?: string | null
    signature?: string | null
  } = {}
): NextRequest {
  const {
    contentType = 'application/json',
    secret = VALID_SECRET,
  } = options

  const headers: Record<string, string> = {}
  if (contentType) headers['content-type'] = contentType
  if (secret !== null) headers['x-audiencelab-secret'] = secret!

  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)

  return new NextRequest('http://localhost:3000/api/webhooks/audiencelab/superpixel', {
    method: 'POST',
    headers,
    body: bodyStr,
  })
}

function makeValidPayload(overrides: Record<string, any> = {}) {
  return {
    pixel_id: 'px-001',
    event: 'page_view',
    hem_sha256: 'abc123',
    uid: 'uid-001',
    FIRST_NAME: 'John',
    LAST_NAME: 'Doe',
    PERSONAL_EMAILS: 'john@example.com',
    ip_address: '1.2.3.4',
    ...overrides,
  }
}

// ============================================
// TESTS
// ============================================

describe('POST /api/webhooks/audiencelab/superpixel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertedEvents.length = 0

    // Set the webhook secret env var
    vi.stubEnv('AUDIENCELAB_WEBHOOK_SECRET', VALID_SECRET)

    // Default: pixel lookup finds a workspace
    mockPixelLookup = vi.fn().mockResolvedValue({
      data: { workspace_id: 'ws-001' },
      error: null,
    })

    // Default: event insert succeeds
    mockEventInsert = vi.fn().mockResolvedValue({
      data: { id: 'evt-' + Math.random().toString(36).slice(2) },
      error: null,
    })
  })

  // ============================================
  // Content-Type enforcement
  // ============================================

  describe('Content-Type enforcement', () => {
    it('should reject non-JSON content type', async () => {
      const request = makeWebhookRequest(
        'some text',
        { contentType: 'text/plain' }
      )
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(415)
      expect(data.error).toContain('Content-Type')
    })

    it('should reject multipart/form-data content type', async () => {
      const request = makeWebhookRequest(
        '{}',
        { contentType: 'multipart/form-data' }
      )
      const response = await POST(request)

      expect(response.status).toBe(415)
    })

    it('should accept application/json content type', async () => {
      const request = makeWebhookRequest(
        makeValidPayload(),
        { contentType: 'application/json' }
      )
      const response = await POST(request)

      // Should pass content type check (may succeed or fail elsewhere)
      expect(response.status).not.toBe(415)
    })

    it('should accept application/json with charset', async () => {
      const request = makeWebhookRequest(
        makeValidPayload(),
        { contentType: 'application/json; charset=utf-8' }
      )
      const response = await POST(request)

      expect(response.status).not.toBe(415)
    })
  })

  // ============================================
  // Secret validation
  // ============================================

  describe('Secret validation', () => {
    it('should reject requests with missing secret header', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/webhooks/audiencelab/superpixel',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            // No secret header
          },
          body: JSON.stringify(makeValidPayload()),
        }
      )
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should reject requests with wrong secret', async () => {
      const request = makeWebhookRequest(
        makeValidPayload(),
        { secret: 'wrong-secret' }
      )
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should accept requests with correct secret', async () => {
      const request = makeWebhookRequest(
        makeValidPayload(),
        { secret: VALID_SECRET }
      )
      const response = await POST(request)

      expect(response.status).not.toBe(401)
    })

    it('should reject when AUDIENCELAB_WEBHOOK_SECRET env var is unset', async () => {
      vi.stubEnv('AUDIENCELAB_WEBHOOK_SECRET', '')

      const request = makeWebhookRequest(
        makeValidPayload(),
        { secret: 'anything' }
      )
      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  // ============================================
  // Payload size enforcement
  // ============================================

  describe('Payload size enforcement', () => {
    it('should reject payloads over 3MB', async () => {
      // Create a payload > 3MB
      const largeData = 'x'.repeat(3 * 1024 * 1024 + 1)

      const request = new NextRequest(
        'http://localhost:3000/api/webhooks/audiencelab/superpixel',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-audiencelab-secret': VALID_SECRET,
          },
          body: largeData,
        }
      )

      const response = await POST(request)

      expect(response.status).toBe(413)
    })

    it('should accept payloads under 3MB', async () => {
      const request = makeWebhookRequest(makeValidPayload())
      const response = await POST(request)

      expect(response.status).not.toBe(413)
    })
  })

  // ============================================
  // Invalid JSON
  // ============================================

  describe('Invalid JSON handling', () => {
    it('should return 400 for malformed JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/webhooks/audiencelab/superpixel',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-audiencelab-secret': VALID_SECRET,
          },
          body: '{invalid json...',
        }
      )
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid JSON')
    })
  })

  // ============================================
  // Unknown pixel_id handling
  // ============================================

  describe('Unknown pixel_id handling', () => {
    it('should store events without processing for unknown pixel_id', async () => {
      // Pixel lookup returns null workspace
      mockPixelLookup.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows' },
      })

      const request = makeWebhookRequest(makeValidPayload({ pixel_id: 'unknown-px' }))
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.processed).toBe(0)
      expect(data.warning).toBe('unknown_pixel_id')
    })

    it('should store events for null pixel_id', async () => {
      mockPixelLookup.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const payload = makeValidPayload()
      delete (payload as any).pixel_id

      const request = makeWebhookRequest(payload)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.warning).toBe('unknown_pixel_id')
    })
  })

  // ============================================
  // Workspace routing by pixel_id
  // ============================================

  describe('Workspace routing by pixel_id', () => {
    it('should route events to workspace associated with pixel_id', async () => {
      mockPixelLookup.mockResolvedValue({
        data: { workspace_id: 'ws-customer-1' },
        error: null,
      })

      const request = makeWebhookRequest(makeValidPayload({ pixel_id: 'px-customer-1' }))
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.stored).toBeGreaterThan(0)
    })

    it('should handle wrapped payload { result: [...] }', async () => {
      const payload = {
        result: [
          makeValidPayload({ pixel_id: 'px-001' }),
          makeValidPayload({ pixel_id: 'px-001', event: 'page_view' }),
        ],
      }

      const request = makeWebhookRequest(payload)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.total).toBe(2)
    })

    it('should handle single event (non-array) payload', async () => {
      const request = makeWebhookRequest(makeValidPayload())
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.total).toBe(1)
    })
  })

  // ============================================
  // Response shape
  // ============================================

  describe('Response shape', () => {
    it('should return success, stored, processed, and total fields', async () => {
      const request = makeWebhookRequest(makeValidPayload())
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('stored')
      expect(data).toHaveProperty('processed')
      expect(data).toHaveProperty('total')
      expect(typeof data.success).toBe('boolean')
      expect(typeof data.stored).toBe('number')
      expect(typeof data.processed).toBe('number')
      expect(typeof data.total).toBe('number')
    })
  })
})
