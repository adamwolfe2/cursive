// Rate Limiter — Middleware (Upstash) + Per-Route (Supabase)
//
// Two rate limiting strategies live here:
//
// 1. checkRateLimit(identifier, tier) — DISTRIBUTED, uses Upstash Redis REST API.
//    Used by src/middleware.ts for coarse-grained IP throttling across all Vercel
//    replicas. Falls back to per-instance in-memory when UPSTASH env vars are absent.
//
// 2. withRateLimit(req, limitType, identifier?) — PER-ENDPOINT, uses Supabase
//    rate_limit_logs table. Used by individual API route handlers for fine-grained
//    per-user / per-workspace limits (e.g. 'ai-generate-email', 'lead-export').
//
// checkWorkspaceRateLimit(workspaceId) — DISTRIBUTED, enforces shared per-workspace
//    quota for extension/external API routes (not just per-IP).

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: Distributed rate limiting via Upstash Redis
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp in ms
}

// In-memory fallback store (per-instance only)
const memoryStore = new Map<string, { count: number; resetAt: number }>()

async function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs }
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  return {
    success: entry.count <= limit,
    limit,
    remaining,
    reset: entry.resetAt,
  }
}

// Periodically evict stale in-memory entries
let lastCleanup = Date.now()
function maybeCleanupMemory() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt < now) memoryStore.delete(key)
  }
}

/**
 * Distributed rate limit check using Upstash Redis REST API.
 *
 * Uses fixed-window counting: each window key is `rl:<tier>:<identifier>:<window>`.
 * Falls back to per-instance in-memory when UPSTASH env vars are absent.
 *
 * Tiers and default limits (requests per windowSeconds):
 *   auth  — 10   /api/auth/* (login, signup, password reset)
 *   write — 30   POST/PUT/DELETE
 *   read  — 60   GET
 *   ext   — 20   browser extension / external API
 */
export async function checkRateLimit(
  identifier: string,
  tier: 'auth' | 'write' | 'read' | 'ext',
  windowSeconds = 60
): Promise<RateLimitResult> {
  const limits: Record<string, number> = { auth: 10, write: 30, read: 60, ext: 20 }
  const limit = limits[tier]
  const key = `rl:${tier}:${identifier}`

  maybeCleanupMemory()

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const now = Math.floor(Date.now() / 1000)
      const window = Math.floor(now / windowSeconds)
      const windowKey = `${key}:${window}`

      const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', windowKey],
          ['EXPIRE', windowKey, windowSeconds * 2],
        ]),
      })

      if (response.ok) {
        const results = await response.json() as Array<{ result: unknown }>
        const count = results[0].result as number
        const remaining = Math.max(0, limit - count)
        const reset = (window + 1) * windowSeconds * 1000
        return { success: count <= limit, limit, remaining, reset }
      }
    } catch {
      // Upstash unavailable — fall through to in-memory
    }
  }

  return checkMemoryRateLimit(key, limit, windowSeconds * 1000)
}

/**
 * Per-workspace rate limit for extension/external API routes.
 * Enforces a shared quota across all users in a workspace, not just per-IP.
 */
