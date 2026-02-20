/**
 * Global Error Handler
 *
 * Handles unhandled promise rejections and runtime errors
 */

import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

// Error logging service (replace with actual service like Sentry)
function logErrorToService(error: Error, context?: any) {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    safeError('[Global Error Handler]:', error, context)
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
    safeLog('[Global Error Handler] Initialized')
  }
}

