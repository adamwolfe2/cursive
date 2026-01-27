/**
 * Common Zod Schemas
 * OpenInfo Platform
 *
 * Reusable validation schemas for API routes.
 */

import { z } from 'zod'

// ============================================
// PRIMITIVE SCHEMAS
// ============================================

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format')

/**
 * Email validation
 */
export const emailSchema = z.string().email('Invalid email format').max(255)

/**
 * Non-empty string
 */
export const nonEmptyString = z.string().min(1, 'Cannot be empty')

/**
 * Optional non-empty string (allows undefined, but not empty string)
 */
export const optionalNonEmptyString = z.string().min(1).optional()

/**
 * Positive integer
 */
export const positiveInt = z.number().int().positive()

/**
 * Non-negative integer
 */
export const nonNegativeInt = z.number().int().nonnegative()

/**
 * URL validation
 */
export const urlSchema = z.string().url('Invalid URL format')

/**
 * Phone number (basic validation)
 */
export const phoneSchema = z.string().max(50).regex(
  /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
  'Invalid phone number format'
).optional()

// ============================================
// PAGINATION SCHEMAS
// ============================================

/**
 * Page number (1-based)
 */
export const pageSchema = z.coerce.number().int().min(1).default(1)

/**
 * Items per page
 */
export const perPageSchema = z.coerce.number().int().min(1).max(100).default(50)

/**
 * Offset-based pagination
 */
export const offsetSchema = z.coerce.number().int().min(0).default(0)

/**
 * Limit for queries
 */
export const limitSchema = z.coerce.number().int().min(1).max(100).default(50)

/**
 * Standard pagination params
 */
export const paginationSchema = z.object({
  page: pageSchema,
  per_page: perPageSchema,
})

/**
 * Offset-based pagination params
 */
export const offsetPaginationSchema = z.object({
  offset: offsetSchema,
  limit: limitSchema,
})

// ============================================
// SORTING & FILTERING SCHEMAS
// ============================================

/**
 * Sort order
 */
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc')

/**
 * Date range filter
 */
export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

/**
 * Search query (with reasonable limits)
 */
export const searchQuerySchema = z.string().max(500).optional()

// ============================================
// LEAD SCHEMAS
// ============================================

/**
 * Intent score values
 */
export const intentScoreSchema = z.enum(['hot', 'warm', 'cold'])

/**
 * Enrichment status values
 */
export const enrichmentStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed'])

/**
 * Delivery status values
 */
export const deliveryStatusSchema = z.enum(['pending', 'delivered', 'failed'])

/**
 * Lead filters schema
 */
export const leadFiltersSchema = z.object({
  query_id: uuidSchema.optional(),
  enrichment_status: enrichmentStatusSchema.optional(),
  delivery_status: deliveryStatusSchema.optional(),
  intent_score: intentScoreSchema.optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: searchQuerySchema,
  page: pageSchema,
  per_page: perPageSchema,
})

/**
 * Lead location schema
 */
export const leadLocationSchema = z.object({
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
})

/**
 * Lead create/update schema
 */
export const leadInputSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: emailSchema,
  phone: phoneSchema,
  company_name: z.string().max(200).optional(),
  company_industry: z.string().max(100).optional(),
  company_location: leadLocationSchema.optional(),
  intent_signal: z.string().max(500).optional(),
  lead_score: z.number().int().min(0).max(100).optional(),
})

// ============================================
// CAMPAIGN SCHEMAS
// ============================================

/**
 * Campaign status values
 */
export const campaignStatusSchema = z.enum(['draft', 'active', 'paused', 'completed', 'archived'])

/**
 * Email send status values
 */
export const emailSendStatusSchema = z.enum([
  'pending_approval',
  'approved',
  'rejected',
  'scheduled',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'replied',
  'bounced',
  'failed',
])

/**
 * Reply sentiment values
 */
export const replySentimentSchema = z.enum([
  'positive',
  'negative',
  'neutral',
  'question',
  'not_interested',
  'out_of_office',
])

// ============================================
// USER & WORKSPACE SCHEMAS
// ============================================

/**
 * User role values
 */
export const userRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer'])

/**
 * Subscription tier values
 */
export const subscriptionTierSchema = z.enum(['free', 'starter', 'professional', 'enterprise'])

/**
 * Password validation (8+ chars, at least one number)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[0-9]/, 'Password must contain at least one number')

// ============================================
// BULK OPERATIONS SCHEMAS
// ============================================

/**
 * Bulk IDs (max 100)
 */
export const bulkIdsSchema = z.array(uuidSchema).min(1).max(100)

/**
 * Bulk action request
 */
export const bulkActionSchema = z.object({
  ids: bulkIdsSchema,
  action: nonEmptyString,
  data: z.record(z.unknown()).optional(),
})

// ============================================
// TIME RANGE SCHEMAS
// ============================================

/**
 * Analytics time range
 */
export const timeRangeSchema = z.enum(['7d', '30d', '90d', '365d']).default('30d')

/**
 * ISO datetime string
 */
export const isoDatetimeSchema = z.string().datetime()

// ============================================
// HELPERS
// ============================================

/**
 * Create an enum schema from an array of values
 */
export function enumFromArray<T extends string>(values: readonly T[]) {
  return z.enum(values as [T, ...T[]])
}

/**
 * Make all properties in a schema optional
 */
export function makeOptional<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.partial()
}

/**
 * Parse query params from URLSearchParams
 */
export function parseQueryParams<T extends z.ZodTypeAny>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T> {
  const params: Record<string, string | undefined> = {}
  searchParams.forEach((value, key) => {
    params[key] = value || undefined
  })
  return schema.parse(params)
}
