'use client'

// Analytics Client
// PostHog integration for product analytics

import posthog from 'posthog-js'
import { safeWarn } from '@/lib/utils/log-sanitizer'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Initialize PostHog
 */
export function initAnalytics() {
  if (typeof window === 'undefined') return

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

  if (!apiKey) {
    safeWarn('PostHog API key not configured')
    return
  }

  posthog.init(apiKey, {
    api_host: apiHost,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug()
      }
    },
    capture_pageview: false, // We'll handle this manually
    capture_pageleave: true,
    autocapture: true,
  })
}

/**
 * Track page view
 */
export function trackPageView(url?: string) {
  if (typeof window === 'undefined') return

  posthog.capture('$pageview', {
    $current_url: url || window.location.href,
  })
}

/**
 * Track event
 */
export function track(event: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return

  posthog.capture(event, properties)
}

/**
 * Identify user
 */
export function identify(userId: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return

  posthog.identify(userId, properties)
}

/**
 * Reset analytics (on logout)
 */
export function reset() {
  if (typeof window === 'undefined') return

  posthog.reset()
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>) {
  if (typeof window === 'undefined') return

  posthog.people.set(properties)
}

/**
 * Track page view on route change
 */
export function useTrackPageViews() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      trackPageView(url)
    }
  }, [pathname, searchParams])
}

/**
 * Feature flags
 */
export function isFeatureEnabled(flag: string): boolean {
  if (typeof window === 'undefined') return false

  return posthog.isFeatureEnabled(flag) || false
}

export function getFeatureFlag(flag: string): string | boolean {
  if (typeof window === 'undefined') return false

  return posthog.getFeatureFlag(flag) ?? false
}

export function onFeatureFlags(callback: (flags: string[], variants: Record<string, string | boolean>) => void) {
  if (typeof window === 'undefined') return

  posthog.onFeatureFlags(callback)
}

/**
 * Get distinct ID
 */
export function getDistinctId(): string | undefined {
  if (typeof window === 'undefined') return undefined

  return posthog.get_distinct_id()
}

/**
 * Export analytics instance
 */
export { posthog }
