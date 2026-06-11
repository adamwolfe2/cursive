"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Users, Target, BarChart3, Layers, Repeat,
  Building2, FileCheck, ArrowRight, type LucideIcon,
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
    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

const benefits: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Eye, title: "Identify client site traffic", body: "Drop the pixel on any client site and resolve 40–60% of anonymous visitors to real companies and people — deterministically." },
  { icon: Users, title: "Fresh audiences per client", body: "A weekly Custom Audience of in-market buyers, built to each client's ICP and delivered straight to a Google Sheet." },
  { icon: Building2, title: "One account, every client", body: "Run separate pixels and audiences across your whole book of business from a single self-serve login." },
  { icon: FileCheck, title: "Verified work emails", body: "Every record carries a validated work email, so the contacts you hand clients actually reach a human." },
  { icon: BarChart3, title: "Prove campaign ROI", body: "Tie site visits and identified buyers back to your campaigns and show clients the pipeline you sourced." },
  { icon: Layers, title: "Plug into your stack", body: "Sync identified visitors and audiences into the CRMs, ad platforms, and sequencers your clients already run." },
]

const useCases = [
  { audience: "Demand Gen", body: "Turn the anonymous traffic your campaigns drive into named accounts you can actually follow up on." },
  { audience: "Paid Media", body: "See which companies clicked the ads but never converted, then retarget and reach out by name." },
  { audience: "Outbound", body: "Hand SDRs a fresh weekly list of in-market buyers built to each client's exact ICP." },
  { audience: "Reporting", body: "Connect site visits to closed deals and walk into renewal calls with proof of pipeline sourced." },
]

const steps = [
  { icon: Eye, title: "Install on client sites", desc: "One lightweight snippet per client. 60 seconds, any platform." },
  { icon: Target, title: "Identify & build audiences", desc: "Visitors resolved in real time; weekly audiences built to each ICP." },
  { icon: Repeat, title: "Activate & report", desc: "Push contacts into client tools, then prove the pipeline you sourced." },
]

const plans: Array<{
  name: string
  price: string
  icon: LucideIcon
  description: string
  cta: string
  highlight: boolean
}> = [
  {
    name: "Visitor Pixel",
    price: "$97",
    icon: Eye,
    description: "Identify the companies and people visiting a client's site.",
    cta: "Get the Pixel",
    highlight: false,
  },
  {
    name: "Pixel + Audience Bundle",
    price: "$247",
    icon: Layers,
    description: "Site traffic and in-market intent in one feed. Best value.",
    cta: "Get the Bundle",
    highlight: true,
  },
  {
    name: "Custom Audience",
    price: "$197",
    icon: Users,
    description: "A fresh weekly list of buyers searching for a client's product.",
    cta: "Get an Audience",
    highlight: false,
  },
]

const resources = [
  { title: "How to Scale Outbound Without Killing Quality", description: "Build workflows that scale with your client base.", href: "/blog/scaling-outbound" },
  { title: "Guide to Direct Mail Marketing Automation", description: "Deliver automated direct mail that drives client results.", href: "/blog/direct-mail" },
  { title: "Omni-Channel Retargeting Strategies", description: "Coordinate campaigns across channels for consistent messaging.", href: "/blog/retargeting" },
  { title: "B2B Audience Targeting Explained", description: "Make B2B targeting simple for your agency clients.", href: "/blog/audience-targeting" },
  { title: "Tips for Improving CRM Integration Workflows", description: "Optimize CRM integrations across multiple client accounts.", href: "/blog/crm-integration" },
  { title: "How Marketing Data Solutions Improve Campaigns", description: "Leverage data to boost campaign ROI for clients.", href: "/blog/analytics" },
]

export default function AgenciesPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Marketing Agencies', url: 'https://www.meetcursive.com/industries/agencies' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Industries", href: "/industries" },
              { name: "Marketing Agencies", href: "/industries/agencies" },
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
                  For Marketing Agencies
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Marketing Agency Solutions
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    pipeline your clients can see
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Add verified visitor identification and in-market audiences to every client engagement.
                  Drop a pixel, deliver real buyers, and prove the pipeline you sourced — all self-serve.
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

          {/* How It Works — stepper */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="How It"
                script="Works"
                sub="From client site to sourced pipeline in three steps."
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

          {/* Why Cursive for Agencies */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="Why Agencies"
                script="Run on Cursive"
                sub="Two products and the verified data behind them — enough to move pipeline for every client you serve."
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
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading plain="Built for Agency" script="Workflows" />
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
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="Simple, Flat"
                script="Pricing"
                sub="Self-serve, month-to-month, cancel anytime. Run it on one client or your whole book."
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
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Agency Resources"
                script="& Insights"
                sub="Strategies and best practices for scaling your marketing agency."
              />
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {resources.map((resource, i) => (
                  <motion.div
                    key={resource.href}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  >
                    <Link
                      href={resource.href}
                      className="block h-full rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 hover:shadow-lg hover:border-primary transition-all group"
                    >
                      <h3 className="text-base font-medium text-gray-900 group-hover:text-primary transition-colors">
                        {resource.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{resource.description}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
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
                  Ready to scale your
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    agency services?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Install the pixel on a client site in 60 seconds. Plans from $97/mo, month-to-month, cancel anytime.
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
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE FOR MARKETING AGENCIES</h1>
            <p className="text-gray-700 leading-relaxed">
              Cursive is a self-serve identity and intent data layer marketing agencies use to source
              pipeline for clients. Drop the Visitor Pixel on any client site to identify 40–60% of
              anonymous visitors, or build a fresh weekly Custom Audience of in-market buyers for each
              client&apos;s ICP. Every record carries a verified work email. Self-serve from $97/month.
            </p>
          </div>

          <MachineSection title="What Agencies Get">
            <MachineList items={[
              "Visitor identification on any client site — 40–60% of anonymous traffic resolved to companies and people, deterministically",
              "Weekly Custom Audiences of in-market buyers, built to each client's exact ICP and delivered to Google Sheets",
              "Verified work email on every contact, so the records you hand clients reach real people",
              "Sync into the CRMs, ad platforms, and sequencers your clients already use",
              "Reporting that ties site visits and identified buyers back to the pipeline you sourced",
            ]} />
          </MachineSection>

          <MachineSection title="Common Agency Use Cases">
            <MachineList items={[
              "Demand Gen: Turn the anonymous traffic campaigns drive into named accounts to follow up on",
              "Paid Media: Retarget and reach out by name to companies that clicked ads but didn't convert",
              "Outbound: Hand SDRs a fresh weekly list of in-market buyers built to each client's ICP",
              "Reporting: Connect site visits to closed deals to prove pipeline sourced on renewal calls",
            ]} />
          </MachineSection>

          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime. Run it on one client or your
              whole book of business from a single login.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) - Identify the companies and people visiting a client's site",
              "Custom Audience ($197/month) - A fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) - Both, in one feed",
            ]} />
          </MachineSection>

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
