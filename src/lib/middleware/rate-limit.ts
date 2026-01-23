// Rate Limiting Middleware
// Provides IP-based and user-based rate limiting for API routes

import { NextRequest, NextResponse } from 'next/server'

// In-memory store for rate limits (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Rate limit configurations
export const RATE_LIMITS = {
  // Public endpoints (IP-based)
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  // Authenticated endpoints (user-based)
  authenticated: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 req/min
  },
  // Strict endpoints (searches, exports)
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
}

export interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
  skipFailedRequests?: boolean
  skipSuccessfulRequests?: boolean
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

/**
 * Rate limit a request based on identifier (IP or user ID)
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const key = options.keyPrefix
    ? `${options.keyPrefix}:${identifier}`
    : identifier
  const now = Date.now()

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key)

  // Reset if window expired
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + options.windowMs,
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  // Calculate remaining
  const remaining = Math.max(0, options.maxRequests - entry.count)
  const reset = Math.ceil(entry.resetAt / 1000)

  // Check if limit exceeded
  const success = entry.count <= options.maxRequests

  const result: RateLimitResult = {
    success,
    limit: options.maxRequests,
    remaining,
    reset,
  }

  // Add retry after if exceeded
  if (!success) {
    result.retryAfter = Math.ceil((entry.resetAt - now) / 1000)
  }

  return result
}

/**
 * Get IP address from request
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const real = req.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (real) {
    return real.trim()
  }

  return 'unknown'
}

/**
 * Create rate limit headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers()

  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.reset.toString())

  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString())
  }

  return headers
}

/**
 * Rate limit response helper
 */
export function rateLimitExceeded(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
    },
    { status: 429 }
  )

  const headers = createRateLimitHeaders(result)
  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Apply rate limit headers to successful response
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  const headers = createRateLimitHeaders(result)
  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })
  return response
}

/**
 * Cleanup old entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}
