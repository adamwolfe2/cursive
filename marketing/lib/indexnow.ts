/**
 * IndexNow Integration
 *
 * IndexNow is a protocol that allows websites to instantly notify search engines
 * (Google, Bing, Yandex, etc.) about content changes for faster indexing.
 *
 * @see https://www.indexnow.org/
 */

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '7c33bde0a15b132aa38f5bea1dd15077'
const BASE_URL = 'https://www.meetcursive.com'

// IndexNow API endpoints (submit to any one and it propagates to all participating search engines)
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow', // IndexNow API
  'https://www.bing.com/indexnow',     // Bing
  'https://yandex.com/indexnow',       // Yandex
]

interface IndexNowSubmission {
  host: string
  key: string
  keyLocation: string
  urlList: string[]
}

/**
 * Get all URLs from sitemap
 * This function extracts all URLs that should be indexed
 */
export function getAllUrls(): string[] {
  const baseUrl = 'https://www.meetcursive.com'

  // Core pages - highest priority, frequent updates
  const corePages = [
    '',
    '/platform',
    '/pricing',
  ]

  // Solution pages - high priority
  const solutionPages = [
    '/visitor-identification',
    '/audience-builder',
    '/direct-mail',
    '/clean-room',
    '/data-access',
    '/integrations',
    '/intent-audiences',
  ]

  // Industry pages - medium-high priority
  const industryPages = [
    '/industries/financial-services',
    '/industries/ecommerce',
    '/industries/media-advertising',
    '/industries/b2b-software',
    '/industries/agencies',
    '/industries/franchises',
    '/industries/home-services',
    '/industries/retail',
    '/industries/education',
  ]

  // Secondary pages - medium priority
  const secondaryPages = [
    '/services',
    '/about',
    '/contact',
    '/demos',
    '/faq',
  ]

  // Resources and blog hub - medium priority
  const resourcePages = [
    '/resources',
    '/blog',
    '/case-studies',
  ]

  // Blog category pages - medium priority
  const blogCategoryPages = [
    '/blog/visitor-tracking',
    '/blog/lead-generation',
    '/blog/data-platforms',
    '/blog/audience-targeting',
    '/blog/direct-mail',
    '/blog/analytics',
    '/blog/retargeting',
    '/blog/crm-integration',
    '/blog/scaling-outbound',
    '/blog/ai-sdr-vs-human-bdr',
    '/blog/cold-email-2026',
    '/blog/icp-targeting-guide',
  ]

  // Recent blog posts (published in last 3 months) - higher priority
  const recentBlogPosts = [
    '/blog/scaling-outbound',
    '/blog/ai-sdr-vs-human-bdr',
    '/blog/cold-email-2026',
    '/blog/icp-targeting-guide',
  ]

  // Older blog posts - standard priority
  const olderBlogPosts = [
    '/blog/tips-for-using-marketing-audience-data-efficiently',
    '/blog/steps-to-build-an-effective-audience-building-platform',
    '/blog/why-consumer-targeting-data-is-essential-for-brands',
    '/blog/what-to-consider-when-selecting-a-business-data-platform',
    '/blog/understanding-data-driven-retargeting-practices',
    '/blog/guide-to-choosing-a-b2c-data-platform-for-retailers',
    '/blog/how-marketing-data-solutions-can-improve-campaigns',
    '/blog/steps-to-use-a-customer-data-platform-successfully',
    '/blog/how-to-leverage-business-contact-data-for-better-outreach',
    '/blog/guide-to-direct-mail-marketing-automation-for-agencies',
    '/blog/why-audience-segmentation-platforms-are-key-to-marketing',
    '/blog/discover-the-benefits-of-a-consumer-data-platform',
    '/blog/tips-for-finding-data-targeting-solutions-that-work',
    '/blog/how-to-improve-b2b-contact-data-efficiency',
    '/blog/understanding-business-intelligence-data-for-marketing-success',
    '/blog/guide-to-building-an-effective-audience-targeting-platform',
    '/blog/cross-platform-retargeting-strategies-to-explore',
    '/blog/understanding-data-driven-decision-making-in-marketing',
    '/blog/enhancing-data-connectivity-with-crm-integration',
    '/blog/guide-to-completing-contact-records-easily',
    '/blog/real-time-analytics-strategies-for-better-roi-decisions',
    '/blog/using-website-visitor-tracking-for-lead-generation',
    '/blog/steps-to-improve-your-marketing-database-quality',
    '/blog/understanding-marketing-data-privacy-compliance',
    '/blog/boosting-sales-through-anonymous-visitor-conversion',
    '/blog/leveraging-real-time-data-for-efficient-campaigns',
    '/blog/steps-to-safeguard-consumer-data-privacy',
    '/blog/why-scalable-workflows-benefit-agencies',
    '/blog/understanding-the-impact-of-buyer-intent-on-campaigns',
    '/blog/tips-for-improving-crm-integration-workflows',
    '/blog/why-data-quality-matters-in-marketing',
    '/blog/creating-behavioral-audience-segments-easily',
    '/blog/why-crm-integration-is-crucial-for-smooth-operations',
    '/blog/multifactor-audience-segmentation-for-campaign-success',
    '/blog/how-omni-channel-orchestration-aligns-marketing-efforts',
    '/blog/guide-to-setting-up-a-consumer-data-platform',
    '/blog/retargeting-tactics-to-boost-offline-conversions',
    '/blog/buyer-intent-based-audience-segmentation-techniques',
    '/blog/discovering-multi-touchpoint-attribution-benefits',
    '/blog/intent-signal-tracking-for-b2b-marketing',
    '/blog/intent-based-marketing-tactics-for-b2b',
    '/blog/how-marketing-contact-data-can-warm-up-cold-leads',
    '/blog/business-database-platforms-for-b2b-growth',
    '/blog/b2b-data-enrichment-for-better-marketing-outcomes',
    '/blog/direct-mail-audience-data-for-smarter-winter-outreach',
    '/blog/unlocking-business-data-enrichment-for-growth',
    '/blog/cdp-for-small-marketing-teams',
    '/blog/b2b-audience-targeting-explained-for-everyday-brands',
    '/blog/holiday-marketing-data-platform-guide',
    '/blog/what-b2c-database-providers-do-for-busy-retailers',
    '/blog/how-business-contact-data-helps-grow-winter-connections',
    '/blog/audience-targeting-software-anyone-can-understand',
  ]

  // Legal pages - low priority, rarely change
  const legalPages = [
    '/privacy',
    '/terms',
  ]

  // Combine all pages
  const allPages = [
    ...corePages,
    ...solutionPages,
    ...industryPages,
    ...secondaryPages,
    ...resourcePages,
    ...blogCategoryPages,
    ...recentBlogPosts,
    ...olderBlogPosts,
    ...legalPages,
  ]

  return allPages.map(url => `${baseUrl}${url}`)
}

