import { NextResponse } from 'next/server'

const BASE_URL = 'https://www.meetcursive.com'

const blogPosts = [
  // Competitor alternative pages
  {
    title: 'Best Clearbit Alternatives After HubSpot Acquisition: 10 Tools Compared (2026)',
    description: 'Clearbit was acquired by HubSpot in 2023. We compared 10 alternatives for B2B enrichment, visitor identification, and lead intelligence.',
    url: '/blog/clearbit-alternatives-comparison',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best RB2B Alternatives: 7 Visitor Identification Tools Compared (2026)',
    description: 'Compare the top alternatives to RB2B for identifying anonymous website visitors. Features, pricing, identification rates, and integrations compared.',
    url: '/blog/rb2b-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best Leadfeeder Alternatives: 7 B2B Visitor ID Tools Compared (2026)',
    description: 'Find the best Leadfeeder alternatives for website visitor identification, company-level vs person-level data, and CRM integration.',
    url: '/blog/leadfeeder-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best Demandbase Alternatives: 7 ABM Platforms Compared (2026)',
    description: 'Compare the best Demandbase alternatives for account-based marketing. Full feature, pricing, and use case comparison.',
    url: '/blog/demandbase-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best Instantly Alternatives: 7 Cold Email Platforms Compared (2026)',
    description: 'Find the best Instantly.ai alternatives for cold email outreach, deliverability, and multi-channel sequences.',
    url: '/blog/instantly-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best Smartlead Alternatives: 7 Cold Outreach Tools Compared (2026)',
    description: 'Compare top Smartlead alternatives for cold email infrastructure, LinkedIn automation, and agency-focused features.',
    url: '/blog/smartlead-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best Clay Alternatives: 7 B2B Data Enrichment Tools Compared (2026)',
    description: 'Find the best Clay alternatives for prospect research, data enrichment, and outreach automation.',
    url: '/blog/clay-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best Datashopper Alternatives: 7 B2B Data Providers Compared (2026)',
    description: 'Compare the best alternatives to Datashopper for B2B data, visitor identification, and AI outreach automation.',
    url: '/blog/datashopper-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best Lusha Alternatives: 7 B2B Contact Data Tools Compared (2026)',
    description: 'Compare the best Lusha alternatives with higher match rates, no per-user credit limits, and built-in outreach automation.',
    url: '/blog/lusha-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best Cognism Alternatives: 7 B2B Data Providers Compared (2026)',
    description: 'Best alternatives to Cognism for US data coverage, phone-verified contacts, and built-in outreach automation.',
    url: '/blog/cognism-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best SalesIntel Alternatives: 7 B2B Data Tools Compared (2026)',
    description: 'Compare the best SalesIntel alternatives for human-verified B2B contact data and outreach automation.',
    url: '/blog/salesintel-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best Hunter.io Alternatives: 7 Email Finder Tools Compared (2026)',
    description: 'Best alternatives to Hunter.io for teams that need phone numbers, visitor identification, and automated outreach.',
    url: '/blog/hunter-io-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best Seamless.AI Alternatives: 7 B2B Data Platforms Compared (2026)',
    description: 'Compare the best Seamless.AI alternatives for real-time B2B data enrichment, visitor identification, and AI outreach.',
    url: '/blog/seamless-ai-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best AudienceLab Alternatives: Cursive vs AudienceLab (2026)',
    description: 'How Cursive compares to AudienceLab — full pipeline activation (visitor ID + outreach) vs raw data infrastructure.',
    url: '/blog/audiencelab-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Best Opensend Alternatives: 7 Visitor ID Tools Compared (2026)',
    description: 'Compare the best Opensend alternatives at 70% identification rate with full outreach automation included.',
    url: '/blog/opensend-alternative',
    date: '2026-02-18',
    category: 'Comparison',
  },
  // Head-to-head comparisons
  {
    title: 'Cursive vs RB2B: 70% vs 50-60% ID Rate — Full Comparison (2026)',
    description: 'Cursive vs RB2B compared on visitor identification rate, person-level data, AI outreach, CRM integrations, and pricing.',
    url: '/blog/cursive-vs-rb2b',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Cursive vs Leadfeeder: Person vs Company ID, $1k vs $139/mo (2026)',
    description: 'Cursive identifies individual visitors by name and email. Leadfeeder shows company-level data only. Full comparison of features, pricing, and use cases.',
    url: '/blog/cursive-vs-leadfeeder',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Cursive vs Clearbit: Best Clearbit Replacement After HubSpot Acquisition (2026)',
    description: 'Clearbit was acquired by HubSpot. Compare Cursive as a Clearbit replacement — visitor ID + AI activation vs enrichment-only data delivery.',
    url: '/blog/cursive-vs-clearbit',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Cursive vs Instantly: $1k/mo Full Stack vs Email-Only at $97/mo (2026)',
    description: 'Compare Cursive and Instantly for B2B outreach. Cursive combines visitor ID, AI email, LinkedIn, SMS, and direct mail. Instantly is email-only infrastructure.',
    url: '/blog/cursive-vs-instantly',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Cursive vs Demandbase: $1k/mo vs $50k+/yr — Full ABM Stack Compared (2026)',
    description: 'Compare Cursive and Demandbase for ABM. Demandbase costs $50k+/year with long implementation. Cursive delivers ABM-like capabilities at $1k/mo.',
    url: '/blog/cursive-vs-demandbase',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Cursive vs Apollo: 70% Visitor ID + $1k/mo vs Cold Contact Database (2026)',
    description: 'Apollo has 250M+ contacts for cold outreach. Cursive identifies 70% of YOUR website visitors and automates warm, personalized outreach at $1k/mo.',
    url: '/blog/cursive-vs-apollo',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Cursive vs ZoomInfo: $1k/mo vs $15k-$50k/yr — Full Comparison (2026)',
    description: 'Compare Cursive and ZoomInfo on pricing, data coverage, visitor identification, intent data, and AI outreach automation.',
    url: '/blog/cursive-vs-zoominfo',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Cursive vs Warmly: 70% vs 40% ID Rate, $1k vs $3.5k/mo (2026)',
    description: 'Cursive vs Warmly compared on visitor identification rate, person-level data, automated outreach, and pricing. Cursive identifies 70% of B2B visitors vs Warmly\'s 40% at $1k vs $3.5k/mo.',
    url: '/blog/cursive-vs-warmly',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Cursive vs 6sense: $1k/mo All-In vs $50k-$200k/yr Enterprise (2026)',
    description: 'Compare Cursive and 6sense for B2B revenue intelligence. 6sense costs $50,000-$200,000/year with 6-12 month implementation. Cursive delivers visitor ID, AI outreach, and direct mail for $1,000/month.',
    url: '/blog/cursive-vs-6sense',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Warmly vs Cursive: 70% vs 40% ID Rate, $1k vs $3.5k/mo (2026)',
    description: 'Warmly vs Cursive compared on visitor identification rate, person-level data, pricing, and outreach automation.',
    url: '/blog/warmly-vs-cursive-comparison',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'Apollo vs Cursive: Cold Prospecting vs Warm Visitor Outreach (2026)',
    description: 'Apollo vs Cursive — two different approaches to B2B pipeline. Cold database prospecting vs warm, intent-driven visitor outreach.',
    url: '/blog/apollo-vs-cursive-comparison',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: '6sense vs Cursive: $50k-$200k/yr vs $1k/mo — Intent Data Compared (2026)',
    description: '6sense vs Cursive compared on intent data, visitor identification, pricing, and ABM capabilities.',
    url: '/blog/6sense-vs-cursive-comparison',
    date: '2026-02-18',
    category: 'Comparison',
  },
  {
    title: 'ZoomInfo vs Cursive: Enterprise Database vs Intent-First Platform (2026)',
    description: 'ZoomInfo vs Cursive — which B2B data platform fits your team? Full comparison of data coverage, pricing, integrations, and outreach automation.',
    url: '/blog/zoominfo-vs-cursive-comparison',
    date: '2026-02-18',
    category: 'Comparison',
  },
  // Best-of roundups
  {
    title: 'Best Intent Data Providers Compared: 8 Platforms Ranked (2026)',
    description: 'Compare the top 8 B2B intent data providers. Find the best platform based on signal volume, update frequency, pricing, and integrations.',
    url: '/blog/intent-data-providers-comparison',
    date: '2026-02-18',
    category: 'Buying Guide',
  },
  {
    title: 'Best B2B Data Providers in 2026: 10 Platforms Compared',
    description: 'Compare the 10 best B2B data providers for sales intelligence, contact data, and intent signals — with pricing, ratings, and a buyer\'s guide.',
    url: '/blog/best-b2b-data-providers-2026',
    date: '2026-02-18',
    category: 'Buying Guide',
  },
  {
    title: 'Best Website Visitor Identification Software 2026: 8 Tools Ranked',
    description: 'Compare the 8 best website visitor identification tools. ID rates, person vs company-level data, pricing, and CRM integrations compared.',
    url: '/blog/best-website-visitor-identification-software',
    date: '2026-02-18',
    category: 'Buying Guide',
  },
  {
    title: 'Best AI SDR Tools for 2026: 9 Platforms Ranked and Compared',
    description: 'Compare the 9 best AI SDR platforms for 2026 — from intent-first outbound to autonomous AI agents. With pricing, highlights, and limitations.',
    url: '/blog/best-ai-sdr-tools-2026',
    date: '2026-02-18',
    category: 'Buying Guide',
  },
  // Alternative roundups
  {
    title: 'Best 6sense Alternatives: 7 ABM Platforms Compared (2026)',
    description: 'Compare the best 6sense alternatives at a fraction of the cost — with intent data, visitor identification, and AI outreach included.',
    url: '/blog/6sense-alternatives-comparison',
    date: '2026-02-04',
    category: 'Comparison',
  },
  {
    title: 'Best Apollo Alternatives: 7 Prospecting Platforms Compared (2026)',
    description: 'Find the best Apollo.io alternatives for B2B prospecting, contact data, and sales automation.',
    url: '/blog/apollo-alternatives-comparison',
    date: '2026-02-04',
    category: 'Comparison',
  },
  {
    title: 'Best Warmly Alternatives: 7 Visitor ID Tools Compared (2026)',
    description: 'Compare the best Warmly alternatives for website visitor identification and signal-based outreach.',
    url: '/blog/warmly-alternatives-comparison',
    date: '2026-02-04',
    category: 'Comparison',
  },
  {
    title: 'Best ZoomInfo Alternatives: 7 B2B Data Platforms Compared (2026)',
    description: 'Compare the best ZoomInfo alternatives without enterprise contracts — with visitor ID, intent data, and outreach automation.',
    url: '/blog/zoominfo-alternatives-comparison',
    date: '2026-02-04',
    category: 'Comparison',
  },
  // How-to guides
  {
    title: 'How to Identify Anonymous Website Visitors: Complete B2B Guide (2026)',
    description: 'Step-by-step guide to identifying anonymous website visitors using IP resolution, device fingerprinting, and identity matching. Turn 70% of anonymous traffic into qualified leads.',
    url: '/blog/how-to-identify-anonymous-website-visitors',
    date: '2026-02-18',
    category: 'Guide',
  },
  {
    title: 'How to Identify Website Visitors: Technical Guide',
    description: 'Learn the technical methods behind website visitor identification — IP tracking, reverse lookup, cookie-based tracking, and privacy-compliant approaches.',
    url: '/blog/how-to-identify-website-visitors-technical-guide',
    date: '2026-02-04',
    category: 'Guide',
  },
  {
    title: 'What Is Revenue Intelligence? Complete Guide for B2B Sales Teams (2026)',
    description: 'Revenue intelligence combines AI analysis of sales activities, customer interactions, and market signals to give revenue teams actionable insights. How it works, what tools are involved, and how to use it.',
    url: '/blog/what-is-revenue-intelligence',
    date: '2026-02-18',
    category: 'Guide',
  },
  // Strategy guides
  {
    title: 'AI SDR vs Human BDR: Which Drives More Pipeline in 2026?',
    description: 'Comparing AI-powered sales development reps to traditional human BDRs: cost, speed, personalization, and results.',
    url: '/blog/ai-sdr-vs-human-bdr',
    date: '2026-02-04',
    category: 'Strategy',
  },
  {
    title: 'Cold Email Strategy for 2026: What Still Works',
    description: 'Updated strategies for cold email outreach that still works in 2026, with deliverability best practices and reply rate benchmarks.',
    url: '/blog/cold-email-2026',
    date: '2026-02-04',
    category: 'Strategy',
  },
  {
    title: 'Scaling Outbound Sales Without Scaling Headcount',
    description: 'How to scale outbound sales without proportionally scaling headcount using automation, AI, and intent-driven targeting.',
    url: '/blog/scaling-outbound',
    date: '2026-02-04',
    category: 'Strategy',
  },
  {
    title: 'ICP Targeting Guide: Define and Reach Your Ideal Customer Profile',
    description: 'Step-by-step guide to defining and targeting your ideal customer profile for B2B outbound sales.',
    url: '/blog/icp-targeting-guide',
    date: '2026-02-04',
    category: 'Strategy',
  },
]

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Cursive Blog — B2B Lead Generation &amp; Visitor Identification</title>
    <link>${BASE_URL}/blog</link>
    <description>Guides, comparisons, and strategies for B2B lead generation, website visitor identification, intent data, and AI-powered outreach automation.</description>
    <language>en-us</language>
    <managingEditor>hello@meetcursive.com (Cursive)</managingEditor>
    <webMaster>hello@meetcursive.com (Cursive)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/cursive-logo.png</url>
      <title>Cursive</title>
      <link>${BASE_URL}/blog</link>
    </image>
${blogPosts.map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}${post.url}</link>
      <guid isPermaLink="true">${BASE_URL}${post.url}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category>${escapeXml(post.category)}</category>
    </item>`).join('\n')}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
