"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Search, FileText, BookOpen, GitCompare,
  ArrowRight, type LucideIcon,
} from "lucide-react"
import { DashboardCTA } from "@/components/dashboard-cta"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { GET_LEADS_URL } from "@/lib/cta"

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

// Topic clusters — what to read, by goal.
const categories: Array<{ icon: LucideIcon; title: string; description: string; href: string }> = [
  {
    icon: Eye,
    title: "Visitor identification",
    description: "Resolve anonymous traffic to real companies and people.",
    href: "/blog/visitor-tracking",
  },
  {
    icon: Search,
    title: "Lead generation",
    description: "Build pipeline with verified, in-market B2B contacts.",
    href: "/blog/lead-generation",
  },
  {
    icon: GitCompare,
    title: "Data platforms",
    description: "How Cursive stacks up against the alternatives.",
    href: "/blog/data-platforms",
  },
]

// Hand-picked, deeper than a flat list.
const guides = [
  {
    title: "How to identify website visitors",
    description: "The technical mechanics behind deterministic visitor resolution.",
    href: "/blog/how-to-identify-website-visitors-technical-guide",
    readTime: "12 min read",
  },
  {
    title: "Identify anonymous website visitors",
    description: "A practical playbook for turning unknown traffic into pipeline.",
    href: "/blog/how-to-identify-anonymous-website-visitors",
    readTime: "9 min read",
  },
  {
    title: "ICP targeting guide",
    description: "A step-by-step framework for defining your ideal customer profile.",
    href: "/blog/icp-targeting-guide",
    readTime: "11 min read",
  },
  {
    title: "Cold email best practices for 2026",
    description: "What actually earns replies now that everyone's automating.",
    href: "/blog/cold-email-2026",
    readTime: "15 min read",
  },
]

// Glossary — short, scannable definitions.
const glossary = [
  { label: "Visitor identification", href: "/what-is-website-visitor-identification" },
  { label: "Visitor deanonymization", href: "/what-is-visitor-deanonymization" },
  { label: "Lead enrichment", href: "/what-is-lead-enrichment" },
  { label: "B2B intent data", href: "/what-is-b2b-intent-data" },
  { label: "Account-based marketing", href: "/what-is-account-based-marketing" },
  { label: "Direct mail automation", href: "/what-is-direct-mail-automation" },
]

// Head-to-head comparisons.
const comparisons = [
  { title: "Warmly vs Cursive", href: "/blog/warmly-vs-cursive-comparison" },
  { title: "Apollo vs Cursive", href: "/blog/apollo-vs-cursive-comparison" },
  { title: "ZoomInfo vs Cursive", href: "/blog/zoominfo-vs-cursive-comparison" },
  { title: "6sense vs Cursive", href: "/blog/6sense-vs-cursive-comparison" },
  { title: "Clearbit alternatives", href: "/blog/clearbit-alternatives-comparison" },
  { title: "ZoomInfo alternatives", href: "/blog/zoominfo-alternatives-comparison" },
]

