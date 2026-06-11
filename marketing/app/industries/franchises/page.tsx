"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  MapPin, Users, Mail, LayoutGrid, BarChart3, TrendingUp,
  Eye, Target, ArrowRight, type LucideIcon,
} from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
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

const benefits: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: MapPin, title: "Territory-based targeting", body: "Target buyers by ZIP code, radius, or custom territory so every franchisee gets leads in their own market." },
  { icon: Eye, title: "Identify local visitors", body: "The Visitor Pixel resolves anonymous traffic to real companies and people, then routes each lead to the right location." },
  { icon: Users, title: "In-market audiences per market", body: "A weekly Custom Audience of buyers actively searching in each franchisee's territory, built to your ICP." },
  { icon: LayoutGrid, title: "Multi-location management", body: "Run the same playbook across hundreds of locations from one verified data feed — no per-location wrangling." },
  { icon: Mail, title: "Verified work emails", body: "Every contact ships with a verified work email, so local outreach lands instead of bouncing." },
  { icon: BarChart3, title: "Visibility by location", body: "See lead flow by territory and franchisee, so corporate knows exactly where pipeline is coming from." },
]

const useCases = [
  { audience: "Corporate Marketing", body: "Push one targeting playbook to every franchisee and keep brand and data consistent across markets." },
  { audience: "Franchise Development", body: "Surface in-market buyers in expansion territories before you open the doors." },
  { audience: "Local Franchisees", body: "Get a weekly list of nearby buyers and the companies visiting your site, routed to your location." },
  { audience: "Multi-Unit Operators", body: "Track lead flow across every unit you own from a single feed, no spreadsheets stitched together." },
]

const plans: Array<{ name: string; price: string; icon: LucideIcon; description: string; cta: string; highlight: boolean }> = [
  {
    name: "Visitor Pixel",
    price: "$97",
    icon: Eye,
    description: "Identify the companies and people visiting your franchise sites and route them to the right location.",
    cta: "Get the Pixel",
    highlight: false,
  },
  {
    name: "Pixel + Audience Bundle",
    price: "$247",
    icon: LayoutGrid,
    description: "Local site traffic and in-market intent for every territory, in one feed.",
    cta: "Get the Bundle",
    highlight: true,
  },
  {
    name: "Custom Audience",
    price: "$197",
    icon: Users,
    description: "A fresh weekly list of buyers searching in each franchisee's market, built to your ICP.",
    cta: "Get an Audience",
    highlight: false,
  },
]

export default function FranchisesPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Franchises', url: 'https://www.meetcursive.com/industries/franchises' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Industries", href: "/industries" },
              { name: "Franchises", href: "/industries/franchises" },
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
                  Industry Solutions
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Franchise Marketing Solutions
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    local leads at scale
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Give every franchisee local leads in their own territory. Cursive identifies the
                  buyers near each location and delivers verified contacts — built to your ICP,
                  routed to the right market.
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

          {/* Why Cursive for Franchises */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Why Franchises"
                script="Run on Cursive"
                sub="Centralized data, local execution. One feed that works the same in every territory."
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

          {/* Use Cases */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading plain="Built for Every" script="Layer of the System" />
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

          {/* Pricing */}
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
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed flex-1">{plan.description}</p>
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
                plain="Franchise Resources"
                script="& Insights"
                sub="Strategies and best practices for franchise marketing at scale."
              />
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {[
                  { title: "How to Scale Outbound Without Killing Quality", description: "Build scalable marketing systems across multiple franchise locations.", href: "/blog/scaling-outbound" },
                  { title: "Guide to Direct Mail Marketing Automation", description: "Automate territory-specific direct mail for all franchisees.", href: "/blog/direct-mail" },
                  { title: "Omni-Channel Retargeting Strategies", description: "Coordinate campaigns across all locations with consistent messaging.", href: "/blog/retargeting" },
                  { title: "How to Identify Website Visitors: Technical Guide", description: "Identify and route leads to the correct franchise location.", href: "/blog/how-to-identify-website-visitors-technical-guide" },
                  { title: "Tips for Improving CRM Integration Workflows", description: "Manage multi-location CRM workflows and franchisee access.", href: "/blog/crm-integration" },
                  { title: "How Marketing Data Solutions Improve Campaigns", description: "Leverage data to improve performance across all franchise locations.", href: "/blog/analytics" },
                ].map((resource, i) => (
                  <motion.a
                    key={resource.href}
                    href={resource.href}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="group block rounded-2xl border border-gray-200 p-6 sm:p-7 hover:shadow-lg hover:border-primary transition-all"
                  >
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{resource.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Read article
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </motion.a>
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
                  Ready to scale your
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    franchise growth?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Local leads for every territory. Plans from $97/mo, month-to-month, cancel anytime.
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
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE FOR FRANCHISES</h1>
            <p className="text-gray-700 leading-relaxed">
              Cursive delivers local leads at scale for franchise systems. Identify the buyers near
              each location and route verified contacts to the right franchisee — with territory-based
              targeting, a weekly in-market audience per market, and visitor identification. Self-serve
              from $97/month.
            </p>
          </div>

          {/* Franchise Solutions */}
          <MachineSection title="Solutions for Franchises">
            <MachineList items={[
              { label: "Territory-Based Targeting", description: "Target buyers by ZIP code, radius, or custom territory for each franchisee" },
              { label: "Visitor Identification", description: "Resolve anonymous site traffic to real companies and people and route to the right location" },
              { label: "In-Market Audiences Per Market", description: "A fresh weekly list of buyers searching in each franchisee's territory, built to your ICP" },
              { label: "Multi-Location Management", description: "Run one verified data feed across hundreds of locations" },
            ]} />
          </MachineSection>

          {/* Benefits */}
          <MachineSection title="Benefits">
            <MachineList items={[
              "Centralized data, local execution: corporate keeps one consistent feed while each franchisee gets leads in their own market",
              "Franchisee support: every contact ships with a verified work email so local outreach lands",
              "Performance visibility: see lead flow by territory and franchisee",
              "Scalable: the same data feed works in every territory, without proportional cost per location",
            ]} />
          </MachineSection>

          {/* Use Cases */}
          <MachineSection title="Common Use Cases">
            <MachineList items={[
              "Corporate marketing: push one targeting playbook to every franchisee",
              "Franchise development: surface in-market buyers in expansion territories",
              "Local franchisees: a weekly list of nearby buyers plus site visitors routed to your location",
              "Multi-unit operators: track lead flow across every unit from a single feed",
            ]} />
          </MachineSection>

          {/* Pricing */}
          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) - Identify the companies and people visiting your franchise sites",
              "Custom Audience ($197/month) - A fresh weekly list of in-market buyers per market, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) - Both, in one feed",
            ]} />
          </MachineSection>

          {/* Getting Started */}
          <MachineSection title="Get Started">
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
