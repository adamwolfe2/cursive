"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Users, Target, Zap, Shield, Filter, Database,
  TrendingUp, CheckCircle2, ArrowRight, Sparkles,
  Globe, Layers, RefreshCw, Building2, UserSearch, Check,
  type LucideIcon,
} from "lucide-react"
import { IntegrationsShowcase } from "@/components/integrations-showcase"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import Link from "next/link"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { GET_LEADS_URL, BOOKING_URL } from "@/lib/cta"

const EASE = [0.22, 1, 0.36, 1] as const

function SectionHeading({ plain, script, sub }: { plain: string; script?: string; sub?: string }) {
  return (
    <div className="text-center mb-14">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900">
        {plain}
        {script && (
          <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
            {script}
          </span>
        )}
      </h2>
      {sub && (
        <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{sub}</p>
      )}
    </div>
  )
}

function IconChip({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

const steps = [
  { icon: Filter, title: "Set your filters", desc: "Stack firmographic, demographic, technographic, and intent criteria to shape your ICP." },
  { icon: Target, title: "Preview the list", desc: "See audience size update live as you refine. Built to your exact target." },
  { icon: Zap, title: "Get it weekly", desc: "A fresh list of in-market buyers, delivered to Google Sheets every week." },
]

const benefits: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Database, title: "280M + 140M profiles", body: "Offline-rooted consumer and business graph (TransUnion, Experian), refreshed every 30 days against NCOA." },
  { icon: Sparkles, title: "~50K intent segments", body: "White-label segments layered on a 15M+ domain organic intent network — validated against real conversions." },
  { icon: UserSearch, title: "Built to your ICP", body: "Industry, size, title, seniority, tech stack, and intent — combined into one precise segment." },
  { icon: RefreshCw, title: "Fresh every week", body: "The graph updates continuously, so each weekly drop reflects the latest contacts and signals." },
  { icon: Shield, title: "Consent-aware", body: "Every record honors opt-outs and complies with GDPR, CCPA, and regional privacy rules." },
  { icon: TrendingUp, title: "Lookalike modeling", body: "Hand us your best customers — we find the prospects who look just like them." },
]

const filters = [
  { icon: Building2, label: "Firmographic", chips: ["Industry / NAICS", "Company size", "Funding stage", "Location"] },
  { icon: Users, label: "Demographic", chips: ["Age & income", "Homeownership", "Household", "Interests"] },
  { icon: Layers, label: "Technographic", chips: ["CRM & MarTech", "Cloud & hosting", "eCommerce", "Security tools"] },
  { icon: Target, label: "Intent", chips: ["Searched topics", "Content consumed", "7/14/30-day recency", "~50K segments"] },
  { icon: UserSearch, label: "Title & seniority", chips: ["C-suite to IC", "Department", "Buying authority", "Recent moves"] },
]

const useCases = [
  { audience: "Paid Media", body: "Filter by tech stack, funding, and intent, then push straight to LinkedIn, Meta, and Google." },
  { audience: "Sales Development", body: "Ready-to-call lists of ICP decision-makers with verified work emails — no manual research." },
  { audience: "Account-Based", body: "Upload target accounts and surface every decision-maker across each buying committee." },
  { audience: "Lifecycle", body: "Lookalikes off your churned or best accounts to power precise win-back campaigns." },
]

const resources = [
  { title: "Build an Effective Audience Platform", href: "/blog/02-steps-to-build-an-effective-audience-building-platform-UPDATED" },
  { title: "Audience Targeting Platform Guide", href: "/blog/16-guide-to-building-an-effective-audience-targeting-platform-UPDATED" },
  { title: "Why Segmentation Matters", href: "/blog/11-why-audience-segmentation-platforms-are-key-to-marketing-UPDATED" },
  { title: "Behavioral Audience Segments", href: "/blog/32-creating-behavioral-audience-segments-easily" },
  { title: "Intent-Based Segmentation", href: "/blog/38-buyer-intent-based-audience-segmentation-techniques-UPDATED" },
  { title: "B2B Audience Targeting, Explained", href: "/blog/48-b2b-audience-targeting-explained-for-everyday-brands-UPDATED" },
]

