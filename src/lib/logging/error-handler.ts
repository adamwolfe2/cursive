// Global Error Handler
// Provides consistent error handling and logging across the application

import { logger, logError, logSecurityEvent } from './logger'
import { NextResponse } from 'next/server'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: any) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT')
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR')
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(
    message: string = 'Insufficient credits',
    public credits?: { remaining: number; limit: number; resetAt: Date }
  ) {
    super(message, 402, 'INSUFFICIENT_CREDITS')
  }
}

/**
 * Handle error and return appropriate response
 */
export function handleError(error: unknown, context?: Record<string, any>): NextResponse {
  // Log error with context
  logError(error, context)

  // Handle known error types
  if (error instanceof AppError) {
    // Log security events for auth errors
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      logSecurityEvent({
        type: 'unauthorized_access',
        details: {
          message: error.message,
          code: error.code,
          ...context,
        },
      })
    }

    const response: any = {
      error: error.code || 'ERROR',
      message: error.message,
    }

    // Add additional fields for specific error types
    if (error instanceof ValidationError && error.errors) {
      response.errors = error.errors
    }

    if (error instanceof RateLimitError && error.retryAfter) {
      const res = NextResponse.json(response, { status: error.statusCode })
      res.headers.set('Retry-After', error.retryAfter.toString())
      return res
    }

    if (error instanceof InsufficientCreditsError && error.credits) {
      response.credits = error.credits
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  // Handle unknown errors
  const isDevelopment = process.env.NODE_ENV === 'development'

  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment && error instanceof Error
        ? error.message
        : 'An unexpected error occurred',
      ...(isDevelopment && error instanceof Error && { stack: error.stack }),
    },
    { status: 500 }
  )
}

/**
 * Async error handler wrapper
 */
export function asyncHandler<T extends any[]>(
  fn: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await fn(...args)
    } catch (error) {
      return handleError(error)
    }
  }
}

/**
 * Report error to external service (Sentry, etc.)
 */
export function reportError(error: Error, context?: Record<string, any>) {
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    // TODO: Integrate with Sentry
    // Sentry.captureException(error, { extra: context })
  }

  // Log locally
  logError(error, context)
}

/**
 * Handle unhandled promise rejections
 */
if (typeof window === 'undefined') {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error({
      type: 'unhandled_rejection',
      reason: reason instanceof Error ? {
        name: reason.name,
        message: reason.message,
        stack: reason.stack,
      } : reason,
    }, 'Unhandled Promise Rejection')

    reportError(
      reason instanceof Error ? reason : new Error(String(reason)),
      { type: 'unhandled_rejection' }
    )
  })

  process.on('uncaughtException', (error: Error) => {
    logger.fatal({
      type: 'uncaught_exception',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }, 'Uncaught Exception')

    reportError(error, { type: 'uncaught_exception' })

    // Exit process after logging
    process.exit(1)
  })
}
