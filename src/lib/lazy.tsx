'use client'

/**
 * Lazy Loading Utilities
 * OpenInfo Platform
 *
 * Utilities for code splitting and lazy loading components.
 */

import * as React from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

// ============================================
// LAZY LOADING WRAPPER
// ============================================

interface LazyLoadOptions {
  /**
   * Loading component to show while loading
   */
  loading?: React.ComponentType
  /**
   * Whether to use server-side rendering
   */
  ssr?: boolean
  /**
   * Delay before showing loading state (prevents flicker)
   */
  delay?: number
}

/**
 * Create a lazily loaded component with loading state
 */
export function lazyLoad<T extends React.ComponentType<P>, P extends object>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): React.ComponentType<P> {
  const { loading: LoadingComponent, ssr = true, delay = 200 } = options

  return dynamic(importFn, {
    loading: LoadingComponent
      ? () => <LoadingComponent />
      : () => <DefaultLoader delay={delay} />,
    ssr,
  }) as React.ComponentType<P>
}

// ============================================
// DEFAULT LOADERS
// ============================================

interface DefaultLoaderProps {
  delay?: number
}

function DefaultLoader({ delay = 200 }: DefaultLoaderProps) {
  const [show, setShow] = React.useState(delay === 0)

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShow(true), delay)
      return () => clearTimeout(timer)
    }
  }, [delay])

  if (!show) {
    return null
  }

  return (
    <div className="flex items-center justify-center p-8">
      <Spinner size="md" />
    </div>
  )
}

/**
 * Page skeleton loader
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

/**
 * Card skeleton loader
 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

/**
 * Table skeleton loader
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="border-b border-border bg-muted/50 p-4">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-border p-4 last:border-0">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================
// LAZY BOUNDARY COMPONENT
// ============================================

interface LazyBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Suspense boundary for lazy-loaded components
 */
export function LazyBoundary({ children, fallback }: LazyBoundaryProps) {
  return (
    <React.Suspense fallback={fallback ?? <DefaultLoader delay={0} />}>
      {children}
    </React.Suspense>
  )
}

// ============================================
// LAZY IMAGE COMPONENT
// ============================================

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode
  threshold?: number
}

/**
 * Lazy loading image with intersection observer
 */
export function LazyImage({
  src,
  alt,
  fallback,
  threshold = 0.1,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [isInView, setIsInView] = React.useState(false)
  const [error, setError] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [threshold])

  const handleLoad = () => setIsLoaded(true)
  const handleError = () => setError(true)

  if (error && fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="relative" ref={imgRef as React.RefObject<HTMLDivElement>}>
      {!isLoaded && (
        <Skeleton
          className={className}
          style={{ position: 'absolute', inset: 0 }}
        />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
          style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
          {...props}
        />
      )}
    </div>
  )
}

// ============================================
// PREFETCH UTILITIES
// ============================================

/**
 * Prefetch a route on hover or focus
 */
export function usePrefetch(href: string) {
  const prefetch = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = href
      document.head.appendChild(link)
    }
  }, [href])

  return {
    onMouseEnter: prefetch,
    onFocus: prefetch,
  }
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string): void {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    document.head.appendChild(link)
  }
}

// ============================================
// DEFERRED VALUE WRAPPER
// ============================================

interface DeferredProps<T> {
  value: T
  children: (deferredValue: T) => React.ReactNode
}

/**
 * Defer expensive renders to keep UI responsive
 */
export function Deferred<T>({ value, children }: DeferredProps<T>) {
  const deferredValue = React.useDeferredValue(value)
  return <>{children(deferredValue)}</>
}

// ============================================
// VIRTUALIZATION HELPERS
// ============================================

interface VirtualListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
}

/**
 * Simple virtual list for long lists
 * For more complex cases, use react-virtual or react-window
 */
export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      ref={containerRef}
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, i) => (
          <div
            key={startIndex + i}
            style={{
              position: 'absolute',
              top: (startIndex + i) * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            {renderItem(item, startIndex + i)}
          </div>
        ))}
      </div>
    </div>
  )
}
