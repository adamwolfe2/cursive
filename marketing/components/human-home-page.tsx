"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { DashboardCTA } from "@/components/dashboard-cta"
import { IntegrationsShowcase } from "@/components/integrations-showcase"
import { TestimonialsSection } from "@/components/homepage/testimonials-section"
import { FAQSection } from "@/components/homepage/faq-section"
import { StartExample, StartHero } from "@/components/homepage/start-hero"
import { Stage } from "@/components/homepage/stage"
import { useState } from "react"
import {
  Eye, ShoppingCart,
  Users, Database, Mail, Sparkles, ShieldCheck,
  BarChart3, GitBranch, Building2, Search, Flame,
  Layers, Check,
  type LucideIcon,
} from "lucide-react"
import { GET_LEADS_URL } from "@/lib/cta"

// Demo components
import { DemoVisitorTracking } from "@/components/demos/demo-visitor-tracking"
import { DemoPipelineDashboard } from "@/components/demos/demo-pipeline-dashboard"
import { DemoLeadSequence } from "@/components/demos/demo-lead-sequence"
import { DemoAIStudio } from "@/components/demos/demo-ai-studio"
import { DemoPeopleSearch } from "@/components/demos/demo-people-search"
import { DemoMarketplace } from "@/components/demos/demo-marketplace"
import { DemoIntentHeatmap } from "@/components/demos/demo-intent-heatmap"
import { DemoAudienceBuilder } from "@/components/demos/demo-audience-builder"
import { DemoEnrichmentWaterfall } from "@/components/demos/demo-enrichment-waterfall"
import { DemoEmailValidator } from "@/components/demos/demo-email-validator"
import { DemoAttributionFlow } from "@/components/demos/demo-attribution-flow"
import { DemoAccountIntelligence } from "@/components/demos/demo-account-intelligence"

// Paid products, each with a live demo, for the "Everything else" tour under the hero
const heroFeatures: Array<{
  id: string
  label: string
  icon: LucideIcon
}> = [
  { id: "visitor-tracking", label: "Visitor Tracking", icon: Eye },
  { id: "intent-heatmap", label: "Intent Heatmap", icon: Flame },
  { id: "audience-builder", label: "Audience Builder", icon: Users },
  { id: "enrichment", label: "Data Enrichment", icon: Database },
  { id: "sequences", label: "Lead Sequences", icon: Mail },
  { id: "ai-studio", label: "AI Studio", icon: Sparkles },
  { id: "email-validator", label: "Email Validator", icon: ShieldCheck },
  { id: "pipeline", label: "Pipeline Dashboard", icon: BarChart3 },
  { id: "attribution", label: "Attribution Flow", icon: GitBranch },
  { id: "account-intel", label: "Account Intelligence", icon: Building2 },
  { id: "people-search", label: "People Search", icon: Search },
  { id: "marketplace", label: "Marketplace", icon: ShoppingCart },
]

/** The six the tour shows; the rest live on their product pages. */
const TOUR_IDS = ["visitor-tracking", "audience-builder", "enrichment", "intent-heatmap", "sequences", "people-search"]

// Render the active demo component lazily
const renderDemoComponent = (activeFeatureId: string) => {
  switch (activeFeatureId) {
    case "visitor-tracking":
      return <DemoVisitorTracking />
    case "intent-heatmap":
      return <DemoIntentHeatmap />
    case "audience-builder":
      return <DemoAudienceBuilder />
    case "enrichment":
      return <DemoEnrichmentWaterfall />
    case "sequences":
      return <DemoLeadSequence />
    case "ai-studio":
      return <DemoAIStudio />
    case "email-validator":
      return <DemoEmailValidator />
    case "pipeline":
      return <DemoPipelineDashboard />
    case "attribution":
      return <DemoAttributionFlow />
    case "account-intel":
      return <DemoAccountIntelligence />
    case "people-search":
      return <DemoPeopleSearch />
    case "marketplace":
      return <DemoMarketplace />
    default:
      return <DemoVisitorTracking />
  }
}

