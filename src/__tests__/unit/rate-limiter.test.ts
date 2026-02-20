/**
 * Rate Limiter Unit Tests
 *
 * Tests the RATE_LIMITS configuration and pure utility functions from
 * src/lib/middleware/rate-limiter.ts.
 *
 * checkRateLimit and withRateLimit are NOT tested here because they call
 * createAdminClient (DB-touching). Only the pure helpers and config object
 * are covered.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase admin before importing the module (it runs at module init)
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ count: 0, error: null })),
      insert: vi.fn(() => ({ error: null })),
    })),
  })),
}))

vi.mock('@/lib/utils/log-sanitizer', () => ({
  safeError: vi.fn(),
  safeLog: vi.fn(),
}))

// Import AFTER mocks are set up
import {
  RATE_LIMITS,
  getRequestIdentifier,
  rateLimitResponse,
  type RateLimitType,
} from '@/lib/middleware/rate-limiter'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// RATE_LIMITS config shape
// ---------------------------------------------------------------------------

describe('RATE_LIMITS configuration', () => {
  const expectedKeys: RateLimitType[] = [
    'partner-upload',
    'marketplace-browse',
    'marketplace-purchase',
    'partner-register',
    'referral',
    'auth-login',
    'auth-change-password',
    'public-form',
    'default',
  ]

  it('defines all expected limit types', () => {
    for (const key of expectedKeys) {
      expect(RATE_LIMITS).toHaveProperty(key)
    }
  })

  it('every limit type has windowMs, maxRequests, and message', () => {
    for (const key of Object.keys(RATE_LIMITS) as RateLimitType[]) {
      const config = RATE_LIMITS[key]
      expect(typeof config.windowMs).toBe('number')
      expect(typeof config.maxRequests).toBe('number')
      expect(typeof config.message).toBe('string')
      expect(config.message.length).toBeGreaterThan(0)
    }
  })

  it('all windowMs values are >= 60_000ms (1 minute)', () => {
    for (const key of Object.keys(RATE_LIMITS) as RateLimitType[]) {
      const { windowMs } = RATE_LIMITS[key]
      expect(windowMs).toBeGreaterThanOrEqual(60_000)
    }
  })

  it('all maxRequests values are > 0', () => {
    for (const key of Object.keys(RATE_LIMITS) as RateLimitType[]) {
      const { maxRequests } = RATE_LIMITS[key]
      expect(maxRequests).toBeGreaterThan(0)
    }
  })

  it('all maxRequests values are < 1000', () => {
    for (const key of Object.keys(RATE_LIMITS) as RateLimitType[]) {
      const { maxRequests } = RATE_LIMITS[key]
      expect(maxRequests).toBeLessThan(1000)
    }
  })

  it('auth-login has a lower maxRequests than marketplace-browse (brute-force vs browse)', () => {
    expect(RATE_LIMITS['auth-login'].maxRequests).toBeLessThan(
      RATE_LIMITS['marketplace-browse'].maxRequests
    )
  })

  it('auth-change-password is the most restrictive auth endpoint', () => {
    expect(RATE_LIMITS['auth-change-password'].maxRequests).toBeLessThanOrEqual(
      RATE_LIMITS['auth-login'].maxRequests
    )
  })

  it('partner-register is very restrictive (prevent registration abuse)', () => {
    expect(RATE_LIMITS['partner-register'].maxRequests).toBeLessThanOrEqual(10)
  })

  it('marketplace-browse is the most generous (good UX)', () => {
    // browse should be >= every other endpoint's maxRequests
    const browseMax = RATE_LIMITS['marketplace-browse'].maxRequests
    const allOthers = Object.entries(RATE_LIMITS)
      .filter(([key]) => key !== 'marketplace-browse' && key !== 'default')
      .map(([, cfg]) => cfg.maxRequests)

    for (const other of allOthers) {
      expect(browseMax).toBeGreaterThanOrEqual(other)
    }
  })

  it('hourly endpoints use windowMs of exactly 3_600_000ms', () => {
    const hourlyEndpoints: RateLimitType[] = ['partner-upload', 'partner-register', 'referral']
    for (const key of hourlyEndpoints) {
      expect(RATE_LIMITS[key].windowMs).toBe(60 * 60 * 1000)
    }
  })
})

// ---------------------------------------------------------------------------
// getRequestIdentifier
// ---------------------------------------------------------------------------

describe('getRequestIdentifier', () => {
  function makeRequest(headers: Record<string, string> = {}): NextRequest {
    return new NextRequest('https://example.com/api/test', {
      headers: new Headers(headers),
    })
  }

  it('returns user:<userId> when a userId is provided', () => {
    const req = makeRequest()
    const identifier = getRequestIdentifier(req, 'abc123')
    expect(identifier).toBe('user:abc123')
  })

  it('returns ip:<ip> from x-forwarded-for header when no userId', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.45' })
    const identifier = getRequestIdentifier(req)
    expect(identifier).toBe('ip:203.0.113.45')
  })

  it('uses only the first IP when x-forwarded-for contains a comma-separated list', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.45, 10.0.0.1, 192.168.1.1' })
    const identifier = getRequestIdentifier(req)
    expect(identifier).toBe('ip:203.0.113.45')
  })

  it('returns ip:unknown when x-forwarded-for header is absent and no userId', () => {
    const req = makeRequest({})
    const identifier = getRequestIdentifier(req)
    expect(identifier).toBe('ip:unknown')
  })

  it('userId takes priority over x-forwarded-for header', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.1' })
    const identifier = getRequestIdentifier(req, 'user-wins')
    expect(identifier).toBe('user:user-wins')
  })
})

// ---------------------------------------------------------------------------
// rateLimitResponse
// ---------------------------------------------------------------------------

describe('rateLimitResponse', () => {
  const fakeResult = {
    allowed: false,
    remaining: 0,
    resetAt: new Date(Date.now() + 60_000),
    limit: 10,
  }

  it('returns a response with status 429', () => {
    const response = rateLimitResponse('auth-login', fakeResult)
    expect(response.status).toBe(429)
  })

  it('includes the X-RateLimit-Limit header', () => {
    const response = rateLimitResponse('auth-login', fakeResult)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
  })

  it('includes the X-RateLimit-Remaining header', () => {
    const response = rateLimitResponse('auth-login', fakeResult)
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
  })

  it('includes the X-RateLimit-Reset header', () => {
    const response = rateLimitResponse('auth-login', fakeResult)
    const reset = response.headers.get('X-RateLimit-Reset')
    expect(reset).toBeTruthy()
    // Should be an ISO date string
    expect(() => new Date(reset!).toISOString()).not.toThrow()
  })

  it('includes the Retry-After header as a positive number', () => {
    const response = rateLimitResponse('auth-login', fakeResult)
    const retryAfter = Number(response.headers.get('Retry-After'))
    expect(retryAfter).toBeGreaterThan(0)
  })

  it('returns the correct message for the limit type', async () => {
    const response = rateLimitResponse('auth-login', fakeResult)
    const body = await response.json()
    expect(body.error).toBe(RATE_LIMITS['auth-login'].message)
  })

  it('includes retryAfter in the JSON body', async () => {
    const response = rateLimitResponse('marketplace-purchase', fakeResult)
    const body = await response.json()
    expect(typeof body.retryAfter).toBe('number')
    expect(body.retryAfter).toBeGreaterThan(0)
  })
})
