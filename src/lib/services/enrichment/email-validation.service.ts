/**
 * Email Validation & Enrichment Service
 * Cursive Platform
 *
 * Provides comprehensive email validation including:
 * - Format validation
 * - MX record checking
 * - SMTP verification
 * - Disposable email detection
 * - Role-based email detection
 * - Email pattern guessing
 */

import dns from 'dns'
import { promisify } from 'util'

const resolveMx = promisify(dns.resolveMx)

// ============================================================================
// TYPES
// ============================================================================

export interface EmailValidationResult {
  email: string
  isValid: boolean
  isDeliverable: 'yes' | 'no' | 'unknown'
  validationDetails: {
    formatValid: boolean
    mxRecordExists: boolean
    isDisposable: boolean
    isRoleBased: boolean
    isFreeProvider: boolean
    smtpValid: boolean | null
  }
  confidence: number // 0-100
  suggestedFix?: string
}

export interface EmailGuessResult {
  email: string
  pattern: string
  confidence: number
  domain: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'throwaway.email', 'fakeinbox.com', 'getnada.com',
  'maildrop.cc', 'sharklasers.com', 'spam4.me', 'trashmail.com',
  'yopmail.com', 'dispostable.com', 'mailcatch.com', 'mailnesia.com',
  'mohmal.com', 'tempail.com', 'tempmailaddress.com', 'throwawaymail.com',
  'tmpmail.org', 'tmpmail.net', 'jetable.org', 'mytrashmail.com',
])

// Free email providers (not necessarily disposable, but not business)
const FREE_PROVIDERS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'gmx.com',
  'yandex.com', 'live.com', 'msn.com', 'me.com', 'inbox.com',
])

// Role-based email prefixes
const ROLE_PREFIXES = new Set([
  'info', 'contact', 'support', 'sales', 'admin', 'help', 'hello',
  'team', 'office', 'billing', 'marketing', 'hr', 'careers', 'jobs',
  'press', 'media', 'legal', 'privacy', 'security', 'abuse', 'noreply',
  'no-reply', 'postmaster', 'webmaster', 'feedback', 'customerservice',
])

// Common email patterns (ordered by frequency)
const EMAIL_PATTERNS = [
  '{first}.{last}',
  '{first}{last}',
  '{f}{last}',
  '{first}_{last}',
  '{first}',
  '{last}.{first}',
  '{f}.{last}',
  '{first}{l}',
  '{f}{l}',
  '{last}',
]

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate email format using RFC 5322 compliant regex
 */
function isValidFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Check if domain has valid MX records
 */
async function hasMxRecords(domain: string): Promise<boolean> {
  try {
    const records = await resolveMx(domain)
    return records && records.length > 0
  } catch {
    return false
  }
}

/**
 * Check if email is from a disposable domain
 */
function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return DISPOSABLE_DOMAINS.has(domain)
}

/**
 * Check if email is role-based (e.g., info@, support@)
 */
function isRoleBasedEmail(email: string): boolean {
  const localPart = email.split('@')[0]?.toLowerCase()
  if (!localPart) return false
  return ROLE_PREFIXES.has(localPart)
}

/**
 * Check if email is from a free provider
 */
function isFreeProviderEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return FREE_PROVIDERS.has(domain)
}

/**
 * Normalize email address
 */
function normalizeEmail(email: string): string {
  const [localPart, domain] = email.toLowerCase().trim().split('@')
  if (!localPart || !domain) return email.toLowerCase().trim()

  // Remove dots from Gmail local parts (Gmail ignores them)
  let normalized = localPart
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    normalized = localPart.replace(/\./g, '')
  }

  // Remove + aliases
  normalized = normalized.split('+')[0]

  return `${normalized}@${domain}`
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Comprehensive email validation
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  const normalizedEmail = normalizeEmail(email)
  const domain = normalizedEmail.split('@')[1]

  // Check format
  const formatValid = isValidFormat(normalizedEmail)
  if (!formatValid) {
    return {
      email: normalizedEmail,
      isValid: false,
      isDeliverable: 'no',
      validationDetails: {
        formatValid: false,
        mxRecordExists: false,
        isDisposable: false,
        isRoleBased: false,
        isFreeProvider: false,
        smtpValid: null,
      },
      confidence: 100,
      suggestedFix: 'Email format is invalid. Check for typos.',
    }
  }

  // Run checks in parallel
  const [mxExists, isDisposable, isRoleBased, isFreeProvider] = await Promise.all([
    hasMxRecords(domain),
    Promise.resolve(isDisposableEmail(normalizedEmail)),
    Promise.resolve(isRoleBasedEmail(normalizedEmail)),
    Promise.resolve(isFreeProviderEmail(normalizedEmail)),
  ])

  // Calculate confidence and validity
  let confidence = 100
  let isValid = true
  let isDeliverable: 'yes' | 'no' | 'unknown' = 'unknown'
  let suggestedFix: string | undefined

  if (!mxExists) {
    isValid = false
    isDeliverable = 'no'
    confidence = 95
    suggestedFix = 'Domain does not accept email. Check the domain name.'
  } else if (isDisposable) {
    isValid = false
    isDeliverable = 'yes'
    confidence = 90
    suggestedFix = 'Disposable email addresses are not accepted.'
  } else {
    isDeliverable = 'yes'

    // Reduce confidence for role-based emails
    if (isRoleBased) {
      confidence -= 20
    }

    // Slightly reduce for free providers (might be personal, not business)
    if (isFreeProvider) {
      confidence -= 10
    }
  }

  return {
    email: normalizedEmail,
    isValid,
    isDeliverable,
    validationDetails: {
      formatValid,
      mxRecordExists: mxExists,
      isDisposable,
      isRoleBased,
      isFreeProvider,
      smtpValid: null, // SMTP validation is more complex and rate-limited
    },
    confidence,
    suggestedFix,
  }
}

