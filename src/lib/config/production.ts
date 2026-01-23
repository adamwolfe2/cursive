/**
 * Production Optimization Utilities
 * OpenInfo Platform
 *
 * Helpers for production deployment and optimization.
 */

// ============================================
// CACHING
// ============================================

/**
 * Cache control header presets for different resource types
 */
export const CACHE_HEADERS = {
  /** No caching - for dynamic content */
  none: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  },

  /** Short cache - for frequently changing content (1 hour) */
  short: {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=60',
  },

  /** Medium cache - for semi-static content (1 day) */
  medium: {
    'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
  },

  /** Long cache - for static assets (1 year) */
  long: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },

  /** Private cache - for user-specific content */
  private: {
    'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
  },
} as const

/**
 * Get cache headers for a specific content type
 */
export function getCacheHeaders(
  type: keyof typeof CACHE_HEADERS
): Record<string, string> {
  return CACHE_HEADERS[type]
}

// ============================================
// SECURITY HEADERS
// ============================================

/**
 * Production security headers
 */
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const

/**
 * Content Security Policy directives
 */
export function getCSPDirectives(nonce?: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' ${nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"} 'unsafe-eval' https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]

  return directives.join('; ')
}

/**
 * Get all security headers including CSP
 */
export function getAllSecurityHeaders(nonce?: string): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    'Content-Security-Policy': getCSPDirectives(nonce),
  }
}

// ============================================
// ERROR TRACKING
// ============================================

export interface ErrorReport {
  message: string
  stack?: string
  url?: string
  userAgent?: string
  timestamp: string
  userId?: string
  sessionId?: string
  context?: Record<string, unknown>
}

/**
 * Format error for reporting
 */
export function formatErrorReport(
  error: Error,
  context?: Record<string, unknown>
): ErrorReport {
  return {
    message: error.message,
    stack: error.stack,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString(),
    context,
  }
}

/**
 * Report error to monitoring service
 * Placeholder - integrate with your error tracking service
 */
export async function reportError(
  error: Error,
  context?: Record<string, unknown>
): Promise<void> {
  const report = formatErrorReport(error, context)

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to your error tracking endpoint
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   body: JSON.stringify(report),
    // })
    console.error('[ERROR REPORT]', report)
  } else {
    console.error('[DEV ERROR]', error, context)
  }
}

// ============================================
// FEATURE FLAGS
// ============================================

type FeatureFlag = string

const defaultFeatures: Record<FeatureFlag, boolean> = {
  'new-dashboard': false,
  'ai-insights': false,
  'export-pdf': true,
  'realtime-updates': true,
  'beta-features': false,
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  // Check environment variable first
  const envVar = process.env[`FEATURE_${feature.toUpperCase().replace(/-/g, '_')}`]
  if (envVar !== undefined) {
    return envVar === 'true' || envVar === '1'
  }

  // Fall back to defaults
  return defaultFeatures[feature] ?? false
}

/**
 * Get all feature flags
 */
export function getFeatureFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {}

  for (const [key, defaultValue] of Object.entries(defaultFeatures)) {
    flags[key] = isFeatureEnabled(key)
  }

  return flags
}

// ============================================
// RATE LIMITING
// ============================================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Simple in-memory rate limiter
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || record.resetAt <= now) {
    // New window
    const resetAt = now + windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }

  record.count++
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt }
}

/**
 * Clear rate limit for a key
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

type ShutdownHandler = () => Promise<void> | void

const shutdownHandlers: ShutdownHandler[] = []

/**
 * Register a shutdown handler
 */
export function onShutdown(handler: ShutdownHandler): void {
  shutdownHandlers.push(handler)
}

/**
 * Execute all shutdown handlers
 */
export async function gracefulShutdown(): Promise<void> {
  console.log('[SHUTDOWN] Starting graceful shutdown...')

  for (const handler of shutdownHandlers) {
    try {
      await handler()
    } catch (error) {
      console.error('[SHUTDOWN] Handler error:', error)
    }
  }

  console.log('[SHUTDOWN] Graceful shutdown complete')
}

// Setup process signal handlers (Node.js only)
if (typeof process !== 'undefined' && process.on) {
  let isShuttingDown = false

  const handleSignal = async (signal: string) => {
    if (isShuttingDown) return
    isShuttingDown = true

    console.log(`[SHUTDOWN] Received ${signal}`)
    await gracefulShutdown()
    process.exit(0)
  }

  process.on('SIGTERM', () => handleSignal('SIGTERM'))
  process.on('SIGINT', () => handleSignal('SIGINT'))
}

// ============================================
// BUILD INFO
// ============================================

/**
 * Get build information
 */
export function getBuildInfo(): {
  version: string
  buildTime: string
  commitSha: string
  environment: string
} {
  return {
    version: process.env.npm_package_version || '1.0.0',
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
    commitSha: process.env.COMMIT_SHA || 'development',
    environment: process.env.NODE_ENV || 'development',
  }
}