const faqs = [
  {
    question: "How large is your B2B and B2C data?",
    answer: "280M+ verified consumer profiles and 140M+ business profiles. The consumer file is sourced from offline data partners (TransUnion, Experian) rather than purely digital signals, then refreshed every 30 days against NCOA — most providers reconcile annually.",
  },
  {
    question: "How fresh is the intent data?",
    answer: "Signals update continuously. Cursive layers a 15M+ domain organic intent network on top of standard SSP feeds and exposes ~50,000 white-label segments via a taxonomy endpoint. Your audience refreshes weekly, validated against real conversion outcomes.",
  },
  {
    question: "Can I filter by intent?",
    answer: "Yes. Build segments of people actively researching solutions like yours — by topic, keyword, content consumed, and recency window.",
  },
  {
    question: "Can I build lookalike audiences?",
    answer: "Yes. Upload your best customers and Cursive finds similar prospects based on firmographics, demographics, technographics, and behavior.",
  },
  {
    question: "Is the data GDPR and CCPA compliant?",
    answer: "Yes. Every record honors opt-outs and complies with GDPR, CCPA, and regional privacy regulations, using consent-aware activation and hashed identifiers.",
  },
  {
    question: "How much does a Custom Audience cost?",
    answer: "Custom Audience is $197/mo — a fresh weekly list built to your ICP, delivered to Google Sheets. Add the Visitor Pixel for $247/mo total. Self-serve, month-to-month, cancel anytime.",
  },
]

