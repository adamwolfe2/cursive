/**
 * Analytics Integration for A/B Testing
 *
 * Tracks test exposures, conversions, and outcomes across multiple
 * analytics platforms (Google Analytics, PostHog, etc.)
 */

interface PostHogInstance {
  capture: (eventName: string, properties?: Record<string, string | number | boolean>) => void;
  init: (apiKey: string, options?: PostHogOptions) => void;
}

interface PostHogOptions {
  api_host?: string;
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    posthog?: PostHogInstance;
    dataLayer?: unknown[];
  }
}

/**
 * Track when a user is exposed to a test variant
 * This is separate from conversion tracking
 */
export function trackABTestView(testId: string, variantId: string): void {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ab_test_view', {
      test_id: testId,
      variant_id: variantId,
      timestamp: new Date().toISOString(),
    });
  }

  // PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture('ab_test_view', {
      test_id: testId,
      variant_id: variantId,
      timestamp: new Date().toISOString(),
    });
  }

  // Custom analytics endpoint (optional)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'ab_test_view',
        test_id: testId,
        variant_id: variantId,
        timestamp: new Date().toISOString(),
      }),
    }).catch(err => console.error('Analytics tracking error:', err));
  }

}

/**
 * Track A/B test conversion event
 */
export function trackABTestConversion(
  testId: string,
  variantId: string,
  conversionType?: string
): void {
  const eventData = {
    test_id: testId,
    variant_id: variantId,
    conversion_type: conversionType || 'default',
    timestamp: new Date().toISOString(),
  };

  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ab_test_conversion', eventData);
  }

  // PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture('ab_test_conversion', eventData);
  }

  // Custom analytics endpoint
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'ab_test_conversion',
        ...eventData,
      }),
    }).catch(err => console.error('Analytics tracking error:', err));
  }

}

/**
 * Track secondary metrics for deeper analysis
 */
export function trackABTestMetric(
  testId: string,
  variantId: string,
  metricName: string,
  metricValue: number | string
): void {
  const eventData = {
    test_id: testId,
    variant_id: variantId,
    metric_name: metricName,
    metric_value: metricValue,
    timestamp: new Date().toISOString(),
  };

  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ab_test_metric', eventData);
  }

  // PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture('ab_test_metric', eventData);
  }

}

/**
 * Track page engagement metrics (time on page, scroll depth, etc.)
 */
export function trackABTestEngagement(
  testId: string,
  variantId: string,
  engagementData: {
    timeOnPage?: number;
    scrollDepth?: number;
    clicks?: number;
    [key: string]: string | number | boolean | undefined;
  }
): void {
  const eventData = {
    test_id: testId,
    variant_id: variantId,
    ...engagementData,
    timestamp: new Date().toISOString(),
  };

  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ab_test_engagement', eventData);
  }

  // PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture('ab_test_engagement', eventData);
  }
}

/**
 * Hook to track time on page for A/B tests
 */
export function useABTestTimeTracking(testId: string, variantId: string) {
  if (typeof window === 'undefined') return;

  const startTime = Date.now();

  const trackTimeOnPage = () => {
    const timeOnPage = Math.round((Date.now() - startTime) / 1000); // in seconds
    trackABTestEngagement(testId, variantId, { timeOnPage });
  };

  // Track on page unload
  window.addEventListener('beforeunload', trackTimeOnPage);

  // Cleanup
  return () => {
    window.removeEventListener('beforeunload', trackTimeOnPage);
    trackTimeOnPage();
  };
}

/**
 * Hook to track scroll depth for A/B tests
 */
export function useABTestScrollTracking(testId: string, variantId: string) {
  if (typeof window === 'undefined') return;

  let maxScrollDepth = 0;

  const trackScrollDepth = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);

    if (scrollPercent > maxScrollDepth) {
      maxScrollDepth = scrollPercent;
    }
  };

  const sendScrollDepth = () => {
    trackABTestEngagement(testId, variantId, { scrollDepth: maxScrollDepth });
  };

  window.addEventListener('scroll', trackScrollDepth);
  window.addEventListener('beforeunload', sendScrollDepth);

  // Cleanup
  return () => {
    window.removeEventListener('scroll', trackScrollDepth);
    window.removeEventListener('beforeunload', sendScrollDepth);
    sendScrollDepth();
  };
}

/**
 * Helper to initialize Google Analytics for A/B testing
 */
export function initializeGoogleAnalytics(measurementId: string): void {
  if (typeof window === 'undefined') return;

  // Load GA4 script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId);
}

/**
 * Helper to initialize PostHog for A/B testing
 */
export function initializePostHog(apiKey: string, options?: PostHogOptions): void {
  if (typeof window === 'undefined') return;

  // Load PostHog
  const script = document.createElement('script');
  script.innerHTML = `
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('${apiKey}',{api_host:'https://app.posthog.com', ...${JSON.stringify(options || {})}})
  `;
  document.head.appendChild(script);
}

/**
 * Query test results from analytics
 * This would typically call your analytics API
 */
export async function getTestResults(testId: string): Promise<{
  variants: Array<{
    variantId: string;
    views: number;
    conversions: number;
    conversionRate: number;
  }>;
}> {
  // Placeholder - implement based on your analytics backend
  // This could call GA4 Data API, PostHog API, or your custom analytics API
  throw new Error('Not implemented - configure analytics backend');
}

/**
 * Export test results to CSV
 */
export function exportTestResultsToCSV(
  testId: string,
  results: Array<{
    variantId: string;
    views: number;
    conversions: number;
    conversionRate: number;
  }>
): void {
  const csvContent = [
    ['Variant ID', 'Views', 'Conversions', 'Conversion Rate'],
    ...results.map(r => [
      r.variantId,
      r.views.toString(),
      r.conversions.toString(),
      `${(r.conversionRate * 100).toFixed(2)}%`,
    ]),
  ]
    .map(row => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ab-test-${testId}-results.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
