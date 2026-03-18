// Google Analytics event tracking utilities

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

// TypeScript types for analytics events
export interface ConversionEventParams {
  event_category: string
  event_label: string
  value?: number
  [key: string]: string | number | boolean | undefined
}

export interface EngagementEventParams {
  event_category: string
  event_label: string
  [key: string]: string | number | boolean | undefined
}

// Safe wrapper for gtag calls
const safeGtagCall = (
  eventName: string,
  params: ConversionEventParams | EngagementEventParams
): void => {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, params)
    }
  } catch (error) {
    // Silently fail - analytics should never break the app
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics tracking failed:', error)
    }
  }
}

/**
 * Track when a user books a demo call
 * @param source - Where the demo was booked from (e.g., "homepage_hero", "faq_section")
 */
export const trackDemoBooked = (source: string): void => {
  safeGtagCall('demo_booking', {
    event_category: 'conversion',
    event_label: source,
    value: 1,
    conversion_type: 'demo_booking',
    source_location: source,
  })
}

/**
 * Track newsletter signups
 * @param source - Where the signup occurred (e.g., "blog_scroll_popup", "footer")
 */
export const trackNewsletterSignup = (source: string): void => {
  safeGtagCall('newsletter_signup', {
    event_category: 'conversion',
    event_label: source,
    value: 1,
    conversion_type: 'newsletter_signup',
    source_location: source,
  })
}

/**
 * Track lead capture events
 * @param source - Where the lead was captured (e.g., "free_audit_form", "exit_intent_popup")
 */
export const trackLeadCaptured = (source: string): void => {
  safeGtagCall('generate_lead', {
    event_category: 'conversion',
    event_label: source,
    value: 1,
    conversion_type: 'lead_capture',
    source_location: source,
  })
}

/**
 * Track form submissions
 * @param formName - The name of the form
 */
export const trackFormSubmission = (formName: string): void => {
  safeGtagCall('form_submit', {
    event_category: 'conversion',
    event_label: formName,
    value: 1,
  })
}

/**
 * Track CTA button clicks
 * @param ctaText - The text on the CTA button
 * @param location - Where the CTA is located
 */
export const trackCTAClick = (ctaText: string, location: string): void => {
  safeGtagCall('cta_click', {
    event_category: 'engagement',
    event_label: `${location}: ${ctaText}`,
    cta_text: ctaText,
    cta_location: location,
  })
}
