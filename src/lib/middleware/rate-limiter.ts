// Rate Limiter Middleware
// Implements token bucket algorithm for API rate limiting

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  // Default fallback
  'default': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Rate limit exceeded. Please try again later.',
  },
}

export type RateLimitType = keyof typeof RATE_LIMITS

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
}

/**
 * Check rate limit for a given identifier and endpoint type
 */
export async function checkRateLimit(
  identifier: string, // IP address, user ID, or API key
  limitType: RateLimitType = 'default'
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[limitType]
  const supabase = createAdminClient()

  const windowStart = new Date(Date.now() - config.windowMs)
  const key = `${limitType}:${identifier}`

  // Get recent requests count
  const { count, error } = await supabase
    .from('rate_limit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart.toISOString())

  if (error) {
    console.error('Rate limit check failed:', error)
    // SECURITY: Fail closed - reject requests when rate limit DB is unavailable
    // This prevents abuse during outages but may cause false positives
    // Monitor error rates and consider circuit breaker pattern if needed
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
    // Log this request
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
 * Rate limit response helper
 */
export function rateLimitResponse(
  limitType: RateLimitType,
  result: RateLimitResult
): NextResponse {
  const config = RATE_LIMITS[limitType]

  return NextResponse.json(
    {
      error: config.message,
      retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': result.resetAt.toISOString(),
        'Retry-After': String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)),
      },
    }
  )
}

/**
 * Get identifier from request (IP or user ID)
 */
export function getRequestIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Get IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return `ip:${ip}`
}

/**
 * Rate limit middleware wrapper
 */
export async function withRateLimit(
  request: NextRequest,
  limitType: RateLimitType,
  identifier?: string
): Promise<NextResponse | null> {
  const id = identifier || getRequestIdentifier(request)
  const result = await checkRateLimit(id, limitType)

  if (!result.allowed) {
    return rateLimitResponse(limitType, result)
  }

  return null // Allow request to proceed
}

// =============================================================================
// REFERRAL ANTI-FRAUD CHECKS
// =============================================================================

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
 * Check for suspicious IP patterns
 */
export async function checkSuspiciousReferralIP(
  referrerIp: string,
  refereeIp: string
): Promise<ReferralFraudCheck> {
  // Same IP is suspicious
  if (referrerIp === refereeIp) {
    return { passed: false, reason: 'Same IP address detected' }
  }

  // Check for too many referrals from same IP
  const supabase = createAdminClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const { count } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_ip', referrerIp)
    .gte('created_at', oneHourAgo.toISOString())

  if ((count || 0) >= 5) {
    return { passed: false, reason: 'Too many referrals from this IP' }
  }

  return { passed: true }
}

/**
 * Check for suspicious email patterns
 */
export function checkSuspiciousEmail(
  referrerEmail: string,
  refereeEmail: string
): ReferralFraudCheck {
  const referrerDomain = referrerEmail.split('@')[1]?.toLowerCase()
  const refereeDomain = refereeEmail.split('@')[1]?.toLowerCase()

  // Same domain (and not common provider) is suspicious
  const commonProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'protonmail.com', 'mail.com', 'aol.com'
  ]

  if (referrerDomain === refereeDomain && !commonProviders.includes(referrerDomain || '')) {
    return { passed: false, reason: 'Same company email domain detected' }
  }

  // Check for similar email patterns (e.g., john1@, john2@)
  const referrerLocal = referrerEmail.split('@')[0]?.toLowerCase()
  const refereeLocal = refereeEmail.split('@')[0]?.toLowerCase()

  if (referrerLocal && refereeLocal) {
    // Remove trailing numbers
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
  // Self-referral check
  const selfCheck = checkSelfReferral(
    params.referrerUserId,
    params.refereeUserId,
    params.referrerWorkspaceId,
    params.refereeWorkspaceId
  )
  if (!selfCheck.passed) return selfCheck

  // IP check
  const ipCheck = await checkSuspiciousReferralIP(params.referrerIp, params.refereeIp)
  if (!ipCheck.passed) return ipCheck

  // Email check
  const emailCheck = checkSuspiciousEmail(params.referrerEmail, params.refereeEmail)
  if (!emailCheck.passed) return emailCheck

  return { passed: true }
}
