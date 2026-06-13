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
        "Self-serve visitor identification and in-market audience plans for B2B companies. Identify companies and people visiting your website or receive a fresh weekly buyer audience in Google Sheets.",
      products: [
        {
          name: "Visitor Identification",
          url: "/visitor-identification",
          description:
            "Identify 60–70% of anonymous visitors with name, company, email, and browsing behavior in real-time",
        },
        {
          name: "Custom Audience",
          url: "https://leads.meetcursive.com/get-leads",
          price: "$197/mo",
          description:
            "Fresh weekly in-market audience delivered to Google Sheets. Month-to-month with no setup fee; cancel anytime.",
        },
        {
          name: "Intent Data Audiences",
          url: "/intent-audiences",
          description:
            "60B+ behaviors & URLs scanned weekly across 30,000+ categories. Pre-built segments with verified purchase intent.",
        },
        {
          name: "Audience Builder",
          url: "/audience-builder",
          description:
            "Build unlimited audiences from 280M US consumer and 140M+ business profiles. No caps or restrictive licensing.",
        },
        {
          name: "Google Sheets Delivery",
          url: "https://leads.meetcursive.com/get-leads",
          description:
            "Receive a fresh weekly list of in-market buyers directly in Google Sheets with the Custom Audience plan.",
        },
        {
          name: "Flexible Plan Terms",
          url: "https://leads.meetcursive.com/get-leads",
          description:
            "All three self-serve plans are month-to-month with no setup fee and can be canceled anytime.",
        },
        {
          name: "Pixel + Audience Bundle",
          url: "https://leads.meetcursive.com/get-leads",
          price: "$247/mo",
          description:
            "Combine website visitor identification with a fresh weekly in-market audience. Month-to-month with no setup fee; cancel anytime.",
        },
      ],
      services: [
        {
          name: "Visitor Pixel",
          price: "$97/mo",
          annual_price: "Month-to-month",
          url: "https://leads.meetcursive.com/get-leads",
          description:
            "Identify companies and people visiting your website. No setup fee; cancel anytime.",
        },
        {
          name: "Custom Audience",
          price: "$197/mo",
          annual_price: "Month-to-month",
          label: "Most Popular",
          url: "https://leads.meetcursive.com/get-leads",
          description:
            "Receive a fresh weekly list of in-market buyers in Google Sheets. No setup fee; cancel anytime.",
        },
        {
          name: "Pixel + Audience Bundle",
          price: "$247/mo",
          annual_price: "Month-to-month",
          url: "https://leads.meetcursive.com/get-leads",
          description:
            "Get website visitor identification plus a fresh weekly in-market audience. No setup fee; cancel anytime.",
        },
      ],
      stats: {
        visitor_id_rate: "60–70%",
        consumer_profiles: "280M",
        business_profiles: "140M+",
        intent_signals_monthly: "60B+",
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
        book_demo: "https://cal.com/cursiveteam/30min",
        free_signup: "https://leads.meetcursive.com/get-leads",
        free_audit: "https://meetcursive.com/free-audit",
        contact_email: "hey@meetcursive.com",
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
