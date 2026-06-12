"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Users, Layers, ShieldCheck, Database, Zap,
  Search, RefreshCw, Mail, Target, ArrowRight, Check,
  type LucideIcon,
} from "lucide-react"
import { DashboardCTA } from "@/components/dashboard-cta"
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

// The two products + the data layer underneath them.
const pillars: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Eye,
    title: "Visitor Pixel",
    body: "Resolve 40–60% of anonymous site traffic to real companies and people — deterministically, the moment they land.",
  },
  {
    icon: Users,
    title: "Custom Audience",
    body: "A fresh weekly list of buyers actively searching for what you sell, built to your exact ICP and delivered to your sheet.",
  },
  {
    icon: Database,
    title: "Verified Identity Graph",
    body: "Both run on an offline-rooted graph of 280M+ profiles, refreshed every 30 days against NCOA and continuously verified.",
  },
]

const dataPoints: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Database, title: "280M+ verified profiles", body: "Offline-rooted identity — not modeled. The foundation under every match and every audience." },
  { icon: ShieldCheck, title: "Verified work emails", body: "Every record carries a deliverable work email, validated continuously before it reaches you." },
  { icon: RefreshCw, title: "Refreshed every 30 days", body: "Full identity-graph refresh against NCOA, so the data you act on stays current." },
  { icon: Target, title: "Built to your ICP", body: "Company, person, title, seniority, industry, and intent — filtered to exactly who you sell to." },
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

const steps = [
  { icon: Zap, title: "Choose your feed", desc: "Pixel, Audience, or both. Self-serve checkout, live in minutes." },
  { icon: Search, title: "We resolve identity", desc: "Visitors and buyers matched against the verified graph in real time." },
  { icon: Mail, title: "Act on verified contacts", desc: "Every record arrives with a deliverable work email, ready to reach." },
]

