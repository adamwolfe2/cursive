/**
 * Rate Limiting Tests
 * Tests for rate limiting utility functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Recreate the rate limiting logic for testing
interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
}

function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Clean up expired entry
  if (entry && entry.resetAt <= now) {
    rateLimitStore.delete(key)
  }

  const currentEntry = rateLimitStore.get(key)

  if (!currentEntry) {
    // First request in window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    }
  }

  // Increment count
  currentEntry.count++

  if (currentEntry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: currentEntry.resetAt - now,
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - currentEntry.count,
    resetIn: currentEntry.resetAt - now,
  }
}

describe('Rate Limiting', () => {
  beforeEach(() => {
    rateLimitStore.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic Rate Limiting', () => {
    it('should allow requests within the limit', () => {
      const config = { windowMs: 60000, maxRequests: 5 }

      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit('test-key', config)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(4 - i)
      }
    })

    it('should block requests exceeding the limit', () => {
      const config = { windowMs: 60000, maxRequests: 3 }

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit('test-key', config)
      }

      // Fourth request should be blocked
      const result = checkRateLimit('test-key', config)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should return correct remaining count', () => {
      const config = { windowMs: 60000, maxRequests: 10 }

      const result1 = checkRateLimit('test-key', config)
      expect(result1.remaining).toBe(9)

      const result2 = checkRateLimit('test-key', config)
      expect(result2.remaining).toBe(8)

      const result3 = checkRateLimit('test-key', config)
      expect(result3.remaining).toBe(7)
    })
  })

  describe('Window Expiration', () => {
    it('should reset after window expires', () => {
      const config = { windowMs: 60000, maxRequests: 2 }

      // Use up the limit
      checkRateLimit('test-key', config)
      checkRateLimit('test-key', config)

      // Third request blocked
      let result = checkRateLimit('test-key', config)
      expect(result.allowed).toBe(false)

      // Advance time past window
      vi.advanceTimersByTime(61000)

      // Request should be allowed again
      result = checkRateLimit('test-key', config)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('should return correct resetIn time', () => {
      const config = { windowMs: 60000, maxRequests: 5 }

      const result = checkRateLimit('test-key', config)
      expect(result.resetIn).toBe(60000)

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000)

      const result2 = checkRateLimit('test-key', config)
      expect(result2.resetIn).toBeLessThanOrEqual(30000)
    })
  })

  describe('Key Isolation', () => {
    it('should track different keys separately', () => {
      const config = { windowMs: 60000, maxRequests: 2 }

      // Use up limit for key1
      checkRateLimit('key1', config)
      checkRateLimit('key1', config)
      const result1 = checkRateLimit('key1', config)
      expect(result1.allowed).toBe(false)

      // Key2 should still be allowed
      const result2 = checkRateLimit('key2', config)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(1)
    })

    it('should handle IP-based rate limiting', () => {
      const config = { windowMs: 60000, maxRequests: 3 }

      // Different IPs should have separate limits
      checkRateLimit('ip:192.168.1.1', config)
      checkRateLimit('ip:192.168.1.1', config)
      checkRateLimit('ip:192.168.1.1', config)

      const result1 = checkRateLimit('ip:192.168.1.1', config)
      expect(result1.allowed).toBe(false)

      const result2 = checkRateLimit('ip:192.168.1.2', config)
      expect(result2.allowed).toBe(true)
    })

    it('should handle user-based rate limiting', () => {
      const config = { windowMs: 60000, maxRequests: 5 }

      // Different users should have separate limits
      for (let i = 0; i < 5; i++) {
        checkRateLimit('user:user-123', config)
      }

      const result1 = checkRateLimit('user:user-123', config)
      expect(result1.allowed).toBe(false)

      const result2 = checkRateLimit('user:user-456', config)
      expect(result2.allowed).toBe(true)
    })
  })

  describe('Configuration Presets', () => {
    it('should handle strict rate limits', () => {
      const strictConfig = { windowMs: 60000, maxRequests: 3 } // 3 per minute

      checkRateLimit('strict-test', strictConfig)
      checkRateLimit('strict-test', strictConfig)
      checkRateLimit('strict-test', strictConfig)

      const result = checkRateLimit('strict-test', strictConfig)
      expect(result.allowed).toBe(false)
    })

    it('should handle lenient rate limits', () => {
      const lenientConfig = { windowMs: 60000, maxRequests: 100 } // 100 per minute

      for (let i = 0; i < 50; i++) {
        const result = checkRateLimit('lenient-test', lenientConfig)
        expect(result.allowed).toBe(true)
      }
    })

    it('should handle very short windows', () => {
      const shortWindowConfig = { windowMs: 1000, maxRequests: 2 } // 2 per second

      checkRateLimit('short-window', shortWindowConfig)
      checkRateLimit('short-window', shortWindowConfig)

      let result = checkRateLimit('short-window', shortWindowConfig)
      expect(result.allowed).toBe(false)

      // Wait for window to expire
      vi.advanceTimersByTime(1100)

      result = checkRateLimit('short-window', shortWindowConfig)
      expect(result.allowed).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single request limit', () => {
      const config = { windowMs: 60000, maxRequests: 1 }

      const result1 = checkRateLimit('single', config)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(0)

      const result2 = checkRateLimit('single', config)
      expect(result2.allowed).toBe(false)
    })

    it('should handle concurrent requests', () => {
      const config = { windowMs: 60000, maxRequests: 5 }

      // Simulate concurrent requests
      const results = Array.from({ length: 10 }, () =>
        checkRateLimit('concurrent', config)
      )

      const allowed = results.filter(r => r.allowed).length
      const blocked = results.filter(r => !r.allowed).length

      expect(allowed).toBe(5)
      expect(blocked).toBe(5)
    })

    it('should handle very long keys', () => {
      const config = { windowMs: 60000, maxRequests: 5 }
      const longKey = 'a'.repeat(1000)

      const result = checkRateLimit(longKey, config)
      expect(result.allowed).toBe(true)
    })

    it('should handle special characters in keys', () => {
      const config = { windowMs: 60000, maxRequests: 5 }

      const result = checkRateLimit('key:with:colons:and/slashes', config)
      expect(result.allowed).toBe(true)
    })
  })
})
