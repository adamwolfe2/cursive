import { NextResponse } from "next/server"

/**
 * GET /api/ai-info
 *
 * Public endpoint that returns Cursive's full product info as structured JSON.
 * Gives any LLM or agent a single URL to fetch structured data about Cursive,
 * independent of WebMCP browser support.
 */
export async function GET() {
  return NextResponse.json(
    {
      company: "Cursive",
      url: "https://meetcursive.com",
      tagline: "Turn Website Visitors Into Booked Meetings",
      description:
        "AI-powered visitor identification and outbound automation for B2B companies. Identifies 70% of anonymous website visitors, enriches them against 220M+ verified contacts, and automates personalized outreach across email, LinkedIn, and SMS.",
      products: [
        {
          name: "Visitor Identification",
          url: "/visitor-identification",
          description:
            "Identify 70% of anonymous visitors with name, company, email, and browsing behavior in real-time",
        },
        {
          name: "Lead Marketplace",
          url: "/marketplace",
          price: "$0.60/lead",
          description:
            "Self-serve B2B lead marketplace. Browse and buy verified leads with credits. 100 free credits to start.",
        },
        {
          name: "Intent Data Audiences",
          url: "/intent-audiences",
          description:
            "450B+ monthly intent signals across 30,000+ categories. Pre-built segments with verified purchase intent.",
        },
        {
          name: "Audience Builder",
          url: "/audience-builder",
          description:
            "Build unlimited audiences from 220M+ consumer and 140M+ business profiles. No caps or restrictive licensing.",
        },
        {
          name: "AI Studio",
          url: "/platform",
          description:
            "AI SDR for email, LinkedIn, SMS outreach with autonomous follow-ups, brand voice training, and meeting booking.",
        },
        {
          name: "Direct Mail",
          url: "/direct-mail",
          description:
            "Physical postcards triggered by digital behavior, delivered in 48 hours with scan-rate tracking.",
        },
        {
          name: "Custom Audiences",
          url: "/custom-audiences",
          price: "$0.50/lead",
          description:
            "Bespoke B2B lead lists built to your exact ICP. Free 25-lead sample in 48 hours.",
        },
      ],
      services: [
        {
          name: "Cursive Data",
          price: "$1,000/mo",
          annual_price: "$800/mo",
          url: "/services#data",
          description:
            "500-2,000 verified leads/month with custom ICP targeting and 95%+ email deliverability.",
        },
        {
          name: "Cursive Outbound",
          price: "$2,500/mo",
          annual_price: "$2,000/mo",
          label: "Most Popular",
          url: "/services#outbound",
          description:
            "Done-for-you email campaigns with AI personalization, infrastructure setup, and weekly strategy calls.",
        },
        {
          name: "Cursive Pipeline",
          price: "$5,000/mo",
          annual_price: "$4,000/mo",
          url: "/services#pipeline",
          description:
            "Full-stack AI SDR across email, LinkedIn, and SMS with unlimited enrichment and dedicated success manager.",
        },
      ],
      stats: {
        visitor_id_rate: "70%",
        consumer_profiles: "220M+",
        business_profiles: "140M+",
        intent_signals_monthly: "450B+",
        intent_categories: "30,000+",
        integrations: "200+",
        data_accuracy: "95%+",
      },
      results: [
        {
          headline: "$11M Revenue Generated",
          detail: "AI SaaS company in 30 days",
        },
        {
          headline: "40x Return on Ad Spend",
          detail: "Custom audience targeting",
        },
        {
          headline: "$24M Pipeline Created",
          detail: "Medical tech in 3 days",
        },
        {
          headline: "5x CPC Reduction",
          detail: "Insurtech Facebook campaigns",
        },
      ],
      actions: {
        book_demo: "https://cal.com/cursive/30min",
        free_signup: "https://leads.meetcursive.com/signup",
        free_audit: "https://meetcursive.com/free-audit",
        contact_email: "hello@meetcursive.com",
        contact_page: "https://meetcursive.com/contact",
      },
      industries: [
        "B2B Software",
        "Agencies",
        "Ecommerce",
        "Financial Services",
        "Home Services",
        "Education",
        "Franchises",
        "Retail",
        "Media & Advertising",
      ],
      webmcp_tools: [
        "getCursivePricing",
        "compareCursiveToCompetitor",
        "getCursiveCapabilities",
        "bookCursiveDemo",
        "getCursiveResults",
        "getCursiveIndustries",
      ],
      machine_readable: {
        llms_txt: "https://meetcursive.com/llms.txt",
        robots_txt: "https://meetcursive.com/robots.txt",
        sitemap: "https://meetcursive.com/sitemap.xml",
      },
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  )
}
