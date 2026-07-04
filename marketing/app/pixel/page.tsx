"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  ArrowRight, Eye, Building2, Users, FileText, TrendingUp,
  ArrowRightLeft, BarChart3, Clock, Zap, Target, Check,
  CheckCircle2, Shield, type LucideIcon,
} from "lucide-react"
import { DashboardCTA } from "@/components/dashboard-cta"
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

const steps = [
  { icon: Zap, title: "Drop in the snippet", desc: "One lightweight tag, any platform. Live in 60 seconds." },
  { icon: Eye, title: "Identify in real time", desc: "Visitors resolved to company and person the moment they land." },
  { icon: Target, title: "Act on warm leads", desc: "Identified contacts sync to your CRM, ready to reach out." },
]

const dataPoints: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Building2, title: "Company detail", body: "Industry, size, revenue, and location for every business that visits." },
  { icon: Users, title: "Decision-makers", body: "Names, titles, seniority, and verified work emails for the right people." },
  { icon: FileText, title: "Page-level intent", body: "See exactly which pages each visitor browsed — pricing, features, docs." },
  { icon: TrendingUp, title: "Intent signals", body: "Scoring from browsing behavior and return visits surfaces the hottest leads." },
  { icon: ArrowRightLeft, title: "CRM sync", body: "Identified visitors flow into Salesforce, HubSpot, and 200+ tools automatically." },
  { icon: BarChart3, title: "Weekly digest", body: "A clean recap of top visitors and trending companies in your inbox." },
]

const proofPoints = [
  { metric: "40–60%", label: "Deterministic match rate, not modeled" },
  { metric: "$0", label: "Per-visitor fees — flat $97/mo" },
  { metric: "60s", label: "To install and go live" },
]

