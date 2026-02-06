/**
 * User-friendly error messages for the Cursive platform
 * Centralized error message definitions for consistency
 */

export const ERROR_MESSAGES = {
  // ============================================================================
  // PURCHASE ERRORS
  // ============================================================================
  INSUFFICIENT_CREDITS: {
    message: 'You don\'t have enough credits to complete this purchase.',
    help: 'Please add credits or select fewer leads.',
    action: 'add_credits',
  },
  LEADS_NO_LONGER_AVAILABLE: {
    message: 'Some of the leads you selected are no longer available.',
    help: 'These leads may have been purchased by another user.',
    action: 'refresh_marketplace',
  },
  DUPLICATE_PURCHASE: {
    message: 'You\'ve already purchased some of these leads.',
    help: 'Check your purchase history to see which leads you own.',
    action: 'view_purchase_history',
  },
  PURCHASE_IN_PROGRESS: {
    message: 'Your purchase is already being processed.',
    help: 'Please wait a moment and check your purchase history.',
    action: 'wait',
  },

  // ============================================================================
  // UPLOAD ERRORS
  // ============================================================================
  INVALID_FILE_TYPE: {
    message: 'Please upload a CSV file.',
    help: 'Only CSV (.csv) files are supported. Excel files must be saved as CSV first.',
    action: 'upload_csv',
  },
  FILE_TOO_LARGE: (sizeMB: number) => ({
    message: `Your file is too large (${sizeMB.toFixed(2)} MB).`,
    help: 'The maximum file size is 10 MB. Please split your file into smaller batches.',
    action: 'split_file',
  }),
  TOO_MANY_ROWS: (count: number) => ({
    message: `Your file contains too many rows (${count.toLocaleString()}).`,
    help: 'The maximum is 10,000 rows per upload. Please split your file into multiple uploads.',
    action: 'split_file',
  }),
  INVALID_INDUSTRY: (industry: string, validIndustries?: string[]) => ({
    message: `"${industry}" is not a valid industry.`,
    help: validIndustries
      ? `Valid industries include: ${validIndustries.slice(0, 5).join(', ')}${validIndustries.length > 5 ? ', and more' : ''}`
      : 'Please use one of our supported industries.',
    action: 'see_valid_industries',
  }),
  INVALID_STATE: (state: string) => ({
    message: `"${state}" is not a valid US state code.`,
    help: 'Please use 2-letter state codes (e.g., CA, NY, TX).',
    action: 'fix_state_codes',
  }),
  CSV_PARSING_ERROR: (error: string) => ({
    message: 'Unable to parse your CSV file.',
    help: `Error: ${error}. Make sure your file has proper headers and is properly formatted.`,
    action: 'check_csv_format',
  }),
  PARTNER_NOT_APPROVED: {
    message: 'Your partner account is pending approval.',
    help: 'Please contact support@meetcursive.com for assistance.',
    action: 'contact_support',
  },

  // ============================================================================
  // CAMPAIGN ERRORS
  // ============================================================================
  FEATURE_NOT_AVAILABLE: {
    message: 'This feature requires a paid plan.',
    help: 'Upgrade your account to access email campaigns and advanced features.',
    action: 'upgrade_plan',
  },
  LIMIT_EXCEEDED: (resource: string, limit: number) => ({
    message: `You've reached your limit of ${limit} ${resource}.`,
    help: 'Upgrade your plan to create more.',
    action: 'upgrade_plan',
  }),
  INVALID_CAMPAIGN_DATA: {
    message: 'Some campaign information is missing or invalid.',
    help: 'Please fill in all required fields and try again.',
    action: 'fix_campaign_data',
  },

  // ============================================================================
  // AUTH ERRORS
  // ============================================================================
  NOT_AUTHENTICATED: {
    message: 'Please sign in to continue.',
    help: 'You need to be signed in to access this feature.',
    action: 'sign_in',
  },
  NOT_AUTHORIZED: {
    message: 'You don\'t have permission to access this resource.',
    help: 'Contact your workspace administrator if you believe this is an error.',
    action: 'contact_admin',
  },
  WORKSPACE_NOT_FOUND: {
    message: 'No workspace found for your account.',
    help: 'Please complete your account setup or contact support.',
    action: 'complete_setup',
  },
  PARTNER_ONLY: {
    message: 'This feature is only available to partners.',
    help: 'Sign up as a partner to upload and sell leads.',
    action: 'become_partner',
  },

  // ============================================================================
  // PAYMENT ERRORS
  // ============================================================================
  PAYMENT_FAILED: {
    message: 'Payment processing failed.',
    help: 'Please check your payment method and try again.',
    action: 'retry_payment',
  },
  INVALID_PACKAGE: {
    message: 'The selected credit package is invalid.',
    help: 'Please select a valid package from the available options.',
    action: 'select_package',
  },
  STRIPE_ERROR: (error: string) => ({
    message: 'Payment provider error.',
    help: `${error}. Please try again or contact support if the issue persists.`,
    action: 'retry_or_contact_support',
  }),

  // ============================================================================
  // GENERIC ERRORS
  // ============================================================================
  INTERNAL_ERROR: {
    message: 'Something went wrong on our end.',
    help: 'Our team has been notified. Please try again in a moment.',
    action: 'retry',
  },
  RATE_LIMIT_EXCEEDED: {
    message: 'Too many requests.',
    help: 'Please wait a moment before trying again.',
    action: 'wait',
  },
  VALIDATION_ERROR: (field: string, reason: string) => ({
    message: `Invalid ${field}.`,
    help: reason,
    action: 'fix_input',
  }),
} as const

/**
 * Format an error response with consistent structure
 */
export interface ErrorResponse {
  error: string
  message: string
  help?: string
  action?: string
  details?: unknown
}

export function formatError(
  errorKey: keyof typeof ERROR_MESSAGES,
  ...args: unknown[]
): ErrorResponse {
  const errorDef = ERROR_MESSAGES[errorKey]

  if (typeof errorDef === 'function') {
    // @ts-ignore - Dynamic function call
    const result = errorDef(...args)
    return {
      error: errorKey,
      message: result.message,
      help: result.help,
      action: result.action,
    }
  }

  return {
    error: errorKey,
    message: errorDef.message,
    help: errorDef.help,
    action: errorDef.action,
  }
}

/**
 * Get list of valid industries for user reference
 */
export const VALID_INDUSTRIES = [
  'HVAC',
  'Roofing',
  'Plumbing',
  'Electrical',
  'Solar',
  'Real Estate',
  'Insurance',
  'Landscaping',
  'Pest Control',
  'Cleaning Services',
  'Auto Services',
  'Legal Services',
  'Financial Services',
  'Healthcare',
  'Technology',
  'Manufacturing',
  'Retail',
  'Construction',
  'Education',
  'Hospitality',
  'Transportation',
  'Utilities',
  'Telecommunications',
  'Media & Entertainment',
  'Government',
  'Non-Profit',
  'Professional Services',
  'Consulting',
] as const

/**
 * Get list of valid US states for user reference
 */
export const VALID_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const
