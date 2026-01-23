/**
 * API Response Utilities
 * OpenInfo Platform
 *
 * Standardized response helpers for API routes.
 */

import { NextResponse } from 'next/server'

// ============================================
// RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: ApiMeta
}

export interface ApiMeta {
  pagination?: PaginationMeta
  timestamp?: string
  requestId?: string
}

export interface PaginationMeta {
  total: number
  page: number
  perPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// ============================================
// SUCCESS RESPONSES
// ============================================

/**
 * Return a successful response with data
 */
export function success<T>(
  data: T,
  meta?: ApiMeta,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  )
}

/**
 * Return a created response (201)
 */
export function created<T>(data: T, meta?: ApiMeta): NextResponse<ApiResponse<T>> {
  return success(data, meta, 201)
}

/**
 * Return a no content response (204)
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

// ============================================
// ERROR RESPONSES
// ============================================

export interface ErrorDetails {
  field?: string
  code?: string
  message: string
}

export interface ApiErrorResponse extends ApiResponse {
  error: string
  details?: ErrorDetails[]
}

/**
 * Return an error response
 */
export function error(
  message: string,
  status = 500,
  details?: ErrorDetails[]
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  )
}

/**
 * Return a bad request error (400)
 */
export function badRequest(
  message = 'Bad request',
  details?: ErrorDetails[]
): NextResponse<ApiErrorResponse> {
  return error(message, 400, details)
}

/**
 * Return an unauthorized error (401)
 */
export function unauthorized(message = 'Unauthorized'): NextResponse<ApiErrorResponse> {
  return error(message, 401)
}

/**
 * Return a forbidden error (403)
 */
export function forbidden(message = 'Forbidden'): NextResponse<ApiErrorResponse> {
  return error(message, 403)
}

/**
 * Return a not found error (404)
 */
export function notFound(message = 'Not found'): NextResponse<ApiErrorResponse> {
  return error(message, 404)
}

/**
 * Return a method not allowed error (405)
 */
export function methodNotAllowed(
  allowed: string[]
): NextResponse<ApiErrorResponse> {
  const response = error('Method not allowed', 405)
  response.headers.set('Allow', allowed.join(', '))
  return response
}

/**
 * Return a conflict error (409)
 */
export function conflict(message = 'Conflict'): NextResponse<ApiErrorResponse> {
  return error(message, 409)
}

/**
 * Return a validation error (422)
 */
export function validationError(
  details: ErrorDetails[]
): NextResponse<ApiErrorResponse> {
  return error('Validation failed', 422, details)
}

/**
 * Return a rate limit error (429)
 */
export function rateLimited(
  retryAfter?: number
): NextResponse<ApiErrorResponse> {
  const response = error('Too many requests', 429)
  if (retryAfter) {
    response.headers.set('Retry-After', String(retryAfter))
  }
  return response
}

/**
 * Return an internal server error (500)
 */
export function serverError(
  message = 'Internal server error'
): NextResponse<ApiErrorResponse> {
  return error(message, 500)
}

// ============================================
// PAGINATION HELPERS
// ============================================

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  page: number,
  perPage: number
): PaginationMeta {
  const totalPages = Math.ceil(total / perPage)
  return {
    total,
    page,
    perPage,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

/**
 * Return a paginated response
 */
export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number
): NextResponse<ApiResponse<T[]>> {
  return success(data, {
    pagination: createPaginationMeta(total, page, perPage),
  })
}
