/**
 * Error Handling Utilities
 *
 * Type-safe error extraction for use across the codebase.
 * Replaces `(error as any).message` patterns with proper type guards.
 */

/**
 * Extract a human-readable message from an unknown error value.
 * Works with Error instances, Supabase PostgrestError, plain objects, and strings.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  if (typeof error === 'string') return error
  return 'Unknown error'
}

/**
 * Extract an error code from Supabase PostgrestError or similar error objects.
 * Returns undefined if the error doesn't have a code property.
 */
export function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code: unknown }).code)
  }
  return undefined
}

/**
 * Check if a Supabase error is a "not found" error (PGRST116).
 */
export function isNotFoundError(error: unknown): boolean {
  return getErrorCode(error) === 'PGRST116'
}