export default function PixelPage() {
  // Product + FAQ structured data for SEO
  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": "https://www.meetcursive.com/pixel#product",
        "name": "Cursive Visitor Pixel — Website Visitor Identification",
        "description": "Self-serve website visitor tracking pixel. Identify anonymous visitors and get company names, decision-maker contacts, pages viewed, and intent signals in real time. Install in 60 seconds.",
        "brand": { "@type": "Brand", "name": "Cursive" },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "97",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "97",
            "priceCurrency": "USD",
            "unitText": "MONTH",
          },
          "availability": "https://schema.org/InStock",
          "url": "https://leads.meetcursive.com/get-leads",
        },
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does the Cursive Visitor Pixel work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Visitor Pixel is a lightweight JavaScript tag you install on your website. When visitors browse your site, it resolves them deterministically against an offline-rooted identity graph, then surfaces company data, decision-maker contacts, and page-level intent in real time.",
            },
          },
          {
            "@type": "Question",
            "name": "How much does the Visitor Pixel cost?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Visitor Pixel is $97/month, self-serve and month-to-month. Flat pricing with no per-visitor or per-lead fees — your cost stays the same regardless of traffic. Cancel anytime.",
            },
          },
          {
            "@type": "Question",
            "name": "How long does it take to set up?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "About 60 seconds. Sign up, drop the one-line snippet onto your site, and you start seeing identified visitors right away. No technical work or onboarding call required.",
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Visitor Pixel", href: "/pixel" },
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
                  Visitor Pixel · $97/mo
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  See who&apos;s visiting
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    your website
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Drop in one snippet and turn anonymous traffic into named companies and people —
                  deterministically, the moment they land. Self-serve, $97/mo, live in 60 seconds.
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
                  {["60-second setup", "40–60% match rate", "No per-visitor fees"].map((item) => (
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
                plain="Live in"
                script="Three Steps"
                sub="No onboarding call, no technical work. Install it yourself in under a minute."
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

          {/* What You Get */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="What Every Visit"
                script="Tells You"
                sub="Rich, verified detail on the companies and people browsing your site."
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {dataPoints.map((d, i) => (
                  <motion.div
                    key={d.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={d.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{d.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{d.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Pricing — single self-serve plan */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="One Flat"
                script="Price"
                sub="No per-visitor fees, no contracts. Your cost stays the same no matter how much traffic you get."
              />
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE }}
                className="max-w-md mx-auto rounded-2xl border border-primary bg-white p-8 shadow-lg ring-1 ring-primary/20"
              >
                <IconChip Icon={Eye} />
                <h3 className="mt-5 text-lg font-medium text-gray-900">Visitor Pixel</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-5xl font-light text-gray-900">$97</span>
                  <span className="text-sm text-gray-500">/mo</span>
                </div>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  Identify the companies and people visiting your site, in real time.
                </p>
                <ul className="mt-6 space-y-2.5">
                  {[
                    "40–60% deterministic match rate",
                    "Company + person-level detail",
                    "Page-level intent and return-visitor signals",
                    "CRM sync to 200+ tools",
                    "One-snippet install, 60 seconds",
                  ].map((item) => (
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
                  className="w-full mt-8"
                >
                  Get the Pixel
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <p className="mt-3 text-center text-xs text-gray-500">
                  Self-serve, month-to-month, cancel anytime.
                </p>
              </motion.div>

              <p className="mt-8 text-center text-sm text-gray-500">
                Want in-market buyers too?{" "}
                <a href="/pricing" className="text-primary font-medium hover:underline">
                  Add a Custom Audience or grab the bundle from $247/mo.
                </a>
              </p>
            </Container>
          </section>

          {/* Proof points */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {proofPoints.map((p, i) => (
                  <motion.div
                    key={p.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl bg-[#F7F9FB] border border-gray-200 p-6 text-center"
                  >
                    <div className="text-3xl sm:text-4xl font-light text-primary">{p.metric}</div>
                    <p className="mt-2 text-sm text-gray-600 leading-snug">{p.label}</p>
                  </motion.div>
                ))}
              </div>
              <p className="mt-8 mx-auto max-w-2xl text-center text-sm text-gray-500 leading-relaxed">
                Deterministic, offline-rooted identity — not modeled. For context, cookie-sync tools
                average 2–5% and IP-only databases sit around 10–15%.
              </p>
            </Container>
          </section>

          {/* Privacy reassurance — single quiet card */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE }}
                className="max-w-2xl mx-auto rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 text-center"
              >
                <div className="mx-auto w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-gray-900">Privacy-compliant by default</h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  GDPR and CCPA ready out of the box. We honor opt-outs, respect Do Not Track, and
                  store only hashed identifiers.
                </p>
              </motion.div>
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
                    on your site?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Install the pixel in 60 seconds. $97/mo, month-to-month, cancel anytime.
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
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    60-second setup
                  </span>
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    No technical work required
                  </span>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Dashboard CTA */}
          <DashboardCTA
            headline="Stop Losing"
            subheadline="website visitors"
            description="Install the Cursive Visitor Pixel in 60 seconds and start turning anonymous traffic into named, verified leads. Self-serve, $97/mo, cancel anytime."
            ctaText="Get Started"
            ctaUrl={GET_LEADS_URL}
          />
        </main>
      </HumanView>

      {/* Machine View — AEO-Optimized */}
      <MachineView>
        <MachineContent>
          {/* Header */}
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h2 className="text-2xl text-foreground font-semibold mb-4">CURSIVE VISITOR PIXEL — WEBSITE VISITOR IDENTIFICATION</h2>
            <p className="text-gray-700 leading-relaxed">
              The Cursive Visitor Pixel is a self-serve website visitor tracking tag. It identifies
              anonymous visitors deterministically and provides company names, decision-maker contacts,
              pages viewed, and intent signals in real time. $97/month, flat pricing with no
              per-visitor fees. Install in 60 seconds — no onboarding call required.
            </p>
          </div>

          {/* Pricing */}
          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Simple, transparent, self-serve pricing with no hidden fees:
            </p>
            <MachineList items={[
              "Visitor Pixel: $97/month — identify the companies and people visiting your site",
              "Flat monthly pricing — no per-visitor or per-lead fees",
              "Your cost stays the same regardless of website traffic volume",
              "40–60% pixel match rate (deterministic, not modeled). For context: cookie sync averages 2–5%, IP-only databases 10–15%.",
              "60–80% pixel-level accuracy on a matched record, driven by geo-framing methodology",
              "Self-serve, month-to-month. No setup fee. Cancel anytime.",
            ]} />
          </MachineSection>

          {/* What You Get */}
          <MachineSection title="What the Pixel Provides">
            <MachineList items={[
              "Company names, industry, size, revenue, and location for visiting businesses",
              "Decision-maker contacts: names, job titles, seniority, verified work emails",
              "Page-level tracking: see exactly which pages each visitor browsed",
              "Intent signals: scoring based on browsing behavior and engagement",
              "Return-visitor detection: know when prospects come back",
              "CRM sync: automatic sync with Salesforce, HubSpot, Pipedrive, and 200+ tools",
              "Weekly digest: top visitors, trending companies, and high-intent leads",
            ]} />
          </MachineSection>

          {/* How It Works */}
          <MachineSection title="Setup Process (Self-Serve)">
            <MachineList items={[
              "Step 1: Sign up at leads.meetcursive.com/get-leads and choose the Visitor Pixel plan",
              "Step 2: Drop the one-line pixel snippet onto your website (60 seconds, any platform)",
              "Step 3: Visitors are resolved to company and person in real time as they browse",
              "Step 4: Identified visitors sync to your CRM and portal automatically",
              "No technical work or onboarding call required",
            ]} />
          </MachineSection>

          {/* Privacy */}
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

          {/* Related products */}
          <MachineSection title="Related Cursive Products">
            <MachineList items={[
              "Custom Audience ($197/month) — a fresh weekly list of in-market buyers built to your ICP, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) — site traffic and in-market intent in one feed",
            ]} />
          </MachineSection>

          {/* Getting Started */}
          <MachineSection title="Get Started">
            <MachineList items={[
              {
                label: "Get Started",
                href: "https://leads.meetcursive.com/get-leads",
                description: "Self-serve. Choose the Visitor Pixel plan and install in 60 seconds.",
              },
              {
                label: "Pricing",
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
