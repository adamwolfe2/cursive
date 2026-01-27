// API Error Handler Utility
// Centralized error handling for API routes

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { FeatureNotAvailableError, LimitExceededError } from '@/lib/tier/server'

/**
 * Custom API Errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation error', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string = 'Database error') {
    super(message, 500, 'DATABASE_ERROR')
    this.name = 'DatabaseError'
  }
}

export class RateLimitError extends ApiError {
  constructor(
    message: string = 'Too many requests',
    public retryAfter: number = 60
  ) {
    super(message, 429, 'RATE_LIMITED')
    this.name = 'RateLimitError'
  }
}

/**
 * Handle API errors and return appropriate NextResponse
 */
export function handleApiError(error: unknown): NextResponse {
  // Don't log expected errors at error level
  const isExpectedError =
    error instanceof ApiError ||
    error instanceof z.ZodError ||
    error instanceof FeatureNotAvailableError ||
    error instanceof LimitExceededError

  if (!isExpectedError) {
    console.error('[API Error]:', error)
  }

  // Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
      { status: 400 }
    )
  }

  // Tier feature errors
  if (error instanceof FeatureNotAvailableError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'FEATURE_NOT_AVAILABLE',
        feature: error.feature,
        currentTier: error.currentTier,
      },
      { status: 403 }
    )
  }

  // Tier limit errors
  if (error instanceof LimitExceededError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'LIMIT_EXCEEDED',
        resource: error.resource,
        used: error.used,
        limit: error.limit,
      },
      { status: 403 }
    )
  }

  // Rate limit errors
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'RATE_LIMITED',
        retryAfter: error.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': error.retryAfter.toString(),
        },
      }
    )
  }

  // Custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.code && { code: error.code }),
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    )
  }

  // Standard Error objects
  if (error instanceof Error) {
    // Check for specific error messages that indicate auth issues
    if (
      error.message.includes('Unauthorized') ||
      error.message.includes('Not authenticated')
    ) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Check for permission errors
    if (
      error.message.includes('Forbidden') ||
      error.message.includes('Insufficient permissions')
    ) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Check for not found errors
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message, code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Generic error - don't expose internal error messages in production
    const isProduction = process.env.NODE_ENV === 'production'
    return NextResponse.json(
      {
        error: isProduction ? 'Internal server error' : error.message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }

  // Unknown error type
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}

/**
 * Common response helpers
 */
export function unauthorized(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message: string = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function notFound(message: string = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function badRequest(message: string, details?: any) {
  return NextResponse.json(
    { error: message, ...(details && { details }) },
    { status: 400 }
  )
}

export function success<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export function rateLimited(retryAfter: number = 60) {
  return NextResponse.json(
    {
      error: 'Too many requests',
      code: 'RATE_LIMITED',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
      },
    }
  )
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}
