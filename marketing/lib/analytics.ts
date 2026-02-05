// Google Analytics event tracking utilities

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

// Track outbound link clicks
export const trackOutboundLink = (url: string, label?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'click', {
      event_category: 'outbound',
      event_label: label || url,
      transport_type: 'beacon',
      url: url,
    })
  }
}

// Track demo booking clicks
export const trackDemoBooking = (source: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'demo_booking', {
      event_category: 'conversion',
      event_label: source,
      value: 1,
    })
  }
}

// Track form submissions
export const trackFormSubmission = (formName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'form_submit', {
      event_category: 'conversion',
      event_label: formName,
      value: 1,
    })
  }
}

// Track newsletter signups
export const trackNewsletterSignup = (source: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'newsletter_signup', {
      event_category: 'conversion',
      event_label: source,
      value: 1,
    })
  }
}

// Track CTA clicks
export const trackCTAClick = (ctaText: string, location: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'cta_click', {
      event_category: 'engagement',
      event_label: `${location}: ${ctaText}`,
      cta_text: ctaText,
      cta_location: location,
    })
  }
}

// Track scroll depth
export const trackScrollDepth = (percentage: number, page: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'scroll_depth', {
      event_category: 'engagement',
      event_label: page,
      value: percentage,
    })
  }
}

// Track video plays (if you add videos)
export const trackVideoPlay = (videoTitle: string, videoUrl: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'video_start', {
      event_category: 'engagement',
      event_label: videoTitle,
      video_url: videoUrl,
    })
  }
}

// Track search (if you add search)
export const trackSearch = (searchTerm: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
    })
  }
}

// Track file downloads
export const trackFileDownload = (fileName: string, fileUrl: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'file_download', {
      event_category: 'engagement',
      event_label: fileName,
      file_url: fileUrl,
    })
  }
}

// Track error pages
export const trackError = (errorCode: string, errorMessage: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'error', {
      event_category: 'error',
      event_label: `${errorCode}: ${errorMessage}`,
      error_code: errorCode,
    })
  }
}
