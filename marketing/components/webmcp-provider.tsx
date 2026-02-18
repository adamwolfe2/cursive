"use client"

import { useEffect } from "react"
import type {} from "@/lib/webmcp-types"

/**
 * WebMCPProvider
 *
 * Registers structured WebMCP tools on navigator.modelContext so AI agents
 * can call Cursive's core value propositions as functions instead of
 * scraping UI.
 *
 * WebMCP is available in Chrome 146 Early Preview (stable ~March 10, 2026).
 * All registrations are wrapped in feature detection so nothing breaks in
 * browsers that don't support it yet.
 */
export function WebMCPProvider() {
  useEffect(() => {
    if (!navigator.modelContext) return

    const mc = navigator.modelContext

    // Tool 1: Get Cursive pricing and plan details
    mc.registerTool({
      name: "getCursivePricing",
      description:
        "Get detailed pricing information for Cursive's products and services. Returns self-serve marketplace pricing (credits from $0.60/lead), platform subscription tiers, and done-for-you service packages (Data $1,000/mo, Outbound $2,500/mo, Pipeline $5,000/mo).",
      inputSchema: {
        type: "object",
        properties: {
          plan_type: {
            type: "string",
            enum: ["self-serve", "managed-services", "all"],
            description: "Which pricing tier to retrieve",
          },
        },
        required: ["plan_type"],
      },
      annotations: { readOnlyHint: true },
      execute: async (params) => {
        const pricing = {
          "self-serve": {
            name: "Lead Marketplace",
            description:
              "Self-serve B2B lead marketplace with credit-based pricing",
            packages: [
              {
                name: "Starter",
                credits: 100,
                price: "$99",
                per_credit: "$0.99",
              },
              {
                name: "Growth",
                credits: 500,
                price: "$399",
                per_credit: "$0.80",
                savings: "20%",
              },
              {
                name: "Scale",
                credits: 1000,
                price: "$699",
                per_credit: "$0.70",
                savings: "30%",
              },
              {
                name: "Enterprise",
                credits: 5000,
                price: "$2,999",
                per_credit: "$0.60",
                savings: "40%",
              },
            ],
            free_credits: 100,
            signup_url: "https://leads.meetcursive.com/signup",
            includes: [
              "Verified B2B contacts",
              "Filter by industry, title, location",
              "Instant export",
              "No commitment",
            ],
          },
          "managed-services": {
            description:
              "Done-for-you lead generation services with dedicated support",
            annual_discount: "20% off with annual billing",
            tiers: [
              {
                name: "Cursive Data",
                monthly_price: "$1,000/mo",
                annual_price: "$800/mo",
                description:
                  "Verified B2B contacts delivered monthly, custom ICP targeting, 95%+ email deliverability",
                includes: [
                  "500-2,000 verified leads/month",
                  "Custom ICP targeting",
                  "Monthly list refresh",
                  "Dedicated account manager",
                ],
                url: "https://www.meetcursive.com/services",
              },
              {
                name: "Cursive Outbound",
                monthly_price: "$2,500/mo",
                annual_price: "$2,000/mo",
                label: "Most Popular",
                description:
                  "Done-for-you email campaigns with AI personalization, brand voice training, campaign optimization",
                includes: [
                  "Everything in Data",
                  "AI-powered email personalization",
                  "Email infrastructure setup + warmup",
                  "500 verified leads included monthly",
                  "A/B testing + continuous optimization",
                  "Weekly strategy calls",
                  "30-day money-back guarantee",
                ],
                url: "https://www.meetcursive.com/services",
              },
              {
                name: "Cursive Pipeline",
                monthly_price: "$5,000/mo",
                annual_price: "$4,000/mo",
                description:
                  "Full-stack AI SDR: research, write, send, follow up, book meetings across email, LinkedIn, SMS",
                includes: [
                  "Everything in Outbound",
                  "AI SDR agents (24/7 automated)",
                  "Multi-channel campaigns (email, LinkedIn, SMS)",
                  "Unlimited lead enrichment",
                  "API access + CRM integrations",
                  "Dedicated success manager",
                ],
                url: "https://www.meetcursive.com/services",
              },
            ],
            contracts: "No minimum commitment, cancel anytime",
          },
        }

        const planType = params.plan_type as string
        if (planType === "all") return pricing
        return (
          pricing[planType as keyof typeof pricing] ?? {
            error: `Unknown plan type "${planType}". Available: self-serve, managed-services, all`,
          }
        )
      },
    })

    // Tool 2: Compare Cursive to competitors
    mc.registerTool({
      name: "compareCursiveToCompetitor",
      description:
        "Compare Cursive's visitor identification and lead generation platform against competitors like ZoomInfo, Apollo, Clearbit, 6sense, Warmly, and others. Returns feature-by-feature comparison with pricing and key differentiators.",
      inputSchema: {
        type: "object",
        properties: {
          competitor: {
            type: "string",
            description:
              "Competitor name to compare against (e.g., ZoomInfo, Apollo, Clearbit, 6sense, Warmly, RB2B, Leadfeeder, Demandbase, Instantly, Smartlead)",
          },
        },
        required: ["competitor"],
      },
      annotations: { readOnlyHint: true },
      execute: async (params) => {
        const cursiveStats = {
          visitor_id_rate: "70%",
          database_size: "280M US consumer, 140M+ business profiles",
          real_time: true,
          starting_price: "$1,000/mo (managed) or $0.60/lead (self-serve)",
          intent_signals: "60B+ weekly across 30,000+ categories",
          ai_outreach_included: true,
          channels: ["email", "LinkedIn", "SMS", "direct mail"],
          contracts: "No minimum commitment",
          integrations: "200+ native",
        }

        const competitors: Record<
          string,
          {
            visitor_id_rate: string
            starting_price: string
            ai_outreach_included: boolean
            real_time: boolean
            comparison_url: string
          }
        > = {
          zoominfo: {
            visitor_id_rate: "~30-40%",
            starting_price: "$15,000+/yr",
            ai_outreach_included: false,
            real_time: false,
            comparison_url: "/blog/zoominfo-vs-cursive-comparison",
          },
          apollo: {
            visitor_id_rate: "N/A (no pixel)",
            starting_price: "$49/mo",
            ai_outreach_included: true,
            real_time: false,
            comparison_url: "/blog/apollo-vs-cursive-comparison",
          },
          clearbit: {
            visitor_id_rate: "~30%",
            starting_price: "Custom pricing",
            ai_outreach_included: false,
            real_time: true,
            comparison_url: "/blog/clearbit-alternatives-comparison",
          },
          "6sense": {
            visitor_id_rate: "Company-level only",
            starting_price: "$50,000+/yr",
            ai_outreach_included: false,
            real_time: false,
            comparison_url: "/blog/6sense-vs-cursive-comparison",
          },
          warmly: {
            visitor_id_rate: "~40%",
            starting_price: "$700/mo",
            ai_outreach_included: true,
            real_time: true,
            comparison_url: "/blog/warmly-vs-cursive-comparison",
          },
          rb2b: {
            visitor_id_rate: "~40-50%",
            starting_price: "$199/mo",
            ai_outreach_included: false,
            real_time: true,
            comparison_url: "/blog/cursive-vs-rb2b",
          },
          leadfeeder: {
            visitor_id_rate: "Company-level only",
            starting_price: "$99/mo",
            ai_outreach_included: false,
            real_time: true,
            comparison_url: "/blog/cursive-vs-leadfeeder",
          },
          demandbase: {
            visitor_id_rate: "Company-level only",
            starting_price: "$25,000+/yr",
            ai_outreach_included: false,
            real_time: false,
            comparison_url: "/blog/cursive-vs-demandbase",
          },
          instantly: {
            visitor_id_rate: "N/A",
            starting_price: "$30/mo",
            ai_outreach_included: true,
            real_time: false,
            comparison_url: "/blog/cursive-vs-instantly",
          },
          smartlead: {
            visitor_id_rate: "N/A",
            starting_price: "$39/mo",
            ai_outreach_included: true,
            real_time: false,
            comparison_url: "/blog/smartlead-alternative",
          },
        }

        const key = (params.competitor as string).toLowerCase()
        const comp = competitors[key] ?? null
        return {
          cursive: cursiveStats,
          competitor: comp
            ? { name: params.competitor, ...comp }
            : {
                error: `No comparison data for "${params.competitor}". Available: ${Object.keys(competitors).join(", ")}`,
              },
          full_comparison_url: comp
            ? `https://www.meetcursive.com${comp.comparison_url}`
            : null,
        }
      },
    })

    // Tool 3: Get platform capabilities
    mc.registerTool({
      name: "getCursiveCapabilities",
      description:
        "Get a structured overview of Cursive platform capabilities including visitor identification, intent data, AI outreach, audience building, direct mail, integrations, and more.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "visitor-id",
              "intent-data",
              "ai-outreach",
              "audience-builder",
              "direct-mail",
              "integrations",
              "all",
            ],
            description:
              "Which capability category to retrieve details for. Defaults to all.",
          },
        },
      },
      annotations: { readOnlyHint: true },
      execute: async (params) => {
        const capabilities = {
          "visitor-id": {
            name: "Visitor Identification",
            description:
              "Identify 70% of anonymous website visitors in real-time with name, company, email, and browsing behavior",
            key_stats: [
              "70% identification rate",
              "Company + individual level",
              "Page-level tracking",
              "Return visitor detection",
            ],
            url: "https://www.meetcursive.com/visitor-identification",
          },
          "intent-data": {
            name: "Intent Data Audiences",
            description:
              "Pre-built segments with verified purchase intent signals across 30,000+ categories",
            key_stats: [
              "60B+ behaviors & URLs scanned weekly",
              "3 intent levels: Hot (7d), Warm (14d), Scale (30d)",
              "Weekly refreshes",
              "8 high-value verticals",
            ],
            url: "https://www.meetcursive.com/intent-audiences",
          },
          "ai-outreach": {
            name: "AI-Powered Outreach (AI Studio)",
            description:
              "AI SDR that sends personalized outreach across email, LinkedIn, and SMS with autonomous follow-ups and meeting booking",
            key_stats: [
              "Multi-channel (email, LinkedIn, SMS)",
              "Brand voice training",
              "24/7 autonomous operation",
              "Automatic meeting booking",
            ],
            url: "https://www.meetcursive.com/platform",
          },
          "audience-builder": {
            name: "Audience Builder",
            description:
              "Build unlimited custom audiences from 280M US consumer and 140M+ business profiles",
            key_stats: [
              "No caps on audience size",
              "Firmographic + demographic + behavioral filters",
              "280M consumer profiles",
              "140M+ business profiles",
            ],
            url: "https://www.meetcursive.com/audience-builder",
          },
          "direct-mail": {
            name: "Direct Mail Automation",
            description:
              "Physical postcards triggered by digital behavior, delivered in 48 hours",
            key_stats: [
              "Triggered by website visits",
              "3-5x higher offline conversion",
              "Track scan rates",
              "48-hour delivery",
            ],
            url: "https://www.meetcursive.com/direct-mail",
          },
          integrations: {
            name: "Integrations",
            description:
              "200+ native integrations with CRMs, marketing tools, and ad platforms",
            key_stats: [
              "Salesforce, HubSpot, Pipedrive",
              "Google Ads, Facebook, LinkedIn",
              "Zapier, Make, n8n",
              "Two-way sync, real-time",
            ],
            url: "https://www.meetcursive.com/integrations",
          },
        }

        const category = params?.category as string | undefined
        if (!category || category === "all") return capabilities
        return (
          capabilities[category as keyof typeof capabilities] ?? {
            error: `Unknown category "${category}". Available: ${Object.keys(capabilities).join(", ")}`,
          }
        )
      },
    })

    // Tool 4: Book a demo (returns cal.com URL)
    mc.registerTool({
      name: "bookCursiveDemo",
      description:
        "Get the booking URL for a free 30-minute demo and AI audit with the Cursive team. No commitment required.",
      inputSchema: {
        type: "object",
        properties: {},
      },
      annotations: { readOnlyHint: true },
      execute: async () => {
        return {
          booking_url: "https://cal.com/cursive/30min",
          message:
            "Book a free 30-minute demo with the Cursive team. No commitment required.",
          what_to_expect: [
            "Live visitor identification demo on your website",
            "Platform walkthrough",
            "Custom ROI analysis",
            "Setup takes 5 minutes after the call",
          ],
          alternative_actions: {
            free_audit:
              "https://www.meetcursive.com/free-audit",
            marketplace_signup:
              "https://leads.meetcursive.com/signup",
            email: "hello@meetcursive.com",
          },
        }
      },
    })

    // Tool 5: Get case study results
    mc.registerTool({
      name: "getCursiveResults",
      description:
        "Get real customer results and case studies from companies using Cursive for lead generation and outbound.",
      inputSchema: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: ["revenue", "roas", "pipeline", "all"],
            description:
              "Filter results by metric type. Defaults to all.",
          },
        },
      },
      annotations: { readOnlyHint: true },
      execute: async (params) => {
        const results = [
          {
            headline: "$11M Revenue Generated",
            detail: "AI SaaS company in 30 days",
            metric: "revenue",
          },
          {
            headline: "40x Return on Ad Spend",
            detail: "Custom audience targeting",
            metric: "roas",
          },
          {
            headline: "$24M Pipeline Created",
            detail: "Medical tech in 3 days",
            metric: "pipeline",
          },
          {
            headline: "5x CPC Reduction",
            detail: "Insurtech Facebook campaigns",
            metric: "roas",
          },
        ]

        const metric = params?.metric as string | undefined
        if (!metric || metric === "all") {
          return {
            results,
            case_studies_url: "https://www.meetcursive.com/case-studies",
          }
        }
        return {
          results: results.filter((r) => r.metric === metric),
          case_studies_url: "https://www.meetcursive.com/case-studies",
        }
      },
    })

    // Tool 6: Check which industries Cursive serves
    mc.registerTool({
      name: "getCursiveIndustries",
      description:
        "Get information about which industries Cursive serves and how the platform is used in each vertical.",
      inputSchema: {
        type: "object",
        properties: {
          industry: {
            type: "string",
            description:
              "Specific industry to get details for (e.g., b2b-software, agencies, ecommerce, financial-services, home-services, education, franchises, retail, media-advertising)",
          },
        },
      },
      annotations: { readOnlyHint: true },
      execute: async (params) => {
        const industries: Record<string, { url: string; use_case: string }> = {
          "b2b-software": {
            url: "https://www.meetcursive.com/industries/b2b-software",
            use_case:
              "Identify anonymous visitors viewing pricing and feature pages for warm outreach",
          },
          agencies: {
            url: "https://www.meetcursive.com/industries/agencies",
            use_case:
              "White-label visitor identification and intent audiences for client services",
          },
          ecommerce: {
            url: "https://www.meetcursive.com/industries/ecommerce",
            use_case:
              "Identify anonymous shoppers and retarget cart abandoners",
          },
          "financial-services": {
            url: "https://www.meetcursive.com/industries/financial-services",
            use_case:
              "Compliant lead generation for financial advisors and lenders",
          },
          "home-services": {
            url: "https://www.meetcursive.com/industries/home-services",
            use_case:
              "Reach homeowners searching for HVAC, plumbing, roofing services",
          },
          education: {
            url: "https://www.meetcursive.com/industries/education",
            use_case: "Identify prospective students researching programs",
          },
          franchises: {
            url: "https://www.meetcursive.com/industries/franchises",
            use_case:
              "Multi-location lead generation with centralized management",
          },
          retail: {
            url: "https://www.meetcursive.com/industries/retail",
            use_case: "Identify in-market shoppers and drive foot traffic",
          },
          "media-advertising": {
            url: "https://www.meetcursive.com/industries/media-advertising",
            use_case:
              "Audience intelligence for media buyers and publishers",
          },
        }

        const key = params?.industry as string | undefined
        if (key) {
          const ind = industries[key.toLowerCase()]
          return (
            ind ?? {
              error: `Industry not found. Available: ${Object.keys(industries).join(", ")}`,
            }
          )
        }
        return industries
      },
    })

    // eslint-disable-next-line no-console
    console.log("[WebMCP] Cursive tools registered successfully")
  }, [])

  return null
}
