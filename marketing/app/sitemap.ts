import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://meetcursive.com'
  const currentDate = new Date()

  // Core pages - highest priority, frequent updates
  const corePages = [
    { url: '', priority: 1.0, changefreq: 'daily' as const },
    { url: '/platform', priority: 0.9, changefreq: 'weekly' as const },
    { url: '/pricing', priority: 0.9, changefreq: 'weekly' as const },
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
  ].map(url => ({
    url,
    priority: 0.8,
    changefreq: 'weekly' as const,
  }))

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
  ].map(url => ({
    url,
    priority: 0.7,
    changefreq: 'monthly' as const,
  }))

  // Secondary pages - medium priority
  const secondaryPages = [
    '/services',
    '/about',
    '/contact',
    '/demos',
    '/faq',
  ].map(url => ({
    url,
    priority: 0.6,
    changefreq: 'monthly' as const,
  }))

  // Resources and blog hub - medium priority
  const resourcePages = [
    { url: '/resources', priority: 0.7, changefreq: 'weekly' as const },
    { url: '/blog', priority: 0.7, changefreq: 'daily' as const },
    { url: '/case-studies', priority: 0.7, changefreq: 'monthly' as const },
  ]

  // Blog posts - organized by recency
  // Recent posts - higher priority
  const recentBlogPosts = [
    '/blog/clearbit-alternatives-comparison',
    '/blog/how-to-identify-website-visitors-technical-guide',
    '/blog/zoominfo-vs-cursive-comparison',
    '/blog/apollo-vs-cursive-comparison',
    '/blog/warmly-vs-cursive-comparison',
    '/blog/6sense-vs-cursive-comparison',
    '/blog/scaling-outbound',
    '/blog/icp-targeting-guide',
    '/blog/cold-email-2026',
    '/blog/ai-sdr-vs-human-bdr',
  ].map(url => ({
    url,
    priority: 0.7,
    changefreq: 'monthly' as const,
  }))

  // Evergreen blog posts - standard priority
  const blogPosts = [
    '/blog/audience-targeting',
    '/blog/visitor-tracking',
    '/blog/data-platforms',
    '/blog/direct-mail',
    '/blog/crm-integration',
    '/blog/retargeting',
    '/blog/analytics',
    '/blog/lead-generation',
  ].map(url => ({
    url,
    priority: 0.6,
    changefreq: 'monthly' as const,
  }))

  // Legal pages - low priority, rarely change
  const legalPages = [
    { url: '/privacy', priority: 0.3, changefreq: 'yearly' as const },
    { url: '/terms', priority: 0.3, changefreq: 'yearly' as const },
  ]

  // Combine all pages
  const allPages = [
    ...corePages,
    ...solutionPages,
    ...industryPages,
    ...secondaryPages,
    ...resourcePages,
    ...recentBlogPosts,
    ...blogPosts,
    ...legalPages,
  ]

  return allPages.map(({ url, priority, changefreq }) => ({
    url: `${baseUrl}${url}`,
    lastModified: currentDate,
    changeFrequency: changefreq,
    priority,
  }))
}

/**
 * Sitemap Configuration Notes:
 *
 * Excluded paths (automatically excluded by Next.js or via robots.txt):
 * - /api/* - API routes
 * - /popup-test - Internal testing page
 *
 * Priority Guidelines:
 * - 1.0: Homepage (most important)
 * - 0.9: Core product pages (platform, pricing)
 * - 0.8: Solution pages
 * - 0.7: Industry pages, resource hubs, recent blog posts
 * - 0.6: Secondary pages, evergreen blog posts
 * - 0.3: Legal pages
 *
 * Change Frequency Guidelines:
 * - daily: Homepage (with dynamic content)
 * - weekly: Product pages, solution pages, resource hubs
 * - monthly: Industry pages, blog posts, secondary pages
 * - yearly: Legal pages
 *
 * Dynamic Routes:
 * For dynamic blog routes like /blog/[category]/[slug], implement generateStaticParams()
 * in the page component to include them in the sitemap at build time.
 */
