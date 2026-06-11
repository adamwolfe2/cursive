"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Target, Zap, Shield, Filter, BarChart3,
  Users, Clock, TrendingUp, CheckCircle2,
  ArrowRight, Database, Layers, Check,
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
    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

const steps = [
  { icon: Zap, title: "Install the pixel", desc: "One lightweight snippet. 60 seconds, any platform." },
  { icon: Eye, title: "Identify in real time", desc: "Visitors resolved to company and person the moment they land." },
  { icon: Target, title: "Activate everywhere", desc: "Verified contacts synced to your CRM, ads, and sequences." },
]

const benefits: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Database, title: "40–60% match rate", body: "Deterministic, offline-rooted identity — not modeled. Cookie sync averages 2–5%, IP-only 10–15%." },
  { icon: Users, title: "Company + person data", body: "See the business and the specific people browsing — job title, seniority, verified work email." },
  { icon: Clock, title: "Real-time, not batched", body: "Visitors resolved the second they land, so you can reach out while intent is hot." },
  { icon: BarChart3, title: "Page-level intent", body: "Know who hit your pricing page. Prioritize the highest-intent visitors first." },
  { icon: Filter, title: "Smart filtering", body: "Auto-exclude existing customers, bots, and internal traffic. Only new opportunities surface." },
  { icon: Shield, title: "Privacy-compliant", body: "GDPR and CCPA ready out of the box — hashed IDs, honored opt-outs, regional rules." },
]

const useCases = [
  { audience: "B2B SaaS Sales", body: "Hot accounts land in your CRM with the pages they viewed — no more blind prospecting." },
  { audience: "Marketing", body: "See which companies clicked your ads but didn't convert, then retarget them by name." },
  { audience: "Customer Success", body: "Get alerted when at-risk accounts revisit pricing, and save them before they churn." },
  { audience: "Agencies", body: "Tie website visits to closed deals and prove campaign ROI to win renewals." },
]

const plans: Array<{
  name: string
  price: string
  icon: LucideIcon
  description: string
  items: string[]
  cta: string
  highlight: boolean
}> = [
  {
    name: "Visitor Pixel",
    price: "$97",
    icon: Eye,
    description: "Identify the companies and people visiting your site.",
    items: [
      "40–60% deterministic match rate",
      "Company + person-level detail",
      "One-snippet install, 60 seconds",
      "Identified visitors synced to your portal",
    ],
    cta: "Get the Pixel",
    highlight: false,
  },
  {
    name: "Pixel + Audience Bundle",
    price: "$247",
    icon: Layers,
    description: "Site traffic and in-market intent in one feed.",
    items: [
      "Everything in Visitor Pixel",
      "Everything in Custom Audience",
      "Priority audience updates within 24h",
      "Best value vs. buying separately",
    ],
    cta: "Get the Bundle",
    highlight: true,
  },
  {
    name: "Custom Audience",
    price: "$197",
    icon: Users,
    description: "A fresh weekly list of buyers searching for your product.",
    items: [
      "Weekly list of in-market prospects",
      "Built to your exact ICP",
      "Delivered to Google Sheets",
      "First audience within 24 hours",
    ],
    cta: "Get an Audience",
    highlight: false,
  },
]

const faqs = [
  {
    question: "How accurate is visitor identification?",
    answer: "Cursive's pixel achieves a 40–60% match rate on US B2B traffic — deterministic, not modeled. Cookie-sync providers average 2–5% and IP-only databases sit around 10–15%. Accuracy on a matched record is 60–80%, driven by geo-framing and an offline-rooted identity graph of 280M+ verified profiles refreshed every 30 days against NCOA.",
  },
  {
    question: "How quickly are visitors identified?",
    answer: "In real time, within seconds of landing. Unlike batch tools, Cursive enriches instantly so you can act on hot leads immediately.",
  },
  {
    question: "Is it GDPR and CCPA compliant?",
    answer: "Yes. We honor all opt-outs, use hashed identifiers, and comply with GDPR, CCPA, and regional privacy regulations out of the box.",
  },
  {
    question: "What data do I get per visitor?",
    answer: "Company name, industry, size, location, and technologies — plus, where available, the individual's job title, seniority, department, and verified work email.",
  },
  {
    question: "How does it work with my CRM?",
    answer: "Native sync to Salesforce, HubSpot, and 200+ tools. Identified visitors flow into your existing stack automatically.",
  },
  {
    question: "How much does it cost?",
    answer: "Flat monthly pricing, no per-visitor fees. Visitor Pixel is $97/mo, Custom Audience $197/mo, or both for $247/mo. Self-serve, month-to-month, cancel anytime.",
  },
]

