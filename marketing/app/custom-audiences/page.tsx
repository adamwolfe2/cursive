"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Users, Layers, Target, CalendarClock, Sparkles,
  ShieldCheck, Search, SlidersHorizontal, TrendingUp,
  ArrowRight, CheckCircle2, Check, FileSpreadsheet,
  type LucideIcon,
} from "lucide-react"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { DashboardCTA } from "@/components/dashboard-cta"
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
  { icon: SlidersHorizontal, title: "Define your ICP", desc: "Industry, geography, company size, seniority, and intent — set it once." },
  { icon: Search, title: "We find in-market buyers", desc: "People actively searching for what you sell, matched to your profile." },
  { icon: FileSpreadsheet, title: "Delivered to your sheet", desc: "A fresh, verified list lands in Google Sheets — first one within 24 hours." },
]

const benefits: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: CalendarClock, title: "Fresh every week", body: "A new list of in-market buyers each week — not a stale database you bought once." },
  { icon: Target, title: "Built to your exact ICP", body: "Industry, geo, company size, seniority, and intent signals — tuned to who you actually sell to." },
  { icon: ShieldCheck, title: "Verified work emails", body: "Every contact carries a validated work email, continuously checked through Deep Verify." },
  { icon: TrendingUp, title: "Real buying intent", body: "Prospects already searching for your category — caught while the intent is hot." },
  { icon: FileSpreadsheet, title: "Straight to Google Sheets", body: "No new tool to learn. Your audience arrives in a sheet, ready to import or sequence." },
  { icon: Sparkles, title: "Sharper every cycle", body: "Targeting compounds week over week as the system learns what converts for you." },
]

const useCases = [
  { audience: "Outbound Sales", body: "A fresh weekly list of in-market accounts to load straight into your sequencer." },
  { audience: "Demand Gen", body: "Feed verified, intent-matched contacts into ads and nurture without buying static lists." },
  { audience: "Agencies", body: "Spin up a tailored audience per client ICP and deliver pipeline, not just reports." },
  { audience: "Founders", body: "Skip the data ops. Get buyers searching for what you built, every week." },
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
    name: "Custom Audience",
    price: "$197",
    icon: Users,
    description: "A fresh weekly list of buyers searching for your product.",
    items: [
      "Weekly list of in-market prospects",
      "Built to your exact ICP",
      "Verified work email on every record",
      "Delivered to Google Sheets",
      "First audience within 24 hours",
    ],
    cta: "Get an Audience",
    highlight: true,
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
    highlight: false,
  },
]

const faqs = [
  {
    question: "What is a Custom Audience?",
    answer: "A fresh weekly list of in-market buyers — people actively searching for what you sell — built to your exact ICP and delivered to Google Sheets. It refreshes every week, so you always have new prospects, not a static database that decays.",
  },
  {
    question: "How fast do I get my first list?",
    answer: "Your first audience lands within 24 hours of setting your ICP. After that, a new list arrives every week automatically.",
  },
  {
    question: "What targeting can I set?",
    answer: "Industry, geography, company size, seniority, and intent signals. Tune them once and every weekly list matches your profile.",
  },
  {
    question: "What's in each record?",
    answer: "Name, company, role, and a verified work email — validated continuously through Deep Verify so deliverability stays high.",
  },
  {
    question: "How is it delivered?",
    answer: "Straight to Google Sheets. No new tool to learn — import it into your CRM or sequencer in minutes.",
  },
  {
    question: "How much does it cost?",
    answer: "Custom Audience is $197/mo flat. Add the Visitor Pixel for $97/mo, or get both in the Bundle for $247/mo. Self-serve, month-to-month, cancel anytime.",
  },
]

