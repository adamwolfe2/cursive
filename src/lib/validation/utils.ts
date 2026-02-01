import { z } from 'zod'

/**
 * Common validation utilities and reusable validation patterns
 */

// ============================================================================
// REUSABLE PATTERNS
// ============================================================================

/**
 * Email validation
 */
export const emailField = z.string().email('Please enter a valid email address')

/**
 * Password validation (basic)
 */
export const passwordField = z.string().min(8, 'Password must be at least 8 characters')

/**
 * Strong password validation
 */
export const strongPasswordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )

/**
 * Required terms acceptance
 */
export const termsField = z.boolean().refine((val) => val === true, {
  message: 'You must agree to the terms and conditions',
})

/**
 * Optional boolean (checkbox)
 */
export const optionalBooleanField = z.boolean().optional()

/**
 * Phone number validation (US format)
 */
export const phoneField = z
  .string()
  .regex(
    /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    'Please enter a valid phone number'
  )
  .optional()

/**
 * URL validation
 */
export const urlField = z.string().url('Please enter a valid URL')

/**
 * Webhook URL validation (must be https)
 */
export const webhookUrlField = z
  .string()
  .url('Please enter a valid URL')
  .refine((url) => url.startsWith('https://'), {
    message: 'Webhook URL must use HTTPS',
  })

/**
 * Required select (non-empty string)
 */
export const requiredSelectField = z.string().min(1, 'Please make a selection')

/**
 * Optional select
 */
export const optionalSelectField = z.string().optional()

/**
 * Positive integer
 */
export const positiveIntField = z.number().int().positive()

/**
 * Non-negative integer (includes 0)
 */
export const nonNegativeIntField = z.number().int().min(0)

/**
 * Positive number (decimal allowed)
 */
export const positiveNumberField = z.number().positive()

/**
 * Non-negative number (includes 0, decimal allowed)
 */
export const nonNegativeNumberField = z.number().min(0)

// ============================================================================
// VALIDATION REFINEMENTS
// ============================================================================

/**
 * Creates a password confirmation refinement
 */
export function passwordConfirmationRefinement<T extends { password: string; confirm_password: string }>(
  message: string = "Passwords don't match"
) {
  return (data: T) => data.password === data.confirm_password
}

/**
 * Creates a range validation refinement (min <= max)
 */
export function rangeRefinement<T extends { min?: number; max?: number }>(
  fieldName: string = 'range'
) {
  return {
    refine: (data: T) => {
      if (data.min !== undefined && data.max !== undefined) {
        return data.min <= data.max
      }
      return true
    },
    message: `Minimum ${fieldName} must be less than or equal to maximum`,
  }
}

/**
 * Creates an "at least one of" refinement
 */
export function atLeastOneOf<T extends Record<string, unknown>>(
  fields: (keyof T)[],
  message: string = 'At least one field is required'
) {
  return (data: T) => {
    return fields.some((field) => {
      const value = data[field]
      return value !== undefined && value !== null && value !== ''
    })
  }
}

/**
 * Creates a conditional required refinement (if X then Y required)
 */
export function conditionalRequired<T extends Record<string, unknown>>(
  conditionField: keyof T,
  requiredField: keyof T,
  conditionValue: unknown = true,
  message?: string
) {
  return (data: T) => {
    if (data[conditionField] === conditionValue) {
      const value = data[requiredField]
      return value !== undefined && value !== null && value !== ''
    }
    return true
  }
}

// ============================================================================
// CUSTOM VALIDATORS
// ============================================================================

/**
 * Validates a credit card number using Luhn algorithm
 */
export function validateCreditCard(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false

  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i])

    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * Validates a US zip code (5 digits or 5+4 format)
 */
export function validateZipCode(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip)
}

/**
 * Validates a domain name
 */
export function validateDomain(domain: string): boolean {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i
  return domainRegex.test(domain)
}

/**
 * Validates a hex color code
 */
export function validateHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

// ============================================================================
// FIELD TRANSFORMERS
// ============================================================================

/**
 * Transforms a string to lowercase
 */
export const toLowercase = z.string().transform((val) => val.toLowerCase())

/**
 * Transforms a string to uppercase
 */
export const toUppercase = z.string().transform((val) => val.toUpperCase())

/**
 * Trims whitespace from string
 */
export const trimString = z.string().transform((val) => val.trim())

/**
 * Transforms empty string to null
 */
export const emptyStringToNull = z.string().transform((val) => (val === '' ? null : val))

/**
 * Transforms undefined to empty string
 */
export const undefinedToEmptyString = z.string().optional().transform((val) => val ?? '')

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
})

/**
 * Date range schema
 */
export const dateRangeSchema = z
  .object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to)
      }
      return true
    },
    {
      message: 'Start date must be before end date',
      path: ['from'],
    }
  )

/**
 * Search schema
 */
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  filters: z.record(z.unknown()).optional(),
})

/**
 * Sort schema
 */
export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('asc'),
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a schema with optional fields
 */
export function makeOptional<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  const shape = schema.shape
  const optionalShape = Object.keys(shape).reduce((acc, key) => {
    acc[key as keyof T] = shape[key as keyof T].optional()
    return acc
  }, {} as z.ZodRawShape)
  return z.object(optionalShape)
}

/**
 * Creates a partial schema (all fields optional)
 */
export function makePartial<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.partial()
}

/**
 * Omits fields from schema
 */
export function omitFields<T extends z.ZodRawShape, K extends keyof T>(
  schema: z.ZodObject<T>,
  keys: K[]
) {
  return schema.omit(
    keys.reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<K, true>)
  )
}

/**
 * Picks fields from schema
 */
export function pickFields<T extends z.ZodRawShape, K extends keyof T>(
  schema: z.ZodObject<T>,
  keys: K[]
) {
  return schema.pick(
    keys.reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<K, true>)
  )
}

// ============================================================================
// ERROR FORMATTING
// ============================================================================

/**
 * Formats Zod errors for display
 */
export function formatZodError(error: z.ZodError): Record<string, string> {
  return error.errors.reduce((acc, err) => {
    const path = err.path.join('.')
    acc[path] = err.message
    return acc
  }, {} as Record<string, string>)
}

/**
 * Gets first error message from Zod error
 */
export function getFirstErrorMessage(error: z.ZodError): string | null {
  return error.errors[0]?.message ?? null
}