export default function AudienceBuilderPage() {
  return (
    <>
      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Audience Builder", href: "/audience-builder" },
            ]} />
          </div>

          {/* Hero */}
          <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="text-center max-w-3xl mx-auto"
              >
                <span className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
                  Audience Builder
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Targeted lists of buyers
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    built to your exact ICP
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Build your audience from 280M consumer and 140M+ business profiles. Filter by
                  firmographics, demographics, and intent — then get a fresh weekly list delivered to
                  your sheet.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                    Book a Call
                  </Button>
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-600">
                  {["280M consumer profiles", "140M+ business profiles", "Fresh weekly delivery"].map((item) => (
                    <span key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </Container>
          </section>

          {/* How It Works — stepper */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="From Filter to"
                script="Inbox"
                sub="A precise, in-market audience in three steps — no per-contact fees, no export limits."
              />
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {steps.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <IconChip Icon={s.icon} />
                      <span className="text-sm font-semibold text-gray-300">0{i + 1}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{s.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Benefits */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="The Data Behind"
                script="Every List"
                sub="An offline-rooted identity graph and a real intent network — not modeled guesswork."
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {benefits.map((b, i) => (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={b.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{b.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{b.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Filters — chip groups */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Filter on Anything"
                script="That Matters"
                sub="Stack criteria across five filter families to build a hyper-targeted segment."
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                {filters.map((f, i) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-7"
                  >
                    <div className="flex items-center gap-3">
                      <IconChip Icon={f.icon} />
                      <h3 className="text-base font-medium text-gray-900">{f.label}</h3>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {f.chips.map((chip) => (
                        <span
                          key={chip}
                          className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Use Cases — chips */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading plain="Built for Your" script="Channel" />
              <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
                {useCases.map((u, i) => (
                  <motion.div
                    key={u.audience}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 p-6 sm:p-7"
                  >
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {u.audience}
                    </span>
                    <p className="mt-4 text-sm text-gray-600 leading-relaxed">{u.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Pricing — Custom Audience + Bundle */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Simple, Flat"
                script="Pricing"
                sub="Self-serve, month-to-month, cancel anytime. First audience within 24 hours."
              />
              <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="flex flex-col rounded-2xl bg-white border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={Users} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">Custom Audience</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-light text-gray-900">$197</span>
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                    A fresh weekly list of in-market buyers, built to your ICP.
                  </p>
                  <ul className="mt-5 space-y-2.5 flex-1">
                    {["Weekly list of in-market prospects", "Built to your exact ICP", "Delivered to Google Sheets", "First audience within 24 hours"].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer" variant="outline" className="w-full mt-8">
                    Get an Audience
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05, duration: 0.4, ease: EASE }}
                  className="relative flex flex-col rounded-2xl bg-white border border-primary p-6 sm:p-8 shadow-lg ring-1 ring-primary/20"
                >
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white whitespace-nowrap">
                    Best Value
                  </span>
                  <IconChip Icon={Layers} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">Pixel + Audience Bundle</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-light text-gray-900">$247</span>
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                    Your weekly audience plus website visitor identification — one feed.
                  </p>
                  <ul className="mt-5 space-y-2.5 flex-1">
                    {["Everything in Custom Audience", "Visitor Pixel ($97 value)", "Site traffic + intent in one feed", "Best value vs. buying separately"].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer" className="w-full mt-8">
                    Get the Bundle
                  </Button>
                </motion.div>
              </div>
              <p className="mt-8 text-center text-sm text-gray-500">
                No setup fee. No long-term contract. Cancel anytime.
              </p>
            </Container>
          </section>

          {/* Integrations */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <IntegrationsShowcase
                title="Activate to Your Whole Stack"
                subtitle="Sync audiences to 200+ ad platforms, CRMs, and marketing tools"
              />
              <div className="text-center mt-8">
                <Button variant="outline" href="/integrations">
                  View All Integrations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Container>
          </section>

          {/* FAQ */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading plain="Frequently Asked" script="Questions" />
              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, i) => (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7"
                  >
                    <h3 className="text-base font-medium text-gray-900">{faq.question}</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Related Resources */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="Learn More About"
                script="Audiences"
                sub="Expert guides for building and activating high-performing segments."
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {resources.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-primary transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {r.title}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </Container>
          </section>

          {/* Final CTA */}
          <section className="py-20 sm:py-28 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE }}
                className="text-center max-w-2xl mx-auto"
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900">
                  Ready to build your
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    audience?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  First list within 24 hours. Custom Audience from $197/mo, month-to-month, cancel anytime.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                    Book a Call
                  </Button>
                </div>
              </motion.div>
            </Container>
          </section>
        </main>
      </HumanView>

      {/* Machine View - AEO-Optimized */}
      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE AUDIENCE BUILDER</h1>
            <p className="text-gray-700 leading-relaxed">
              Build a targeted Custom Audience from 280M+ verified consumer profiles and 140M+ business
              profiles. Filter by demographics, firmographics, technographics, and ~50,000 white-label
              intent segments, then receive a fresh weekly list delivered to Google Sheets. Custom
              Audience is $197/month; bundle with the Visitor Pixel for $247/month.
            </p>
          </div>

          <MachineSection title="Platform Overview">
            <p className="text-gray-700 mb-4">
              Cursive Audience Builder is the Custom Audience capability — a fresh weekly list of
              in-market buyers built to your exact ICP. It draws on 280M+ verified consumer profiles and
              140M+ business profiles, sourced from offline data partners and refreshed every 30 days
              against NCOA, with intent signals validated against real conversion outcomes.
            </p>
            <MachineList items={[
              "280M+ verified consumer profiles, refreshed every 30 days against NCOA",
              "140M+ business profiles with firmographic data",
              "15M+ organic-network domains layered on standard SSP feeds (the moat)",
              "~50,000 white-label intent segments via taxonomy endpoint",
              "Fresh weekly delivery to Google Sheets",
              "One-click activation to 200+ marketing platforms",
            ]} />
          </MachineSection>

          <MachineSection title="How It Works">
            <p className="text-gray-700 mb-4">
              Build a targeted audience in three steps:
            </p>
            <MachineList items={[
              "Set your filters - Stack firmographic, demographic, technographic, and intent criteria to shape your ICP",
              "Preview the list - See audience size update live as you refine, built to your exact target",
              "Get it weekly - A fresh list of in-market buyers delivered to Google Sheets, with one-click activation to 200+ platforms",
            ]} />
          </MachineSection>

          <MachineSection title="Key Features">
            <MachineList items={[
              {
                label: "280M+ Verified Consumer / 140M+ Business Profiles",
                description: "Offline-rooted (TransUnion, Experian), refreshed every 30 days against NCOA",
              },
              {
                label: "~50K Intent Segments",
                description: "White-label segments via taxonomy endpoint, layered on a 15M+ domain organic intent network on top of standard SSP feeds",
              },
              {
                label: "Built to Your ICP",
                description: "Combine industry, size, title, seniority, tech stack, and intent into one precise segment",
              },
              {
                label: "Fresh Weekly Delivery",
                description: "The graph updates continuously, so each weekly drop reflects the latest contacts and signals",
              },
              {
                label: "Consent-Aware Activation",
                description: "GDPR and CCPA compliant. All data honors opt-outs and privacy regulations",
              },
              {
                label: "Lookalike Modeling",
                description: "Upload customer lists to find similar prospects using AI pattern matching",
              },
            ]} />
          </MachineSection>

          <MachineSection title="Available Filters">
            <div className="space-y-6">
              <div>
                <p className="text-white mb-2">Firmographic Filters (B2B):</p>
                <MachineList items={[
                  "Industry (NAICS codes, custom verticals)",
                  "Company size (employees, revenue)",
                  "Funding stage and total raised",
                  "Geographic location (country, state, city, zip)",
                  "Growth signals (hiring trends, news mentions)",
                ]} />
              </div>
              <div>
                <p className="text-white mb-2">Demographic Filters (B2C):</p>
                <MachineList items={[
                  "Age, gender, income, education level",
                  "Homeownership status and property value",
                  "Household composition and family size",
                  "Interests and purchase behaviors",
                  "Location and mobility patterns",
                ]} />
              </div>
              <div>
                <p className="text-white mb-2">Technographic Filters:</p>
                <MachineList items={[
                  "CRM, marketing automation, analytics tools",
                  "Cloud infrastructure and hosting platforms",
                  "E-commerce platforms and payment processors",
                  "HR and productivity software",
                  "Security and compliance tools",
                ]} />
              </div>
              <div>
                <p className="text-white mb-2">Intent-Based Filters:</p>
                <MachineList items={[
                  "Topics and keywords searched",
                  "Content consumed (whitepapers, reviews, comparisons)",
                  "Recency windows (7-day, 14-day, 30-day)",
                  "~50,000 white-label intent segments via taxonomy endpoint",
                  "15M+ domain organic intent network layered on standard SSP feeds",
                ]} />
              </div>
            </div>
          </MachineSection>

          <MachineSection title="Use Cases">
            <div className="space-y-4">
              <div>
                <p className="text-white mb-2">Paid Media Teams:</p>
                <p className="text-gray-400">Build audiences filtered by tech stack, funding stage, intent signals, and topics. Activate to LinkedIn, Meta, and Google.</p>
              </div>
              <div>
                <p className="text-white mb-2">Sales Development:</p>
                <p className="text-gray-400">Ready-to-call lists of ICP decision-makers with verified work emails. SDRs spend time selling, not researching.</p>
              </div>
              <div>
                <p className="text-white mb-2">Account-Based Marketing:</p>
                <p className="text-gray-400">Upload target account lists and surface every decision-maker per buying committee for multi-threaded ABM.</p>
              </div>
              <div>
                <p className="text-white mb-2">Lifecycle Marketing:</p>
                <p className="text-gray-400">Build lookalike audiences off churned or best accounts to power targeted win-back campaigns.</p>
              </div>
            </div>
          </MachineSection>

          <MachineSection title="Integrations">
            <p className="text-gray-700 mb-4">
              One-click activation to 200+ platforms including:
            </p>
            <MachineList items={[
              "Advertising: Facebook Ads, Google Ads, LinkedIn Ads, Twitter Ads, TikTok Ads, Snapchat Ads",
              "CRM: Salesforce, HubSpot, Marketo, Pardot, Pipedrive, Zoho CRM",
              "Email: Mailchimp, SendGrid, ActiveCampaign, Klaviyo, Braze, Customer.io",
              "Automation: Slack, Zapier, and 180+ more platforms",
            ]} />
          </MachineSection>

          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Custom Audience ($197/month) - A fresh weekly list of in-market buyers built to your ICP, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) - Custom Audience plus the Visitor Pixel, in one feed",
              "Visitor Pixel ($97/month) - Identify the companies and people visiting your site",
            ]} />
          </MachineSection>

          <MachineSection title="Getting Started">
            <MachineList items={[
              {
                label: "Get Started",
                href: "https://leads.meetcursive.com/get-leads",
                description: "Pick a plan and get your first audience within 24 hours",
              },
              {
                label: "Pricing",
                href: "https://www.meetcursive.com/pricing",
                description: "Custom Audience $197/mo, or bundle with the Visitor Pixel for $247/mo",
              },
              {
                label: "Book a Call",
                href: "https://cal.com/cursiveteam/30min",
                description: "Talk to the team before you buy",
              },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
