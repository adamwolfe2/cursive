"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Target, Zap, TrendingUp, CheckCircle2, ArrowRight,
  Clock, Database, RefreshCw, Users, Layers,
  BarChart3, Globe, Shield, Flame, Rocket, Check, Eye,
  type LucideIcon,
} from "lucide-react"
import { IntegrationsShowcase } from "@/components/integrations-showcase"
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
    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

const stats: Array<{ value: string; label: string; icon: LucideIcon }> = [
  { value: "280M+", label: "Verified consumer profiles", icon: Users },
  { value: "15M+", label: "Organic-network domains", icon: Globe },
  { value: "~50K", label: "Intent segments", icon: Layers },
  { value: "7 days", label: "Audience refresh cycle", icon: RefreshCw },
]

const steps: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  { icon: Target, title: "Tell us your ICP", desc: "Pick a vertical and segment, or describe exactly who you sell to." },
  { icon: TrendingUp, title: "Set the intent window", desc: "Hot, Warm, or Scale — match audience freshness to your goal." },
  { icon: Zap, title: "Get a fresh feed weekly", desc: "In-market buyers delivered to your sheet, updated every 7 days." },
]

const levels: Array<{ level: string; window: string; desc: string; size: string; icon: LucideIcon }> = [
  { level: "Hot", window: "7-day", desc: "Highest intent, actively searching now. Smallest list, best conversion.", size: "Thousands", icon: Flame },
  { level: "Warm", window: "14-day", desc: "Expanded reach with strong recent interest. Intent meets scale.", size: "Tens of thousands", icon: TrendingUp },
  { level: "Scale", window: "30-day", desc: "Full-funnel coverage for awareness and retargeting at volume.", size: "Hundreds of thousands", icon: Rocket },
]

const verticals: Array<{ vertical: string; segments: string[] }> = [
  { vertical: "MedSpa & Aesthetics", segments: ["Botox", "Laser Hair Removal", "Body Contouring", "Anti-Aging"] },
  { vertical: "GLP-1 & Weight Loss", segments: ["GLP-1 Meds", "Medical Weight Loss", "Bariatric", "Diet Programs"] },
  { vertical: "Home Services", segments: ["HVAC", "Roofing", "Kitchen Remodel", "Solar"] },
  { vertical: "Legal Services", segments: ["Personal Injury", "Divorce", "Estate Planning", "Immigration"] },
  { vertical: "Luxury Goods", segments: ["Watches", "Fine Jewelry", "Exotic Cars", "Private Aviation"] },
  { vertical: "Men's Health", segments: ["TRT", "ED Treatment", "Hair Restoration", "Hormone Optimization"] },
  { vertical: "High-Ticket Recreation", segments: ["Boats", "RVs", "Golf Members", "Luxury Travel"] },
  { vertical: "Pickleball", segments: ["Equipment", "Lessons", "Court Memberships", "Tournaments"] },
]

const benefits: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: TrendingUp, title: "Convert 2–4x better", body: "Intent beats demographics. You reach people researching now, not passive browsers." },
  { icon: Clock, title: "Launch in minutes", body: "No manual list building. Pick a segment, set your window, and the feed builds itself." },
  { icon: RefreshCw, title: "Never goes stale", body: "Refreshed every 7 days with new in-market prospects, so the list is always live." },
  { icon: BarChart3, title: "Lower acquisition cost", body: "Targeting buyers in-market trims wasted spend, with lower CPMs and CPCs." },
  { icon: Layers, title: "Stack custom filters", body: "Start with intent, then layer geography, income, age, or firmographics on top." },
  { icon: Shield, title: "Privacy-compliant", body: "GDPR and CCPA ready. Opt-outs honored, consent-aware activation, hashed IDs." },
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
    ],
    cta: "Get the Pixel",
    highlight: false,
  },
  {
    name: "Custom Audience",
    price: "$197",
    icon: Target,
    description: "Intent data, turned into a weekly list of in-market buyers.",
    items: [
      "Built to your exact ICP",
      "Hot / Warm / Scale intent windows",
      "Fresh feed delivered every 7 days",
      "First audience within 24 hours",
    ],
    cta: "Get an Audience",
    highlight: true,
  },
  {
    name: "Pixel + Audience",
    price: "$247",
    icon: Layers,
    description: "Site traffic and in-market intent in one feed.",
    items: [
      "Everything in Visitor Pixel",
      "Everything in Custom Audience",
      "Best value vs. buying separately",
    ],
    cta: "Get the Bundle",
    highlight: false,
  },
]

