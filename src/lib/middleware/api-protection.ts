// API Protection Middleware
// Combines auth, rate limiting, and credit checks

import { NextRequest, NextResponse } from 'next/server'
import {
  rateLimit,
  getClientIp,
  rateLimitExceeded,
  applyRateLimitHeaders,
  RATE_LIMITS,
} from './rate-limit'
import { CreditService } from '@/lib/services/credit.service'
import type { CreditAction } from '@/lib/services/credit.service'
import { createClient } from '@/lib/supabase/server'
import { logSecurityEvent } from '@/lib/logging/logger'

export interface ProtectionOptions {
  rateLimit?: {
    windowMs: number
    maxRequests: number
    keyPrefix?: string
  }
  requireAuth?: boolean
  requireCredits?: {
    action: CreditAction
    consumeOnSuccess?: boolean
  }
}

export interface ProtectedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    workspace_id: string
    plan: string
  }
  credits?: {
    remaining: number
    limit: number
    resetAt: Date
  }
}

/**
 * Protect API route with auth, rate limiting, and credit checks
 */
export async function protectRoute(
  req: NextRequest,
  options: ProtectionOptions = {}
): Promise<{ success: true; req: ProtectedRequest } | { success: false; response: NextResponse }> {
  // 1. Rate limiting (IP-based for public, user-based for auth)
  if (options.rateLimit) {
    const identifier = options.requireAuth
      ? req.headers.get('x-user-id') || getClientIp(req)
      : getClientIp(req)

    const rateLimitResult = await rateLimit(identifier, options.rateLimit)

    if (!rateLimitResult.success) {
      // Log rate limit violation
      logSecurityEvent({
        type: 'rate_limit_exceeded',
        ip: getClientIp(req),
        userId: req.headers.get('x-user-id') || undefined,
        details: {
          endpoint: req.url,
          limit: rateLimitResult.limit,
          retryAfter: rateLimitResult.retryAfter,
        },
      })

      return {
        success: false,
        response: rateLimitExceeded(rateLimitResult),
      }
    }
  }

  // 2. Authentication
  let user: ProtectedRequest['user'] | undefined

  if (options.requireAuth) {
    const supabase = await createClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      // Log failed authentication
      logSecurityEvent({
        type: 'auth_failed',
        ip: getClientIp(req),
        details: {
          endpoint: req.url,
          error: authError?.message,
        },
      })

      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        ),
      }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, workspace_id, plan')
      .eq('auth_user_id', authUser.id)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized', message: 'User profile not found' },
          { status: 401 }
        ),
      }
    }

    user = profile
  }

  // 3. Credit check
  let credits: ProtectedRequest['credits'] | undefined

  if (options.requireCredits && user) {
    const creditCheck = await CreditService.checkCredits(
      user.id,
      options.requireCredits.action
    )

    if (!creditCheck.allowed) {
      // Log insufficient credits (potential abuse or upgrade opportunity)
      logSecurityEvent({
        type: 'suspicious_activity',
        userId: user.id,
        workspaceId: user.workspace_id,
        details: {
          type: 'insufficient_credits',
          action: options.requireCredits.action,
          remaining: creditCheck.remaining,
          limit: creditCheck.limit,
        },
      })

      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Insufficient credits',
            message: creditCheck.message,
            credits: {
              remaining: creditCheck.remaining,
              limit: creditCheck.limit,
              resetAt: creditCheck.resetAt,
            },
          },
          { status: 402 }
        ),
      }
    }

    credits = {
      remaining: creditCheck.remaining,
      limit: creditCheck.limit,
      resetAt: creditCheck.resetAt,
    }
  }

  // Create protected request object
  const protectedReq = req as ProtectedRequest
  if (user) protectedReq.user = user
  if (credits) protectedReq.credits = credits

  return {
    success: true,
    req: protectedReq,
  }
}

/**
 * Helper to apply rate limit headers to response
 */
export async function applyProtectionHeaders(
  response: NextResponse,
  req: NextRequest,
  options: ProtectionOptions
): Promise<NextResponse> {
  if (options.rateLimit) {
    const identifier = options.requireAuth
      ? req.headers.get('x-user-id') || getClientIp(req)
      : getClientIp(req)

    const rateLimitResult = await rateLimit(identifier, options.rateLimit)
    return applyRateLimitHeaders(response, rateLimitResult)
  }

  return response
}

/**
 * Consume credits after successful operation
 */
export async function consumeCredits(
  user: NonNullable<ProtectedRequest['user']>,
  action: CreditAction
): Promise<void> {
  await CreditService.consumeCredits(user.id, user.workspace_id, action)
}

/**
 * Preset protection configurations
 */
export const PROTECTION_PRESETS = {
  // Public endpoints
  public: {
    rateLimit: RATE_LIMITS.public,
  },

  // Authenticated endpoints
  authenticated: {
    requireAuth: true,
    rateLimit: RATE_LIMITS.authenticated,
  },

  // Search endpoints (requires credits)
  search: {
    requireAuth: true,
    rateLimit: RATE_LIMITS.strict,
    requireCredits: {
      action: 'people_search' as CreditAction,
      consumeOnSuccess: true,
    },
  },

  // Export endpoints (requires credits)
  export: {
    requireAuth: true,
    rateLimit: RATE_LIMITS.strict,
    requireCredits: {
      action: 'export' as CreditAction,
      consumeOnSuccess: true,
    },
  },

  // Email reveal (requires credits)
  emailReveal: {
    requireAuth: true,
    rateLimit: RATE_LIMITS.strict,
    requireCredits: {
      action: 'email_reveal' as CreditAction,
      consumeOnSuccess: true,
    },
  },
} as const
