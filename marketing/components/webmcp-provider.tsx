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
        "Get pricing for Cursive's three self-serve plans, all month-to-month with no setup fee: Visitor Pixel ($97/mo), Custom Audience ($197/mo), and Pixel + Audience Bundle ($247/mo).",
      inputSchema: {
        type: "object",
        properties: {
          plan_type: {
            type: "string",
            enum: ["pixel", "audience", "bundle", "all"],
            description: "Which plan to retrieve (pixel, audience, bundle, or all)",
          },
        },
        required: ["plan_type"],
      },
      annotations: { readOnlyHint: true },
      execute: async (params) => {
        const billing = "month-to-month, no setup fee, cancel anytime"
        const url = "https://leads.meetcursive.com/get-leads"
        const pricing = {
          pixel: {
            name: "Visitor Pixel",
            price: "$97/mo",
            billing,
            description:
              "Identify the companies and people visiting your website, deterministically.",
            includes: [
              "40-60% deterministic visitor match rate",
              "Company + person-level detail with a verified work email",
              "60-second pixel install, no engineering",
              "Identified visitors synced to your portal",
            ],
            url,
          },
          audience: {
            name: "Custom Audience",
            price: "$197/mo",
            billing,
            description:
              "A fresh weekly list of people actively searching for your product, delivered to Google Sheets.",
            includes: [
              "Weekly list of in-market prospects built to your ICP",
              "Verified work email on every record",
              "Delivered to Google Sheets",
              "First audience within 24 hours",
            ],
            url,
          },
          bundle: {
            name: "Pixel + Audience Bundle",
            price: "$247/mo",
            billing,
            label: "Best value",
            description:
              "Both the Visitor Pixel and the weekly Custom Audience in one feed.",
            includes: [
              "Everything in Visitor Pixel",
              "Everything in Custom Audience",
              "Site traffic + in-market intent in one feed",
              "Priority audience updates within 24 hours",
            ],
            url,
          },
        }

        const planType = params.plan_type as string
        if (planType === "all") return pricing
        return (
          pricing[planType as keyof typeof pricing] ?? {
            error: `Unknown plan type "${planType}". Available: pixel, audience, bundle, all`,
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
          visitor_id_rate: "40-60% (deterministic)",
          database_size: "280M US consumer, 140M+ business profiles",
          real_time: true,
          starting_price:
            "$97/mo (Visitor Pixel), $197/mo (Custom Audience), $247/mo (Bundle) — self-serve, month-to-month",
          intent_signals: "60B+ weekly across 30,000+ categories",
          verified_email_included: true,
          weekly_in_market_audience: true,
          contracts: "Month-to-month, no setup fee, cancel anytime",
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
          booking_url: "https://cal.com/cursiveteam/30min",
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
            get_started:
              "https://leads.meetcursive.com/get-leads",
            email: "hey@meetcursive.com",
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
