/**
 * Rate Limiting Utility
 * Cursive Platform
 *
 * Simple in-memory rate limiter for API endpoints.
 * For production scale, consider Redis-based implementation.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (works for single instance, use Redis for multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Cleanup every minute

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSecs: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for an identifier (IP, user ID, etc.)
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${identifier}:${endpoint}`
  const now = Date.now()
  const windowMs = config.windowSecs * 1000

  let entry = rateLimitStore.get(key)

  // Create new entry or reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    }
    rateLimitStore.set(key, entry)

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++

  // Check if over limit
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Rate limit headers to add to response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  }
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
  // Public endpoints - strict limits
  public: { limit: 60, windowSecs: 60 }, // 60 req/min
  publicStrict: { limit: 10, windowSecs: 60 }, // 10 req/min

  // Authenticated endpoints - more generous
  authenticated: { limit: 300, windowSecs: 60 }, // 300 req/min

  // Webhooks - very generous (external services)
  webhook: { limit: 1000, windowSecs: 60 }, // 1000 req/min

  // Search/expensive operations
  search: { limit: 30, windowSecs: 60 }, // 30 req/min

  // Auth endpoints - prevent brute force
  auth: { limit: 5, windowSecs: 300 }, // 5 req/5min
} as const
