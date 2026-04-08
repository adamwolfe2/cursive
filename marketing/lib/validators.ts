/**
 * Shared validators and constants for marketing API routes
 */

/** Email validation regex */
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Default sender address */
export const FROM_EMAIL = process.env.EMAIL_FROM || 'Cursive <noreply@meetcursive.com>'

/** Support / internal notification address */
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'hey@meetcursive.com'

/**
 * Returns true if the given email string passes basic format validation.
 */
export function validateEmail(email: string): boolean {
  return emailRegex.test(email)
}

/**
 * Escapes HTML special characters to prevent XSS in email templates.
 */
export function escapeHtml(str: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return str.replace(/[&<>"']/g, (char) => map[char])
}
