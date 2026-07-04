"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Home, Send, MapPin, Search, RefreshCw, Layers,
  Eye, Users, ArrowRight, type LucideIcon,
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
  { icon: Eye, title: "Listing visitor ID", body: "See which buyers and sellers are browsing your listings, matched to real people with verified contact details." },
  { icon: Send, title: "Automated direct mail", body: "Trigger just-listed, just-sold, and farming postcards automatically based on events and schedules." },
  { icon: MapPin, title: "Neighborhood farming", body: "Build targeted audiences by zip code, neighborhood, and property characteristics for consistent prospecting." },
  { icon: Search, title: "Buyer intent signals", body: "Surface prospects actively searching for properties in your market, before they call another agent." },
  { icon: RefreshCw, title: "CRM integration", body: "Sync identified leads straight into your real estate CRM for automated follow-up sequences." },
  { icon: Layers, title: "Multi-channel reach", body: "Coordinate outreach across direct mail, email, digital ads, and social for maximum coverage." },
]

const useCases = [
  { audience: "Just Listed / Just Sold", body: "Trigger postcards to surrounding homes automatically when a new listing goes live or closes." },
  { audience: "Geographic Farming", body: "Stay top of mind in target zip codes with automated monthly mailers built on local market data." },
  { audience: "Open House Follow-Up", body: "Identify visitors to your listing pages before and after open houses, then follow up by name." },
  { audience: "Expired Listings", body: "Reach homeowners with expired listings through coordinated direct mail and digital campaigns." },
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
    description: "Identify the buyers and sellers browsing your listings.",
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
    description: "Listing traffic and in-market intent in one feed.",
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
    description: "A fresh weekly list of buyers and sellers in your market.",
    items: [
      "Weekly list of in-market prospects",
      "Built to your farm area and ICP",
      "Delivered to Google Sheets",
      "First audience within 24 hours",
    ],
    cta: "Get an Audience",
    highlight: false,
  },
]

const resources = [
  { title: "Guide to Direct Mail Marketing Automation", description: "Automate just-listed, just-sold, and farming campaigns with triggered direct mail.", href: "/blog/direct-mail" },
  { title: "How to Identify Website Visitors: Technical Guide", description: "Turn anonymous listing visitors into identified buyer and seller leads.", href: "/blog/how-to-identify-website-visitors-technical-guide" },
  { title: "Omni-Channel Retargeting Strategies", description: "Coordinate campaigns across digital ads, email, and direct mail for real estate.", href: "/blog/retargeting" },
  { title: "Tips for Improving CRM Integration Workflows", description: "Sync lead data with your real estate CRM for automated follow-up.", href: "/blog/crm-integration" },
  { title: "How Marketing Data Solutions Improve Campaigns", description: "Use data-driven targeting to reach buyers and sellers in your market.", href: "/blog/analytics" },
  { title: "How to Scale Outbound Without Killing Quality", description: "Scale your prospecting while keeping outreach personal.", href: "/blog/scaling-outbound" },
]

export default function RealEstatePage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Real Estate', url: 'https://www.meetcursive.com/industries/real-estate' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Industries", href: "/industries" },
              { name: "Real Estate", href: "/industries/real-estate" },
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
                  Real Estate
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Real Estate Marketing
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    Solutions
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Identify the buyers and sellers visiting your listings, build targeted audiences
                  for your farm area, and turn anonymous traffic into closed deals.
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

          {/* Benefits */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Why Real Estate Teams"
                script="Choose Cursive"
                sub="Identify listing visitors, automate the mail, and prospect your farm without the busywork."
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
              <SectionHeading plain="Built for Your" script="Campaigns" />
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
                plain="Real Estate Resources"
                script="& Insights"
                sub="Strategies and best practices for real estate marketing and lead generation."
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {resources.map((resource, i) => (
                  <motion.div
                    key={resource.href}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                  >
                    <Link
                      href={resource.href}
                      className="flex h-full flex-col rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-primary transition-all group"
                    >
                      <h3 className="text-base font-medium text-gray-900 group-hover:text-primary transition-colors">
                        {resource.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed flex-1">
                        {resource.description}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                        Read article
                        <ArrowRight className="h-4 w-4" />
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
                  Ready to generate more
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    real estate leads?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Install the pixel in 60 seconds and identify your listing visitors. Plans from
                  $97/mo, month-to-month, cancel anytime.
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
            <h2 className="text-2xl text-foreground font-semibold mb-4">REAL ESTATE MARKETING SOLUTIONS</h2>
            <p className="text-gray-700 leading-relaxed">
              Lead generation and direct mail automation for real estate professionals. Identify prospective buyers and sellers visiting your listings, automate farming campaigns, and convert more leads with targeted outreach. Self-serve from $97/month.
            </p>
          </div>

          {/* Overview */}
          <MachineSection title="Solution Overview">
            <p className="text-gray-700 mb-4">
              Cursive helps real estate agents, teams, and brokerages identify website visitors browsing listings, automate direct mail campaigns for farming and prospecting, and build targeted audiences of likely buyers and sellers. Turn anonymous listing traffic into actionable leads and scale your marketing without administrative overhead.
            </p>
          </MachineSection>

          {/* Key Benefits */}
          <MachineSection title="Why Choose Cursive for Real Estate">
            <MachineList items={[
              { label: "Listing Visitor Identification", description: "Identify who is browsing your listings online and match them to verified contact information" },
              { label: "Automated Direct Mail", description: "Trigger just-listed, just-sold, and farming postcards automatically based on events and schedules" },
              { label: "Neighborhood Farming", description: "Build targeted audiences by zip code, neighborhood, and property characteristics for consistent prospecting" },
              { label: "Buyer Intent Signals", description: "Identify prospects actively searching for properties in your market with buying intent data" },
              { label: "CRM Integration", description: "Sync identified leads directly to your real estate CRM for automated follow-up sequences" },
              { label: "Multi-Channel Campaigns", description: "Coordinate outreach across direct mail, email, digital ads, and social media for maximum reach" },
            ]} />
          </MachineSection>

          {/* Use Cases */}
          <MachineSection title="Common Use Cases">
            <MachineList items={[
              "Just-Listed / Just-Sold Campaigns: Automatically trigger postcards to surrounding neighborhoods when new listings go live or close",
              "Geographic Farming: Maintain consistent presence in target zip codes with automated monthly mailers personalized with local market data",
              "Open House Follow-Up: Identify visitors to your listing pages before and after open houses and trigger personalized follow-up",
              "Expired Listing Outreach: Target homeowners with expired listings using personalized direct mail and digital campaigns",
            ]} />
          </MachineSection>

          {/* Pricing */}
          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) - Identify the buyers and sellers visiting your listings",
              "Custom Audience ($197/month) - A fresh weekly list of in-market prospects, delivered to Google Sheets",
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
