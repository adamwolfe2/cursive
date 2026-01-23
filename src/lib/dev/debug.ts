/**
 * Debug Utilities
 * OpenInfo Platform
 *
 * Development debugging helpers and inspection tools.
 */

import { logger } from './logger'

// ============================================
// INSPECT UTILITIES
// ============================================

/**
 * Pretty print an object for debugging
 */
export function inspect(value: unknown, label?: string): void {
  if (process.env.NODE_ENV !== 'development') return

  if (label) {
    console.log(`\n=== ${label} ===`)
  }
  console.dir(value, { depth: null, colors: true })
  if (label) {
    console.log('='.repeat(label.length + 8))
  }
}

/**
 * Log and return a value (useful for debugging in pipelines)
 * @example
 * const result = tap(data, 'API Response')
 */
export function tap<T>(value: T, label?: string): T {
  if (process.env.NODE_ENV === 'development') {
    if (label) {
      console.log(`[TAP] ${label}:`, value)
    } else {
      console.log('[TAP]', value)
    }
  }
  return value
}

/**
 * Debug helper that only runs in development
 */
export function debugOnly(fn: () => void): void {
  if (process.env.NODE_ENV === 'development') {
    fn()
  }
}

// ============================================
// PERFORMANCE DEBUGGING
// ============================================

/**
 * Simple performance marker
 */
export class PerfMarker {
  private marks: Map<string, number> = new Map()

  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark)
    if (!start) {
      logger.warn(`Performance mark "${startMark}" not found`)
      return 0
    }
    const duration = performance.now() - start
    logger.debug(`Performance: ${name}`, { durationMs: duration.toFixed(2) })
    return duration
  }

  reset(): void {
    this.marks.clear()
  }
}

export const perfMarker = new PerfMarker()

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start

  if (process.env.NODE_ENV === 'development') {
    logger.debug(`[PERF] ${name}`, { durationMs: duration.toFixed(2) })
  }

  return { result, duration }
}

/**
 * Measure sync function execution time
 */
export function measureSync<T>(
  name: string,
  fn: () => T
): { result: T; duration: number } {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start

  if (process.env.NODE_ENV === 'development') {
    logger.debug(`[PERF] ${name}`, { durationMs: duration.toFixed(2) })
  }

  return { result, duration }
}

// ============================================
// RENDER DEBUGGING
// ============================================

/**
 * Track component renders in development
 * @example
 * const renderCount = useRenderCount('MyComponent')
 */
export function createRenderCounter(componentName: string) {
  let count = 0

  return {
    count: () => {
      count++
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RENDER] ${componentName}: ${count}`)
      }
      return count
    },
    reset: () => {
      count = 0
    },
    getCount: () => count,
  }
}

/**
 * Log when props change
 */
export function logPropsChanges<T extends Record<string, unknown>>(
  componentName: string,
  prevProps: T,
  nextProps: T
): void {
  if (process.env.NODE_ENV !== 'development') return

  const changes: Record<string, { prev: unknown; next: unknown }> = {}

  const allKeys = Array.from(new Set([...Object.keys(prevProps), ...Object.keys(nextProps)]))
  for (const key of allKeys) {
    if (prevProps[key] !== nextProps[key]) {
      changes[key] = { prev: prevProps[key], next: nextProps[key] }
    }
  }

  if (Object.keys(changes).length > 0) {
    console.log(`[PROPS] ${componentName}:`, changes)
  }
}

// ============================================
// NETWORK DEBUGGING
// ============================================

/**
 * Log fetch requests in development
 */
export function debugFetch(url: string, options?: RequestInit): void {
  if (process.env.NODE_ENV !== 'development') return

  const method = options?.method || 'GET'
  console.log(`[FETCH] ${method} ${url}`)

  if (options?.body) {
    try {
      console.log('[FETCH BODY]', JSON.parse(options.body as string))
    } catch {
      console.log('[FETCH BODY]', options.body)
    }
  }
}

/**
 * Create a fetch wrapper with debugging
 */
export function createDebugFetch() {
  return async (url: string, options?: RequestInit): Promise<Response> => {
    debugFetch(url, options)
    const start = performance.now()

    try {
      const response = await fetch(url, options)
      const duration = performance.now() - start

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[FETCH RESPONSE] ${response.status} ${url} (${duration.toFixed(0)}ms)`
        )
      }

      return response
    } catch (error) {
      console.error(`[FETCH ERROR] ${url}`, error)
      throw error
    }
  }
}

// ============================================
// STATE DEBUGGING
// ============================================

/**
 * Create a debug proxy that logs all property access and mutations
 */
export function createDebugProxy<T extends object>(
  target: T,
  name: string
): T {
  if (process.env.NODE_ENV !== 'development') return target

  return new Proxy(target, {
    get(obj, prop) {
      const value = Reflect.get(obj, prop)
      console.log(`[GET] ${name}.${String(prop)}:`, value)
      return value
    },
    set(obj, prop, value) {
      console.log(`[SET] ${name}.${String(prop)}:`, value)
      return Reflect.set(obj, prop, value)
    },
  })
}

/**
 * Log state changes
 */
export function logStateChange<T>(
  stateName: string,
  prevState: T,
  nextState: T
): void {
  if (process.env.NODE_ENV !== 'development') return

  console.log(`[STATE] ${stateName}:`, {
    prev: prevState,
    next: nextState,
    changed: prevState !== nextState,
  })
}

// ============================================
// ERROR DEBUGGING
// ============================================

/**
 * Enhanced error logging with stack trace
 */
export function debugError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV !== 'development') return

  console.group(`[ERROR] ${context || 'Unknown context'}`)

  if (error instanceof Error) {
    console.error('Message:', error.message)
    console.error('Name:', error.name)
    if (error.stack) {
      console.error('Stack:', error.stack)
    }
    if ('cause' in error && error.cause) {
      console.error('Cause:', error.cause)
    }
  } else {
    console.error('Error:', error)
  }

  console.groupEnd()
}

/**
 * Assert with helpful error message
 */
export function debugAssert(
  condition: boolean,
  message: string,
  context?: Record<string, unknown>
): asserts condition {
  if (!condition) {
    const error = new Error(`Assertion failed: ${message}`)

    if (process.env.NODE_ENV === 'development') {
      console.error('[ASSERT FAILED]', message, context)
      throw error
    }

    logger.error('Assertion failed', error, context)
  }
}

// ============================================
// BREAKPOINT HELPER
// ============================================

/**
 * Development-only debugger breakpoint
 */
export function breakpoint(condition: boolean = true): void {
  if (process.env.NODE_ENV === 'development' && condition) {
    // eslint-disable-next-line no-debugger
    debugger
  }
}

// ============================================
// MEMORY DEBUGGING
// ============================================

/**
 * Log memory usage (Node.js only)
 */
export function logMemoryUsage(label?: string): void {
  if (process.env.NODE_ENV !== 'development') return
  if (typeof process === 'undefined' || !process.memoryUsage) return

  const usage = process.memoryUsage()
  const format = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

  console.log(`[MEMORY] ${label || 'Current'}:`, {
    heapUsed: format(usage.heapUsed),
    heapTotal: format(usage.heapTotal),
    external: format(usage.external),
    rss: format(usage.rss),
  })
}

// ============================================
// DEVELOPMENT FLAGS
// ============================================

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

/**
 * Get current environment
 */
export function getEnvironment(): 'development' | 'production' | 'test' {
  return (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development'
}
