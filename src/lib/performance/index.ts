/**
 * Performance Optimization Utilities
 * OpenInfo Platform Marketing Site
 *
 * Utilities for optimizing Core Web Vitals and performance.
 */

'use client'

import * as React from 'react'

// ============================================
// IMAGE OPTIMIZATION
// ============================================

/**
 * Generate responsive image srcSet
 */
export function generateSrcSet(
  src: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  return widths
    .map((w) => {
      // For Next.js Image optimization
      const url = `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`
      return `${url} ${w}w`
    })
    .join(', ')
}

/**
 * Get optimal image sizes for responsive images
 */
export function getImageSizes(
  options: {
    mobile?: string
    tablet?: string
    desktop?: string
  } = {}
): string {
  const { mobile = '100vw', tablet = '50vw', desktop = '33vw' } = options
  return `(max-width: 640px) ${mobile}, (max-width: 1024px) ${tablet}, ${desktop}`
}

// ============================================
// LAZY LOADING
// ============================================

/**
 * Hook to detect when element is in viewport
 */
export function useInView(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, ...options }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [options])

  return [ref, isInView]
}

/**
 * Hook to lazy load components when in viewport
 */
export function useLazyLoad<T>(
  factory: () => Promise<{ default: React.ComponentType<T> }>,
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement | null>, React.ComponentType<T> | null] {
  const [ref, isInView] = useInView(options)
  const [Component, setComponent] = React.useState<React.ComponentType<T> | null>(null)

  React.useEffect(() => {
    if (isInView && !Component) {
      factory().then((mod) => setComponent(() => mod.default))
    }
  }, [isInView, Component, factory])

  return [ref, Component]
}

// ============================================
// RESOURCE HINTS
// ============================================

/**
 * Preconnect to origin
 */
export function preconnect(url: string): void {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = url
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}

/**
 * Prefetch resource
 */
export function prefetch(url: string, as?: string): void {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = url
  if (as) link.as = as
  document.head.appendChild(link)
}

/**
 * DNS prefetch
 */
export function dnsPrefetch(url: string): void {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'dns-prefetch'
  link.href = url
  document.head.appendChild(link)
}

// ============================================
// CRITICAL CSS
// ============================================

/**
 * Load non-critical CSS asynchronously
 */
export function loadAsyncCSS(href: string): void {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.media = 'print'
  link.onload = () => {
    link.media = 'all'
  }
  document.head.appendChild(link)
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

/**
 * Get Core Web Vitals metrics
 */
export function getWebVitals(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    const metrics: PerformanceMetrics = {}

    // Get basic metrics from Performance API
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      if (navigation) {
        metrics.ttfb = navigation.responseStart - navigation.requestStart
      }

      // Get paint metrics
      const paintEntries = performance.getEntriesByType('paint')
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime
        }
      })
    }

    resolve(metrics)
  })
}

/**
 * Report metrics to analytics
 */
export function reportWebVitals(
  metric: { name: string; value: number },
  reportFn: (metric: { name: string; value: number }) => void
): void {
  reportFn(metric)
}

// ============================================
// DEBOUNCE & THROTTLE
// ============================================

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// ============================================
// SCROLL PERFORMANCE
// ============================================

/**
 * Hook for performant scroll handling
 */
export function useScrollPosition(): { x: number; y: number } {
  const [position, setPosition] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    const handleScroll = throttle(() => {
      setPosition({ x: window.scrollX, y: window.scrollY })
    }, 100)

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return position
}

/**
 * Hook to detect scroll direction
 */
export function useScrollDirection(): 'up' | 'down' | null {
  const [scrollDirection, setScrollDirection] = React.useState<'up' | 'down' | null>(null)
  const [lastScrollY, setLastScrollY] = React.useState(0)

  React.useEffect(() => {
    const handleScroll = throttle(() => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY) {
        setScrollDirection('down')
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up')
      }

      setLastScrollY(currentScrollY)
    }, 100)

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return scrollDirection
}

// ============================================
// ANIMATION PERFORMANCE
// ============================================

/**
 * Request idle callback polyfill
 */
export function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options)
  }

  // Fallback for Safari
  return setTimeout(() => {
    const start = Date.now()
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    })
  }, 1) as unknown as number
}

/**
 * Cancel idle callback polyfill
 */
export function cancelIdleCallback(handle: number): void {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle)
  } else {
    clearTimeout(handle)
  }
}

/**
 * Run task when browser is idle
 */
export function runWhenIdle<T>(
  task: () => T,
  timeout: number = 2000
): Promise<T> {
  return new Promise((resolve) => {
    requestIdleCallback(
      () => {
        resolve(task())
      },
      { timeout }
    )
  })
}
