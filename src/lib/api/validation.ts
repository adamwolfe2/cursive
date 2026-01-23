/**
 * API Validation Utilities
 * OpenInfo Platform
 *
 * Zod schemas and validation helpers for API routes.
 */

import { z } from 'zod'
import { NextRequest } from 'next/server'
import { BadRequestError, ValidationError } from './errors'
import type { ErrorDetails } from './response'

// ============================================
// COMMON SCHEMAS
// ============================================

/**
 * UUID string schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format')

/**
 * Email schema
 */
export const emailSchema = z.string().email('Invalid email format')

/**
 * Non-empty string schema
 */
export const nonEmptyString = z.string().min(1, 'Cannot be empty')

/**
 * Pagination query params schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
})

export type PaginationParams = z.infer<typeof paginationSchema>

/**
 * Sort query params schema
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type SortParams = z.infer<typeof sortSchema>

/**
 * Date range schema (base - for spreading into other schemas)
 */
const dateRangeBaseSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

/**
 * Date range schema (with refinement validation)
 */
export const dateRangeSchema = dateRangeBaseSchema.refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return new Date(data.dateFrom) <= new Date(data.dateTo)
    }
    return true
  },
  { message: 'dateFrom must be before dateTo' }
)

/**
 * Search query schema
 */
export const searchSchema = z.object({
  search: z.string().optional(),
  query: z.string().optional(), // Alias for search
})

// ============================================
// ENTITY SCHEMAS
// ============================================

/**
 * User schemas
 */
export const userSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  fullName: nonEmptyString,
  plan: z.enum(['free', 'pro', 'enterprise']),
  workspaceId: uuidSchema,
})

export type UserSchema = z.infer<typeof userSchema>

/**
 * Query creation schema
 */
export const createQuerySchema = z.object({
  topicId: uuidSchema,
  name: z.string().max(100).optional(),
  filters: z.object({
    location: z.object({
      country: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
    }).optional().nullable(),
    companySize: z.object({
      min: z.number().int().positive().optional(),
      max: z.number().int().positive().optional(),
    }).optional().nullable(),
    industry: z.array(z.string()).optional().nullable(),
    revenueRange: z.object({
      min: z.number().positive().optional(),
      max: z.number().positive().optional(),
    }).optional().nullable(),
    employeeRange: z.object({
      min: z.number().int().positive().optional(),
      max: z.number().int().positive().optional(),
    }).optional().nullable(),
    technologies: z.array(z.string()).optional().nullable(),
    excludeCompanies: z.array(z.string()).optional(),
  }).optional().default({}),
})

export type CreateQuerySchema = z.infer<typeof createQuerySchema>

/**
 * Lead filter schema
 */
export const leadFilterSchema = z.object({
  queryId: uuidSchema.optional(),
  enrichmentStatus: z.enum(['pending', 'completed', 'failed']).optional(),
  deliveryStatus: z.enum(['pending', 'delivered', 'failed']).optional(),
  intentScore: z.enum(['hot', 'warm', 'cold']).optional(),
  ...dateRangeBaseSchema.shape,
  ...searchSchema.shape,
  ...paginationSchema.shape,
  ...sortSchema.shape,
})

export type LeadFilterSchema = z.infer<typeof leadFilterSchema>

/**
 * People search schema
 */
export const peopleSearchSchema = z.object({
  companyDomain: z.string().optional(),
  companyName: z.string().optional(),
  titles: z.array(z.string()).optional(),
  departments: z.array(z.string()).optional(),
  seniorityLevels: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(100).default(25),
}).refine(
  (data) => data.companyDomain || data.companyName,
  { message: 'Either companyDomain or companyName is required' }
)

export type PeopleSearchSchema = z.infer<typeof peopleSearchSchema>

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Parse and validate JSON body
 */
export async function parseBody<T extends z.ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    throw new BadRequestError('Invalid JSON body')
  }

  return validateData(body, schema)
}

/**
 * Parse and validate query parameters
 */
export function parseSearchParams<T extends z.ZodSchema>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  const searchParams = request.nextUrl.searchParams
  const params: Record<string, string | string[]> = {}

  searchParams.forEach((value, key) => {
    const existing = params[key]
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(value)
      } else {
        params[key] = [existing, value]
      }
    } else {
      params[key] = value
    }
  })

  return validateData(params, schema)
}

/**
 * Parse and validate route parameters
 */
export function parseParams<T extends z.ZodSchema>(
  params: Record<string, string | string[]>,
  schema: T
): z.infer<T> {
  return validateData(params, schema)
}

/**
 * Validate data against a schema
 */
export function validateData<T extends z.ZodSchema>(
  data: unknown,
  schema: T
): z.infer<T> {
  const result = schema.safeParse(data)

  if (!result.success) {
    const details: ErrorDetails[] = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      code: err.code,
      message: err.message,
    }))
    throw new ValidationError(details)
  }

  return result.data
}

/**
 * Create a validated schema for partial updates (all fields optional)
 */
export function createPartialSchema<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T
): z.ZodObject<{ [K in keyof T['shape']]: z.ZodOptional<T['shape'][K]> }> {
  return schema.partial() as z.ZodObject<{ [K in keyof T['shape']]: z.ZodOptional<T['shape'][K]> }>
}

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Sanitize a string (remove HTML tags, trim whitespace)
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove any remaining angle brackets
    .trim()
}

/**
 * Sanitize an object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}

/**
 * Schema transformer that sanitizes string fields
 */
export function withSanitization<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T
): T {
  return schema.transform((data) => sanitizeObject(data)) as unknown as T
}
