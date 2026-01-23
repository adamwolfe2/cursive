// Logging Middleware
// Automatically logs all API requests and responses

import { NextRequest, NextResponse } from 'next/server'
import { logRequest, logResponse, logError } from '@/lib/logging/logger'
import { getClientIp } from './rate-limit'

export interface LoggingContext {
  startTime: number
  requestId: string
  userId?: string
  workspaceId?: string
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Wrap API handler with automatic logging
 */
export function withLogging<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    const requestId = generateRequestId()
    const ip = getClientIp(req)

    // Extract user context (if available)
    const userId = req.headers.get('x-user-id') || undefined
    const workspaceId = req.headers.get('x-workspace-id') || undefined

    // Log request
    logRequest({
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      userId,
      workspaceId,
      ip,
    })

    try {
      // Execute handler
      const response = await handler(req, ...args)

      // Calculate duration
      const duration = Date.now() - startTime

      // Log response
      logResponse({
        method: req.method,
        url: req.url,
        status: response.status,
        duration,
        userId,
        workspaceId,
      })

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId)

      return response
    } catch (error) {
      // Calculate duration
      const duration = Date.now() - startTime

      // Log error
      logError(error, {
        method: req.method,
        url: req.url,
        duration,
        userId,
        workspaceId,
        ip,
        requestId,
      })

      // Log failed response
      logResponse({
        method: req.method,
        url: req.url,
        status: 500,
        duration,
        userId,
        workspaceId,
      })

      // Re-throw error
      throw error
    }
  }
}

/**
 * Extract logging context from request
 */
export function getLoggingContext(req: NextRequest): LoggingContext {
  return {
    startTime: Date.now(),
    requestId: generateRequestId(),
    userId: req.headers.get('x-user-id') || undefined,
    workspaceId: req.headers.get('x-workspace-id') || undefined,
  }
}

/**
 * Add logging context to request
 */
export function addLoggingContext(req: NextRequest, context: LoggingContext): void {
  // Store context in request headers (for downstream handlers)
  req.headers.set('x-request-id', context.requestId)
  if (context.userId) {
    req.headers.set('x-user-id', context.userId)
  }
  if (context.workspaceId) {
    req.headers.set('x-workspace-id', context.workspaceId)
  }
}