export async function checkWorkspaceRateLimit(
  workspaceId: string,
  _limitPerMinute = 60
): Promise<RateLimitResult> {
  return checkRateLimit(`workspace:${workspaceId}`, 'ext', 60)
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: Per-route rate limiting via Supabase (rate_limit_logs table)
// ─────────────────────────────────────────────────────────────────────────────

// Rate limit configurations by endpoint type
export const RATE_LIMITS = {
  // Partner upload - strict limits to prevent abuse
  'partner-upload': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 uploads per hour
    message: 'Too many uploads. Please wait before uploading again.',
  },

  // Marketplace browse - generous limits for good UX
  'marketplace-browse': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'Too many requests. Please slow down.',
  },

  // Purchase endpoints - moderate limits
  'marketplace-purchase': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 purchases per minute
    message: 'Too many purchase attempts. Please wait.',
  },

  // Partner registration - conservative to prevent abuse on unauthenticated endpoint
  'partner-register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 registration attempts per hour per IP
    message: 'Too many registration attempts. Please try again later.',
  },

  // Referral endpoints - strict to prevent abuse
  'referral': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 referral operations per hour
    message: 'Too many referral requests. Please wait.',
  },

  // Auth login - strict to prevent brute force
  'auth-login': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 login attempts per minute per IP
    message: 'Too many login attempts. Please wait before trying again.',
  },

  // Auth password change - very strict
  'auth-change-password': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 password change attempts per minute
    message: 'Too many password change attempts. Please wait before trying again.',
  },

  // Public form submissions (contact, waitlist) - strict to prevent spam
  'public-form': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 submissions per minute per IP
    message: 'Too many submissions. Please wait before trying again.',
  },

  // Partner payout requests - very strict to prevent abuse
  'partner-payout': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 payout requests per hour
    message: 'Too many payout requests. Please wait before trying again.',
  },

  // Billing checkout - prevent Stripe session spam
  'billing-checkout': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 checkout sessions per hour per IP
    message: 'Too many checkout attempts. Please wait before trying again.',
  },

  // Quick email send - prevent Resend abuse
  'email-quick-send': {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 20, // 20 quick-send emails per 10 minutes per user
    message: 'Too many emails sent. Please wait before sending more.',
  },

  // Lead enrichment - prevent runaway API costs
  'lead-enrich': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 enrichment requests per minute per user
    message: 'Too many enrichment requests. Please slow down.',
  },

  // MCP server envelope - outer rate limit for all MCP method calls per workspace
  // Per-tool limits apply on top (e.g. enrich_person also uses 'lead-enrich')
  'mcp-request': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 MCP method calls per minute per workspace
    message: 'Too many MCP requests. Please slow down.',
  },

  // MCP segment pull - pull_in_market_identities tool.
  // Extremely strict because each call hits AudienceLab preview API (billable)
  // and can return up to 50 records. Hard cap prevents credit burn from agent loops.
  'mcp-segment-pull': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 segment pulls per hour per workspace
    message: 'Segment pull limit reached. Please wait before pulling more identities.',
  },

  // MCP audience preview - billable AL API call
  'mcp-preview': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 previews per hour per workspace
    message: 'Audience preview limit reached. Please wait before previewing more audiences.',
  },

  // Lead export - prevent bulk scraping
  'lead-export': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 exports per hour per user
    message: 'Too many exports per hour. Please try again later.',
  },

  // AI lead qualification - expensive Claude API calls
  'ai-qualify': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 30, // 30 AI qualification calls per hour per user
    message: 'AI qualification limit reached. Please wait before qualifying more leads.',
  },

  // AI email generation - expensive Claude API calls
  'ai-generate-email': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100, // 100 email generations per hour per user
    message: 'Email generation limit reached. Please wait before generating more emails.',
  },

  // Sequence enrollment - triggers Inngest batch jobs, potentially 1000 leads
  'sequence-enroll': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 enrollment operations per hour per user
    message: 'Sequence enrollment limit reached. Please wait before enrolling more leads.',
  },

  // Sequence creation - DB writes with steps
  'sequence-create': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 30, // 30 sequences per hour per user
    message: 'Sequence creation limit reached. Please wait before creating more sequences.',
  },

  // Global search - 3 parallel DB queries per call
  'search': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute per user
    message: 'Too many search requests. Please slow down.',
  },

  // Segment run - Audiencelab API calls + credit deduction, expensive
  'segment-run': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 segment runs per hour per user
    message: 'Segment run limit reached. Please wait before running more segments.',
  },

  // Activation requests (campaign/audience) - Slack alerts + DB writes
  'activate-request': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 activation requests per hour per user (low — these are DFY requests)
    message: 'Too many activation requests. Please wait before submitting another.',
  },

  // Default fallback
  'default': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Rate limit exceeded. Please try again later.',
  },
}

export type RateLimitType = keyof typeof RATE_LIMITS

interface RouteRateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
}

/**
 * Check per-route rate limit backed by Supabase rate_limit_logs table.
 * Used internally by withRateLimit().
 */
async function checkRouteRateLimit(
  identifier: string,
  limitType: RateLimitType = 'default'
): Promise<RouteRateLimitResult> {
  const config = RATE_LIMITS[limitType]
  const supabase = createAdminClient()

  const windowStart = new Date(Date.now() - config.windowMs)
  const key = `${limitType}:${identifier}`

  const { count, error } = await supabase
    .from('rate_limit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart.toISOString())

  if (error) {
    safeError('Route rate limit check failed:', error)
    // Fail closed — reject on DB error to prevent abuse during outages
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + config.windowMs),
      limit: config.maxRequests,
    }
  }

  const currentCount = count || 0
  const allowed = currentCount < config.maxRequests

  if (allowed) {
    await supabase.from('rate_limit_logs').insert({
      key,
      limit_type: limitType,
      identifier,
    })
  }

  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - currentCount - (allowed ? 1 : 0)),
    resetAt: new Date(Date.now() + config.windowMs),
    limit: config.maxRequests,
  }
}

/**
 * Build a 429 response for a per-route rate limit violation.
 */
