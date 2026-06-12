"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Users, ShoppingCart, Repeat, Target, Database,
  Sparkles, ArrowRight, CheckCircle2,
  type LucideIcon,
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
  { icon: Eye, title: "Identify your shoppers", body: "The Visitor Pixel resolves 40–60% of anonymous store traffic to real people — not the 2–5% cookies catch or 10–15% from IP databases." },
  { icon: ShoppingCart, title: "Recover lost carts", body: "Know who abandoned checkout, even when they never logged in, and win them back with a name attached." },
  { icon: Repeat, title: "Find lookalike buyers", body: "A fresh weekly Custom Audience of in-market shoppers built to match your best customers." },
  { icon: Target, title: "Retarget by name", body: "Push verified contacts to email, ads, and SMS so your spend reaches real buyers, not cookie ghosts." },
  { icon: Database, title: "Enrich your list", body: "Every record carries a verified contact and attributes — turn thin emails into rich profiles." },
  { icon: Sparkles, title: "Live in 60 seconds", body: "One snippet on Shopify, WooCommerce, or any platform. No engineering project, no batch waiting." },
]

const useCases = [
  { audience: "DTC Brands", body: "See which shoppers browsed but bounced, then bring them back across email and ads while intent is hot." },
  { audience: "Abandoned Carts", body: "Recover anonymous cart abandoners with a real contact — not just a cookie that expires." },
  { audience: "Subscription & Replenishment", body: "Identify lapsed buyers and reach them before they churn to a competitor." },
  { audience: "Paid Acquisition", body: "Feed verified buyer audiences into Meta, Google, and TikTok to cut wasted spend on lookalikes." },
]

const resources = [
  { title: "How to Identify Website Visitors: Technical Guide", description: "Turn anonymous eCommerce visitors into identified leads and customers.", href: "/blog/how-to-identify-website-visitors-technical-guide" },
  { title: "Guide to Direct Mail Marketing Automation", description: "Combine digital and direct mail for higher conversion rates.", href: "/blog/direct-mail" },
  { title: "Omni-Channel Retargeting Strategies", description: "Coordinate campaigns across email, ads, and direct mail for better results.", href: "/blog/retargeting" },
  { title: "Tips for Improving CRM Integration Workflows", description: "Sync customer data and automate your eCommerce marketing stack.", href: "/blog/crm-integration" },
  { title: "How Marketing Data Solutions Improve Campaigns", description: "Leverage customer data to drive more conversions and revenue.", href: "/blog/analytics" },
  { title: "B2B Audience Targeting Explained", description: "Target B2B buyers for wholesale and enterprise sales.", href: "/blog/audience-targeting" },
]

export default function EcommercePage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'eCommerce', url: 'https://www.meetcursive.com/industries/ecommerce' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Industries", href: "/industries" },
              { name: "eCommerce", href: "/industries/ecommerce" },
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
                  eCommerce Solutions
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Turn anonymous shoppers
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    into named customers
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Most of your store traffic leaves without a trace. Cursive resolves 40–60% of those
                  visitors to real people, recovers lost carts, and builds high-intent audiences you
                  can activate across every channel.
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
                  {["60-second setup", "40–60% match rate", "Any platform"].map((item) => (
                    <span key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Benefits */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Why Brands Choose Cursive"
                script="for eCommerce"
                sub="Stop paying to acquire shoppers you can never reach again. Identify them, then sell to them."
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {benefits.map((b, i) => (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
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
              <SectionHeading plain="Built for Your" script="Store" />
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

          {/* Resources */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Resources"
                script="& Insights"
                sub="Strategies and best practices for growing your online store."
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
                  Ready to grow your
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    eCommerce revenue?
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
            <h1 className="text-2xl text-gray-900 font-bold mb-4">ECOMMERCE MARKETING SOLUTIONS</h1>
            <p className="text-gray-700 leading-relaxed">
              Turn anonymous shoppers into named customers. Cursive identifies eCommerce website
              visitors, recovers abandoned carts, and builds high-intent audiences you can activate
              across email, ads, and SMS. Self-serve from $97/month.
            </p>
          </div>

          {/* Overview */}
          <MachineSection title="Solution Overview">
            <p className="text-gray-700 mb-4">
              Cursive helps eCommerce brands identify website visitors, recover abandoned carts, and
              find new customers. The Visitor Pixel resolves 40–60% of anonymous store traffic to real
              people, and Custom Audiences deliver a fresh weekly list of in-market shoppers matched to
              your best buyers. Every record carries a verified contact you can activate across channels.
            </p>
          </MachineSection>

          {/* Key Benefits */}
          <MachineSection title="Why Choose Cursive for eCommerce">
            <MachineList items={[
              { label: "Visitor Identification", description: "40–60% deterministic pixel match rate (vs 2–5% for cookies, 10–15% for IP databases) — turn anonymous browsers into named buyers" },
              { label: "Cart Abandonment Recovery", description: "Identify anonymous cart abandoners and win them back with a real contact attached" },
              { label: "Lookalike Audiences", description: "A fresh weekly Custom Audience of in-market shoppers matched to your best customers" },
              { label: "Multi-Channel Retargeting", description: "Activate verified contacts on email, ads, and SMS instead of cookies that expire" },
              { label: "Purchase Intent Data", description: "Reach shoppers actively searching for products in your category" },
              { label: "Customer Enrichment", description: "Enrich thin customer records with verified contact data and attributes" },
            ]} />
          </MachineSection>

          {/* Pricing */}
          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) - Identify the people visiting your store",
              "Custom Audience ($197/month) - A fresh weekly list of in-market shoppers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) - Both, in one feed",
            ]} />
          </MachineSection>

          {/* Getting Started */}
          <MachineSection title="Getting Started">
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team before you buy" },
              { label: "Website", href: "https://www.meetcursive.com" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
