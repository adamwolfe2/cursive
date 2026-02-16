"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion, AnimatePresence } from "framer-motion"
import { DashboardCTA } from "@/components/dashboard-cta"
import { IntegrationsShowcase } from "@/components/integrations-showcase"
import { HowItWorksSection } from "@/components/homepage/how-it-works-section"
import { CompetitiveAdvantagesSection } from "@/components/homepage/competitive-advantages-section"
import { FAQSection } from "@/components/homepage/faq-section"
import { CustomerLogos } from "@/components/homepage/customer-logos"
import Link from "next/link"
import { useState } from "react"
import {
  Eye, Bot, TrendingUp, ShoppingCart, Briefcase,
  Zap, Users, Database, Mail, Sparkles, ShieldCheck,
  BarChart3, GitBranch, Building2, Search, Flame,
  type LucideIcon,
} from "lucide-react"

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

// Feature definitions with icons for the hero showcase
const heroFeatures: Array<{
  id: string
  label: string
  shortLabel: string
  icon: LucideIcon
}> = [
  { id: "visitor-tracking", label: "Visitor Tracking", shortLabel: "Visitors", icon: Eye },
  { id: "intent-heatmap", label: "Intent Heatmap", shortLabel: "Intent", icon: Flame },
  { id: "audience-builder", label: "Audience Builder", shortLabel: "Audiences", icon: Users },
  { id: "enrichment", label: "Data Enrichment", shortLabel: "Enrichment", icon: Database },
  { id: "sequences", label: "Lead Sequences", shortLabel: "Sequences", icon: Mail },
  { id: "ai-studio", label: "AI Studio", shortLabel: "AI Studio", icon: Sparkles },
  { id: "email-validator", label: "Email Validator", shortLabel: "Validator", icon: ShieldCheck },
  { id: "pipeline", label: "Pipeline Dashboard", shortLabel: "Pipeline", icon: BarChart3 },
  { id: "attribution", label: "Attribution Flow", shortLabel: "Attribution", icon: GitBranch },
  { id: "account-intel", label: "Account Intelligence", shortLabel: "Accounts", icon: Building2 },
  { id: "people-search", label: "People Search", shortLabel: "People", icon: Search },
  { id: "marketplace", label: "Marketplace", shortLabel: "Marketplace", icon: ShoppingCart },
]

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
      {/* ===== HERO SECTION ===== */}
      <section id="hero" className="pt-14 pb-6 bg-white lg:min-h-[90vh] lg:flex lg:flex-col lg:justify-center">
        <Container className="max-w-[1440px] lg:px-12">
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-center lg:text-left mb-4"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600">
              <Zap className="w-3 h-3 text-[#007AFF]" />
              AI Intent Systems That Never Sleep
            </span>
          </motion.div>

          {/* Split Layout: Copy Left, Demo Right */}
          <div className="lg:flex lg:gap-8 xl:gap-12 items-start">
            {/* Left Column: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:w-[40%] lg:flex-shrink-0 text-center lg:text-left mb-8 lg:mb-0"
            >
              <h1 className="text-[1.65rem] sm:text-4xl lg:text-[2.5rem] xl:text-[2.75rem] font-light mb-4 leading-[1.15]">
                <span className="text-gray-900">Turn Website Visitors</span>
                <br />
                <span className="text-gray-400">Into Booked Meetings.</span>
              </h1>

              <p className="text-base text-gray-600 mb-4 leading-relaxed max-w-lg mx-auto lg:mx-0">
                98% of visitors leave your site without converting. <span className="font-cursive text-gray-900 text-lg">Cursive</span> tracks leads with pixels, enriches leads against 220M verified contacts, and automates personalized outreach so you can make sales in your sleep.
              </p>

              {/* Stats */}
              <div className="flex justify-center lg:justify-start gap-6 mb-4 py-3 border-y border-gray-100">
                {[
                  { value: "70%", label: "Visitor ID Rate" },
                  { value: "220M+", label: "Consumer Profiles" },
                  { value: "140M+", label: "Business Profiles" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl lg:text-3xl text-gray-900 font-light">{stat.value}</div>
                    <div className="text-[11px] text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mb-1">
                <Button
                  size="lg"
                  href="https://cal.com/cursive/30min"
                  target="_blank"
                  className="bg-[#007AFF] text-white hover:bg-[#0066DD] px-6 py-3"
                >
                  Book Your Free AI Audit
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  href="https://leads.meetcursive.com/signup?source=homepage"
                  target="_blank"
                  className="px-6 py-3"
                >
                  Get 100 Free Leads
                </Button>
              </div>
              <div className="mb-4" />

              {/* Desktop Feature Pills (ClickUp-style flex-wrap rows) */}
              <div className="hidden lg:flex lg:flex-wrap gap-1.5">
                {heroFeatures.map((feature) => {
                  const Icon = feature.icon
                  const isActive = activeFeature === feature.id
                  return (
                    <button
                      key={feature.id}
                      onClick={() => setActiveFeature(feature.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium shadow-sm border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <Icon className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      {feature.label}
                    </button>
                  )
                })}
              </div>
            </motion.div>

            {/* Right Column: Demo */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="lg:flex-1 lg:min-w-0"
            >
              {/* Mobile Feature Grid (ClickUp-style 4x3 icon grid) */}
              <div className="lg:hidden grid grid-cols-4 gap-px bg-gray-200 rounded-xl overflow-hidden mb-4">
                {heroFeatures.map((feature) => {
                  const Icon = feature.icon
                  const isActive = activeFeature === feature.id
                  return (
                    <button
                      key={feature.id}
                      onClick={() => setActiveFeature(feature.id)}
                      className={`flex flex-col items-center justify-center gap-1 py-3 px-1 transition-colors ${
                        isActive ? 'bg-blue-50' : 'bg-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#007AFF]' : 'text-gray-400'}`} />
                      <span className={`text-[10px] leading-tight text-center ${
                        isActive ? 'text-[#007AFF] font-medium' : 'text-gray-500'
                      }`}>
                        {feature.shortLabel}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Demo with Browser Chrome */}
              <div className="bg-gradient-to-br from-blue-50/50 to-blue-100/50 rounded-2xl p-2 md:p-3">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  <div className="bg-gray-100 px-3 py-2 flex items-center gap-1.5 border-b border-gray-200">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  </div>
                  <div className="p-3 md:p-4 min-h-[400px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeFeature}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {renderDemoComponent(activeFeature)}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Social Proof */}
      <CustomerLogos />

      {/* Two Ways to Get Started */}
      <section id="pricing" className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Two Ways to Get Started
            </h2>
            <p className="text-xl text-gray-600">
              Whether you prefer self-serve or done-for-you, we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card 1: Browse & Buy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <ShoppingCart className="w-7 h-7 text-[#007AFF]" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3">Browse & Buy Leads</h3>
              <p className="text-gray-600 mb-6">
                Self-serve marketplace with 50k+ verified B2B leads. Filter, preview, and purchase with credits. Start with 100 free credits.
              </p>
              <ul className="space-y-2 mb-8 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  Instant access to leads
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  Credits from $0.60/lead
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  No commitment required
                </li>
              </ul>
              <Button href="https://leads.meetcursive.com/signup?source=homepage" target="_blank" className="w-full">
                Try Free Leads
              </Button>
            </motion.div>

            {/* Card 2: Let Us Handle It */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <Briefcase className="w-7 h-7 text-[#007AFF]" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3">Let Us Handle It</h3>
              <p className="text-gray-600 mb-6">
                Done-for-you lead generation and outbound. We deliver verified leads, run campaigns, and book meetings on your behalf.
              </p>
              <ul className="space-y-2 mb-8 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  Managed by our team
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  Starting at $1k/mo
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                  Guaranteed results
                </li>
              </ul>
              <Button href="/services" className="w-full">
                Explore Services
              </Button>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Problem → Solution (Benefit-Led) */}
      <section id="products" className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Stop Losing Your Best Prospects
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              98% of website visitors leave without filling out a form. Cursive reveals who they are—so you can reach out while they&apos;re still interested.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {benefitPillars.map((pillar, i) => {
              const Icon = pillar.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 mb-4 flex items-center justify-center bg-gray-100 rounded-lg">
                    <Icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <h3 className="text-xl text-gray-900 mb-3">{pillar.title}</h3>
                  <p className="text-gray-600 text-sm">{pillar.description}</p>
                </motion.div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* Competitive Advantages */}
      <CompetitiveAdvantagesSection />

      {/* Core Features Grid */}
      <section id="features" className="py-20 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-2">
              Everything You Need to
            </h2>
            <p className="font-cursive text-5xl lg:text-6xl text-gray-500">
              Scale Outbound
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-6 h-6 text-gray-700"
                  >
                    <path d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-xl text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <HowItWorksSection />

      {/* Integrations Showcase */}
      <section id="integrations" className="py-20 bg-[#F7F9FB]">
        <Container>
          <IntegrationsShowcase
            title="Works With Your Existing Stack"
            subtitle="200+ native integrations—sync leads to your CRM, trigger campaigns, and automate workflows"
          />
        </Container>
      </section>

      {/* Proven Results */}
      <section id="case-studies" className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Proven Results
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real outcomes from companies using Cursive to power their pipeline
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { metric: "$11M", label: "Revenue Generated", detail: "AI SaaS company in 30 days" },
              { metric: "40x", label: "Return on Ad Spend", detail: "Custom audience targeting" },
              { metric: "$24M", label: "Pipeline Created", detail: "Medical tech in 3 days" },
              { metric: "5x", label: "CPC Reduction", detail: "Insurtech Facebook campaigns" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 bg-[#F7F9FB] rounded-xl border border-gray-200"
              >
                <div className="text-3xl lg:text-4xl font-light text-[#007AFF] mb-2">{stat.metric}</div>
                <div className="text-gray-900 font-medium mb-1">{stat.label}</div>
                <div className="text-sm text-gray-500">{stat.detail}</div>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Button variant="outline" href="/case-studies">
              View All Case Studies
            </Button>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Explore by Industry */}
      <section id="industries" className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Built for Your Industry
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cursive powers lead generation and outbound for companies across every sector. See how teams in your industry use our platform.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
            {[
              { label: "B2B Software", href: "/industries/b2b-software" },
              { label: "Agencies", href: "/industries/agencies" },
              { label: "Ecommerce", href: "/industries/ecommerce" },
              { label: "Financial Services", href: "/industries/financial-services" },
              { label: "Home Services", href: "/industries/home-services" },
              { label: "Education", href: "/industries/education" },
              { label: "Franchises", href: "/industries/franchises" },
              { label: "Retail", href: "/industries/retail" },
              { label: "Media & Advertising", href: "/industries/media-advertising" },
            ].map((industry) => (
              <Link
                key={industry.href}
                href={industry.href}
                className="block p-4 bg-[#F7F9FB] rounded-lg border border-gray-200 text-center text-gray-900 hover:border-[#007AFF] hover:text-[#007AFF] transition-all text-sm font-medium"
              >
                {industry.label}
              </Link>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Want to see how Cursive compares to other platforms?
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/blog/clearbit-alternatives-comparison" className="text-sm text-[#007AFF] hover:underline">
                Clearbit Alternatives
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/blog/zoominfo-vs-cursive-comparison" className="text-sm text-[#007AFF] hover:underline">
                ZoomInfo vs Cursive
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/blog/apollo-vs-cursive-comparison" className="text-sm text-[#007AFF] hover:underline">
                Apollo vs Cursive
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/blog/6sense-vs-cursive-comparison" className="text-sm text-[#007AFF] hover:underline">
                6sense vs Cursive
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Dashboard CTA */}
      <DashboardCTA
        headline="Ready to See Who's"
        subheadline="Visiting Your Site?"
        description="Book a free AI audit. We'll show you exactly which companies are researching your product right now—and how to convert them."
        ctaText="Book Your Free AI Audit Now"
      />
    </main>
  )
}

// Benefit-focused pillars
const benefitPillars: Array<{
  icon: LucideIcon
  title: string
  description: string
}> = [
  {
    icon: Eye,
    title: "Know Who's Interested",
    description: '70% of your anonymous visitors identified with name, company, and email—before they fill out a form.',
  },
  {
    icon: Bot,
    title: 'Reach Them Fast',
    description: 'AI agents send personalized outreach across email, LinkedIn, and SMS within hours of their visit.',
  },
  {
    icon: TrendingUp,
    title: 'Book More Meetings',
    description: 'Autonomous follow-ups and meeting scheduling that runs 24/7. No manual work required.',
  },
]

// Core Features Data
const coreFeatures = [
  {
    title: "Visitor Identification",
    description: "Know which companies are researching your product—before they fill out a form",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    items: [
      "Reveal 70% of anonymous visitors",
      "Company + individual-level data",
      "See exactly which pages they viewed",
      "Track returning visitors"
    ]
  },
  {
    title: "AI-Powered Outreach",
    description: "Your AI SDR that books meetings while you sleep—trained on your best messaging",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    items: [
      "Multi-channel campaigns (email, LinkedIn, SMS)",
      "Personalized at scale",
      "Autonomous follow-ups",
      "Automatic meeting booking"
    ]
  },
  {
    title: "Intent Data",
    description: "Reach prospects actively searching for solutions like yours—right now",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    items: [
      "450B+ monthly intent signals",
      "30,000+ commercial categories",
      "Real-time (not monthly snapshots)",
      "Know when prospects are in-market"
    ]
  },
  {
    title: "Audience Builder",
    description: "Build unlimited lead lists with 220M+ consumer and 140M+ business profiles",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    items: [
      "No caps on audience size",
      "Firmographic + demographic filters",
      "Behavioral segmentation",
      "Create segments in minutes"
    ]
  },
  {
    title: "Direct Mail Automation",
    description: "Turn website visits into physical postcards—offline conversion 3-5x higher",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    items: [
      "Triggered by website behavior",
      "Custom design or templates",
      "Delivered in 48 hours",
      "Track scan rates + responses"
    ]
  },
  {
    title: "CRM Integration",
    description: "Sync leads to Salesforce, HubSpot, and 200+ tools you already use",
    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    items: [
      "200+ native integrations",
      "Two-way sync",
      "Automated workflows",
      "Real-time updates"
    ]
  },
]
