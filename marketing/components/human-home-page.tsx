"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { IntegrationsShowcase } from "@/components/integrations-showcase"
import { FAQSection } from "@/components/homepage/faq-section"
import { SiteForm, StartExample, StartHero } from "@/components/homepage/start-hero"
import { Stage } from "@/components/homepage/stage"
import { useState } from "react"
import {
  Eye, ShoppingCart,
  Users, Database, Mail, Sparkles, ShieldCheck,
  BarChart3, GitBranch, Building2, Search, Flame,
  Check,
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

/** The three the tour shows; the rest live on their product pages. */
const TOUR_IDS = ["visitor-tracking", "audience-builder", "enrichment"]

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
          <h2 id="products-tour-heading" className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-[#0f172a] sm:text-[2.5rem]">
            Then put the same data to work
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-[#475569]">
            Identify your website visitors, build audiences and enrich lists from one data layer.
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
                  isActive ? "border border-[#007AFF] bg-[#007AFF] text-white" : "border border-[#e2e8f0] bg-white text-[#475569] hover:border-[#cbd5e1] hover:text-[#0f172a]"
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
            <div className="overflow-hidden rounded-2xl border border-[#e3eeff] bg-white shadow-[0_24px_50px_-30px_rgb(15_23_42/0.35)]">
              <div className="h-[420px] overflow-hidden p-3 md:p-4">
                <div key={activeFeature}>{renderDemoComponent(activeFeature)}</div>
              </div>
            </div>
          </div>
        </Stage>
      </section>

      {/* Integrations Showcase */}
      <section id="integrations" className="py-20 bg-[#f8fafc] sm:py-28">
        <Container>
          <IntegrationsShowcase
            title="Send leads where you already work"
            subtitle="Push every lead to your CRM, inbox or sequencer. Webhooks and an API cover the rest."
            only={["Salesforce", "HubSpot", "Gmail", "Outlook", "Slack", "Zapier", "Instantly", "LinkedIn"]}
          />
        </Container>
      </section>

      {/* Pricing — three self-serve plans */}
      <section id="pricing" className="py-20 bg-white sm:py-28">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-[#0f172a] sm:text-[2.5rem] mb-4">
              When you want more than 25
            </h2>
            <p className="text-[17px] leading-relaxed text-[#475569] max-w-xl mx-auto">
              Month-to-month plans. No setup fee, cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {pricingPlans.map((plan, i) => {
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
                      Best value
                    </span>
                  )}
                  <h3 className="text-[17px] font-semibold text-[#0f172a]">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-[-0.03em] text-[#0f172a]">{plan.price}</span>
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

        </Container>
      </section>

      <FAQSection />

      {/* Dashboard CTA */}
      <section aria-labelledby="final-cta-heading" className="px-2 pb-20 pt-4 sm:px-4 sm:pb-28">
        <Stage className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
            <h2 id="final-cta-heading" className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-[#0f172a] sm:text-[2.5rem]">
              Get your 25 leads in about a minute
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-[#475569]">Free, no card, no sales call.</p>
            <SiteForm placement="home-final-cta" className="mx-auto mt-8" />
          </div>
        </Stage>
      </section>
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
  items: string[]
  cta: string
  highlight: boolean
}> = [
  {
    name: 'Visitor Pixel',
    price: '$97',
    description: 'See the companies and people visiting your site. Installs in a minute.',
    items: [
      '40 to 60% of visitors matched to a person',
      'Company and contact details',
      'One snippet, no engineering',
      'Synced to your Cursive workspace',
    ],
    cta: 'Get the Pixel',
    highlight: false,
  },
  {
    name: 'Custom Audience',
    price: '$197',
    description: 'A fresh list of in-market buyers every week, built to your profile.',
    items: [
      'New buyers every week',
      'Built to your exact profile',
      'Delivered to Google Sheets',
      'First list within 24 hours',
    ],
    cta: 'Get an Audience',
    highlight: false,
  },
  {
    name: 'Pixel + Audience',
    price: '$247',
    description: 'Site visitors and in-market buyers in one weekly list.',
    items: [
      'Everything in Visitor Pixel',
      'Everything in Custom Audience',
      'Audience updates within 24 hours',
      'Saves $47 a month',
    ],
    cta: 'Get both',
    highlight: true,
  },
]


