/**
 * API Middleware Utilities
 * Cursive Platform
 *
 * Reusable middleware functions for API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { UnauthorizedError, ForbiddenError, RateLimitError } from './errors'

/**
 * Get the current authenticated user from Supabase session
 */
async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore - called from Server Component
            }
          },
        },
      }
    )

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return null
    }

    // Fetch user with workspace data
    const { data: user } = await supabase
      .from('users')
      .select('*, workspaces(*)')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user) {
      return null
    }

    const workspace = (user as any).workspaces

    return {
      id: user.id,
      auth_user_id: user.auth_user_id,
      email: session.user.email || '',
      full_name: user.full_name || '',
      workspace_id: user.workspace_id,
      plan: workspace?.plan || 'free',
      daily_credits_used: user.daily_credits_used || 0,
      daily_credit_limit: workspace?.daily_credit_limit || 10,
    }
  } catch (error) {
    console.error('[Auth] Failed to get current user:', error)
    return null
  }
}

// ============================================
// TYPES
// ============================================

export interface AuthenticatedUser {
  id: string
  auth_user_id: string
  email: string
  full_name: string
  workspace_id: string
  plan: 'free' | 'pro' | 'enterprise'
  daily_credits_used: number
  daily_credit_limit: number
}

export type AuthenticatedHandler<T = NextResponse> = (
  request: NextRequest,
  context: { user: AuthenticatedUser; params?: Record<string, string> }
) => Promise<T>

// ============================================
// AUTH MIDDLEWARE
// ============================================

/**
 * Require authentication for a route handler
 */
export function withAuth<T extends NextResponse>(
  handler: AuthenticatedHandler<T>
): (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T | NextResponse> {
  return async (request, context) => {
    const user = await getCurrentUser()

    if (!user) {
      throw new UnauthorizedError()
    }

    return handler(request, { user: user as AuthenticatedUser, params: context?.params })
  }
}

/**
 * Require a specific plan level
 */
export function withPlan(
  requiredPlans: ('free' | 'pro' | 'enterprise')[]
): <T extends NextResponse>(
  handler: AuthenticatedHandler<T>
) => (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T | NextResponse> {
  return (handler) => {
    return async (request, context) => {
      const user = await getCurrentUser()

      if (!user) {
        throw new UnauthorizedError()
      }

      if (!requiredPlans.includes(user.plan as 'free' | 'pro' | 'enterprise')) {
        throw new ForbiddenError(
          `This feature requires a ${requiredPlans.join(' or ')} plan`
        )
      }

      return handler(request, { user: user as AuthenticatedUser, params: context?.params })
    }
  }
}

/**
 * Require workspace ownership
 */
export function withWorkspaceOwner<T extends NextResponse>(
  handler: AuthenticatedHandler<T>
): (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T | NextResponse> {
  return withAuth(async (request, context) => {
    // TODO: Add workspace owner check when workspace roles are implemented
    return handler(request, context)
  })
}

// ============================================
// RATE LIMITING
// ============================================

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyGenerator?: (request: NextRequest, user?: AuthenticatedUser) => string
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Helper to get IP from request
function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
}

/**
 * Simple rate limiting middleware
 */
export function withRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req, user) => user?.id || getClientIp(req) || 'anonymous',
  } = config

  return <T extends NextResponse>(
    handler: AuthenticatedHandler<T>
  ): ((request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T | NextResponse>) => {
    return async (request, context) => {
      const user = await getCurrentUser()
      const key = keyGenerator(request, user as AuthenticatedUser | undefined)
      const now = Date.now()

      // Get or create rate limit entry
      let entry = rateLimitStore.get(key)

      if (!entry || entry.resetAt < now) {
        entry = { count: 0, resetAt: now + windowMs }
        rateLimitStore.set(key, entry)
      }

      // Check if rate limited
      if (entry.count >= maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
        throw new RateLimitError('Rate limit exceeded', retryAfter)
      }

      // Increment count
      entry.count++

      // Continue to handler
      if (!user) {
        throw new UnauthorizedError()
      }

      return handler(request, { user: user as AuthenticatedUser, params: context?.params })
    }
  }
}

// ============================================
// CREDIT CHECKING
// ============================================

/**
 * Check if user has available credits
 */
export function withCreditCheck<T extends NextResponse>(
  creditsRequired = 1
): (
  handler: AuthenticatedHandler<T>
) => (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T | NextResponse> {
  return (handler) => {
    return withAuth(async (request, context) => {
      const { user } = context

      const availableCredits = user.daily_credit_limit - user.daily_credits_used

      if (availableCredits < creditsRequired) {
        throw new ForbiddenError(
          `Insufficient credits. You have ${availableCredits} credits remaining, but this action requires ${creditsRequired} credits.`
        )
      }

      return handler(request, context)
    })
  }
}

// ============================================
// CORS MIDDLEWARE
// ============================================

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_PRODUCTION_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  // Production domains
  'https://meetcursive.com',
  'https://www.meetcursive.com',
  'https://app.meetcursive.com',
].filter(Boolean) as string[]

/**
 * Add CORS headers to response
 */
export function withCors<T extends NextResponse>(
  handler: (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T>
): (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T | NextResponse> {
  return async (request, context) => {
    const origin = request.headers.get('origin')

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin || '')
            ? origin!
            : ALLOWED_ORIGINS[0] || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      }) as T | NextResponse
    }

    const response = await handler(request, context)

    // Add CORS headers
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }

    return response
  }
}

// ============================================
// REQUEST LOGGING
// ============================================

/**
 * Log request details
 */
export function withLogging<T extends NextResponse>(
  handler: (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T>
): (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T> {
  return async (request, context) => {
    const start = Date.now()
    const method = request.method
    const url = request.url

    try {
      const response = await handler(request, context)
      const duration = Date.now() - start

      console.log(
        `[API] ${method} ${url} - ${response.status} (${duration}ms)`
      )

      return response
    } catch (error) {
      const duration = Date.now() - start
      console.error(
        `[API] ${method} ${url} - Error (${duration}ms)`,
        error
      )
      throw error
    }
  }
}

// ============================================
// COMPOSE MIDDLEWARE
// ============================================

type Middleware<T extends NextResponse> = (
  handler: (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T>
) => (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T | NextResponse>

/**
 * Compose multiple middleware functions
 */
export function compose<T extends NextResponse>(
  ...middlewares: Middleware<T>[]
): Middleware<T> {
  return (handler) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc as (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T>),
      handler as (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T | NextResponse>
    ) as (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<T | NextResponse>
  }
}
