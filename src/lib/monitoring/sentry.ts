/**
 * Sentry Error Tracking Integration
 * Provides comprehensive error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs'

export interface ErrorContext {
  userId?: string
  workspaceId?: string
  tags?: Record<string, string>
  extra?: Record<string, any>
  user?: {
    id: string
    email?: string
    username?: string
  }
}

/**
 * Initialize Sentry with environment-specific configuration
 */
export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured - error tracking disabled')
    return
  }

  const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development'
  const isProduction = environment === 'production'

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment,

    // Performance monitoring sample rates
    tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in dev

    // Session replay for debugging
    replaysSessionSampleRate: isProduction ? 0.01 : 0.1, // 1% in production, 10% in dev
    replaysOnErrorSampleRate: 1.0, // 100% when errors occur

    // Configure integrations
    integrations: [
      new Sentry.BrowserTracing({
        // Track navigation and API calls
        tracingOrigins: ['localhost', /^\//],
        // Don't track these endpoints
        tracePropagationTargets: [/^\/api\//],
      }),
      new Sentry.Replay({
        // Mask sensitive data
        maskAllText: isProduction,
        blockAllMedia: isProduction,
      }),
    ],

    // Filter out noise before sending to Sentry
    beforeSend(event, hint) {
      // Ignore browser-specific errors that we can't fix
      const ignoredErrors = [
        'ResizeObserver',
        'Non-Error promise rejection',
        'Network request failed',
        'Failed to fetch',
        'Load failed',
        'cancelled',
      ]

      const errorMessage = event.exception?.values?.[0]?.value || ''
      if (ignoredErrors.some(msg => errorMessage.includes(msg))) {
        return null
      }

      // Don't send events from development unless explicitly enabled
      if (!isProduction && !process.env.SENTRY_DEV_ENABLED) {
        console.log('[Sentry] Event blocked (dev mode):', event)
        return null
      }

      return event
    },

    // Add release information
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // Performance tuning
    maxBreadcrumbs: 50,
    debug: !isProduction,
  })
}

/**
 * Capture an error with context
 */
export function captureError(error: Error | string, context?: ErrorContext) {
  const errorObj = typeof error === 'string' ? new Error(error) : error

  Sentry.captureException(errorObj, {
    tags: context?.tags,
    extra: context?.extra,
    user: context?.user,
    contexts: {
      workspace: context?.workspaceId ? { workspace_id: context.workspaceId } : undefined,
    },
  })
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
  Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
    user: context?.user,
  })
}

/**
 * Set user context for all subsequent events
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username || user.email,
    })
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Set workspace context
 */
export function setWorkspace(workspaceId: string | null) {
  if (workspaceId) {
    Sentry.setContext('workspace', {
      workspace_id: workspaceId,
    })
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, operation: string) {
  return Sentry.startTransaction({
    name,
    op: operation,
  })
}

/**
 * Wrap async function with error tracking
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    captureError(error as Error, context)
    throw error
  }
}

/**
 * Check if Sentry is initialized
 */
export function isSentryEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_SENTRY_DSN
}
