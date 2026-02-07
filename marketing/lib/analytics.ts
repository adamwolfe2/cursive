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

// ============================================================================
// CONVERSION TRACKING FUNCTIONS
// ============================================================================

/**
 * Track when a user books a demo call
 * @param source - Where the demo was booked from (e.g., "homepage_hero", "faq_section", "exit_intent_popup")
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
 * Track when a user starts a trial
 * @param plan - The plan type selected (e.g., "starter", "growth", "enterprise")
 */
export const trackTrialStarted = (plan: string): void => {
  safeGtagCall('trial_started', {
    event_category: 'conversion',
    event_label: plan,
    value: 1,
    conversion_type: 'trial_start',
    plan_type: plan,
  })
}

/**
 * Track newsletter signups
 * @param source - Where the signup occurred (e.g., "homepage_footer", "blog_sidebar", "exit_intent_popup")
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
 * @param source - Where the lead was captured (e.g., "free_audit_form", "exit_intent_popup", "contact_form")
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

// ============================================================================
// ENGAGEMENT TRACKING FUNCTIONS
// ============================================================================

/**
 * Track outbound link clicks
 * @param url - The destination URL
 * @param label - Optional label for the link
 */
export const trackOutboundLink = (url: string, label?: string): void => {
  safeGtagCall('click', {
    event_category: 'outbound',
    event_label: label || url,
    transport_type: 'beacon',
    url: url,
  })
}

/**
 * Track demo booking clicks (legacy - use trackDemoBooked instead)
 * @deprecated Use trackDemoBooked for consistency
 */
export const trackDemoBooking = (source: string): void => {
  trackDemoBooked(source)
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

/**
 * Track scroll depth
 * @param percentage - Percentage scrolled (25, 50, 75, 100)
 * @param page - The page being tracked
 */
export const trackScrollDepth = (percentage: number, page: string): void => {
  safeGtagCall('scroll_depth', {
    event_category: 'engagement',
    event_label: page,
    value: percentage,
  })
}

/**
 * Track video plays
 * @param videoTitle - Title of the video
 * @param videoUrl - URL of the video
 */
export const trackVideoPlay = (videoTitle: string, videoUrl: string): void => {
  safeGtagCall('video_start', {
    event_category: 'engagement',
    event_label: videoTitle,
    video_url: videoUrl,
  })
}

/**
 * Track search queries
 * @param searchTerm - The search term entered
 */
export const trackSearch = (searchTerm: string): void => {
  safeGtagCall('search', {
    event_category: 'engagement',
    event_label: searchTerm,
    search_term: searchTerm,
  })
}

/**
 * Track file downloads
 * @param fileName - Name of the downloaded file
 * @param fileUrl - URL of the file
 */
export const trackFileDownload = (fileName: string, fileUrl: string): void => {
  safeGtagCall('file_download', {
    event_category: 'engagement',
    event_label: fileName,
    file_url: fileUrl,
  })
}

/**
 * Track error pages
 * @param errorCode - HTTP error code
 * @param errorMessage - Error message
 */
export const trackError = (errorCode: string, errorMessage: string): void => {
  safeGtagCall('error', {
    event_category: 'error',
    event_label: `${errorCode}: ${errorMessage}`,
    error_code: errorCode,
  })
}
