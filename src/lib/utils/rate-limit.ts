/**
 * In-Memory Rate Limiter for Admin Operations
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  windowMs: number
  max: number
}

export const RATE_LIMIT_CONFIGS = {
  payout_approval: { windowMs: 60 * 60 * 1000, max: 10 }, // 10/hour
  payout_rejection: { windowMs: 60 * 60 * 1000, max: 20 }, // 20/hour
  admin_lead_search: { windowMs: 60 * 1000, max: 30 }, // 30/minute — expensive search operation
  admin_bulk_upload: { windowMs: 60 * 1000, max: 5 }, // 5/minute — bulk operations
  admin_trigger_lead_generation: { windowMs: 60 * 1000, max: 10 }, // 10/minute — triggers external APIs
  admin_trigger_enrichment: { windowMs: 60 * 1000, max: 10 }, // 10/minute — triggers external APIs
  admin_impersonate: { windowMs: 60 * 1000, max: 10 }, // 10/minute — security-sensitive
} as const

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter: number
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  let entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs }
  }

  entry.count++
  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, config.max - entry.count)
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000)

  return { allowed: entry.count <= config.max, remaining, retryAfter }
}
