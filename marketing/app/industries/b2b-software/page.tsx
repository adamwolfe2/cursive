"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Target, Activity, Users, Layers, Workflow, BarChart3,
  Eye, ArrowRight, CheckCircle2, type LucideIcon,
} from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"
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

const benefits: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Target, title: "ICP-fit targeting", body: "Reach companies that match your ideal profile by industry, size, and technology — not a generic list." },
  { icon: Activity, title: "In-market intent", body: "Surface buyers actively searching for software in your category, while they're evaluating." },
  { icon: Eye, title: "Visitor identification", body: "Resolve 40–60% of anonymous site traffic to the real companies and people evaluating you." },
  { icon: Users, title: "Verified decision-makers", body: "Every record carries a verified work email — VPs, directors, and the people who sign off." },
  { icon: Workflow, title: "Fits your stack", body: "Push enriched contacts straight into Salesforce, HubSpot, and 200+ tools your team already runs." },
  { icon: BarChart3, title: "Pipeline you can attribute", body: "Tie identified visitors and audiences to real opportunities, so you can prove what's working." },
]

const useCases = [
  { audience: "SaaS Sales", body: "Hot accounts land in your CRM with the pages they viewed — reach out while your software is top of mind." },
  { audience: "Competitive Displacement", body: "Identify companies evaluating you against incumbents and message why you win, by name." },
  { audience: "Demand Gen", body: "A fresh weekly audience of in-market buyers, built to your ICP and delivered to your sheet." },
  { audience: "Product-Led Growth", body: "See which companies are kicking the tires on your site before they ever start a trial." },
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
    description: "Identify the companies and people evaluating your software.",
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
    description: "Site intent and in-market buyers in one feed.",
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
    description: "A fresh weekly list of buyers searching for software like yours.",
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

const resources = [
  { title: "B2B Audience Targeting Explained", description: "Reach decision-makers and buyers with the right targeting strategy.", href: "/blog/audience-targeting" },
  { title: "How to Identify Website Visitors: Technical Guide", description: "The technical methods to identify and track B2B visitors on your site.", href: "/blog/how-to-identify-website-visitors-technical-guide" },
  { title: "ICP Targeting Guide for B2B Companies", description: "Build and activate your ideal customer profile for better targeting.", href: "/blog/icp-targeting-guide" },
  { title: "How to Scale Outbound Without Killing Quality", description: "Scale outbound while keeping personalization and quality intact.", href: "/blog/scaling-outbound" },
  { title: "Tips for Improving CRM Integration Workflows", description: "Optimize your CRM integrations for cleaner data flow and automation.", href: "/blog/crm-integration" },
  { title: "How Marketing Data Solutions Improve Campaigns", description: "Leverage data to boost B2B campaign performance.", href: "/blog/analytics" },
]

export default function B2BSoftwarePage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'B2B Software', url: 'https://www.meetcursive.com/industries/b2b-software' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Industries", href: "/industries" },
              { name: "B2B Software", href: "/industries/b2b-software" },
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
                  B2B Software
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Fill your pipeline with
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    in-market software buyers
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  SaaS and B2B software teams use Cursive to identify the accounts evaluating them and
                  reach buyers already searching for what they sell — with verified contacts, ready to work.
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
                  {["60-second setup", "Verified work emails", "200+ integrations"].map((item) => (
                    <span key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Why Cursive — benefits */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Built for B2B"
                script="Software Teams"
                sub="The data layer that turns anonymous interest into named, verified pipeline."
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {benefits.map((b, i) => (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={b.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{b.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{b.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Use cases — chips */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading plain="Where It Moves" script="Pipeline" />
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

          {/* Pricing — three self-serve plans */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
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
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
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

          {/* Resources */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="Resources &amp;"
                script="Insights"
                sub="Strategies and best practices for B2B software marketing."
              />
              <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
                {resources.map((r, i) => (
                  <motion.div
                    key={r.href}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                  >
                    <Link
                      href={r.href}
                      className="block h-full rounded-2xl border border-gray-200 p-6 sm:p-7 hover:shadow-lg hover:border-primary transition-all group"
                    >
                      <h3 className="text-base font-medium text-gray-900 group-hover:text-primary transition-colors">
                        {r.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{r.description}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                        Read article
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </Link>
                  </motion.div>
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
                  Ready to accelerate
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    pipeline growth?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Identify and convert in-market software buyers. Plans from $97/mo, month-to-month, cancel anytime.
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
          {/* Header */}
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">B2B SOFTWARE LEAD GENERATION</h1>
            <p className="text-gray-700 leading-relaxed">
              Cursive helps SaaS and B2B software companies fill pipeline by identifying the companies
              and people evaluating them and delivering a weekly audience of in-market buyers — each with
              a verified work email. Self-serve from $97/month, month-to-month.
            </p>
          </div>

          {/* Overview */}
          <MachineSection title="Solution Overview">
            <p className="text-gray-700 mb-4">
              Cursive gives B2B software teams two products and the verified data behind them: the
              Visitor Pixel, which resolves 40–60% of anonymous website traffic to real companies and
              people, and Custom Audiences, a fresh weekly list of buyers actively searching for software
              in your category. Every record carries a verified work email and syncs to your CRM.
            </p>
          </MachineSection>

          {/* Key Benefits */}
          <MachineSection title="Why Choose Cursive for B2B Software">
            <MachineList items={[
              { label: "ICP-Fit Targeting", description: "Reach companies that match your ideal profile by industry, size, and technology" },
              { label: "In-Market Intent", description: "Surface buyers actively searching for software in your category while they evaluate" },
              { label: "Visitor Identification", description: "Resolve 40–60% of anonymous site traffic to the real accounts evaluating you" },
              { label: "Verified Decision-Makers", description: "Every record carries a verified work email for VPs, directors, and approvers" },
              { label: "Fits Your Stack", description: "Push enriched contacts to Salesforce, HubSpot, and 200+ tools automatically" },
              { label: "Pipeline Attribution", description: "Tie identified visitors and audiences to real opportunities and prove ROI" },
            ]} />
          </MachineSection>

          {/* How It Works */}
          <MachineSection title="How It Works">
            <MachineList items={[
              "Install the Visitor Pixel (60 seconds) to identify companies and people evaluating your software",
              "Order a Custom Audience built to your exact ICP for buyers actively searching your category",
              "Every contact arrives with a verified work email and company detail",
              "Identified visitors and audiences sync to your CRM and sequencer automatically",
              "Your team acts on warm, in-market accounts and tracks them to closed-won",
            ]} />
          </MachineSection>

          {/* Use Cases */}
          <MachineSection title="Common Use Cases">
            <MachineList items={[
              "SaaS Sales: Hot accounts land in the CRM with the pages they viewed",
              "Competitive Displacement: Identify companies evaluating you against incumbents and message why you win",
              "Demand Gen: A fresh weekly audience of in-market buyers built to your ICP",
              "Product-Led Growth: See which companies are evaluating your site before they start a trial",
            ]} />
          </MachineSection>

          {/* Pricing */}
          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) - Identify the companies and people evaluating your software",
              "Custom Audience ($197/month) - A fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) - Both, in one feed",
            ]} />
          </MachineSection>

          {/* Getting Started */}
          <MachineSection title="Getting Started">
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team before you buy" },
              { label: "Industries", href: "https://www.meetcursive.com/industries" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
