/**
 * API Route Wrapper with Monitoring
 * Automatically tracks performance, errors, and logs for all API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/monitoring/performance'
import { logger } from '@/lib/monitoring/logger'
import { captureError } from '@/lib/monitoring/sentry'

export interface ApiHandlerOptions {
  name: string
  requireAuth?: boolean
  rateLimit?: {
    maxRequests: number
    windowMs: number
  }
}

export type ApiHandler = (
  req: NextRequest,
  context: any
) => Promise<NextResponse | Response>

/**
 * Wrap an API route handler with automatic monitoring
 */
export function withMonitoring(
  handler: ApiHandler,
  options: ApiHandlerOptions
): ApiHandler {
  return async (req: NextRequest, context: any) => {
    const startTime = Date.now()
    const { name } = options

    // Extract request metadata
    const method = req.method
    const pathname = req.nextUrl.pathname
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Start performance tracking
    const perfId = performanceMonitor.start(`api-${name}`, {
      method,
      pathname,
    })

    // Log request start
    logger.debug(`API Request: ${method} ${pathname}`, {
      method,
      pathname,
      ip,
      userAgent,
    })

    try {
      // Execute the handler
      const response = await handler(req, context)

      // Calculate duration
      const duration = Date.now() - startTime
      const status = response.status

      // End performance tracking
      performanceMonitor.end(perfId, {
        success: status < 400,
        status,
      })

      // Log request completion
      logger.apiRequest({
        method,
        path: pathname,
        status,
        duration,
      })

      // Add performance headers
      const headers = new Headers(response.headers)
      headers.set('X-Response-Time', `${duration}ms`)

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch (error) {
      // Calculate duration for failed requests
      const duration = Date.now() - startTime

      // End performance tracking with error
      performanceMonitor.end(perfId, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      // Log error
      logger.error(
        `API Error: ${method} ${pathname}`,
        {
          method,
          pathname,
          duration,
          ip,
          userAgent,
        },
        error as Error
      )

      // Capture in Sentry
      captureError(error as Error, {
        tags: {
          api_route: name,
          method,
        },
        extra: {
          pathname,
          duration,
        },
      })

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message:
            process.env.NODE_ENV === 'development'
              ? (error as Error).message
              : 'An error occurred processing your request',
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Create a monitored API route handler
 */
export function createApiRoute(
  handler: ApiHandler,
  options: ApiHandlerOptions
) {
  return withMonitoring(handler, options)
}

/**
 * Helper to extract user ID from request
 * This should be called after authentication middleware
 */
export async function getUserIdFromRequest(
  req: NextRequest
): Promise<string | null> {
  try {
    // Get user from Supabase session
    const { createClient } = await import('@/lib/supabase/middleware')
    const { supabase } = createClient(req)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.user?.id || null
  } catch (error) {
    logger.error('Failed to get user from request', {}, error as Error)
    return null
  }
}

/**
 * Helper to get workspace ID from user
 */
export async function getWorkspaceIdFromRequest(
  req: NextRequest
): Promise<string | null> {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return null

    const { createClient } = await import('@/lib/supabase/middleware')
    const { supabase } = createClient(req)

    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', userId)
      .single()

    return user?.workspace_id || null
  } catch (error) {
    logger.error(
      'Failed to get workspace from request',
      {},
      error as Error
    )
    return null
  }
}
