/**
 * Global Error Handler
 *
 * Handles unhandled promise rejections and runtime errors
 */

// Error logging service (replace with actual service like Sentry)
function logErrorToService(error: Error, context?: any) {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('[Global Error Handler]:', error, context)
  }

  // In production, send to error tracking service
  // Sentry integration is available via src/lib/monitoring/sentry.ts
  // Uncomment and import if needed for this global handler:
  // import { captureError } from '@/lib/monitoring/sentry'
  // captureError(error, context)
}

// Handle unhandled promise rejections
export function initGlobalErrorHandler() {
  if (typeof window === 'undefined') return

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault()

    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason))

    logErrorToService(error, {
      type: 'unhandledRejection',
      promise: event.promise,
    })
  })

  // Handle runtime errors
  window.addEventListener('error', (event) => {
    event.preventDefault()

    logErrorToService(event.error || new Error(event.message), {
      type: 'runtimeError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  // Log that handler is initialized
  if (process.env.NODE_ENV === 'development') {
    console.log('[Global Error Handler] Initialized')
  }
}

// Network error detector
export function isNetworkError(error: Error): boolean {
  return (
    error.message.includes('fetch') ||
    error.message.includes('Network') ||
    error.message.includes('timeout') ||
    error.message.includes('ERR_CONNECTION') ||
    error.message.includes('ERR_INTERNET_DISCONNECTED')
  )
}

// Server error detector
export function isServerError(error: Error): boolean {
  return (
    error.message.includes('500') ||
    error.message.includes('502') ||
    error.message.includes('503') ||
    error.message.includes('504')
  )
}

// Get user-friendly error message
export function getUserFriendlyErrorMessage(error: Error): string {
  if (isNetworkError(error)) {
    return 'Network connection issue. Please check your internet connection and try again.'
  }

  if (isServerError(error)) {
    return 'Our servers are temporarily unavailable. Please try again in a few moments.'
  }

  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    return 'Your session has expired. Please sign in again.'
  }

  if (error.message.includes('403') || error.message.includes('Forbidden')) {
    return "You don't have permission to perform this action."
  }

  if (error.message.includes('404') || error.message.includes('not found')) {
    return 'The requested resource was not found.'
  }

  // Default message
  return error.message || 'An unexpected error occurred. Please try again.'
}
