/**
 * API Error Classes
 * OpenInfo Platform
 *
 * Custom error types for API routes with proper error handling.
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  rateLimited,
  serverError,
  ErrorDetails,
  ApiErrorResponse,
} from './response'

// ============================================
// BASE ERROR CLASS
// ============================================

export class ApiError extends Error {
  readonly statusCode: number
  readonly details?: ErrorDetails[]

  constructor(message: string, statusCode = 500, details?: ErrorDetails[]) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }

  toResponse(): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
      {
        success: false,
        error: this.message,
        details: this.details,
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: this.statusCode }
    )
  }
}

// ============================================
// SPECIFIC ERROR CLASSES
// ============================================

export class BadRequestError extends ApiError {
  constructor(message = 'Bad request', details?: ErrorDetails[]) {
    super(message, 400, details)
    this.name = 'BadRequestError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

export class ValidationError extends ApiError {
  constructor(details: ErrorDetails[], message = 'Validation failed') {
    super(message, 422, details)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends ApiError {
  readonly retryAfter?: number

  constructor(message = 'Too many requests', retryAfter?: number) {
    super(message, 429)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }

  override toResponse(): NextResponse<ApiErrorResponse> {
    const response = super.toResponse()
    if (this.retryAfter) {
      response.headers.set('Retry-After', String(this.retryAfter))
    }
    return response
  }
}

export class DatabaseError extends ApiError {
  constructor(message = 'Database error') {
    super(message, 500)
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends ApiError {
  readonly service: string

  constructor(service: string, message?: string) {
    super(message || `External service error: ${service}`, 502)
    this.name = 'ExternalServiceError'
    this.service = service
  }
}

// ============================================
// ERROR HANDLER
// ============================================

/**
 * Convert any error to an API response
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Log error for debugging
  console.error('[API Error]', error)

  // Already an API error
  if (error instanceof ApiError) {
    return error.toResponse()
  }

  // Zod validation error
  if (error instanceof ZodError) {
    const details = error.errors.map((err) => ({
      field: err.path.join('.'),
      code: err.code,
      message: err.message,
    }))
    return validationError(details)
  }

  // Standard Error
  if (error instanceof Error) {
    // Check for specific error patterns
    const message = error.message.toLowerCase()

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return unauthorized()
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return forbidden()
    }

    if (message.includes('not found')) {
      return notFound()
    }

    if (message.includes('duplicate') || message.includes('conflict')) {
      return conflict(error.message)
    }

    // Don't expose internal error messages in production
    if (process.env.NODE_ENV === 'production') {
      return serverError()
    }

    return serverError(error.message)
  }

  // Unknown error
  return serverError()
}

// ============================================
// ERROR WRAPPER
// ============================================

type RouteHandler = (
  ...args: unknown[]
) => Promise<NextResponse> | NextResponse

/**
 * Wrap a route handler with error handling
 */
export function withErrorHandler<T extends RouteHandler>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }) as T
}

// ============================================
// ASSERTION HELPERS
// ============================================

/**
 * Assert that a value exists, throw NotFoundError otherwise
 */
export function assertFound<T>(
  value: T | null | undefined,
  message = 'Resource not found'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(message)
  }
}

/**
 * Assert that user is authenticated
 */
export function assertAuthenticated<T>(
  user: T | null | undefined,
  message = 'Authentication required'
): asserts user is T {
  if (!user) {
    throw new UnauthorizedError(message)
  }
}

/**
 * Assert that user has permission
 */
export function assertAuthorized(
  condition: boolean,
  message = 'Permission denied'
): asserts condition is true {
  if (!condition) {
    throw new ForbiddenError(message)
  }
}

/**
 * Assert that a condition is true, throw BadRequestError otherwise
 */
export function assertValid(
  condition: boolean,
  message = 'Invalid request'
): asserts condition is true {
  if (!condition) {
    throw new BadRequestError(message)
  }
}