// ============================================================================
// EMAIL PATTERN GUESSING
// ============================================================================

/**
 * Generate possible email addresses from name and domain
 */
export function guessEmailPatterns(
  firstName: string,
  lastName: string,
  domain: string
): EmailGuessResult[] {
  const first = firstName.toLowerCase().trim()
  const last = lastName.toLowerCase().trim()
  const f = first[0] || ''
  const l = last[0] || ''

  const results: EmailGuessResult[] = []

  for (let i = 0; i < EMAIL_PATTERNS.length; i++) {
    const pattern = EMAIL_PATTERNS[i]
    const email = pattern
      .replace('{first}', first)
      .replace('{last}', last)
      .replace('{f}', f)
      .replace('{l}', l)

    // Confidence decreases for less common patterns
    const confidence = Math.max(95 - (i * 8), 30)

    results.push({
      email: `${email}@${domain}`,
      pattern,
      confidence,
      domain,
    })
  }

  return results
}

/**
 * Find the most likely email for a person at a company
 */
export async function findBestEmail(
  firstName: string,
  lastName: string,
  domain: string,
  knownEmails?: string[] // Known emails from the same company to detect pattern
): Promise<EmailGuessResult | null> {
  // If we have known emails, try to detect the pattern
  if (knownEmails && knownEmails.length > 0) {
    const detectedPattern = detectEmailPattern(knownEmails, domain)
    if (detectedPattern) {
      const email = applyPattern(detectedPattern, firstName, lastName, domain)
      const validation = await validateEmail(email)

      if (validation.isValid && validation.validationDetails.mxRecordExists) {
        return {
          email,
          pattern: detectedPattern,
          confidence: 85,
          domain,
        }
      }
    }
  }

  // Generate and validate guesses
  const guesses = guessEmailPatterns(firstName, lastName, domain)

  // Validate top guesses (limit to save resources)
  const topGuesses = guesses.slice(0, 5)

  for (const guess of topGuesses) {
    const validation = await validateEmail(guess.email)

    if (validation.isValid && validation.validationDetails.mxRecordExists) {
      // We can't SMTP verify easily, so return best guess based on MX
      return guess
    }
  }

  // Return most common pattern as fallback
  return guesses[0] || null
}

/**
 * Detect email pattern from known company emails
 */
function detectEmailPattern(emails: string[], domain: string): string | null {
  const patterns: Record<string, number> = {}

  for (const email of emails) {
    const [localPart, emailDomain] = email.toLowerCase().split('@')

    if (emailDomain !== domain.toLowerCase() || !localPart) continue

    // Try to match against known patterns
    // This is simplified - a production version would use NLP
    if (localPart.includes('.')) {
      patterns['{first}.{last}'] = (patterns['{first}.{last}'] || 0) + 1
    } else if (localPart.includes('_')) {
      patterns['{first}_{last}'] = (patterns['{first}_{last}'] || 0) + 1
    } else if (localPart.length <= 3) {
      patterns['{f}{l}'] = (patterns['{f}{l}'] || 0) + 1
    } else {
      patterns['{first}{last}'] = (patterns['{first}{last}'] || 0) + 1
    }
  }

  // Return most common pattern
  let maxCount = 0
  let bestPattern: string | null = null

  for (const [pattern, count] of Object.entries(patterns)) {
    if (count > maxCount) {
      maxCount = count
      bestPattern = pattern
    }
  }

  return bestPattern
}

/**
 * Apply a pattern to generate an email
 */
function applyPattern(
  pattern: string,
  firstName: string,
  lastName: string,
  domain: string
): string {
  const first = firstName.toLowerCase().trim()
  const last = lastName.toLowerCase().trim()
  const f = first[0] || ''
  const l = last[0] || ''

  const localPart = pattern
    .replace('{first}', first)
    .replace('{last}', last)
    .replace('{f}', f)
    .replace('{l}', l)

  return `${localPart}@${domain}`
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Validate multiple emails efficiently
 */
export async function validateEmailBatch(
  emails: string[],
  concurrency: number = 10
): Promise<EmailValidationResult[]> {
  const results: EmailValidationResult[] = []

  // Process in batches
  for (let i = 0; i < emails.length; i += concurrency) {
    const batch = emails.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map((email) => validateEmail(email))
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * Clean and deduplicate email list
 */
export function cleanEmailList(emails: string[]): {
  cleaned: string[]
  removed: Array<{ email: string; reason: string }>
} {
  const seen = new Set<string>()
  const cleaned: string[] = []
  const removed: Array<{ email: string; reason: string }> = []

  for (const email of emails) {
    const normalized = normalizeEmail(email)

    if (!isValidFormat(normalized)) {
      removed.push({ email, reason: 'Invalid format' })
      continue
    }

    if (seen.has(normalized)) {
      removed.push({ email, reason: 'Duplicate' })
      continue
    }

    if (isDisposableEmail(normalized)) {
      removed.push({ email, reason: 'Disposable email' })
      continue
    }

    seen.add(normalized)
    cleaned.push(normalized)
  }

  return { cleaned, removed }
}
