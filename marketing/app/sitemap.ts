import { MetadataRoute } from 'next'
import { integrations } from '@/lib/integrations-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.meetcursive.com'
  const lastModified = new Date() // Dynamic: always current build time for freshness signals

  // Core pages - highest priority
  const corePages = [
    { url: '', priority: 1.0, changefreq: 'weekly' as const },
    { url: '/platform', priority: 0.9, changefreq: 'weekly' as const },
    { url: '/pricing', priority: 0.9, changefreq: 'weekly' as const },
    { url: '/free-audit', priority: 0.9, changefreq: 'weekly' as const },
    { url: '/marketplace', priority: 0.9, changefreq: 'weekly' as const },
  ]

  // Feature pages - main feature/product pages
  const featurePages = [
    '/visitor-identification',
    '/audience-builder',
    '/direct-mail',
    '/data-access',
    '/integrations',
    '/intent-audiences',
  ].map(url => ({
    url,
    priority: 0.9,
    changefreq: 'weekly' as const,
  }))

  // Service/offer pages - main feature/product pages
  const servicePages = [
    '/services',
    '/pixel',
    '/custom-audiences',
    '/venture-studio',
  ].map(url => ({
    url,
    priority: 0.9,
    changefreq: 'weekly' as const,
  }))

  // Industry pages
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
    '/industries/real-estate',
    '/industries/technology',
  ].map(url => ({
    url,
    priority: 0.8,
    changefreq: 'monthly' as const,
  }))

  // Educational/resource pages
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
    priority: 0.6,
    changefreq: 'monthly' as const,
  }))

  // Secondary pages
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

  // Resource hubs
  const resourcePages = [
    { url: '/resources', priority: 0.6, changefreq: 'monthly' as const },
    { url: '/blog', priority: 0.7, changefreq: 'weekly' as const },
  ]

  // Comparison blog posts - all blog posts at 0.7
  const comparisonBlogPosts = [
    // Existing competitor "alternative" pages
    '/blog/clearbit-alternatives-comparison',
    '/blog/rb2b-alternative',
    '/blog/leadfeeder-alternative',
    '/blog/demandbase-alternative',
    '/blog/instantly-alternative',
    '/blog/smartlead-alternative',
    '/blog/clay-alternative',
    // New competitor alternative pages (created Feb 2026)
    '/blog/datashopper-alternative',
    '/blog/lusha-alternative',
    '/blog/cognism-alternative',
    '/blog/salesintel-alternative',
    '/blog/hunter-io-alternative',
    '/blog/seamless-ai-alternative',
    '/blog/audiencelab-alternative',
    '/blog/opensend-alternative',
    // Existing "cursive vs" pages
    '/blog/cursive-vs-rb2b',
    '/blog/cursive-vs-leadfeeder',
    '/blog/cursive-vs-clearbit',
    '/blog/cursive-vs-instantly',
    '/blog/cursive-vs-demandbase',
    '/blog/cursive-vs-apollo',
    // New "cursive vs" pages (created Feb 2026)
    '/blog/cursive-vs-zoominfo',
    // Existing competitor "vs cursive" pages
    '/blog/warmly-vs-cursive-comparison',
    '/blog/apollo-vs-cursive-comparison',
    '/blog/6sense-vs-cursive-comparison',
    '/blog/zoominfo-vs-cursive-comparison',
    // Existing alternative roundup pages
    '/blog/6sense-alternatives-comparison',
    '/blog/apollo-alternatives-comparison',
    '/blog/warmly-alternatives-comparison',
    '/blog/zoominfo-alternatives-comparison',
  ].map(url => ({
    url,
    priority: 0.7,
    changefreq: 'monthly' as const,
  }))

  // Other blog posts
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
    // New roundup/buying-intent posts (created Feb 2026)
    '/blog/best-b2b-data-providers-2026',
    '/blog/best-website-visitor-identification-software',
    '/blog/intent-data-providers-comparison',
    '/blog/how-to-identify-anonymous-website-visitors',
    '/blog/best-ai-sdr-tools-2026',
    // AI/WebMCP posts
    '/blog/ai-agents-replacing-buyer-journey',
    '/blog/webmcp-ai-agent-ready-lead-generation',
    '/blog/webmcp-implementation-guide-b2b-saas',
    '/blog/what-is-webmcp-guide',
  ].map(url => ({
    url,
    priority: 0.7,
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
    lastModified,
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
 * - 1.0: Homepage
 * - 0.9: Core product pages (platform, pricing, free-audit, marketplace), feature pages, service pages
 * - 0.8: Industry pages
 * - 0.7: Blog posts, blog index
 * - 0.6: Educational/resource pages, secondary pages, integration pages
 * - 0.3: Legal pages
 *
 * Change Frequency Guidelines:
 * - weekly: Homepage, product pages, feature pages, service pages, blog index
 * - monthly: Industry pages, educational pages, blog posts, integration pages, secondary pages, resources
 * - yearly: Legal pages
 *
 * Integration pages are dynamically generated from the integrations data module
 * to ensure new integrations are automatically included in the sitemap.
 */
