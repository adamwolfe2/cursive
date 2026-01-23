// Performance Monitoring
// Track operation timings and identify bottlenecks

import { logPerformance } from './logger'

export interface PerformanceMarker {
  name: string
  startTime: number
}

export class PerformanceMonitor {
  private markers: Map<string, PerformanceMarker> = new Map()
  private operation: string

  constructor(operation: string) {
    this.operation = operation
  }

  /**
   * Start timing a marker
   */
  mark(name: string) {
    this.markers.set(name, {
      name,
      startTime: Date.now(),
    })
  }

  /**
   * End timing a marker and log it
   */
  measure(name: string, metadata?: Record<string, any>) {
    const marker = this.markers.get(name)
    if (!marker) {
      console.warn(`No marker found for ${name}`)
      return 0
    }

    const duration = Date.now() - marker.startTime
    this.markers.delete(name)

    logPerformance({
      operation: `${this.operation}.${name}`,
      duration,
      success: true,
      metadata,
    })

    return duration
  }

  /**
   * Get all markers
   */
  getMarkers() {
    return Array.from(this.markers.values())
  }

  /**
   * Clear all markers
   */
  clear() {
    this.markers.clear()
  }
}

/**
 * Measure execution time of a function
 */
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now()
  let success = true
  let result: T

  try {
    result = await fn()
    return result
  } catch (error) {
    success = false
    throw error
  } finally {
    const duration = Date.now() - startTime
    logPerformance({
      operation,
      duration,
      success,
      metadata,
    })
  }
}

/**
 * Measure execution time of a synchronous function
 */
export function measureSync<T>(
  operation: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const startTime = Date.now()
  let success = true
  let result: T

  try {
    result = fn()
    return result
  } catch (error) {
    success = false
    throw error
  } finally {
    const duration = Date.now() - startTime
    logPerformance({
      operation,
      duration,
      success,
      metadata,
    })
  }
}

/**
 * Decorator for measuring method execution time
 */
export function Measure(operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const methodName = operation || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      return measureAsync(methodName, () => originalMethod.apply(this, args))
    }

    return descriptor
  }
}

/**
 * Create a performance budget checker
 */
export function createBudgetChecker(budgets: Record<string, number>) {
  return {
    check(operation: string, duration: number): boolean {
      const budget = budgets[operation]
      if (budget === undefined) {
        return true
      }

      const withinBudget = duration <= budget
      if (!withinBudget) {
        logPerformance({
          operation,
          duration,
          success: false,
          metadata: {
            budget,
            overage: duration - budget,
            percentOver: ((duration - budget) / budget) * 100,
          },
        })
      }

      return withinBudget
    },
  }
}

/**
 * Performance budgets (in milliseconds)
 */
export const PERFORMANCE_BUDGETS = {
  'api.query': 1000,           // Query list endpoint
  'api.leads': 2000,            // Leads list endpoint
  'api.people-search': 3000,    // People search
  'api.export': 5000,           // Export generation
  'db.select': 500,             // Database reads
  'db.insert': 200,             // Database inserts
  'db.update': 200,             // Database updates
  'external.datashopper': 5000, // DataShopper API
  'external.clay': 3000,        // Clay API
  'external.stripe': 2000,      // Stripe API
}

/**
 * Check if operation is within performance budget
 */
export const budgetChecker = createBudgetChecker(PERFORMANCE_BUDGETS)
