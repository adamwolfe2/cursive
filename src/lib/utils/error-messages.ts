// Centralized Error Message Mapping
// Provides user-friendly error messages for common errors
// Prevents exposing internal Supabase/API error details to users

export const ERROR_MESSAGES = {
  // ============================================
  // AUTH ERRORS
  // ============================================
  user_already_exists: 'This email is already registered. Try signing in instead.',
  email_already_registered: 'This email is already registered. Try signing in instead.',
  weak_password: 'Password must be at least 8 characters with uppercase, lowercase, and number.',
  invalid_credentials: 'Email or password is incorrect.',
  invalid_login_credentials: 'Email or password is incorrect.',
  email_not_confirmed: 'Please check your email and confirm your account.',
  user_not_found: 'No account found with this email address.',
  invalid_email: 'Please enter a valid email address.',
  email_not_verified: 'Please verify your email address before signing in.',
  session_expired: 'Your session has expired. Please sign in again.',
  unauthorized: 'You must be signed in to access this page.',

  // ============================================
  // MARKETPLACE ERRORS
  // ============================================
  insufficient_credits: "You don't have enough credits. Purchase more or use a credit card.",
  leads_no_longer_available: 'Some leads were purchased by another user. Try different leads.',
  leads_already_purchased: "You've already purchased these leads.",
  lead_not_found: 'This lead could not be found or has been removed.',
  marketplace_disabled: 'The marketplace is temporarily unavailable. Please try again later.',
  purchase_failed: 'Purchase failed. Your payment method was not charged. Please try again.',
  invalid_purchase: 'This purchase request is invalid. Please refresh and try again.',

  // ============================================
  // PAYMENT ERRORS
  // ============================================
  payment_failed: 'Payment failed. Please check your payment method and try again.',
  card_declined: 'Your card was declined. Please use a different payment method.',
  insufficient_funds: 'Your card has insufficient funds. Please use a different card.',
  invalid_card: 'Invalid card information. Please check your details and try again.',
  payment_processing_error: 'Payment processing failed. Please try again or contact support.',
  stripe_error: 'Payment service error. Please try again in a few moments.',

  // ============================================
  // LEAD MANAGEMENT ERRORS
  // ============================================
  lead_upload_failed: 'Failed to upload leads. Please check your file format and try again.',
  invalid_csv_format: 'Invalid CSV format. Please use the template provided.',
  csv_too_large: 'File is too large. Maximum 10,000 leads per upload.',
  duplicate_leads: 'Some leads already exist in your database.',
  lead_verification_failed: 'Email verification failed. These leads may have invalid emails.',
  lead_enrichment_failed: 'Lead enrichment failed. You can retry enrichment later.',

  // ============================================
  // CAMPAIGN ERRORS
  // ============================================
  campaign_not_found: 'Campaign not found or has been deleted.',
  campaign_send_failed: 'Failed to send campaign emails. Please try again.',
  invalid_campaign_data: 'Campaign data is invalid. Please check all required fields.',
  email_quota_exceeded: 'Daily email sending limit reached. Upgrade your plan for more sends.',
  no_leads_in_campaign: 'This campaign has no leads. Please add leads before sending.',

  // ============================================
  // WORKSPACE ERRORS
  // ============================================
  workspace_not_found: 'Workspace not found. You may not have access.',
  workspace_limit_reached: 'Workspace limit reached. Please upgrade your plan.',
  permission_denied: "You don't have permission to perform this action.",
  forbidden: "You don't have permission to access this resource.",

  // ============================================
  // NETWORK ERRORS
  // ============================================
  network_error: 'Connection lost. Check your internet and try again.',
  timeout: 'Request timed out. Please try again.',
  server_error: 'Server error. Our team has been notified. Please try again later.',
  service_unavailable: 'Service temporarily unavailable. Please try again in a few minutes.',

  // ============================================
  // VALIDATION ERRORS
  // ============================================
  required_field: 'This field is required.',
  invalid_email_format: 'Please enter a valid email address.',
  invalid_phone: 'Please enter a valid phone number.',
  invalid_url: 'Please enter a valid URL.',
  field_too_short: 'This field is too short.',
  field_too_long: 'This field is too long.',

  // ============================================
  // RATE LIMIT ERRORS
  // ============================================
  rate_limit_exceeded: 'Too many requests. Please wait a moment and try again.',
  too_many_attempts: 'Too many attempts. Please wait before trying again.',

  // ============================================
  // GENERIC FALLBACK
  // ============================================
  generic_error: 'Something went wrong. Please try again or contact support.',
  unknown_error: 'An unexpected error occurred. Please try again.',
} as const

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES

/**
 * Get a user-friendly error message from an error object
 * Maps known error patterns to friendly messages
 * Never exposes internal error details to users
 */
export function getErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (!error) {
    return ERROR_MESSAGES.unknown_error
  }

  // Handle Error objects
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    // Check for exact matches first
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (errorMessage.includes(key.toLowerCase())) {
        return message
      }
    }

    // Check for common patterns
    if (errorMessage.includes('fetch')) {
      return ERROR_MESSAGES.network_error
    }

    if (errorMessage.includes('timeout')) {
      return ERROR_MESSAGES.timeout
    }

    if (errorMessage.includes('network')) {
      return ERROR_MESSAGES.network_error
    }

    if (errorMessage.includes('unauthorized') || errorMessage.includes('403')) {
      return ERROR_MESSAGES.unauthorized
    }

    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return 'Resource not found.'
    }

    if (errorMessage.includes('rate limit')) {
      return ERROR_MESSAGES.rate_limit_exceeded
    }

    // Don't expose internal error messages
    return ERROR_MESSAGES.generic_error
  }

  // Handle string errors
  if (typeof error === 'string') {
    const lowerError = error.toLowerCase()

    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (lowerError.includes(key.toLowerCase())) {
        return message
      }
    }

    return ERROR_MESSAGES.generic_error
  }

  // Handle error objects with message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return getErrorMessage((error as { message: string }).message)
  }

  // Fallback
  return ERROR_MESSAGES.generic_error
}

/**
 * Get error message by key
 * Type-safe way to get specific error messages
 */
export function getErrorMessageByKey(key: ErrorMessageKey): string {
  return ERROR_MESSAGES[key]
}

/**
 * Check if an error is a specific type
 */
export function isErrorType(error: unknown, type: ErrorMessageKey): boolean {
  if (!error) return false

  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return errorMessage.includes(type.toLowerCase())
}
