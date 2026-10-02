/**
 * Static path lists for sitemap.xml. Plain module (no path aliases) so tests can check it against the app directory.
 *
 * Left out on purpose:
 * - /case-studies, /visitor-identification: 301 elsewhere (see next.config.ts).
 * - /call-booked, /deck, /enterprise-deck, /partners/terms, /affiliates: private, thank-you or partner-only pages.
 * - Retired offer pages (/marketplace, /services, ...): 301 to /pricing (see next.config.ts).
 * - /api, /admin, /dashboard, /popup-test, /test: blocked in robots.ts.
 */

export type ChangeFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface SitemapPath {
  url: string
  priority: number
  changeFrequency: ChangeFrequency
}

const entries = (urls: string[], priority: number, changeFrequency: ChangeFrequency): SitemapPath[] =>
  urls.map((url) => ({ url, priority, changeFrequency }))

/** Home, pricing and the add-on page lead. Pricing is the page a buyer needs next. */
export const CORE_PATHS: SitemapPath[] = [
  { url: '', priority: 1.0, changeFrequency: 'weekly' },
  { url: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
  { url: '/pixel', priority: 0.8, changeFrequency: 'monthly' },
]

/** Older product pages, still live. Lower priority than the pricing ladder. */
export const PRODUCT_PATHS: SitemapPath[] = entries(
  [
    '/platform',
    '/superpixel',
    '/free-audit',
    '/data-partnerships',
  ],
  0.6,
  'monthly',
)

export const INTEGRATIONS_INDEX: SitemapPath = { url: '/integrations', priority: 0.7, changeFrequency: 'monthly' }

export const INDUSTRY_PATHS: SitemapPath[] = entries([
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
], 0.6, 'monthly')

export const EDUCATIONAL_PATHS: SitemapPath[] = entries([
  '/what-is-website-visitor-identification',
  '/what-is-b2b-intent-data',
  '/what-is-ai-sdr',
  '/what-is-lead-enrichment',
  '/what-is-direct-mail-automation',
  '/what-is-visitor-deanonymization',
  '/what-is-account-based-marketing',
], 0.6, 'monthly')

export const SECONDARY_PATHS: SitemapPath[] = entries(['/about', '/contact', '/faq', '/resources'], 0.6, 'monthly')

export const BLOG_INDEX: SitemapPath = { url: '/blog', priority: 0.7, changeFrequency: 'weekly' }

/** Every blog post that has a page under app/blog. A test keeps this list in step with the directory. */
export const BLOG_POST_PATHS: SitemapPath[] = entries([
  '/blog/6sense-alternatives-comparison',
  '/blog/6sense-vs-cursive-comparison',
  '/blog/ai-agents-replacing-buyer-journey',
  '/blog/ai-sales-engagement-platform',
  '/blog/ai-sales-tools',
  '/blog/ai-sdr-vs-human-bdr',
  '/blog/amplemarket-alternative',
  '/blog/analytics',
  '/blog/apollo-alternatives-comparison',
  '/blog/apollo-io-vs-zoominfo',
  '/blog/apollo-vs-cursive-comparison',
  '/blog/attribution-moat',
  '/blog/audience-targeting',
  '/blog/audiencelab-alternative',
  '/blog/b2b-lead-generation-guide-2026',
  '/blog/best-ai-sales-assistants',
  '/blog/best-ai-sdr-tools-2026',
  '/blog/best-b2b-data-providers-2026',
  '/blog/best-outreach-platforms',
  '/blog/best-website-visitor-identification-software',
  '/blog/beyond-visitor-identification',
  '/blog/bombora-alternative',
  '/blog/clay-alternative',
  '/blog/clearbit-alternatives-comparison',
  '/blog/cognism-alternative',
  '/blog/cold-email-2026',
  '/blog/compounding-audience',
  '/blog/crm-integration',
  '/blog/cursive-vs-6sense',
  '/blog/cursive-vs-apollo',
  '/blog/cursive-vs-clearbit',
  '/blog/cursive-vs-demandbase',
  '/blog/cursive-vs-instantly',
  '/blog/cursive-vs-leadfeeder',
  '/blog/cursive-vs-rb2b',
  '/blog/cursive-vs-warmly',
  '/blog/cursive-vs-zoominfo',
  '/blog/data-platforms',
  '/blog/datashopper-alternative',
  '/blog/demandbase-alternative',
  '/blog/direct-mail',
  '/blog/email-finder',
  '/blog/gdpr-compliant-visitor-identification',
  '/blog/how-to-identify-anonymous-website-visitors',
  '/blog/how-to-identify-website-visitors-technical-guide',
  '/blog/hunter-io-alternative',
  '/blog/icp-targeting-guide',
  '/blog/identity-resolution-case-studies',
  '/blog/identity-resolution-moat',
  '/blog/instantly-ai-alternative',
  '/blog/instantly-alternative',
  '/blog/intent-data-providers-comparison',
  '/blog/intent-score-acceleration',
  '/blog/international-website-visitor-identification',
  '/blog/klenty-alternative',
  '/blog/lead-generation',
  '/blog/lead-generation-software',
  '/blog/leadfeeder-alternative',
  '/blog/leadiq-alternative',
  '/blog/lemlist-alternative',
  '/blog/lusha-alternative',
  '/blog/opensend-alternative',
  '/blog/outbound-sales-outreach',
  '/blog/outreach-alternative',
  '/blog/overloop-alternative',
  '/blog/qualified-alternative',
  '/blog/r4-signal-model-explained',
  '/blog/rb2b-alternative',
  '/blog/reply-io-alternative',
  '/blog/retargeting',
  '/blog/sales-automation-tools',
  '/blog/sales-engagement-alternatives',
  '/blog/sales-engagement-competitors',
  '/blog/sales-engagement-software',
  '/blog/sales-prospecting-tools',
  '/blog/salesintel-alternative',
  '/blog/salesloft-alternative',
  '/blog/scaling-outbound',
  '/blog/seamless-ai-alternative',
  '/blog/smartlead-alternative',
  '/blog/snov-io-alternative',
  '/blog/state-of-digital-ads-2026',
  '/blog/visitor-tracking',
  '/blog/warmly-alternatives-comparison',
  '/blog/warmly-vs-cursive-comparison',
  '/blog/webmcp-ai-agent-ready-lead-generation',
  '/blog/webmcp-implementation-guide-b2b-saas',
  '/blog/website-visitor-identification-guide',
  '/blog/what-is-b2b-data',
  '/blog/what-is-buyer-intent',
  '/blog/what-is-demand-generation',
  '/blog/what-is-revenue-intelligence',
  '/blog/what-is-sales-intelligence',
  '/blog/what-is-webmcp-guide',
  '/blog/why-intent-data-fails',
  '/blog/zoominfo-alternatives-comparison',
  '/blog/zoominfo-vs-cursive-comparison',
], 0.6, 'monthly')

export const LEGAL_PATHS: SitemapPath[] = entries(['/privacy', '/terms'], 0.3, 'yearly')