export default function CustomAudiencesPage() {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": "https://www.meetcursive.com/custom-audiences#service",
        "name": "Cursive Custom Audience",
        "description": "A fresh weekly list of in-market B2B buyers built to your exact ICP, each with a verified work email, delivered to Google Sheets. First audience within 24 hours. $197/month, self-serve, month-to-month.",
        "provider": {
          "@type": "Organization",
          "name": "Cursive",
        },
        "serviceType": "B2B Audience Building",
        "areaServed": "Worldwide",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "197",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "197",
            "priceCurrency": "USD",
            "unitText": "per month",
          },
          "availability": "https://schema.org/InStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.meetcursive.com",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Custom Audiences",
            "item": "https://www.meetcursive.com/custom-audiences",
          },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Custom Audiences", href: "/custom-audiences" },
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
                  Custom Audience
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  A fresh list of buyers
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    every single week
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Tell us who you sell to. Cursive finds in-market buyers searching for your category,
                  verifies every work email, and drops a fresh list into your Google Sheet — first one
                  within 24 hours.
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
                  {["$197/mo flat", "First audience in 24h", "Delivered to Google Sheets"].map((item) => (
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
                sub="From ICP to a verified weekly list in three steps."
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
                plain="Buyers, Not"
                script="A Static List"
                sub="Stop buying databases that decay. Get fresh, intent-matched buyers every week."
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

          {/* Targeting — chips */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Tune It To Your"
                script="Exact ICP"
                sub="Set these once. Every weekly audience matches your profile."
              />
              <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
                {["Industry", "Geography", "Company size", "Seniority", "Intent signals", "Job title", "Technologies"].map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 text-primary" />
                    {chip}
                  </span>
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
                sub="Self-serve, month-to-month, cancel anytime. First audience within 24 hours."
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
                        This Page
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

          {/* Dashboard CTA */}
          <DashboardCTA
            headline="Ready for a Custom"
            subheadline="Audience?"
            description="Set your ICP and get your first verified weekly list within 24 hours. $197/mo, month-to-month, cancel anytime."
            ctaText="Get Started"
          />
        </main>
      </HumanView>

      {/* Machine View — AEO-Optimized */}
      <MachineView>
        <MachineContent>
          {/* Header */}
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE CUSTOM AUDIENCE</h1>
            <p className="text-gray-700 leading-relaxed">
              A fresh weekly list of in-market B2B buyers built to your exact ICP. Cursive finds people
              actively searching for what you sell, verifies a work email on every record, and delivers
              the list to Google Sheets — your first audience within 24 hours. Self-serve, $197/month,
              month-to-month, cancel anytime.
            </p>
          </div>

          {/* Service Overview */}
          <MachineSection title="Service Overview">
            <p className="text-gray-700 mb-4">
              Cursive Custom Audience is a self-serve product, not a done-for-you service. You set your
              ideal customer profile once and Cursive delivers a fresh list of in-market buyers every
              week, each with a verified work email, straight to a Google Sheet.
            </p>
            <MachineList items={[
              "Fresh weekly list of in-market buyers, not a one-time static database",
              "Built to your exact ICP: industry, geography, company size, seniority, intent",
              "Verified work email on every record, validated continuously via Deep Verify",
              "Delivered to Google Sheets for easy import to any CRM or sequencer",
              "First audience delivered within 24 hours of setting your ICP",
            ]} />
          </MachineSection>

          {/* How It Works */}
          <MachineSection title="How It Works">
            <MachineList items={[
              "Step 1: Define your ICP — industry, geography, company size, seniority, and intent signals",
              "Step 2: Cursive finds in-market buyers actively searching for your category",
              "Step 3: Every contact is matched and its work email verified",
              "Step 4: A fresh list is delivered to your Google Sheet, the first within 24 hours",
              "Step 5: A new list arrives every week automatically",
            ]} />
          </MachineSection>

          {/* Targeting Criteria */}
          <MachineSection title="Available Targeting Criteria">
            <MachineList items={[
              {
                label: "Industry",
                description: "SaaS, Financial Services, Healthcare, eCommerce, Manufacturing, Real Estate, Education, and more",
              },
              {
                label: "Geography",
                description: "Any region worldwide — US, UK, DACH, APAC, LATAM, etc.",
              },
              {
                label: "Company Size",
                description: "1-10, 11-50, 51-200, 201-1000, 1000+ employees",
              },
              {
                label: "Seniority Level",
                description: "C-Suite, VP, Director, Manager, Individual Contributor",
              },
              {
                label: "Intent Signals",
                description: "Target prospects actively researching your category, topics, or technologies",
              },
            ]} />
          </MachineSection>

          {/* What You Get */}
          <MachineSection title="What's In Each Record">
            <MachineList items={[
              "Full name and company",
              "Job title and seniority",
              "Verified work email, validated continuously via Deep Verify",
              "Intent context: the category the buyer is actively searching",
            ]} />
          </MachineSection>

          {/* Pricing */}
          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Custom Audience ($197/month) — A fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Visitor Pixel ($97/month) — Identify the companies and people visiting your site",
              "Pixel + Audience Bundle ($247/month) — Both, in one feed",
            ]} />
          </MachineSection>

          {/* Getting Started */}
          <MachineSection title="Getting Started">
            <MachineList items={[
              {
                label: "Get Started",
                href: "https://leads.meetcursive.com/get-leads",
                description: "Set your ICP and get your first audience within 24 hours",
              },
              {
                label: "Pricing",
                href: "https://www.meetcursive.com/pricing",
                description: "Custom Audience $197/mo, Visitor Pixel $97/mo, or both for $247/mo",
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
