/**
 * Performance Monitoring
 * Track API performance, database queries, and slow operations
 */

import { captureMessage } from './sentry'
import { metrics } from './metrics'
import { logger } from './logger'

interface PerformanceMetadata {
  workspace_id?: string
  user_id?: string
  success?: boolean
  error?: string
  [key: string]: any
}

class PerformanceMonitor {
  private timers = new Map<string, { startTime: number; metadata?: PerformanceMetadata }>()

  /**
   * Start timing an operation
   */
  start(operationName: string, metadata?: PerformanceMetadata): string {
    const id = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.timers.set(id, {
      startTime: Date.now(),
      metadata,
    })
    return id
  }

  /**
   * End timing an operation
   */
  end(id: string, metadata?: PerformanceMetadata): number {
    const timer = this.timers.get(id)
    if (!timer) {
      logger.warn('Performance timer not found', { timer_id: id })
      return 0
    }

    const duration = Date.now() - timer.startTime
    this.timers.delete(id)

    const operationName = id.split('-')[0]
    const combinedMetadata = { ...timer.metadata, ...metadata }

    // Track metric
    this.trackMetric({
      operation: operationName,
      duration,
      ...combinedMetadata,
    })

    // Alert on slow operations
    if (duration > this.getSlowThreshold(operationName)) {
      this.alertSlowOperation(operationName, duration, combinedMetadata)
    }

    return duration
  }

  /**
   * Measure an async operation
   */
  async measure<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: PerformanceMetadata
  ): Promise<T> {
    const id = this.start(operationName, metadata)
    try {
      const result = await fn()
      this.end(id, { ...metadata, success: true })
      return result
    } catch (error) {
      this.end(id, {
        ...metadata,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Measure a sync operation
   */
  measureSync<T>(operationName: string, fn: () => T, metadata?: PerformanceMetadata): T {
    const id = this.start(operationName, metadata)
    try {
      const result = fn()
      this.end(id, { ...metadata, success: true })
      return result
    } catch (error) {
      this.end(id, {
        ...metadata,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Track metric to monitoring service
   */
  private trackMetric(data: {
    operation: string
    duration: number
    [key: string]: any
  }) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Performance: ${data.operation} took ${data.duration}ms`, data)
    }

    // Track in metrics system
    metrics.timing(`operation.${data.operation}`, data.duration, {
      success: String(data.success ?? true),
      workspace_id: data.workspace_id,
      user_id: data.user_id,
    })

    // Log to structured logger
    logger.info(`Operation completed: ${data.operation}`, {
      duration: data.duration,
      ...data,
    })
  }

  /**
   * Alert on slow operation
   */
  private alertSlowOperation(
    operation: string,
    duration: number,
    metadata?: PerformanceMetadata
  ) {
    const threshold = this.getSlowThreshold(operation)

    logger.warn(`Slow operation detected: ${operation}`, {
      operation,
      duration,
      threshold,
      ...metadata,
    })

    // Send to Sentry for visibility
    captureMessage(
      `Slow operation: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
      'warning',
      {
        tags: {
          operation,
          performance: 'slow',
        },
        extra: {
          duration,
          threshold,
          ...metadata,
        },
      }
    )

    // Track slow operation metric
    metrics.increment('operation.slow', 1, {
      operation,
      threshold: String(threshold),
    })
  }

  /**
   * Get slow operation threshold by operation type
   */
  private getSlowThreshold(operation: string): number {
    const thresholds: Record<string, number> = {
      // API routes
      'api-leads-list': 3000,
      'api-leads-search': 5000,
      'api-purchase-leads': 10000,
      'api-marketplace-search': 3000,

      // Database operations
      'db-query': 1000,
      'db-transaction': 5000,
      'db-bulk-insert': 10000,

      // External API calls
      'external-api': 5000,
      'webhook-delivery': 30000,

      // Email operations
      'email-send': 5000,
      'email-batch': 30000,

      // Background jobs
      'job-process-purchase': 30000,
      'job-send-emails': 60000,
      'job-calculate-payouts': 120000,
    }

    return thresholds[operation] || 5000 // Default 5s threshold
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      activeTimers: this.timers.size,
      timers: Array.from(this.timers.entries()).map(([id, timer]) => ({
        id,
        operation: id.split('-')[0],
        elapsed: Date.now() - timer.startTime,
        metadata: timer.metadata,
      })),
    }
  }

  /**
   * Clear all timers (useful for testing)
   */
  clear() {
    this.timers.clear()
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Export convenience functions
export const measure = performanceMonitor.measure.bind(performanceMonitor)
export const measureSync = performanceMonitor.measureSync.bind(performanceMonitor)
export const startTimer = performanceMonitor.start.bind(performanceMonitor)
export const endTimer = performanceMonitor.end.bind(performanceMonitor)
