/* eslint-disable no-console -- this module wraps console.log/error with sanitization; console methods are the intended implementation */
/**
 * Log Sanitization Utility
 * Prevents sensitive data (API keys, tokens, emails) from appearing in application logs
 *
 * Security: All integration clients MUST use this utility before logging
 */

/**
 * Sensitive field patterns to redact
 */
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /token/i,
  /password/i,
  /auth/i,
  /bearer/i,
  /credential/i,
  /signature/i,
  /webhook[_-]?secret/i,
  /stripe[_-]?key/i,
  /client[_-]?secret/i,
]

/**
 * Email regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Redact sensitive string value
 * Shows only last 4 characters for debugging
 */
function redactSensitiveValue(value: string, fieldName: string): string {
  // Check if field name matches sensitive patterns
  const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName))

  if (!isSensitive && !EMAIL_REGEX.test(value)) {
    return value // Not sensitive, return as-is
  }

  // Redact sensitive values
  if (value.length <= 8) {
    return '****' // Too short, fully redact
  }

  // For emails, show first char and domain
  if (EMAIL_REGEX.test(value)) {
    const [localPart, domain] = value.split('@')
    return `${localPart[0]}***@${domain}`
  }

  // For API keys/tokens, show last 4 chars
  const lastFour = value.slice(-4)
  return `****${lastFour}`
}

/**
 * Recursively sanitize an object for logging
 */
export function sanitizeLog(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  // Handle primitives
  if (typeof data !== 'object') {
    return data
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeLog(item))
  }

  // Handle objects
  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      sanitized[key] = value
      continue
    }

    // Recursively sanitize nested objects/arrays
    if (typeof value === 'object') {
      sanitized[key] = sanitizeLog(value)
      continue
    }

    // Sanitize string values
    if (typeof value === 'string') {
      sanitized[key] = redactSensitiveValue(value, key)
      continue
    }

    // Pass through other types (numbers, booleans)
    sanitized[key] = value
  }

  return sanitized
}

/**
 * Sanitize a single argument for safe logging.
 * Objects are recursively sanitized; Error objects preserve stack traces.
 */
function sanitizeArg(arg: any): any {
  if (arg === null || arg === undefined || typeof arg !== 'object') {
    return arg
  }
  // Preserve stack traces on Error-like objects
  const sanitized = sanitizeLog(arg)
  if (arg?.stack) {
    return { ...sanitized, stack: arg.stack }
  }
  return sanitized
}

/**
 * Safe console.log that sanitizes sensitive data
 */
export function safeLog(message: string, ...args: any[]): void {
  if (args.length === 0) {
    console.log(message)
  } else {
    console.log(message, ...args.map(sanitizeArg))
  }
}

/**
 * Safe console.error that sanitizes sensitive data
 */
export function safeError(message: string, ...args: any[]): void {
  if (args.length === 0) {
    console.error(message)
  } else {
    console.error(message, ...args.map(sanitizeArg))
  }
}

/**
 * Safe console.warn that sanitizes sensitive data
 */
export function safeWarn(message: string, ...args: any[]): void {
  if (args.length === 0) {
    console.warn(message)
  } else {
    console.warn(message, ...args.map(sanitizeArg))
  }
}
