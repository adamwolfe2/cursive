/**
 * Service Tier Analytics Events
 *
 * Track user interactions with service tier pages and conversion funnel
 */

// Event names
export const SERVICE_TIER_EVENTS = {
  // Page Views
  PAGE_VIEW_SERVICES_HUB: 'service_tier_hub_viewed',
  PAGE_VIEW_TIER_DETAIL: 'service_tier_detail_viewed',
  PAGE_VIEW_CHECKOUT_SUCCESS: 'service_tier_checkout_success_viewed',

  // CTA Interactions
  CTA_CLICKED: 'service_tier_cta_clicked',
  UPGRADE_PROMPT_CLICKED: 'service_tier_upgrade_prompt_clicked',
  CONTACT_SALES_CLICKED: 'service_tier_contact_sales_clicked',

  // Checkout Flow
  CHECKOUT_STARTED: 'service_tier_checkout_started',
  CHECKOUT_COMPLETED: 'service_tier_checkout_completed',
  CHECKOUT_ABANDONED: 'service_tier_checkout_abandoned',

  // Upsells
  UPSELL_DISPLAYED: 'service_tier_upsell_displayed',
  UPSELL_CLICKED: 'service_tier_upsell_clicked',
  UPSELL_DISMISSED: 'service_tier_upsell_dismissed',

  // Feature Locks
  FEATURE_LOCK_DISPLAYED: 'service_tier_feature_lock_displayed',
  FEATURE_LOCK_UPGRADE_CLICKED: 'service_tier_feature_lock_upgrade_clicked',

  // Service Management
  SUBSCRIPTION_VIEWED: 'service_subscription_viewed',
  SUBSCRIPTION_CANCELED: 'service_subscription_canceled',
  SUBSCRIPTION_UPGRADED: 'service_subscription_upgraded',
} as const

export type ServiceTierEvent = typeof SERVICE_TIER_EVENTS[keyof typeof SERVICE_TIER_EVENTS]

// Event properties
export interface ServiceTierEventProperties {
  // Common properties
  tier_slug?: string
  tier_name?: string
  tier_price?: number
  user_id?: string
  workspace_id?: string

  // CTA properties
  cta_location?: string // 'dashboard', 'marketplace', 'billing', 'feature_lock', etc.
  cta_text?: string

  // Upsell properties
  upsell_type?: string // 'banner', 'modal', 'inline', 'empty_state'
  upsell_location?: string
  current_tier?: string
  target_tier?: string

  // Checkout properties
  checkout_session_id?: string
  amount?: number

  // Feature lock properties
  locked_feature?: string
  required_tier?: string

  // Additional metadata
  [key: string]: any
}

/**
 * Track a service tier analytics event
 */
export async function trackServiceTierEvent(
  event: ServiceTierEvent,
  properties?: ServiceTierEventProperties
): Promise<void> {
  try {
    // Send to analytics endpoint
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          page_url: typeof window !== 'undefined' ? window.location.href : undefined,
          referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        },
      }),
    })
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.error('Analytics tracking error:', error)
  }
}

/**
 * Track page view with automatic tier detection
 */
export function trackServicePageView(
  page: 'hub' | 'detail' | 'success',
  properties?: ServiceTierEventProperties
): void {
  const eventMap = {
    hub: SERVICE_TIER_EVENTS.PAGE_VIEW_SERVICES_HUB,
    detail: SERVICE_TIER_EVENTS.PAGE_VIEW_TIER_DETAIL,
    success: SERVICE_TIER_EVENTS.PAGE_VIEW_CHECKOUT_SUCCESS,
  }

  trackServiceTierEvent(eventMap[page], properties)
}

/**
 * Track CTA click with context
 */
export function trackCTAClick(
  tierSlug: string,
  ctaLocation: string,
  ctaText: string,
  properties?: ServiceTierEventProperties
): void {
  trackServiceTierEvent(SERVICE_TIER_EVENTS.CTA_CLICKED, {
    tier_slug: tierSlug,
    cta_location: ctaLocation,
    cta_text: ctaText,
    ...properties,
  })
}

/**
 * Track upsell interaction
 */
export function trackUpsell(
  action: 'displayed' | 'clicked' | 'dismissed',
  properties: {
    upsell_type: string
    upsell_location: string
    current_tier: string
    target_tier: string
    [key: string]: any
  }
): void {
  const eventMap = {
    displayed: SERVICE_TIER_EVENTS.UPSELL_DISPLAYED,
    clicked: SERVICE_TIER_EVENTS.UPSELL_CLICKED,
    dismissed: SERVICE_TIER_EVENTS.UPSELL_DISMISSED,
  }

  trackServiceTierEvent(eventMap[action], properties)
}

/**
 * Track feature lock interaction
 */
export function trackFeatureLock(
  action: 'displayed' | 'upgrade_clicked',
  lockedFeature: string,
  requiredTier: string,
  properties?: ServiceTierEventProperties
): void {
  const eventMap = {
    displayed: SERVICE_TIER_EVENTS.FEATURE_LOCK_DISPLAYED,
    upgrade_clicked: SERVICE_TIER_EVENTS.FEATURE_LOCK_UPGRADE_CLICKED,
  }

  trackServiceTierEvent(eventMap[action], {
    locked_feature: lockedFeature,
    required_tier: requiredTier,
    ...properties,
  })
}

/**
 * Track checkout flow
 */
export function trackCheckout(
  stage: 'started' | 'completed' | 'abandoned',
  properties: {
    tier_slug: string
    tier_name: string
    tier_price: number
    checkout_session_id?: string
    [key: string]: any
  }
): void {
  const eventMap = {
    started: SERVICE_TIER_EVENTS.CHECKOUT_STARTED,
    completed: SERVICE_TIER_EVENTS.CHECKOUT_COMPLETED,
    abandoned: SERVICE_TIER_EVENTS.CHECKOUT_ABANDONED,
  }

  trackServiceTierEvent(eventMap[stage], properties)
}

/**
 * Client-side hook for automatic page view tracking
 */
export function useServiceTierPageTracking(
  page: 'hub' | 'detail' | 'success',
  properties?: ServiceTierEventProperties
) {
  // Track on mount (skip in SSR)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    trackServicePageView(page, properties)
  }, [page, properties])
}

// React import for hook
import React from 'react'
