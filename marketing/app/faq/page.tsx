"use client"

import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { ChevronDown, Search, Eye, Users, Layers } from "lucide-react"
import { useState } from "react"
import { DashboardCTA } from "@/components/dashboard-cta"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { FAQSchema } from "@/components/schema/SchemaMarkup"
import { Button } from "@/components/ui/button"
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

// Quick-look plan cards above the accordion.
const plans = [
  { icon: Eye, name: "Visitor Pixel", price: "$97", desc: "Identify the companies and people on your site." },
  { icon: Users, name: "Custom Audience", price: "$197", desc: "A fresh weekly in-market list to Google Sheets." },
  { icon: Layers, name: "Pixel + Audience", price: "$247", desc: "Both, in one feed. Best value." },
]

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <>
      {/* FAQ Schema for Google Rich Snippets */}
      <FAQSchema items={faqs.map(({ question, answer }) => ({ question, answer }))} />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          {/* Hero */}
          <section className="relative pt-16 pb-12 sm:pt-20 sm:pb-16 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="text-center max-w-3xl mx-auto"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Frequently Asked
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    Questions
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Everything about Cursive&apos;s self-serve plans — pixel, audiences, data, and
                  privacy. Can&apos;t find it?{" "}
                  <a href="/contact" className="text-primary hover:underline">Contact us</a>.
                </p>

                {/* Search */}
                <div className="mt-8 max-w-xl mx-auto relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for answers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                  />
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Plan snapshot */}
          <section className="pb-4 bg-white">
            <Container>
              <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {plans.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 p-5 sm:p-6 text-center"
                  >
                    <div className="w-11 h-11 mx-auto rounded-xl bg-primary/5 flex items-center justify-center">
                      <p.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="mt-4 flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-light text-gray-900">{p.price}</span>
                      <span className="text-sm text-gray-500">/mo</span>
                    </div>
                    <h3 className="mt-1 text-sm font-medium text-gray-900">{p.name}</h3>
                    <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* FAQ Content */}
          <section className="py-16 sm:py-20 bg-white">
            <Container>
              {/* Category tabs */}
              <div className="flex flex-wrap gap-2.5 justify-center mb-10">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setActiveCategory(category.value)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                      activeCategory === category.value
                        ? "bg-primary text-white"
                        : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {/* FAQ list */}
              <div className="max-w-3xl mx-auto space-y-3">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">No results found for &ldquo;{searchQuery}&rdquo;</p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-primary hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  filteredFaqs.map((faq, index) => {
                    const isOpen = openFaq === index
                    return (
                      <motion.div
                        key={faq.question}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ delay: Math.min(index, 6) * 0.04, duration: 0.4, ease: EASE }}
                        className="rounded-2xl border border-gray-200 overflow-hidden"
                      >
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : index)}
                          className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-gray-50 transition-colors"
                          aria-expanded={isOpen}
                        >
                          <span className="text-base font-medium text-gray-900">{faq.question}</span>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-5">
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                          </div>
                        )}
                      </motion.div>
                    )
                  })
                )}
              </div>

              {/* Inline CTAs */}
              <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                  Get Started
                </Button>
                <Button size="lg" variant="outline" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                  Book a Call
                </Button>
              </div>
            </Container>
          </section>

          {/* Dashboard CTA */}
          <DashboardCTA
            headline="Still Have"
            subheadline="Questions?"
            description="Pick a plan and you're live in minutes, or book a call and we'll answer everything first."
          />
        </main>
      </HumanView>

      {/* Machine View - AEO-Optimized */}
      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h2 className="text-2xl text-foreground font-semibold mb-4">FREQUENTLY ASKED QUESTIONS</h2>
            <p className="text-gray-700 leading-relaxed">
              Common questions about Cursive&apos;s self-serve plans: the Visitor Pixel ($97/month),
              Custom Audience ($197/month), and the Pixel + Audience Bundle ($247/month). Covers how
              each works, data accuracy, integrations, privacy, getting started, and cancellation.
            </p>
          </div>

          <MachineSection title="Plans & Pricing">
            <p className="text-gray-700 mb-4">
              Every plan is self-serve and month-to-month with no setup fee. Install the pixel in
              about 60 seconds, get your first Custom Audience within 24 hours, and cancel anytime.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) - Identify the companies and people visiting your site",
              "Custom Audience ($197/month) - A fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) - Both, in one feed",
            ]} />
          </MachineSection>

          <MachineSection title="How It Works">
            <MachineList items={[
              "Visitor Pixel: a single JavaScript snippet resolves your anonymous traffic to real companies and people the moment they land",
              "Custom Audience: tell us your ICP and each week we deliver a fresh list of people actively searching for what you sell, to Google Sheets",
              "Pixel + Audience Bundle: site traffic plus in-market intent combined in one feed",
            ]} />
          </MachineSection>

          <MachineSection title="Data Accuracy">
            <MachineList items={[
              "40–60% deterministic pixel match rate on US B2B traffic (not modeled). Cookie-sync averages 2–5%, IP-only 10–15%",
              "60–80% accuracy on a matched record, driven by geo-framing and an offline-rooted identity graph",
              "280M+ verified consumer and 140M+ business profiles, refreshed every 30 days against NCOA",
              "Deep Verify, our in-house email validation engine, processes ~20 million records per day",
            ]} />
          </MachineSection>

          <MachineSection title="Integrations">
            <MachineList items={[
              "Custom Audiences are delivered straight to Google Sheets",
              "Identified visitors sync to HubSpot, Salesforce, Pipedrive, Close, and Zapier (5,000+ tools)",
              "Webhook-based custom integrations to CRMs, sequencers (Outreach, Salesloft), or Slack",
            ]} />
          </MachineSection>

          <MachineSection title="Privacy & Compliance">
            <p className="text-gray-700">
              Cursive complies with GDPR, CCPA, and CAN-SPAM under a legitimate-interest and B2B
              commercial-use framework. We honor all opt-outs, maintain suppression lists, store
              hashed identifiers, and process data deletion requests within 30 days.
            </p>
          </MachineSection>

          <MachineSection title="Getting Started & Billing">
            <MachineList items={[
              "Pick a plan at leads.meetcursive.com/get-leads and you are dropped straight into your portal",
              "The Visitor Pixel installs in about 60 seconds; Custom Audience delivers its first list within 24 hours",
              "Month-to-month, no setup fee, cancel anytime from your portal",
            ]} />
          </MachineSection>

          <MachineSection title="Get Help">
            <MachineList items={[
              {
                label: "Get Started",
                href: "https://leads.meetcursive.com/get-leads",
                description: "Pick a plan and you are live in minutes",
              },
              {
                label: "Book a Call",
                href: "https://cal.com/cursiveteam/30min",
                description: "Talk to the team before you buy",
              },
              {
                label: "Contact Support",
                href: "https://www.meetcursive.com/contact",
                description: "Send us a message and we'll respond within 24 hours",
              },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}

// Categories
const categories = [
  { value: "all", label: "All Questions" },
  { value: "getting-started", label: "Getting Started" },
  { value: "plans", label: "Plans & Pricing" },
  { value: "data", label: "Data & Accuracy" },
  { value: "privacy", label: "Privacy & Integrations" },
]

// FAQ Data — self-serve plans only ($97 / $197 / $247)
const faqs = [
  // Getting Started
  {
    category: "getting-started",
    question: "What is Cursive and what does it do?",
    answer: `Cursive is the identity layer for B2B outbound. Two self-serve products run on the same verified data:

The Visitor Pixel ($97/mo) identifies the companies and people already visiting your site.

The Custom Audience ($197/mo) delivers a fresh weekly list of people actively searching for what you sell.

Get both in one feed with the Pixel + Audience Bundle ($247/mo).`,
  },
  {
    category: "getting-started",
    question: "How do I get started?",
    answer: `Pick a plan at leads.meetcursive.com/get-leads and you're dropped straight into your portal.

The Visitor Pixel installs in about 60 seconds with a single snippet. Custom Audience plans deliver your first list within 24 hours.

Prefer to talk first? Book a 30-minute call and we'll walk you through it.`,
  },
  {
    category: "getting-started",
    question: "How fast can I be up and running?",
    answer: `Fast. The pixel goes live the moment you paste the snippet — usually under 60 seconds — and starts identifying visitors right away.

For Custom Audiences, you tell us your ICP at checkout and your first list lands within 24 hours.`,
  },
  {
    category: "getting-started",
    question: "Can I cancel anytime?",
    answer: `Yes. Every plan is month-to-month with no setup fee and no long-term contract. Cancel anytime from your portal — no calls, no clawbacks.`,
  },

  // Plans & Pricing
  {
    category: "plans",
    question: "What's the difference between the Visitor Pixel and the Custom Audience?",
    answer: `The Visitor Pixel ($97/mo) is reactive: it turns the anonymous traffic already on your site into named companies and people, synced to your portal.

The Custom Audience ($197/mo) is proactive: each week we deliver a fresh list of people actively searching for what you sell, whether or not they've visited your site.

The Pixel + Audience Bundle ($247/mo) combines both into one feed — the best value if you want site traffic and in-market intent together.`,
  },
  {
    category: "plans",
    question: "How much does Cursive cost?",
    answer: `Flat monthly pricing, no per-visitor or per-lead fees:

Visitor Pixel — $97/mo
Custom Audience — $197/mo
Pixel + Audience Bundle — $247/mo

All self-serve, month-to-month, no setup fee, cancel anytime.`,
  },
  {
    category: "plans",
    question: "Is there a setup fee or contract?",
    answer: `No. There's no setup fee, no onboarding fee, and no contract. You pay one flat monthly price and can cancel whenever you like.`,
  },
  {
    category: "plans",
    question: "Which plan is right for me?",
    answer: `If you already get meaningful website traffic and want to know who's there, start with the Visitor Pixel.

If you want net-new buyers searching for what you sell, start with the Custom Audience.

If you want both pipelines feeding you at once, the Bundle gives you everything for $247/mo.`,
  },

  // Data & Accuracy
  {
    category: "data",
    question: "How accurate is visitor identification?",
    answer: `The pixel achieves a 40–60% match rate on US B2B traffic — deterministic, not modeled. For comparison, cookie-sync tools resolve 2–5% and IP databases 10–15%.

Accuracy on a matched record is 60–80%, driven by our geo-framing methodology and an offline-rooted identity graph of 280M+ verified consumer and 140M+ business profiles, refreshed every 30 days against NCOA.`,
  },
  {
    category: "data",
    question: "How do you keep emails and records fresh?",
    answer: `Every contact carries a verified work email. Deep Verify, our in-house validation engine, processes roughly 20 million records per day, and the full identity graph refreshes every 30 days against NCOA.

A closed feedback loop maps signals back to source URLs and validates against real conversions, so targeting gets sharper over time.`,
  },
  {
    category: "data",
    question: "What data do I get per contact?",
    answer: `Company name, industry, size, location, and technologies — plus, where available, the individual's job title, seniority, department, and verified work email.

Custom Audiences arrive built to your exact ICP, ready to load into outreach.`,
  },
  {
    category: "data",
    question: "How are Custom Audiences delivered?",
    answer: `Straight to Google Sheets, refreshed weekly. No exports to chase or dashboards to log into — your latest in-market list is always waiting in the same sheet.`,
  },

  // Privacy & Integrations
  {
    category: "privacy",
    question: "What does Cursive integrate with?",
    answer: `Custom Audiences are delivered directly to Google Sheets.

Identified visitors sync natively to HubSpot, Salesforce, Pipedrive, Close, and Zapier — which connects you to 5,000+ more tools. Webhook-based custom integrations push contacts to your CRM, sequencers like Outreach and Salesloft, or Slack.`,
  },
  {
    category: "privacy",
    question: "Is Cursive GDPR and CCPA compliant?",
    answer: `Yes. Cursive operates under a legitimate-interest and B2B commercial-use framework. All profiles are sourced through consent-appropriate channels.

We honor all opt-outs, maintain suppression lists, store hashed identifiers, and process data deletion requests within 30 days. Our practices comply with GDPR, CCPA, and CAN-SPAM.`,
  },
  {
    category: "privacy",
    question: "What kind of companies use Cursive?",
    answer: `Mostly B2B SaaS companies, professional services firms, and sales teams with 5–500 employees. Ideal fit: at least 500 monthly website visitors and an average contract value of $5,000+.

Cursive is used across technology, financial services, healthcare services, and real estate.`,
  },
]