export default function VisitorIdentificationPage() {
  return (
    <>
      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Visitor Identification", href: "/visitor-identification" },
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
                  Website Visitor Identification
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Stop losing 98% of
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    your website visitors
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Most B2B sites never know who shows up. The Cursive pixel resolves 40–60% of your
                  anonymous traffic to real companies and people — deterministically, the moment they land.
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
                  {["60-second setup", "40–60% match rate", "200+ integrations"].map((item) => (
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
                plain="How It"
                script="Works"
                sub="From anonymous visitor to qualified lead in three steps."
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
                plain="Turn Anonymous Traffic"
                script="Into Revenue"
                sub="Stop guessing who's interested. Start reaching out while leads are hot."
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

          {/* Use Cases — chips */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading plain="Built for Your" script="Workflow" />
              <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
                {useCases.map((u, i) => (
                  <motion.div
                    key={u.audience}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-7"
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

          {/* Pricing — three self-serve plans */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="Pick Your"
                script="Plan"
                sub="Self-serve, month-to-month, cancel anytime. Install in 60 seconds, first audience in 24 hours."
              />
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
                {plans.map((plan, i) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className={`relative flex flex-col rounded-2xl p-6 sm:p-8 transition-shadow ${
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
                    <IconChip Icon={plan.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{plan.name}</h3>
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
                      rel="noopener noreferrer"
                      variant={plan.highlight ? "default" : "outline"}
                      className="w-full mt-8"
                    >
                      {plan.cta}
                    </Button>
                  </motion.div>
                ))}
              </div>
              <p className="mt-8 text-center text-sm text-gray-500">
                No setup fee. No long-term contract. Cancel anytime.
              </p>
            </Container>
          </section>

          {/* Integrations */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <IntegrationsShowcase
                title="Works With Your Existing Stack"
                subtitle="Native integrations with 200+ CRMs, ad platforms, and marketing tools"
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
          <section className="py-20 sm:py-24 bg-white">
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
                    className="rounded-2xl border border-gray-200 p-6 sm:p-7"
                  >
                    <h3 className="text-base font-medium text-gray-900">{faq.question}</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Related */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="How Cursive"
                script="Compares"
                sub="See visitor identification side by side with the alternatives."
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[
                  { title: "Clearbit Alternatives", href: "/blog/clearbit-alternatives-comparison" },
                  { title: "Warmly vs Cursive", href: "/blog/warmly-vs-cursive-comparison" },
                  { title: "ZoomInfo vs Cursive", href: "/blog/zoominfo-vs-cursive-comparison" },
                  { title: "Apollo vs Cursive", href: "/blog/apollo-vs-cursive-comparison" },
                  { title: "6sense vs Cursive", href: "/blog/6sense-vs-cursive-comparison" },
                  { title: "Identify Anonymous Visitors", href: "/blog/how-to-identify-anonymous-website-visitors" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-primary transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {link.title}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </Container>
          </section>

          {/* Final CTA */}
          <section className="py-20 sm:py-28 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE }}
                className="text-center max-w-2xl mx-auto"
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900">
                  Ready to see who&apos;s
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    visiting your site?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Install the pixel in 60 seconds. Plans from $97/mo, month-to-month, cancel anytime.
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

      {/* Machine View — AEO-Optimized */}
      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">WEBSITE VISITOR IDENTIFICATION</h1>
            <p className="text-gray-700 leading-relaxed">
              Cursive identifies 40&ndash;60% of anonymous website visitors deterministically against an
              offline-rooted identity graph of 280M+ verified profiles refreshed every 30 days against NCOA.
              Turn unknown traffic into qualified leads with company and individual-level data, page-level
              tracking, and instant CRM sync. Self-serve from $97/month.
            </p>
          </div>

          <MachineSection title="Key Metrics">
            <MachineList items={[
              "40–60% - Pixel match rate on US B2B traffic (deterministic, not modeled)",
              "60–80% - Accuracy on a matched record",
              "2–5% - Industry cookie-sync match rate (for context)",
              "10–15% - Industry IP-database match rate (for context)",
              "280M+ - Verified profiles, refreshed every 30 days against NCOA",
              "200+ - Native CRM and ad-platform integrations",
              "60 seconds - To install the pixel and go live",
            ]} />
          </MachineSection>

          <MachineSection title="How Visitor Identification Works">
            <MachineList items={[
              "Step 1: Install the lightweight tracking pixel (60 seconds)",
              "Step 2: Visitors browse your website",
              "Step 3: Cursive resolves company + individual in real time",
              "Step 4: Verified contacts sync to your CRM automatically",
              "Step 5: Your team acts on warm, in-market leads",
            ]} />
          </MachineSection>

          <MachineSection title="What You Get Per Visitor">
            <MachineList items={[
              "Company name, industry, size, location, and technologies",
              "Individual job title, seniority, and department",
              "Verified work email (and phone where available)",
              "Page-level browsing behavior and return-visitor detection",
            ]} />
          </MachineSection>

          <MachineSection title="Common Use Cases">
            <MachineList items={[
              "B2B SaaS Sales: Hot accounts land in the CRM with the pages they viewed",
              "Marketing: Retarget companies that clicked ads but didn't convert",
              "Customer Success: Get alerted when at-risk accounts revisit pricing",
              "Agencies: Tie website visits to closed deals and prove campaign ROI",
            ]} />
          </MachineSection>

          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) - Identify the companies and people visiting your site",
              "Custom Audience ($197/month) - A fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) - Both, in one feed",
            ]} />
          </MachineSection>

          <MachineSection title="CRM Integrations">
            <p className="text-gray-700 mb-4">
              Visitor data syncs automatically to 200+ platforms, including:
            </p>
            <MachineList items={[
              "Salesforce - Real-time lead creation and updates",
              "HubSpot - Contact enrichment and activity tracking",
              "Pipedrive - Deal stage automation based on visits",
              "Custom API - Build your own integrations",
            ]} />
          </MachineSection>

          <MachineSection title="Privacy & Compliance">
            <p className="text-gray-700 mb-4">
              Fully compliant with GDPR, CCPA, and regional privacy regulations. We honor opt-outs,
              respect Do Not Track signals, and store only hashed identifiers.
            </p>
            <MachineList items={[
              { label: "Privacy Policy", href: "https://www.meetcursive.com/privacy" },
              { label: "Terms of Service", href: "https://www.meetcursive.com/terms" },
            ]} />
          </MachineSection>

          <MachineSection title="Getting Started">
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team before you buy" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