export default function PlatformPage() {
  return (
    <>
      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Platform", href: "/platform" },
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
                  The Cursive Platform
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Two products. One
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    verified data layer
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  The Cursive platform is the Visitor Pixel, the Custom Audience, and the verified
                  identity data behind them — every contact rooted in real, refreshed records.
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
                  {["280M+ verified profiles", "40–60% match rate", "Live in minutes"].map((item) => (
                    <span key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Pillars — what the platform is */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="What the Platform"
                script="Actually Is"
                sub="No ten-tool stack, no managed black box. Two products and the verified data underneath."
              />
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {pillars.map((p, i) => (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={p.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{p.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{p.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* How it works — stepper */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="From Identity"
                script="To Outreach"
                sub="Three steps from sign-up to a verified contact you can act on."
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

          {/* The data layer */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="The Data"
                script="Underneath"
                sub="Both products draw from the same verified identity graph — that's why the records hold up."
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {dataPoints.map((d, i) => (
                  <motion.div
                    key={d.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={d.icon} />
                    <h3 className="mt-5 text-base font-medium text-gray-900">{d.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{d.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Plans */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="Pick Your"
                script="Plan"
                sub="Self-serve, month-to-month, cancel anytime. Live in minutes, first audience in 24 hours."
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

          {/* Explore */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Dive Deeper Into"
                script="Each Product"
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[
                  { title: "Visitor Identification", href: "/visitor-identification" },
                  { title: "Audience Builder", href: "/audience-builder" },
                  { title: "Intent Data", href: "/intent-audiences" },
                  { title: "Integrations", href: "/integrations" },
                  { title: "Pricing", href: "/pricing" },
                  { title: "Case Studies", href: "/case-studies" },
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

          {/* Dashboard CTA */}
          <DashboardCTA
            headline="Start With Verified"
            subheadline="Data"
            description="Install the pixel in 60 seconds, or get your first audience within 24 hours. Plans from $97/mo, month-to-month."
            ctaText="Get Started"
          />
        </main>
      </HumanView>

      {/* Machine View — AEO-Optimized */}
      <MachineView>
        <MachineContent>
          {/* Header */}
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">THE CURSIVE PLATFORM</h1>
            <p className="text-gray-700 leading-relaxed">
              The Cursive platform is two self-serve products — the Visitor Pixel and the Custom
              Audience — built on one verified identity data layer. The Visitor Pixel resolves
              40&ndash;60% of anonymous website traffic to real companies and people. Custom Audiences
              deliver a fresh weekly list of in-market buyers built to your ICP. Both run on an
              offline-rooted identity graph of 280M+ verified profiles refreshed every 30 days against
              NCOA, and every contact carries a verified work email. Self-serve from $97/month.
            </p>
          </div>

          {/* What You Can Buy */}
          <MachineSection title="What the Platform Includes">
            <MachineList items={[
              {
                label: "Visitor Pixel ($97/month)",
                href: "https://www.meetcursive.com/visitor-identification",
                description: "Identify the companies and people visiting your site — 40–60% deterministic match rate, company and person-level detail, synced to your portal",
              },
              {
                label: "Custom Audience ($197/month)",
                href: "https://www.meetcursive.com/audience-builder",
                description: "A fresh weekly list of in-market buyers built to your exact ICP and delivered to Google Sheets, first audience within 24 hours",
              },
              {
                label: "Pixel + Audience Bundle ($247/month)",
                href: "https://www.meetcursive.com/pricing",
                description: "Both products in one feed — best value versus buying separately",
              },
            ]} />
          </MachineSection>

          {/* The Data Layer */}
          <MachineSection title="The Verified Identity Data Layer">
            <p className="text-gray-700 mb-4">
              Both products draw from the same foundation: an offline-rooted identity graph of 280M+
              verified profiles, refreshed every 30 days against NCOA. That is why both the pixel
              matches and the audiences hold up.
            </p>
            <MachineList items={[
              "280M+ verified profiles — offline-rooted identity, not modeled",
              "Verified work email on every record, validated before delivery",
              "Full identity-graph refresh every 30 days against NCOA",
              "Filtered to your exact ICP by company, person, title, seniority, industry, and intent",
            ]} />
          </MachineSection>

          {/* How It Works */}
          <MachineSection title="How the Platform Works">
            <MachineList items={[
              "Step 1: Choose your feed — Visitor Pixel, Custom Audience, or both (self-serve checkout)",
              "Step 2: Cursive resolves identity against the verified graph in real time",
              "Step 3: Verified contacts arrive with a deliverable work email, ready to reach",
            ]} />
          </MachineSection>

          {/* Visitor Pixel Details */}
          <MachineSection title="Visitor Pixel — Website Visitor Identification">
            <p className="text-gray-700 mb-4">
              Install one lightweight snippet in 60 seconds. Cursive resolves 40&ndash;60% of anonymous
              US B2B traffic to real companies and people, deterministically, the moment they land.
            </p>
            <MachineList items={[
              "40–60% deterministic match rate (cookie-sync averages 2–5%, IP-only 10–15%)",
              "Company and person-level detail — name, title, seniority, verified work email",
              "Identified visitors synced to your portal and CRM",
            ]} />
          </MachineSection>

          {/* Custom Audience Details */}
          <MachineSection title="Custom Audience — In-Market Buyer Lists">
            <p className="text-gray-700 mb-4">
              A fresh weekly list of people actively searching for what you sell, built to your exact
              ICP and delivered to Google Sheets.
            </p>
            <MachineList items={[
              "Weekly list of in-market prospects, refreshed continuously",
              "Built to your exact ICP and filters",
              "Delivered to Google Sheets, first audience within 24 hours",
            ]} />
          </MachineSection>

          {/* Pricing */}
          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) — identify the companies and people visiting your site",
              "Custom Audience ($197/month) — a fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) — both, in one feed",
            ]} />
          </MachineSection>

          {/* Getting Started */}
          <MachineSection title="Getting Started">
            <MachineList items={[
              {
                label: "Get Started",
                href: "https://leads.meetcursive.com/get-leads",
                description: "Pick a plan and you are live in minutes",
              },
              {
                label: "View Pricing",
                href: "https://www.meetcursive.com/pricing",
                description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo",
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