export default function IntentAudiencesPage() {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": "https://www.meetcursive.com/intent-audiences#product",
        "name": "Cursive Custom Audience",
        "description": "Intent data turned into a fresh weekly list of in-market buyers, built to your ICP. Powered by 280M+ verified consumer profiles, a 15M+ domain organic intent network, and ~50,000 intent segments across 8 high-value verticals. Updated every 7 days.",
        "brand": { "@type": "Brand", "name": "Cursive" },
        "offers": {
          "@type": "Offer",
          "url": "https://www.meetcursive.com/intent-audiences",
          "price": "197",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        },
        "category": "Intent Data Platform"
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.meetcursive.com" },
          { "@type": "ListItem", "position": 2, "name": "Intent Audiences", "item": "https://www.meetcursive.com/intent-audiences" }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is intent data?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Intent data is the behavioral signal that someone is actively researching a product or service right now. Cursive layers a 15M+ domain organic intent network on top of standard SSP feeds and exposes ~50,000 intent segments to identify in-market prospects across 8 high-value verticals. It is the engine behind the Custom Audience plan ($197/mo)."
            }
          },
          {
            "@type": "Question",
            "name": "How fresh is the intent data?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Your Custom Audience is rebuilt every 7 days with fresh in-market users. Signals are tracked in real time, so you always reach prospects at peak interest."
            }
          },
          {
            "@type": "Question",
            "name": "Which verticals are available?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Eight high-value verticals: MedSpa & Aesthetics, GLP-1 & Weight Loss, Home Services, Legal Services, Luxury Goods, Men's Health, High-Ticket Recreation, and Pickleball, each with multiple specific segments. Custom ICPs outside these verticals are supported too."
            }
          },
          {
            "@type": "Question",
            "name": "What are the intent levels?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Three windows: Hot (7-day, highest intent), Warm (14-day, expanded reach), and Scale (30-day, full-funnel coverage). Choose based on your campaign goal."
            }
          },
          {
            "@type": "Question",
            "name": "How do I receive and activate the audience?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Your Custom Audience is delivered to Google Sheets and syncs to 200+ platforms, including Facebook Ads, Google Ads, LinkedIn Ads, email tools, and CRMs."
            }
          },
          {
            "@type": "Question",
            "name": "Can I combine intent with custom filters?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Start with intent, then layer on location, income, age, or firmographics to refine targeting."
            }
          },
          {
            "@type": "Question",
            "name": "Is the data privacy-compliant?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. All intent data honors opt-outs and complies with GDPR, CCPA, and regional privacy laws using consent-aware activation and hashed identifiers."
            }
          },
          {
            "@type": "Question",
            "name": "How much does it cost?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Custom Audience plan is $197/month, self-serve and month-to-month. Add the Visitor Pixel ($97/mo) or get both in the Pixel + Audience bundle for $247/mo. Cancel anytime."
            }
          },
          {
            "@type": "Question",
            "name": "How quickly can I launch?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Your first audience arrives within 24 hours of choosing your vertical and intent window. No manual list building required."
            }
          }
        ]
      }
    ]
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
              { name: "Intent Audiences", href: "/intent-audiences" },
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
                  Intent Data &amp; Audiences
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Reach buyers the moment
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    they're ready to buy
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Intent data is the signal that someone is researching what you sell — right now. It&apos;s
                  the engine behind the Cursive Custom Audience: a fresh weekly list of in-market buyers,
                  built to your ICP and delivered to your sheet.
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
                  {["8 high-value verticals", "Refreshed every 7 days", "$197/mo, month-to-month"].map((item) => (
                    <span key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Stats */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl bg-white border border-gray-200 p-6 text-center"
                  >
                    <stat.icon className="h-7 w-7 text-primary mx-auto mb-3" />
                    <div className="text-3xl sm:text-4xl font-light text-primary">{stat.value}</div>
                    <p className="mt-2 text-sm text-gray-600 leading-snug">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* How it powers the audience — stepper cards */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="From Intent Signal"
                script="To Audience"
                sub="Intent data powers the Custom Audience ($197/mo). Here's how it becomes a feed you can act on."
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

          {/* Intent Levels */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Choose Your"
                script="Intent Window"
                sub="Match audience freshness to your goal — tighter window, higher intent."
              />
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {levels.map((tier, i) => (
                  <motion.div
                    key={tier.level}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={tier.icon} />
                    <div className="mt-5 flex items-baseline gap-2">
                      <h3 className="text-lg font-medium text-gray-900">{tier.level}</h3>
                      <span className="text-sm text-gray-400">{tier.window} window</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{tier.desc}</p>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Database className="w-3.5 h-3.5" />
                      {tier.size}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Verticals — chips */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="8 High-Value"
                script="Verticals"
                sub="Pre-built segments where purchase intent runs hot — or bring your own ICP."
              />
              <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
                {verticals.map((item, i) => (
                  <motion.div
                    key={item.vertical}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                    className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-7 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-base font-medium text-gray-900">{item.vertical}</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.segments.map((segment) => (
                        <span key={segment} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700">
                          {segment}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Benefits */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Target Behavior,"
                script="Not Demographics"
                sub="Why intent audiences outperform broad targeting on every metric that matters."
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {benefits.map((b, i) => (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={b.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{b.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{b.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Pricing — three self-serve plans */}
          <section className="py-20 sm:py-24 bg-white">
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
                        The Intent Audience
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

          {/* Integrations */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <IntegrationsShowcase
                title="Activate to Every Marketing Platform"
                subtitle="One-click sync to 200+ ad platforms, CRMs, and email tools"
              />
              <div className="text-center mt-8">
                <Button variant="outline" href="/integrations">
                  View All Integrations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Container>
          </section>

          {/* Related */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="Learn More About"
                script="Intent Data"
                sub="Go deeper on intent-based targeting and where it fits in your stack."
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[
                  { title: "What Is B2B Intent Data", href: "/what-is-b2b-intent-data" },
                  { title: "Custom Audiences", href: "/custom-audiences" },
                  { title: "Buyer Intent Segmentation", href: "/blog/38-buyer-intent-based-audience-segmentation-techniques-UPDATED" },
                  { title: "Intent Signal Tracking for B2B", href: "/blog/40-intent-signal-tracking-for-b2b-marketing" },
                  { title: "Impact of Buyer Intent on Campaigns", href: "/blog/29-understanding-the-impact-of-buyer-intent-on-campaigns" },
                  { title: "Intent-Based Marketing Tactics", href: "/blog/41-intent-based-marketing-tactics-for-b2b" },
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
                  Ready to reach
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    in-market buyers?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Get your first Custom Audience within 24 hours. $197/mo, month-to-month, cancel anytime.
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

      {/* Machine View — AEO-Optimized */}
      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE INTENT DATA &amp; AUDIENCES</h1>
            <p className="text-gray-700 leading-relaxed">
              Intent data is the behavioral signal that someone is actively researching a product or service
              right now. Cursive turns it into the Custom Audience ($197/month): a fresh weekly list of
              in-market buyers built to your ICP. Powered by 280M+ verified consumer profiles, a 15M+ domain
              organic intent network, and ~50,000 intent segments across 8 high-value verticals. Updated every
              7 days and delivered to Google Sheets.
            </p>
          </div>

          <MachineSection title="What Is Intent Data">
            <p className="text-gray-700 mb-4">
              Intent data identifies people actively researching specific products or services. Cursive layers a
              15M+ domain organic intent network on top of standard SSP feeds (the same signal-source pool the
              rest of the industry pulls from) and exposes ~50,000 intent segments via a taxonomy endpoint. A
              closed feedback loop maps signals back to source URLs, apps, and exchanges and validates against
              real conversion outcomes. This intent layer is the engine behind the Custom Audience plan.
            </p>
            <MachineList items={[
              "280M+ verified consumer profiles, refreshed every 30 days against NCOA",
              "15M+ organic-network domains layered on top of SSP feeds (the moat)",
              "~50,000 intent segments via taxonomy endpoint",
              "8 high-value verticals with multiple specific segments each",
              "Custom Audience rebuilt every 7 days with fresh in-market buyers",
              "Three intent windows: Hot (7D), Warm (14D), Scale (30D)",
              "Delivered to Google Sheets, syncs to 200+ platforms",
            ]} />
          </MachineSection>

          <MachineSection title="How It Works">
            <MachineList items={[
              "Tell us your ICP - Pick a vertical and segment, or describe exactly who you sell to",
              "Set the intent window - Hot (7D) for highest intent, Warm (14D) for reach, Scale (30D) for full-funnel",
              "Get a fresh feed weekly - In-market buyers delivered to your sheet, updated every 7 days",
            ]} />
          </MachineSection>

          <MachineSection title="Intent Windows">
            <div className="space-y-4">
              <div>
                <p className="text-white mb-2">Hot (7-day):</p>
                <p className="text-gray-400">Highest intent prospects actively searching in the last 7 days. Smallest audience (thousands), best conversion. Best for high-ticket offers and limited ad budgets.</p>
              </div>
              <div>
                <p className="text-white mb-2">Warm (14-day):</p>
                <p className="text-gray-400">Expanded reach with strong interest in the last 14 days. Balance of intent and scale (tens of thousands). Best for standard campaigns and lead gen.</p>
              </div>
              <div>
                <p className="text-white mb-2">Scale (30-day):</p>
                <p className="text-gray-400">Full-funnel coverage from the last 30 days. Maximum reach (hundreds of thousands). Best for awareness and retargeting.</p>
              </div>
            </div>
          </MachineSection>

          <MachineSection title="Available Verticals">
            <div className="space-y-4">
              <div>
                <p className="text-white mb-2">MedSpa & Aesthetics:</p>
                <p className="text-gray-400">Botox, Laser Hair Removal, Body Contouring, Anti-Aging</p>
              </div>
              <div>
                <p className="text-white mb-2">GLP-1 & Weight Loss:</p>
                <p className="text-gray-400">GLP-1 Medications, Medical Weight Loss, Bariatric, Diet Programs</p>
              </div>
              <div>
                <p className="text-white mb-2">Home Services:</p>
                <p className="text-gray-400">HVAC, Roofing, Kitchen Remodel, Solar</p>
              </div>
              <div>
                <p className="text-white mb-2">Legal Services:</p>
                <p className="text-gray-400">Personal Injury, Divorce, Estate Planning, Immigration</p>
              </div>
              <div>
                <p className="text-white mb-2">Luxury Goods:</p>
                <p className="text-gray-400">Watches, Fine Jewelry, Exotic Cars, Private Aviation</p>
              </div>
              <div>
                <p className="text-white mb-2">Men's Health:</p>
                <p className="text-gray-400">TRT, ED Treatment, Hair Restoration, Hormone Optimization</p>
              </div>
              <div>
                <p className="text-white mb-2">High-Ticket Recreation:</p>
                <p className="text-gray-400">Boats, RVs, Golf Members, Luxury Travel</p>
              </div>
              <div>
                <p className="text-white mb-2">Pickleball:</p>
                <p className="text-gray-400">Equipment, Lessons, Court Memberships, Tournaments</p>
              </div>
            </div>
          </MachineSection>

          <MachineSection title="Key Benefits">
            <MachineList items={[
              "Convert 2–4x better than demographic targeting by reaching active researchers",
              "Launch in minutes - no manual list building",
              "Never goes stale - refreshed every 7 days with new in-market prospects",
              "Lower acquisition cost - less wasted spend, lower CPMs and CPCs",
              "Stack custom filters - layer geography, income, age, or firmographics on intent",
              "Privacy-compliant - honors opt-outs, GDPR and CCPA ready, hashed identifiers",
            ]} />
          </MachineSection>

          <MachineSection title="Integrations">
            <p className="text-gray-700 mb-4">
              Delivered to Google Sheets and one-click activation to 200+ platforms:
            </p>
            <MachineList items={[
              "Advertising: Facebook Ads, Google Ads, LinkedIn Ads, TikTok Ads, Snapchat Ads",
              "CRM: Salesforce, HubSpot, Marketo, Pardot, Pipedrive, Zoho CRM",
              "Email: Mailchimp, SendGrid, ActiveCampaign, Klaviyo, Braze, Customer.io",
            ]} />
          </MachineSection>

          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Custom Audience ($197/month) - Intent data turned into a fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Visitor Pixel ($97/month) - Identify the companies and people visiting your site",
              "Pixel + Audience Bundle ($247/month) - Both, in one feed",
            ]} />
          </MachineSection>

          <MachineSection title="Getting Started">
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and get your first audience within 24 hours" },
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Custom Audience $197/mo, Visitor Pixel $97/mo, or both for $247/mo" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team before you buy" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