/**
 * Notify IndexNow about a single URL or multiple URLs
 *
 * @param urls - Single URL string or array of URLs to notify
 * @returns Promise that resolves when notification is complete
 */
export async function notifyIndexNow(urls: string | string[]): Promise<void> {
  const urlList = Array.isArray(urls) ? urls : [urls]

  if (urlList.length === 0) {
    console.log('[IndexNow] No URLs to notify')
    return
  }

  // Validate URLs
  const validUrls = urlList.filter(url => {
    try {
      new URL(url)
      return url.startsWith(BASE_URL)
    } catch {
      console.warn(`[IndexNow] Invalid URL skipped: ${url}`)
      return false
    }
  })

  if (validUrls.length === 0) {
    console.warn('[IndexNow] No valid URLs to notify after filtering')
    return
  }

  const submission: IndexNowSubmission = {
    host: 'meetcursive.com',
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: validUrls,
  }

  console.log(`[IndexNow] Notifying ${validUrls.length} URLs...`)

  // Submit to primary endpoint (IndexNow API)
  const primaryEndpoint = INDEXNOW_ENDPOINTS[0]

  try {
    const response = await fetch(primaryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(submission),
    })

    if (response.ok) {
      const statusCode = response.status
      if (statusCode === 200) {
        console.log('[IndexNow] Successfully notified search engines')
      } else if (statusCode === 202) {
        console.log('[IndexNow] URLs received and will be processed')
      }
    } else {
      const statusCode = response.status
      let errorMessage = `HTTP ${statusCode}`

      try {
        const errorText = await response.text()
        if (errorText) {
          errorMessage += `: ${errorText}`
        }
      } catch {
        // Ignore error text parsing failures
      }

      if (statusCode === 400) {
        console.error('[IndexNow] Bad request - check URL format and key')
      } else if (statusCode === 403) {
        console.error('[IndexNow] Forbidden - key validation failed')
      } else if (statusCode === 422) {
        console.error('[IndexNow] Unprocessable - URLs may already be submitted')
      } else if (statusCode === 429) {
        console.error('[IndexNow] Too many requests - rate limited')
      } else {
        console.error(`[IndexNow] Error: ${errorMessage}`)
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[IndexNow] Network error: ${error.message}`)
    } else {
      console.error('[IndexNow] Unknown error occurred')
    }

    // Don't throw - we want builds to succeed even if IndexNow fails
    console.warn('[IndexNow] Continuing despite error (non-critical)')
  }
}

/**
 * Notify IndexNow about all pages in the sitemap
 * This should be called after each deployment
 */
export async function notifyAllPages(): Promise<void> {
  const urls = getAllUrls()
  console.log(`[IndexNow] Preparing to notify all ${urls.length} pages from sitemap`)

  // IndexNow supports up to 10,000 URLs per request
  // We'll submit in batches of 100 to be conservative
  const BATCH_SIZE = 100
  const batches = []

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(urls.slice(i, i + BATCH_SIZE))
  }

  console.log(`[IndexNow] Submitting ${batches.length} batch(es)`)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`[IndexNow] Batch ${i + 1}/${batches.length}: ${batch.length} URLs`)

    await notifyIndexNow(batch)

    // Add small delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log('[IndexNow] All batches submitted successfully')
}
