"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Users, Layers, Target, BarChart3, Database,
  ShieldCheck, LinkIcon, ArrowRight, CheckCircle2,
  type LucideIcon,
} from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import Link from "next/link"
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
  { icon: Database, title: "Premium audience data", body: "High-value, verified audience segments that lift CPMs and pull premium advertisers to your inventory." },
  { icon: Users, title: "First-party enrichment", body: "Layer demographic, firmographic, and behavioral detail onto your first-party data for sharper targeting." },
  { icon: Target, title: "Advertiser targeting", body: "Build custom audiences that match each advertiser's brief and maximize fill rates." },
  { icon: BarChart3, title: "Cross-platform attribution", body: "Tie audience engagement across channels back to campaigns and prove the value of your media properties." },
  { icon: LinkIcon, title: "Programmatic integration", body: "Push audience data straight into your ad server and programmatic platforms — synced to 200+ tools." },
  { icon: ShieldCheck, title: "Brand-safe & compliant", body: "Verified, GDPR/CCPA-ready data with full transparency, so advertisers buy with confidence." },
]

const useCases = [
  { audience: "Publishers", body: "Monetize your audience with premium, verified segments that command higher CPMs." },
  { audience: "Agencies", body: "Tie website visits back to campaigns and prove attribution to win client renewals." },
  { audience: "Ad Ops", body: "Feed enriched audiences into programmatic platforms to lift fill rates and yield." },
  { audience: "Media Sales", body: "Back property valuations with hard audience data when you pitch advertisers." },
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
    description: "Identify the companies and people visiting your media properties.",
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
    description: "A fresh weekly list of buyers built to your advertiser ICP.",
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
  {
    title: "How to Identify Website Visitors: Technical Guide",
    description: "Track and identify visitors to prove campaign attribution for clients.",
    href: "/blog/how-to-identify-website-visitors-technical-guide",
  },
  {
    title: "How to Scale Outbound Without Killing Quality",
    description: "Build scalable campaign workflows across multiple advertising clients.",
    href: "/blog/scaling-outbound",
  },
  {
    title: "Omni-Channel Retargeting Strategies",
    description: "Coordinate campaigns across channels for consistent client results.",
    href: "/blog/retargeting",
  },
  {
    title: "B2B Audience Targeting Explained",
    description: "Build premium B2B audience segments for advertising clients.",
    href: "/blog/audience-targeting",
  },
  {
    title: "Tips for Improving CRM Integration Workflows",
    description: "Integrate campaign data with client CRMs for better reporting.",
    href: "/blog/crm-integration",
  },
  {
    title: "How Marketing Data Solutions Improve Campaigns",
    description: "Leverage audience data to maximize campaign performance.",
    href: "/blog/analytics",
  },
]

export default function MediaAdvertisingPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Media & Advertising', url: 'https://www.meetcursive.com/industries/media-advertising' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Industries", href: "/industries" },
              { name: "Media & Advertising", href: "/industries/media-advertising" },
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
                  Media &amp; Advertising
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Media &amp; Advertising
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    marketing solutions
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Audience data for publishers, media companies, and advertising agencies. Build
                  premium audiences, maximize ad inventory value, and prove campaign attribution.
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
                  {["Attribution tracking", "Client reporting", "Campaign proof"].map((item) => (
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
                plain="Why Choose Cursive for"
                script="Media & Advertising"
                sub="Premium audience data and verified attribution, built to grow inventory value."
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
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading plain="Built for Your" script="Media Team" />
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
                plain="Resources &"
                script="Insights"
                sub="Strategies and best practices for media companies and advertising agencies."
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
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
                      className="flex h-full flex-col rounded-2xl border border-gray-200 p-6 hover:border-primary hover:shadow-lg transition-all group"
                    >
                      <h3 className="text-base font-medium text-gray-900 group-hover:text-primary transition-colors">
                        {r.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed flex-1">{r.description}</p>
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
                  Ready to prove your
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    campaign ROI?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Track website visitors back to campaigns and prove attribution for your advertising
                  clients. Plans from $97/mo, month-to-month, cancel anytime.
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
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE FOR MEDIA & ADVERTISING</h1>
            <p className="text-gray-700 leading-relaxed">
              Audience data platform for publishers, media companies, and advertising agencies. Build premium audiences, maximize ad inventory value, and prove campaign attribution. Self-serve from $97/month.
            </p>
          </div>

          {/* Media & Advertising Solutions */}
          <MachineSection title="Solutions for Media & Advertising">
            <MachineList items={[
              {
                label: "Premium Audience Data",
                description: "Access high-value audience segments to increase CPMs and attract advertisers"
              },
              {
                label: "First-Party Data Enrichment",
                description: "Enhance first-party data with demographic, psychographic, behavioral insights"
              },
              {
                label: "Advertiser Targeting",
                description: "Build custom audiences that match advertiser requirements and maximize fill rates"
              },
              {
                label: "Cross-Platform Attribution",
                description: "Track audience engagement across channels and prove media property value"
              }
            ]} />
          </MachineSection>

          {/* Benefits */}
          <MachineSection title="Benefits">
            <MachineList items={[
              "Increase Ad Revenue: Premium audience data commands higher CPMs and attracts more advertisers to your inventory.",
              "Prove Campaign Attribution: Track website visitors back to campaigns and demonstrate clear ROI for advertising clients.",
              "Programmatic Integration: Integrate audience data with programmatic platforms and ad servers for real-time targeting.",
              "Brand Safety & Compliance: Verified, GDPR/CCPA-compliant audience data with full transparency.",
            ]} />
          </MachineSection>

          {/* Use Cases */}
          <MachineSection title="Common Use Cases">
            <MachineList items={[
              "Publisher audience monetization",
              "Programmatic advertising optimization",
              "Advertiser campaign targeting and reporting",
              "Media property valuation and sales",
              "Cross-platform attribution tracking",
              "Client campaign performance reporting"
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
          <MachineSection title="Get Started">
            <MachineList items={[
              {
                label: "Get Started",
                href: "https://leads.meetcursive.com/get-leads",
                description: "Pick a plan and you are live in minutes"
              },
              {
                label: "Pricing",
                href: "https://www.meetcursive.com/pricing",
                description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo"
              },
              {
                label: "Book a Call",
                href: "https://cal.com/cursiveteam/30min",
                description: "Discuss audience data and attribution needs"
              }
            ]} />
          </MachineSection>

        </MachineContent>
      </MachineView>
    </>
  )
}
