"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  ShieldCheck, Target, Building2, Search, BadgeCheck, Lock,
  Eye, Users, Layers, ArrowRight, Check, CheckCircle2,
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
  { icon: ShieldCheck, title: "Compliance-first data", body: "GDPR, CCPA, and financial-services rules built into every record. Hashed identifiers and honored opt-outs by default." },
  { icon: Target, title: "Investor & borrower targeting", body: "Reach qualified investors, borrowers, and high-net-worth individuals with deterministic, verified identity." },
  { icon: Building2, title: "Account-based marketing", body: "Target decision-makers at banks, lenders, and corporations — job title, seniority, verified work email." },
  { icon: Search, title: "Intent for finance", body: "Surface prospects actively researching loans, investments, insurance, and banking products." },
  { icon: BadgeCheck, title: "Verified contact data", body: "Every contact carries a continuously validated work email, so outreach lands instead of bouncing." },
  { icon: Lock, title: "Secure handling", body: "Bank-grade encryption for every transfer and export. Your prospect data stays protected end to end." },
]

const useCases = [
  { audience: "Wealth Management", body: "Identify high-net-worth visitors on your site and reach qualified investors before competitors do." },
  { audience: "Commercial Lending", body: "Target businesses researching loans and treasury services, with the decision-maker named." },
  { audience: "Insurance", body: "Generate compliant policy leads from in-market prospects, not stale purchased lists." },
  { audience: "Banking & Fintech", body: "Run card, mortgage, and refinance campaigns to verified, opt-in-respecting audiences." },
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
    description: "Identify the firms and people visiting your site.",
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
    description: "A fresh weekly list of in-market finance buyers.",
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
  { title: "B2B Audience Targeting Explained", description: "Target businesses and decision-makers at financial institutions.", href: "/blog/audience-targeting" },
  { title: "How to Identify Website Visitors: Technical Guide", description: "Identify high-net-worth visitors and qualified prospects on your site.", href: "/blog/how-to-identify-website-visitors-technical-guide" },
  { title: "Guide to Direct Mail Marketing Automation", description: "Deliver compliant direct mail campaigns to qualified prospects.", href: "/blog/direct-mail" },
  { title: "How Marketing Data Solutions Improve Campaigns", description: "Leverage compliant data to boost financial services campaigns.", href: "/blog/analytics" },
  { title: "Tips for Improving CRM Integration Workflows", description: "Optimize your financial CRM and marketing automation workflows.", href: "/blog/crm-integration" },
  { title: "Omni-Channel Retargeting Strategies", description: "Coordinate compliant campaigns across multiple channels.", href: "/blog/retargeting" },
]

export default function FinancialServicesPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Financial Services', url: 'https://www.meetcursive.com/industries/financial-services' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Industries", href: "/industries" },
              { name: "Financial Services", href: "/industries/financial-services" },
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
                  Financial Services
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    Marketing Solutions
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Verified, compliance-first B2B data for banks and financial institutions. Accelerate
                  prospecting, cut CAC, and prove attribution — without buying another stale lead list.
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
                  {["Compliance ready", "Secure data", "HNW targeting"].map((item) => (
                    <span key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Why Cursive */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Why Choose Cursive"
                script="for Financial Services"
                sub="Compliant, verified data and the identity layer behind it — built for regulated marketing."
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
              <SectionHeading plain="Built for Your" script="Workflow" />
              <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
                {useCases.map((u, i) => (
                  <motion.div
                    key={u.audience}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl bg-[#F7F9FB] border border-gray-200 p-6 sm:p-7"
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

          {/* Resources */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="Resources &"
                script="Insights"
                sub="Strategies and best practices for financial services marketing."
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
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
                      className="flex flex-col h-full rounded-2xl border border-gray-200 bg-white p-6 hover:border-primary hover:shadow-lg transition-all group"
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
                  Ready to acquire more
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    high-value clients?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Target high-net-worth individuals and businesses with compliant, verified data. Plans
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
            <h2 className="text-2xl text-foreground font-semibold mb-4">CURSIVE FOR FINANCIAL SERVICES</h2>
            <p className="text-gray-700 leading-relaxed">
              Identity and intent data platform for banks, credit unions, wealth management firms,
              insurance companies, and fintech. Acquire high-net-worth clients and businesses with
              compliant, verified data. Self-serve from $97/month.
            </p>
          </div>

          {/* Financial Services Solutions */}
          <MachineSection title="Solutions for Financial Services">
            <MachineList items={[
              { label: "Compliance-First Data", description: "GDPR, CCPA, and financial services regulations built into every dataset" },
              { label: "High-Net-Worth Targeting", description: "Reach qualified investors, borrowers, and HNW individuals with precision" },
              { label: "Account-Based Marketing", description: "Target businesses and decision-makers at financial institutions" },
              { label: "Intent Data", description: "Identify prospects researching loans, investments, insurance, and banking products" },
            ]} />
          </MachineSection>

          {/* Benefits */}
          <MachineSection title="Benefits">
            <MachineList items={[
              "Reduce Customer Acquisition Cost: Reach qualified prospects directly instead of paying for stale lead lists",
              "Compliant Marketing: All data sourced and managed under GDPR, CCPA, and financial services regulations",
              "Secure Data Handling: Bank-grade security and encryption for all data transfers and storage",
              "Verified Contact Data: Continuously validated work emails so outreach lands instead of bouncing",
            ]} />
          </MachineSection>

          {/* Use Cases */}
          <MachineSection title="Common Use Cases">
            <MachineList items={[
              "Wealth management client acquisition",
              "Commercial lending prospect targeting",
              "Insurance policy lead generation",
              "Credit card and banking product campaigns",
              "Mortgage and refinance targeting",
              "B2B banking and treasury services",
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
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team about compliant marketing strategies" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