export function rateLimitResponse(
  limitType: RateLimitType,
  result: RouteRateLimitResult
): NextResponse {
  const config = RATE_LIMITS[limitType]
  const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)

  return NextResponse.json(
    { error: config.message, retryAfter },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': result.resetAt.toISOString(),
        'Retry-After': String(retryAfter),
      },
    }
  )
}

/**
 * Get a stable request identifier (user ID preferred, falls back to IP).
 */
export function getRequestIdentifier(request: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return `ip:${ip}`
}

/**
 * Per-route rate limit middleware wrapper (Supabase-backed).
 * Returns a 429 NextResponse when the limit is exceeded, null otherwise.
 *
 * Usage:
 *   const limited = await withRateLimit(req, 'ai-generate-email', getRequestIdentifier(req, user.id))
 *   if (limited) return limited
 */
export async function withRateLimit(
  request: NextRequest,
  limitType: RateLimitType,
  identifier?: string
): Promise<NextResponse | null> {
  const id = identifier ?? getRequestIdentifier(request)
  const result = await checkRouteRateLimit(id, limitType)
  if (!result.allowed) return rateLimitResponse(limitType, result)
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3: Referral anti-fraud checks
// ─────────────────────────────────────────────────────────────────────────────

interface ReferralFraudCheck {
  passed: boolean
  reason?: string
}

/**
 * Check for self-referral (same user/workspace)
 */
export function checkSelfReferral(
  referrerUserId: string,
  refereeUserId: string,
  referrerWorkspaceId?: string,
  refereeWorkspaceId?: string
): ReferralFraudCheck {
  if (referrerUserId === refereeUserId) {
    return { passed: false, reason: 'Self-referral not allowed' }
  }

  if (referrerWorkspaceId && refereeWorkspaceId && referrerWorkspaceId === refereeWorkspaceId) {
    return { passed: false, reason: 'Same workspace referral not allowed' }
  }

  return { passed: true }
}

/**
 * Check for suspicious IP patterns (same IP or too many referrals from one IP)
 */
export async function checkSuspiciousReferralIP(
  referrerIp: string,
  refereeIp: string
): Promise<ReferralFraudCheck> {
  if (referrerIp === refereeIp) {
    return { passed: false, reason: 'Same IP address detected' }
  }

  const supabase = createAdminClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const { count } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_ip', referrerIp)
    .gte('created_at', oneHourAgo.toISOString())

  if ((count || 0) >= 5) {
    return { passed: false, reason: 'Too many referrals from this IP' }
  }

  return { passed: true }
}

/**
 * Check for suspicious email patterns (same domain, similar local parts)
 */
export function checkSuspiciousEmail(
  referrerEmail: string,
  refereeEmail: string
): ReferralFraudCheck {
  const referrerDomain = referrerEmail.split('@')[1]?.toLowerCase()
  const refereeDomain = refereeEmail.split('@')[1]?.toLowerCase()

  const commonProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'protonmail.com', 'mail.com', 'aol.com',
  ]

  if (referrerDomain === refereeDomain && !commonProviders.includes(referrerDomain || '')) {
    return { passed: false, reason: 'Same company email domain detected' }
  }

  const referrerLocal = referrerEmail.split('@')[0]?.toLowerCase()
  const refereeLocal = refereeEmail.split('@')[0]?.toLowerCase()

  if (referrerLocal && refereeLocal) {
    const normalizedReferrer = referrerLocal.replace(/\d+$/, '')
    const normalizedReferee = refereeLocal.replace(/\d+$/, '')

    if (normalizedReferrer === normalizedReferee && normalizedReferrer.length > 3) {
      return { passed: false, reason: 'Similar email pattern detected' }
    }
  }

  return { passed: true }
}

/**
 * Run all referral fraud checks
 */
export async function validateReferral(params: {
  referrerUserId: string
  refereeUserId: string
  referrerWorkspaceId?: string
  refereeWorkspaceId?: string
  referrerEmail: string
  refereeEmail: string
  referrerIp: string
  refereeIp: string
}): Promise<ReferralFraudCheck> {
  const selfCheck = checkSelfReferral(
    params.referrerUserId,
    params.refereeUserId,
    params.referrerWorkspaceId,
    params.refereeWorkspaceId
  )
  if (!selfCheck.passed) return selfCheck

  const ipCheck = await checkSuspiciousReferralIP(params.referrerIp, params.refereeIp)
  if (!ipCheck.passed) return ipCheck

  const emailCheck = checkSuspiciousEmail(params.referrerEmail, params.refereeEmail)
  if (!emailCheck.passed) return emailCheck

  return { passed: true }
}
