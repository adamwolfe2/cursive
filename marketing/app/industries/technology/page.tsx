"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Users, Target, Layers, BarChart3, RefreshCw,
  ArrowRight, type LucideIcon,
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
    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

const benefits: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Eye, title: "Identify your visitors", body: "Resolve 40–60% of anonymous traffic to the companies and people evaluating your product — deterministically, the moment they land." },
  { icon: Users, title: "Reach decision-makers", body: "Every visitor and audience record carries a verified work email, job title, and seniority — built for technical buying committees." },
  { icon: Target, title: "Built to your ICP", body: "A fresh weekly Custom Audience of buyers searching for what you sell, filtered to your exact ideal customer profile." },
  { icon: BarChart3, title: "Page-level intent", body: "Know who hit your pricing, docs, or integrations page. Prioritize the highest-intent accounts first." },
  { icon: Layers, title: "Fits your stack", body: "Export verified contacts straight to your CRM, ad platforms, and sequencer. No rip-and-replace." },
  { icon: RefreshCw, title: "Gets smarter monthly", body: "Every visitor identified and audience built feeds your targeting, so pipeline quality compounds cycle over cycle." },
]

const useCases = [
  { audience: "Demand Generation", body: "Surface companies researching solutions in your category and reach them while intent is hot." },
  { audience: "Product Launches", body: "Build awareness for new releases with accounts that match your ICP and show buying signals." },
  { audience: "Sales Development", body: "Hot accounts land in your CRM with the pages they viewed — no more blind prospecting." },
  { audience: "Marketing Ops", body: "See which companies clicked your ads but didn't convert, then retarget them by name." },
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

const resources = [
  { title: "B2B Audience Targeting Explained", description: "Master B2B targeting strategies to reach technology buyers and decision-makers.", href: "/blog/audience-targeting" },
  { title: "How to Identify Website Visitors: Technical Guide", description: "Deanonymize website traffic and turn visitors into qualified pipeline.", href: "/blog/how-to-identify-website-visitors-technical-guide" },
  { title: "ICP Targeting Guide for Technology Companies", description: "Build and activate your ideal customer profile for precision targeting.", href: "/blog/icp-targeting-guide" },
  { title: "How to Scale Outbound Without Killing Quality", description: "Scale outbound campaigns while maintaining relevance and personalization.", href: "/blog/scaling-outbound" },
  { title: "Tips for Improving CRM Integration Workflows", description: "Optimize your CRM integrations for seamless data flow and pipeline tracking.", href: "/blog/crm-integration" },
  { title: "How Marketing Data Solutions Improve Campaigns", description: "Leverage intent data and enrichment to improve campaign performance.", href: "/blog/analytics" },
]

export default function TechnologyPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Technology', url: 'https://www.meetcursive.com/industries/technology' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Industries", href: "/industries" },
              { name: "Technology", href: "/industries/technology" },
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
                  Technology Industry
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    pipeline, identified
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Accelerate pipeline for technology companies. Identify the buyers already evaluating
                  your product, surface in-market accounts to your ICP, and reach verified
                  decision-makers — deterministically, the moment they show intent.
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

          {/* Why Cursive */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Why Technology Teams"
                script="Choose Cursive"
                sub="Two products and the verified data behind them. No army of BDRs, no stitching together ten tools."
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
              <SectionHeading plain="Built for Your" script="Workflow" />
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
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{plan.description}</p>
                    <ul className="mt-5 space-y-2.5 flex-1">
                      {plan.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
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
                plain="Technology Resources"
                script="& Insights"
                sub="Strategies and best practices for technology company marketing and demand generation."
              />
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {resources.map((resource, i) => (
                  <motion.a
                    key={resource.href}
                    href={resource.href}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="block rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg hover:border-primary transition-all group"
                  >
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{resource.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                      Read article
                      <ArrowRight className="w-4 h-4" />
                    </div>
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
                  Ready to accelerate your
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    pipeline growth?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Install the pixel in 60 seconds, or get your first audience within 24 hours. Plans
                  from $97/mo, month-to-month, cancel anytime.
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
            <h2 className="text-2xl text-foreground font-semibold mb-4">TECHNOLOGY INDUSTRY MARKETING SOLUTIONS</h2>
            <p className="text-gray-700 leading-relaxed">
              Pipeline acceleration for technology companies. Identify the companies and people evaluating
              your product, surface in-market buyers to your ICP, and reach verified decision-makers with
              a self-serve identity and intent data layer. Self-serve from $97/month.
            </p>
          </div>

          {/* Overview */}
          <MachineSection title="Solution Overview">
            <p className="text-gray-700 mb-4">
              Cursive helps technology companies identify prospects actively evaluating solutions in their
              category, deanonymize website visitors, and reach verified decision-makers. Built for demand
              generation teams at hardware, software, IT services, and managed services companies.
            </p>
          </MachineSection>

          {/* Key Benefits */}
          <MachineSection title="Why Choose Cursive for Technology">
            <MachineList items={[
              { label: "Visitor Identification", description: "Resolve 40–60% of anonymous website traffic to the companies and people evaluating your product, deterministically" },
              { label: "Verified Decision-Makers", description: "Every record carries a verified work email, job title, and seniority for technical buying committees" },
              { label: "ICP-Built Audiences", description: "A fresh weekly Custom Audience of buyers searching for your product, filtered to your exact ideal customer profile" },
              { label: "Page-Level Intent", description: "See who hit your pricing, docs, or integrations pages and prioritize the highest-intent accounts first" },
              { label: "Stack Integration", description: "Export verified contacts to your CRM, ad platforms, and sequencer with no rip-and-replace" },
              { label: "Compounding Targeting", description: "Every visitor identified and audience built feeds targeting so pipeline quality improves month over month" },
            ]} />
          </MachineSection>

          {/* Use Cases */}
          <MachineSection title="Common Use Cases">
            <MachineList items={[
              "Demand Generation: Surface companies researching solutions in your category and reach them while intent is hot",
              "Product Launches: Build awareness for new releases with accounts that match your ICP and show buying signals",
              "Sales Development: Hot accounts land in the CRM with the pages they viewed, no more blind prospecting",
              "Marketing Ops: Retarget companies that clicked ads but didn't convert, by name",
            ]} />
          </MachineSection>

          {/* Pricing */}
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

          {/* Getting Started */}
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
