/**
 * Timeouts and Limits Configuration
 * Centralized constants for timeouts, expiry periods, and rate limits
 */

export const TIMEOUTS = {
  // Download expiry
  DOWNLOAD_EXPIRY_DAYS: 90,

  // Session expiry
  SESSION_EXPIRY_HOURS: 24,

  // Token expiry
  VERIFICATION_TOKEN_EXPIRY_HOURS: 48,
  RESET_TOKEN_EXPIRY_HOURS: 1,

  // Rate limits (window in milliseconds)
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute

  // Retries
  EMAIL_RETRY_ATTEMPTS: 3,
  WEBHOOK_RETRY_ATTEMPTS: 5,
  JOB_RETRY_ATTEMPTS: 3,

  // Delays (exponential backoff)
  RETRY_DELAY_BASE_MS: 1000,
  RETRY_DELAY_MAX_MS: 30000,

  // Commission
  COMMISSION_HOLDBACK_DAYS: 14,
} as const

export const RATE_LIMITS = {
  // Purchase endpoints
  MARKETPLACE_PURCHASE: 10, // per minute
  CREDIT_PURCHASE: 5, // per minute

  // API endpoints
  API_READ: 100, // per minute
  API_WRITE: 30, // per minute

  // Communication
  EMAIL_SEND: 50, // per minute

  // Partner upload
  PARTNER_UPLOAD: 5, // per minute
} as const

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_MB: 10,
  MAX_CSV_ROWS: 10000,
} as const

export const PRICES = {
  LEAD_DEFAULT: 0.05,
  MIN_MARKETPLACE_PRICE: 0.05,
} as const

/**
 * Helper function to calculate expiry date from days
 */
export function getDaysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

/**
 * Helper function to calculate expiry date from hours
 */
export function getHoursFromNow(hours: number): Date {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date
}

/**
 * Helper function to calculate retry delay with exponential backoff
 */
export function getRetryDelay(attemptNumber: number): number {
  const delay = TIMEOUTS.RETRY_DELAY_BASE_MS * Math.pow(2, attemptNumber - 1)
  return Math.min(delay, TIMEOUTS.RETRY_DELAY_MAX_MS)
}
