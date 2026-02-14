/**
 * Text Sanitization Utility
 *
 * Sanitizes user-generated content to prevent XSS attacks.
 * While React automatically escapes text content in JSX, this provides
 * an additional layer of security and explicitly documents intent.
 */

/**
 * Sanitizes text content by removing/escaping potentially dangerous characters
 * @param text - The text to sanitize
 * @param maxLength - Optional maximum length (default: 500)
 * @returns Sanitized text safe for display
 */
export function sanitizeText(text: string | null | undefined, maxLength: number = 500): string {
  if (!text) return ''

  return (
    text
      // Remove any HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // Trim whitespace
      .trim()
      // Limit length
      .slice(0, maxLength)
  )
}

/**
 * Sanitizes text specifically for display names (stricter rules)
 * @param name - The name to sanitize
 * @returns Sanitized name
 */
export function sanitizeName(name: string | null | undefined): string {
  if (!name) return ''

  return (
    name
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Allow only letters, numbers, spaces, hyphens, apostrophes, and periods
      .replace(/[^a-zA-Z0-9\s\-'.]/g, '')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100)
  )
}

/**
 * Sanitizes company/industry names
 * @param text - The company/industry text to sanitize
 * @returns Sanitized text
 */
export function sanitizeCompanyName(text: string | null | undefined): string {
  if (!text) return ''

  return (
    text
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Allow letters, numbers, spaces, and common business punctuation
      .replace(/[^a-zA-Z0-9\s\-'.&,()]/g, '')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200)
  )
}

/**
 * Sanitizes email addresses (basic validation)
 * @param email - The email to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return ''

  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const sanitized = email.trim().toLowerCase().slice(0, 254)

  return emailRegex.test(sanitized) ? sanitized : ''
}
