import { MetadataRoute } from 'next'
import { integrations } from '@/lib/integrations-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://meetcursive.com'
  const currentDate = new Date()

  // Core pages - highest priority, frequent updates
  const corePages = [
    { url: '', priority: 1.0, changefreq: 'daily' as const },
    { url: '/platform', priority: 0.9, changefreq: 'weekly' as const },
    { url: '/pricing', priority: 0.9, changefreq: 'weekly' as const },
    { url: '/free-audit', priority: 0.9, changefreq: 'weekly' as const },
    { url: '/marketplace', priority: 0.9, changefreq: 'weekly' as const },
  ]

  // Feature pages - high priority
  const featurePages = [
    '/visitor-identification',
    '/audience-builder',
    '/direct-mail',
    '/data-access',
    '/integrations',
    '/intent-audiences',
  ].map(url => ({
    url,
    priority: 0.8,
    changefreq: 'weekly' as const,
  }))

  // Service/offer pages - high priority
  const servicePages = [
    '/services',
    '/pixel',
    '/custom-audiences',
    '/venture-studio',
  ].map(url => ({
    url,
    priority: 0.8,
    changefreq: 'weekly' as const,
  }))

  // Industry pages - medium-high priority
  const industryPages = [
    '/industries/b2b-software',
    '/industries/agencies',
    '/industries/ecommerce',
    '/industries/financial-services',
    '/industries/education',
    '/industries/home-services',
    '/industries/franchises',
    '/industries/retail',
    '/industries/media-advertising',
  ].map(url => ({
    url,
    priority: 0.7,
    changefreq: 'monthly' as const,
  }))

  // Educational pages - medium-high priority
  const educationalPages = [
    '/what-is-website-visitor-identification',
    '/what-is-b2b-intent-data',
    '/what-is-ai-sdr',
    '/what-is-lead-enrichment',
    '/what-is-direct-mail-automation',
    '/what-is-visitor-deanonymization',
    '/what-is-account-based-marketing',
  ].map(url => ({
    url,
    priority: 0.7,
    changefreq: 'monthly' as const,
  }))

  // Secondary pages - medium priority
  const secondaryPages = [
    '/about',
    '/contact',
    '/demos',
    '/faq',
    '/case-studies',
  ].map(url => ({
    url,
    priority: 0.6,
    changefreq: 'monthly' as const,
  }))

  // Resource hubs - medium-high priority
  const resourcePages = [
    { url: '/resources', priority: 0.7, changefreq: 'weekly' as const },
    { url: '/blog', priority: 0.7, changefreq: 'weekly' as const },
  ]

  // Comparison blog posts - higher priority blog content
  const comparisonBlogPosts = [
    '/blog/clearbit-alternatives-comparison',
    '/blog/rb2b-alternative',
    '/blog/leadfeeder-alternative',
    '/blog/demandbase-alternative',
    '/blog/instantly-alternative',
    '/blog/smartlead-alternative',
    '/blog/clay-alternative',
    '/blog/cursive-vs-rb2b',
    '/blog/cursive-vs-leadfeeder',
    '/blog/cursive-vs-clearbit',
    '/blog/cursive-vs-instantly',
    '/blog/cursive-vs-demandbase',
    '/blog/cursive-vs-apollo',
    '/blog/warmly-vs-cursive-comparison',
    '/blog/apollo-vs-cursive-comparison',
    '/blog/6sense-vs-cursive-comparison',
    '/blog/zoominfo-vs-cursive-comparison',
  ].map(url => ({
    url,
    priority: 0.7,
    changefreq: 'monthly' as const,
  }))

  // Other blog posts - standard priority
  const blogPosts = [
    '/blog/ai-sdr-vs-human-bdr',
    '/blog/cold-email-2026',
    '/blog/scaling-outbound',
    '/blog/icp-targeting-guide',
    '/blog/how-to-identify-website-visitors-technical-guide',
    '/blog/visitor-tracking',
    '/blog/audience-targeting',
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

  // Integration pages - dynamically generated from integrations data
  const integrationPages = integrations.map(i => ({
    url: `/integrations/${i.slug}`,
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
    ...featurePages,
    ...servicePages,
    ...industryPages,
    ...educationalPages,
    ...secondaryPages,
    ...resourcePages,
    ...comparisonBlogPosts,
    ...blogPosts,
    ...integrationPages,
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
 * - /clean-room - Internal page
 *
 * Priority Guidelines:
 * - 1.0: Homepage (most important)
 * - 0.9: Core product pages (platform, pricing, free-audit, marketplace)
 * - 0.8: Feature pages, service/offer pages
 * - 0.7: Industry pages, educational pages, resource hubs, comparison blog posts
 * - 0.6: Secondary pages, other blog posts, integration pages
 * - 0.3: Legal pages
 *
 * Change Frequency Guidelines:
 * - daily: Homepage (with dynamic content)
 * - weekly: Product pages, feature pages, service pages, resource hubs
 * - monthly: Industry pages, educational pages, blog posts, integration pages, secondary pages
 * - yearly: Legal pages
 *
 * Integration pages are dynamically generated from the integrations data module
 * to ensure new integrations are automatically included in the sitemap.
 */