export default function ResourcesPage() {
  return (
    <main className="overflow-hidden">
      <HumanView>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Resources", href: "/resources" },
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
                Resources
              </span>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                Learn about
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                  visitor identification
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                Guides on turning anonymous traffic into qualified pipeline — the data,
                the tactics, and how Cursive compares.
              </p>
            </motion.div>
          </Container>
        </section>

        {/* Topic clusters */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading plain="Start by" script="Topic" />
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {categories.map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                >
                  <Link
                    href={c.href}
                    className="group block h-full rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={c.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{c.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{c.description}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      Browse articles
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Featured guides */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Featured"
              script="Guides"
              sub="The pieces worth reading first."
            />
            <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {guides.map((g, i) => (
                <motion.div
                  key={g.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                >
                  <Link
                    href={g.href}
                    className="group flex h-full flex-col rounded-2xl border border-gray-200 p-6 sm:p-7 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {g.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm text-gray-600 leading-relaxed">{g.description}</p>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="text-gray-500">{g.readTime}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button variant="outline" href="/blog" size="lg">
                View all articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Container>
        </section>

        {/* Glossary — compact chip list */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="The"
              script="Glossary"
              sub="Plain-English definitions for the terms that show up everywhere."
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto"
            >
              {glossary.map((term) => (
                <Link
                  key={term.href}
                  href={term.href}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-gray-400" aria-hidden />
                  {term.label}
                </Link>
              ))}
            </motion.div>
          </Container>
        </section>

        {/* Comparisons */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="How Cursive"
              script="Compares"
              sub="See the platform side by side with the alternatives."
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {comparisons.map((link) => (
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
            <div className="mt-10 text-center">
              <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Container>
        </section>

        <DashboardCTA
          headline="Ready to Identify"
          subheadline="Your Website Visitors?"
          description="Install the pixel in 60 seconds and see which companies are visiting your site right now. Plans from $97/mo, month-to-month."
          ctaText="Get Started"
        />
      </HumanView>

      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">CURSIVE RESOURCES — VISITOR IDENTIFICATION & LEAD GENERATION GUIDES</h1>
            <p className="text-gray-700 leading-relaxed">
              Guides, comparisons, and definitions on visitor identification, intent data, and B2B
              lead generation. Learn how to turn anonymous website traffic into qualified pipeline
              with the Cursive Visitor Pixel and Custom Audiences.
            </p>
          </div>

          <MachineSection title="Resource Categories">
            <MachineList items={[
              { label: "Visitor Identification", href: "/blog/visitor-tracking", description: "Identify and track anonymous website visitors" },
              { label: "Lead Generation", href: "/blog/lead-generation", description: "Strategies for generating high-quality B2B leads" },
              { label: "Data Platforms", href: "/blog/data-platforms", description: "Comparisons and guides for B2B data providers" },
            ]} />
          </MachineSection>

          <MachineSection title="Featured Guides">
            <MachineList items={[
              { label: "How to Identify Website Visitors: Complete Technical Guide", href: "/blog/how-to-identify-website-visitors-technical-guide", description: "12 min read — the mechanics behind deterministic visitor resolution" },
              { label: "How to Identify Anonymous Website Visitors", href: "/blog/how-to-identify-anonymous-website-visitors", description: "9 min read — a practical playbook for turning unknown traffic into pipeline" },
              { label: "ICP Targeting Guide", href: "/blog/icp-targeting-guide", description: "11 min read — a framework for defining your ideal customer profile" },
              { label: "Cold Email Best Practices for 2026", href: "/blog/cold-email-2026", description: "15 min read — what actually earns replies in 2026" },
            ]} />
          </MachineSection>

          <MachineSection title="Glossary">
            <MachineList items={[
              { label: "What Is Website Visitor Identification?", href: "/what-is-website-visitor-identification", description: "Guide to visitor identification technology" },
              { label: "What Is Visitor Deanonymization?", href: "/what-is-visitor-deanonymization", description: "How deanonymization works for B2B websites" },
              { label: "What Is Lead Enrichment?", href: "/what-is-lead-enrichment", description: "Enriching lead data with company and contact information" },
              { label: "What Is B2B Intent Data?", href: "/what-is-b2b-intent-data", description: "Understanding and using buyer intent signals" },
              { label: "What Is Account-Based Marketing?", href: "/what-is-account-based-marketing", description: "ABM strategies for B2B companies" },
              { label: "What Is Direct Mail Automation?", href: "/what-is-direct-mail-automation", description: "Automating direct mail triggered by digital behavior" },
            ]} />
          </MachineSection>

          <MachineSection title="Comparison Guides">
            <MachineList items={[
              { label: "Warmly vs. Cursive", href: "/blog/warmly-vs-cursive-comparison", description: "Visitor identification platform comparison" },
              { label: "Apollo vs. Cursive", href: "/blog/apollo-vs-cursive-comparison", description: "Sales engagement vs. visitor identification" },
              { label: "ZoomInfo vs. Cursive", href: "/blog/zoominfo-vs-cursive-comparison", description: "Data enrichment platform comparison" },
              { label: "6sense vs. Cursive", href: "/blog/6sense-vs-cursive-comparison", description: "Intent data platform comparison" },
              { label: "Clearbit Alternatives", href: "/blog/clearbit-alternatives-comparison", description: "Top Clearbit alternatives for 2026" },
              { label: "ZoomInfo Alternatives", href: "/blog/zoominfo-alternatives-comparison", description: "Best ZoomInfo alternatives compared" },
            ]} />
          </MachineSection>

          <MachineSection title="What Cursive Sells">
            <MachineList items={[
              "Visitor Pixel ($97/month) — identify the companies and people visiting your site",
              "Custom Audience ($197/month) — a fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) — both, in one feed",
            ]} />
            <p className="text-gray-700 mt-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
          </MachineSection>

          <MachineSection title="Get Started with Cursive">
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Full Blog", href: "https://www.meetcursive.com/blog", description: "Browse all articles on B2B growth and lead generation" },
              { label: "Platform Overview", href: "https://www.meetcursive.com/platform", description: "Visitor identification and intent audiences" },
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" },
              { label: "Case Studies", href: "https://www.meetcursive.com/case-studies", description: "Real results from real companies using Cursive" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