export function HumanHomePage() {
  const [activeFeature, setActiveFeature] = useState("visitor-tracking")

  return (
    <main className="bg-white">
      <StartHero />

      {/* Everything else: the paid products, each with a live demo. Secondary to the free list above. */}
      <StartExample />

      {/* The paid products, each with a live demo. Secondary to the free list above. */}
      <section id="products-tour" aria-labelledby="products-tour-heading" className="px-2 pb-20 sm:px-4 sm:pb-28">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 id="products-tour-heading" className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-[#0c1f45] sm:text-[2.5rem]">
            One data layer, every way to use it
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-[#4b5563]">
            The free list is the start. The same data runs visitor identification, audiences, enrichment and outreach.
          </p>
        </div>
        <div role="group" aria-label="Pick a product" className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2 px-4">
          {heroFeatures.filter((f) => TOUR_IDS.includes(f.id)).map((feature) => {
            const Icon = feature.icon
            const isActive = activeFeature === feature.id
            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => setActiveFeature(feature.id)}
                aria-pressed={isActive}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] ${
                  isActive ? "bg-[#0c1f45] text-white" : "border border-gray-200 bg-white text-[#4b5563] hover:border-gray-300 hover:text-[#111827]"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} aria-hidden="true" />
                {feature.label}
              </button>
            )
          })}
        </div>
        <Stage className="mx-auto mt-10 max-w-7xl">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-16">
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_30px_70px_-30px_rgb(4_22_66/0.7)]">
              <div className="h-[420px] overflow-hidden p-3 md:p-4">
                <div key={activeFeature}>{renderDemoComponent(activeFeature)}</div>
              </div>
            </div>
          </div>
        </Stage>
      </section>

      {/* Integrations Showcase */}
      <section id="integrations" className="py-20 bg-white">
        <Container>
          <IntegrationsShowcase
            title="Works With Your Existing Stack"
            subtitle="200+ native integrations. Sync leads to your CRM, trigger campaigns, and automate workflows."
          />
        </Container>
      </section>

      {/* Pricing — three self-serve plans */}
      <section id="pricing" className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Pick Your Plan
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Start with 25 free leads. When you want a steady flow, these plans are month-to-month and cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {pricingPlans.map((plan, i) => {
              const Icon = plan.icon
              return (
                <motion.div
                  key={plan.name}
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative flex flex-col rounded-2xl p-6 sm:p-8 transition-all ${
                    plan.highlight
                      ? "bg-white border border-primary shadow-lg ring-1 ring-primary/20"
                      : "bg-white border border-gray-200 hover:shadow-lg"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white whitespace-nowrap">
                      Most Popular
                    </span>
                  )}
                  <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-light text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{plan.description}</p>
                  <ul className="mt-5 space-y-2.5 flex-1">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    href={GET_LEADS_URL}
                    target="_blank"
                    variant={plan.highlight ? "default" : "outline"}
                    className="w-full mt-8"
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              )
            })}
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            No setup fee. No long-term contract. Cancel anytime.
          </p>
        </Container>
      </section>

      <TestimonialsSection />

      <FAQSection />

      {/* Dashboard CTA */}
      <DashboardCTA
        headline="See who should"
        subheadline="buy from you"
        description="Paste your website and get 25 real leads with work emails in about a minute. Free, no card, no call."
      />
    </main>
  )
}

// Pricing plans — the three self-serve offers (source of truth:
// src/lib/stripe/funnel-products.ts). All month-to-month, all sold through
// the get-leads funnel.
const pricingPlans: Array<{
  name: string
  price: string
  description: string
  icon: LucideIcon
  items: string[]
  cta: string
  highlight: boolean
}> = [
  {
    name: 'Visitor Pixel',
    price: '$97',
    description: 'Identify the companies and people visiting your site. Installs in 60 seconds.',
    icon: Eye,
    items: [
      '40–60% deterministic match rate',
      'Company + person-level detail',
      'One-snippet install, no engineering',
      'Identified visitors synced to your portal',
    ],
    cta: 'Get the Pixel',
    highlight: false,
  },
  {
    name: 'Pixel + Audience Bundle',
    price: '$247',
    description: 'Your full top-of-funnel intel layer: site traffic and in-market intent in one feed.',
    icon: Layers,
    items: [
      'Everything in Visitor Pixel',
      'Everything in Custom Audience',
      'Priority audience updates within 24h',
      'Best value vs. buying separately',
    ],
    cta: 'Get the Bundle',
    highlight: true,
  },
  {
    name: 'Custom Audience',
    price: '$197',
    description: 'A fresh weekly list of people actively searching for your product, delivered to Sheets.',
    icon: Users,
    items: [
      'Weekly list of in-market prospects',
      'Built to your exact ICP',
      'Delivered to Google Sheets',
      'First audience within 24 hours',
    ],
    cta: 'Get an Audience',
    highlight: false,
  },
]


