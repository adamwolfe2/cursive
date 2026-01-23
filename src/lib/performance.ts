/**
 * Performance Monitoring Utilities
 * OpenInfo Platform
 *
 * Tools for monitoring and optimizing application performance.
 */

// ============================================
// PERFORMANCE METRICS
// ============================================

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

type MetricsCallback = (metrics: PerformanceMetric[]) => void

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private callbacks: MetricsCallback[] = []

  /**
   * Record a custom metric
   */
  record(name: string, value: number, unit = 'ms'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    }
    this.metrics.push(metric)
    this.notifyCallbacks([metric])
  }

  /**
   * Measure the execution time of a function
   */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      return await fn()
    } finally {
      const duration = performance.now() - start
      this.record(name, duration)
    }
  }

  /**
   * Create a timer that can be stopped later
   */
  startTimer(name: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.record(name, duration)
    }
  }

  /**
   * Subscribe to metrics
   */
  subscribe(callback: MetricsCallback): () => void {
    this.callbacks.push(callback)
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback)
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Clear all recorded metrics
   */
  clear(): void {
    this.metrics = []
  }

  private notifyCallbacks(metrics: PerformanceMetric[]): void {
    this.callbacks.forEach((callback) => callback(metrics))
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// ============================================
// WEB VITALS
// ============================================

interface WebVitalsMetric {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

type WebVitalsCallback = (metric: WebVitalsMetric) => void

/**
 * Report Web Vitals metrics
 */
export function reportWebVitals(callback: WebVitalsCallback): void {
  if (typeof window === 'undefined') return

  // Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries()
    const lastEntry = entries[entries.length - 1]
    if (lastEntry) {
      const value = lastEntry.startTime
      callback({
        id: 'lcp',
        name: 'LCP',
        value,
        rating: value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor',
      })
    }
  })

  try {
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    // Browser doesn't support this observer type
  }

  // First Input Delay
  const fidObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries()
    const firstEntry = entries[0] as PerformanceEventTiming | undefined
    if (firstEntry) {
      const value = firstEntry.processingStart - firstEntry.startTime
      callback({
        id: 'fid',
        name: 'FID',
        value,
        rating: value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor',
      })
    }
  })

  try {
    fidObserver.observe({ type: 'first-input', buffered: true })
  } catch {
    // Browser doesn't support this observer type
  }

  // Cumulative Layout Shift
  let clsValue = 0
  const clsObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries() as PerformanceEntry[]) {
      if ((entry as LayoutShift).hadRecentInput) continue
      clsValue += (entry as LayoutShift).value
    }
    callback({
      id: 'cls',
      name: 'CLS',
      value: clsValue,
      rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
    })
  })

  try {
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  } catch {
    // Browser doesn't support this observer type
  }
}

// Type definitions for PerformanceEntry extensions
interface LayoutShift extends PerformanceEntry {
  hadRecentInput: boolean
  value: number
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number
}

// ============================================
// MEMORY USAGE
// ============================================

interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

/**
 * Get current memory usage (Chrome only)
 */
export function getMemoryUsage(): MemoryInfo | null {
  if (typeof window === 'undefined') return null

  const perf = performance as Performance & {
    memory?: MemoryInfo
  }

  if (perf.memory) {
    return {
      usedJSHeapSize: perf.memory.usedJSHeapSize,
      totalJSHeapSize: perf.memory.totalJSHeapSize,
      jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
    }
  }

  return null
}

// ============================================
// RENDER TRACKING
// ============================================

const renderCounts = new Map<string, number>()

/**
 * Track component render counts (for development)
 */
export function trackRender(componentName: string): void {
  if (process.env.NODE_ENV !== 'development') return

  const count = (renderCounts.get(componentName) || 0) + 1
  renderCounts.set(componentName, count)

  if (count > 10) {
    console.warn(`[Performance] ${componentName} has rendered ${count} times`)
  }
}

/**
 * Get render counts for all tracked components
 */
export function getRenderCounts(): Map<string, number> {
  return new Map(renderCounts)
}

/**
 * Reset render tracking
 */
export function resetRenderCounts(): void {
  renderCounts.clear()
}

// ============================================
// DEBOUNCE & THROTTLE UTILITIES
// ============================================

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// ============================================
// REQUEST IDLE CALLBACK
// ============================================

type IdleCallback = (deadline: IdleDeadline) => void

/**
 * Schedule work during idle periods
 */
export function scheduleIdleWork(callback: IdleCallback, timeout = 5000): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout })
  }
  // Fallback for browsers without requestIdleCallback
  return window.setTimeout(() => {
    callback({
      didTimeout: true,
      timeRemaining: () => 50,
    })
  }, 1) as unknown as number
}

/**
 * Cancel scheduled idle work
 */
export function cancelIdleWork(id: number): void {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(id)
  } else {
    window.clearTimeout(id)
  }
}

// ============================================
// BATCH UPDATES
// ============================================

type BatchedFn<T> = (items: T[]) => void

/**
 * Batch multiple calls into one
 */
export function createBatcher<T>(
  fn: BatchedFn<T>,
  delay = 16 // ~1 frame at 60fps
): (item: T) => void {
  let batch: T[] = []
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (item: T) {
    batch.push(item)

    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        fn([...batch])
        batch = []
        timeoutId = null
      }, delay)
    }
  }
}

// ============================================
// PRELOADING
// ============================================

/**
 * Preload an image
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Preload multiple images
 */
export function preloadImages(srcs: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(srcs.map(preloadImage))
}

/**
 * Preload a script
 */
export function preloadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'script'
    link.href = src
    link.onload = () => resolve()
    link.onerror = reject
    document.head.appendChild(link)
  })
}

// ============================================
// NETWORK INFO
// ============================================

interface NetworkInfo {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g'
  downlink: number
  rtt: number
  saveData: boolean
}

/**
 * Get network connection information
 */
export function getNetworkInfo(): NetworkInfo | null {
  if (typeof window === 'undefined') return null

  const nav = navigator as Navigator & {
    connection?: NetworkInfo
  }

  if (nav.connection) {
    return {
      effectiveType: nav.connection.effectiveType,
      downlink: nav.connection.downlink,
      rtt: nav.connection.rtt,
      saveData: nav.connection.saveData,
    }
  }

  return null
}

/**
 * Check if user prefers reduced data usage
 */
export function shouldReduceData(): boolean {
  const info = getNetworkInfo()
  if (!info) return false
  return info.saveData || info.effectiveType === 'slow-2g' || info.effectiveType === '2g'
}
