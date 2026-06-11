"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { OrganizationSchema, ArticleSchema } from "@/components/schema/SchemaMarkup"
import Link from "next/link"
import {
  Code2, Database, Fingerprint, Network, Sparkles,
  Globe, Cookie, FileCheck, Users, Target, BarChart3,
  Megaphone, LayoutTemplate, GitMerge, ShieldCheck, Scale,
  ArrowRight, type LucideIcon,
} from "lucide-react"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { GET_LEADS_URL, BOOKING_URL } from "@/lib/cta"

const EASE = [0.22, 1, 0.36, 1] as const

const faqs = [
  {
    question: "What is website visitor identification?",
    answer:
      "Website visitor identification is the process of revealing the companies and individuals who browse your website without filling out a form. It uses technologies like reverse IP lookup, device fingerprinting, and cookie matching to de-anonymize traffic and provide firmographic and contact data for sales and marketing teams.",
  },
  {
    question: "How accurate is website visitor identification in 2026?",
    answer:
      "Accuracy varies dramatically by method. Cookie-based tools resolve only 2–5% of visitors. IP databases resolve 10–15%. Cursive uses a deterministic pixel that resolves visitors against an identity graph of 280M+ verified consumer and 140M+ business profiles, achieving a 40–60% match rate with 60–80% pixel-level accuracy — not modeled or probabilistic.",
  },
  {
    question: "Is website visitor identification legal?",
    answer:
      "Yes, website visitor identification is legal when implemented with proper compliance measures. B2B identification using business IP addresses and publicly available professional data is permitted under GDPR and CCPA. Best practices include displaying a privacy policy, offering opt-out mechanisms, and only collecting business-relevant data.",
  },
  {
    question: "What data do visitor identification tools provide?",
    answer:
      "Visitor identification tools provide company-level data (company name, industry, employee count, revenue, technologies used) and person-level data (name, job title, email address, LinkedIn profile, phone number). Advanced platforms also provide behavioral data like pages visited, time on site, and intent signals.",
  },
  {
    question: "How does website visitor identification differ from Google Analytics?",
    answer:
      "Google Analytics shows aggregate traffic metrics like page views and bounce rates but does not reveal who individual visitors are. Visitor identification tools go further by matching anonymous sessions to specific companies and contacts, enabling direct sales outreach rather than just reporting on traffic patterns.",
  },
  {
    question: "How long does it take to set up visitor identification?",
    answer:
      "Most visitor identification platforms can be set up in under 10 minutes. Installation typically involves adding a small JavaScript tracking pixel to your website, similar to adding Google Analytics. With Cursive the pixel installs in about 60 seconds, and once installed, visitor data begins flowing immediately through one-click CRM integrations.",
  },
  {
    question: "What is the ROI of website visitor identification?",
    answer:
      "The ROI depends on your traffic volume and sales cycle, but most B2B companies see a 3–5x return within the first quarter. For example, a company with 10,000 monthly visitors using a deterministic pixel that resolves 40–60% of traffic gains access to 4,000–6,000 identified prospects per month — vs 200–500 from a cookie-based tool. Even converting 1% of those into qualified opportunities can generate significant pipeline.",
  },
  {
    question: "Can visitor identification work for B2C companies?",
    answer:
      "Visitor identification is primarily designed for B2B use cases where identifying business visitors creates actionable sales opportunities. B2C identification is more restricted due to consumer privacy regulations. However, B2C companies can still benefit from company-level identification for partnership and B2B2C opportunities.",
  },
]

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

const howItWorks: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Code2,
    title: "Tracking pixel installation",
    body: "A lightweight JavaScript pixel loads asynchronously on every page. Cursive's pixel is privacy-compliant by default and adds less than 20ms of page load time.",
  },
  {
    icon: Database,
    title: "Data collection",
    body: "The pixel collects non-PII session signals — IP address, user agent, browser configuration, screen resolution, language, and referring URL — which combine into a unique signature.",
  },
  {
    icon: Fingerprint,
    title: "Device fingerprinting",
    body: "Dozens of browser and device attributes form a probabilistic identifier that holds up even when visitors use VPNs, privacy features, or randomized signals.",
  },
  {
    icon: Network,
    title: "Database matching",
    body: "Signals are matched against hundreds of millions of business records in real time, typically within 200–500ms. Database freshness is the primary differentiator between platforms.",
  },
  {
    icon: GitMerge,
    title: "Identity resolution",
    body: "Fragmented sessions across devices, IPs, and browsers merge into a single unified profile — essential in B2B, where buying committees visit at different times.",
  },
  {
    icon: Sparkles,
    title: "Enrichment & real-time delivery",
    body: "Identified visitors are enriched with firmographic and contact data, then delivered to your CRM and tools within minutes — before intent signals decay.",
  },
]

const methods: Array<{ icon: LucideIcon; title: string; rate: string; body: string }> = [
  {
    icon: Globe,
    title: "Reverse IP lookup",
    rate: "30–40% match",
    body: "Maps a visitor's IP to the company that owns the address block. Reliable for static corporate IPs, but struggles with remote workers, VPNs, and residential ISPs. Company-level only.",
  },
  {
    icon: Fingerprint,
    title: "Device fingerprinting",
    rate: "60–70% match",
    body: "Analyzes 100+ browser, device, and software attributes to identify individuals — not just companies — and works even over VPNs or remote networks.",
  },
  {
    icon: Cookie,
    title: "Cookie-based tracking",
    rate: "Variable",
    body: "First-party cookies reconnect returning visitors to an existing profile. Third-party cookie restrictions have reduced effectiveness, so it works best combined with other methods.",
  },
  {
    icon: FileCheck,
    title: "Form-based identification",
    rate: "2–5% capture",
    body: "Visitors self-report via forms and gated content — the highest accuracy, but the lowest coverage. Best used to validate and enhance data from other methods.",
  },
]

const dataCategories: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Database,
    title: "Company-level data",
    body: "Company name, domain, industry (SIC/NAICS), employee count, revenue range, HQ location, funding status, and technology stack — instant ICP qualification.",
  },
  {
    icon: Users,
    title: "Person-level data",
    body: "Full name, job title, department, seniority, verified work email, phone, and LinkedIn URL — enabling direct, personalized outreach when available.",
  },
  {
    icon: BarChart3,
    title: "Behavioral data",
    body: "Pages viewed, time on page, scroll depth, visit count, referring source, and UTM parameters — turning identity into actionable context.",
  },
  {
    icon: Target,
    title: "Intent signals",
    body: "Composite scores that flag active buying cycles: pricing-page views, competitor comparisons, and repeat sessions in a short window.",
  },
]

const useCases: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Users,
    title: "B2B lead generation",
    body: "Capture far more than the 2% who fill out forms. A site with 20,000 monthly visitors and a 40–60% match rate surfaces 8,000–12,000 identified visitors — vs 400–1,000 from a cookie tool.",
  },
  {
    icon: Target,
    title: "Account-based marketing",
    body: "See which target accounts are already engaging, then reach out at the moment of interest. Intent-driven ABM typically lifts engagement rates by 2–3x.",
  },
  {
    icon: BarChart3,
    title: "Sales intelligence",
    body: "Know a prospect viewed pricing, read an industry case study, and returned three times this week — and craft outreach that turns cold conversations warm.",
  },
  {
    icon: Megaphone,
    title: "Retargeting & advertising",
    body: "Segment retargeting audiences by firmographic fit and behavior. Tailored ads typically cut cost per acquisition by 40–60% versus broad retargeting.",
  },
  {
    icon: LayoutTemplate,
    title: "Content personalization",
    body: "Adjust messaging, case studies, and CTAs in real time based on who's visiting. Visitor-based personalization drives 15–25% lifts in conversion rates.",
  },
  {
    icon: GitMerge,
    title: "Pipeline attribution",
    body: "Connect anonymous pre-form-fill visits to closed revenue, attributing pipeline to the campaigns, content, and channels that actually work.",
  },
]

const implementation: Array<{ title: string; body: string }> = [
  {
    title: "Choose the right platform",
    body: "Evaluate match rate, data accuracy, integrations, and compliance posture. Run a proof of concept against your real traffic rather than trusting marketing claims.",
  },
  {
    title: "Install the tracking pixel",
    body: "Add the JavaScript snippet to your site header or tag manager and confirm it loads on every page. With Cursive this takes about 60 seconds.",
  },
  {
    title: "Connect your integrations",
    body: "Wire visitor data into your CRM (Salesforce, HubSpot), marketing automation, Slack, and ad platforms with one-click integrations.",
  },
  {
    title: "Set up workflows and alerts",
    body: "Route identified visitors to the right teams — Slack alerts when a target account hits pricing, auto-created CRM leads for ICP matches, and segmented ad audiences.",
  },
  {
    title: "Train your team",
    body: "Teach reps to reference behavioral data without being intrusive, and set expectations around match rates and acceptable use.",
  },
  {
    title: "Measure and optimize",
    body: "Track match-rate trends, qualified leads, pipeline influenced, and cost per identified lead against your baselines to quantify ROI.",
  },
]

const platformRows: Array<{ name: string; rate: string; level: string; integrations: string; note: string; highlight?: boolean }> = [
  { name: "Cursive", rate: "40–60% (deterministic)", level: "Company + Individual", integrations: "200+", note: "Newer platform", highlight: true },
  { name: "Warmly", rate: "40–50%", level: "Company + Individual", integrations: "50+", note: "Higher price point" },
  { name: "Clearbit", rate: "N/A", level: "N/A", integrations: "N/A", note: "Shut down / absorbed into HubSpot" },
  { name: "Leadfeeder", rate: "30–40%", level: "Company only", integrations: "30+", note: "No individual identification" },
  { name: "RB2B", rate: "50–60%", level: "Company + Individual", integrations: "20+", note: "US-only coverage" },
]

const relatedResources = [
  { title: "What is B2B Intent Data?", href: "/what-is-b2b-intent-data", desc: "How intent signals reveal which companies are actively researching solutions like yours." },
  { title: "Cursive Visitor Identification", href: "/visitor-identification", desc: "See how Cursive's deterministic pixel resolves 40–60% of your website traffic." },
  { title: "Audience Builder", href: "/audience-builder", desc: "Build targeted segments from identified visitors using firmographic and behavioral filters." },
  { title: "Visitor Identification for B2B Software", href: "/industries/b2b-software", desc: "Industry-specific strategies for SaaS and technology companies." },
  { title: "Clearbit Alternatives Comparison", href: "/blog/clearbit-alternatives-comparison", desc: "Evaluate the top visitor identification platforms available in 2026." },
  { title: "Pricing", href: "/pricing", desc: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo." },
]

export default function WhatIsWebsiteVisitorIdentificationPage() {
  return (
    <main className="overflow-hidden">
      <OrganizationSchema />
      <ArticleSchema
        title="What is Website Visitor Identification? Complete Guide (2026)"
        description="A comprehensive guide to website visitor identification: how it works, key methods, accuracy benchmarks, compliance, and implementation steps."
        publishedAt="2026-01-15"
        updatedAt="2026-02-01"
      />
      <StructuredData data={generateFAQSchema({ faqs })} />

      <HumanView>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Resources", href: "/resources" },
              { name: "What is Website Visitor Identification?", href: "/what-is-website-visitor-identification" },
            ]}
          />
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
                Complete Guide · 2026
              </span>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                What is website
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                  visitor identification?
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                <strong className="text-gray-900 font-medium">Website visitor identification</strong> reveals
                which companies and people browse your site — even when they never fill out a form. By matching
                anonymous traffic to real business contacts, it turns the 98% of traffic that usually leaves
                unknown into actionable sales opportunities.
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

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
              className="mt-12 max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-[#F7F9FB] p-6 sm:p-8"
            >
              <p className="text-base text-gray-700 leading-relaxed">
                In 2026, visitor identification is a foundational capability for B2B revenue teams. According
                to Forrester, 68% of the B2B buying process now happens digitally — so seeing who researches
                your product before they raise their hand is a decisive advantage. Platforms like{" "}
                <Link href="/platform" className="text-primary hover:underline font-medium">Cursive</Link>{" "}
                deliver a 40–60% deterministic match rate (vs 2–5% for cookie tools and 10–15% for IP
                databases), backed by 280M+ verified consumer and 140M+ business profiles refreshed every 30
                days via NCOA.
              </p>
            </motion.div>
          </Container>
        </section>

        {/* How It Works */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="How Visitor Identification"
              script="Actually Works"
              sub="A multi-step pipeline that transforms anonymous web sessions into identified contacts."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {howItWorks.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <IconChip Icon={s.icon} />
                    <span className="text-sm font-semibold text-gray-300">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{s.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{s.body}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Identification Methods */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Visitor Identification"
              script="Methods"
              sub="Four primary methods, each with different accuracy, coverage, and compliance characteristics. Modern platforms combine several to maximize match rates."
            />
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {methods.map((m, i) => (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <IconChip Icon={m.icon} />
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {m.rate}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{m.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{m.body}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Accuracy & Match Rates */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Accuracy and"
              script="Match Rates"
              sub="Match rate — the share of visitors you can identify — is the single most important metric when comparing platforms."
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-white p-2 sm:p-3 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Metric</th>
                      <th className="px-4 py-3 font-medium">Industry Average</th>
                      <th className="px-4 py-3 font-medium">Best-in-Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ["Company-level match rate", "30–40%", "65–75%"],
                      ["Individual-level match rate", "15–25%", "50–60%"],
                      ["Email accuracy", "80–85%", "95%+"],
                      ["Data freshness", "30–90 days", "Real-time"],
                      ["Firmographic completeness", "60–70%", "90%+"],
                    ].map((row) => (
                      <tr key={row[0]} className="text-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900">{row[0]}</td>
                        <td className="px-4 py-3">{row[1]}</td>
                        <td className="px-4 py-3 text-primary font-medium">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <div className="mt-12 grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE }}
                className="rounded-2xl border border-gray-200 bg-white p-7"
              >
                <h4 className="text-xs font-semibold text-gray-400 tracking-widest mb-4 uppercase">What lowers match rates</h4>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  <li>Residential ISP, mobile, and consumer-VPN traffic</li>
                  <li>Regions with thinner business-database coverage</li>
                  <li>Lower-footprint industries</li>
                  <li>Mobile traffic (~half the rate of desktop)</li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
                className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-7"
              >
                <h4 className="text-xs font-semibold text-primary tracking-widest mb-4 uppercase">How to improve them</h4>
                <ul className="space-y-2.5 text-sm text-gray-700">
                  <li>Install the pixel site-wide, not just key pages</li>
                  <li>Use a platform that combines multiple methods</li>
                  <li>Drive authenticated, business-hours traffic</li>
                  <li>Keep your data source continuously fresh</li>
                </ul>
              </motion.div>
            </div>
          </Container>
        </section>

        {/* What Data You Get */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="What Data"
              script="You Get"
              sub="Modern platforms deliver four categories of data for each identified visitor — a complete picture of who is engaging and why."
            />
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {dataCategories.map((d, i) => (
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
            <p className="mt-8 text-center text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Use these signals to qualify against your{" "}
              <Link href="/audience-builder" className="text-primary hover:underline">ideal customer profile</Link>{" "}
              and prioritize the hottest{" "}
              <Link href="/what-is-b2b-intent-data" className="text-primary hover:underline">intent signals</Link> first.
            </p>
          </Container>
        </section>

        {/* Use Cases */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Use Cases for"
              script="Visitor Identification"
              sub="Six of the highest-impact ways B2B teams turn identified traffic into revenue."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {useCases.map((u, i) => (
                <motion.div
                  key={u.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={u.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{u.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{u.body}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Legal & Compliance */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Legal and"
              script="Compliance"
              sub="B2B visitor identification is broadly permissible in 2026 when implemented correctly. Here's what matters."
            />
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: ShieldCheck,
                  title: "GDPR",
                  body: "B2B identification is typically processed under legitimate interest (Article 6(1)(f)). Provide privacy-policy notice, complete a Legitimate Interest Assessment, and offer a clear opt-out.",
                },
                {
                  icon: Scale,
                  title: "CCPA / CPRA",
                  body: "Permitted with disclosure: list the categories of data collected, provide a \"Do Not Sell or Share\" link, honor opt-outs within 15 business days, and document it in your privacy policy.",
                },
                {
                  icon: Users,
                  title: "B2B vs. B2C",
                  body: "Identifying business professionals via work-related footprints has broader legal support than consumer tracking. Cursive focuses exclusively on B2B data for the strongest posture.",
                },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={c.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{c.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{c.body}</p>
                </motion.div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Best practice: disclose the technology in your privacy policy, add a visible opt-out, keep an LIA
              on record, work with SOC 2 Type II providers, and honor deletion requests promptly.
            </p>
          </Container>
        </section>

        {/* Implementation Guide */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Implementation"
              script="Guide"
              sub="Six steps to launch visitor identification and maximize your results."
            />
            <div className="max-w-3xl mx-auto space-y-4">
              {implementation.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                  className="flex gap-5 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7"
                >
                  <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{step.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Platform Comparison */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Platform"
              script="Comparison"
              sub="How the leading visitor identification platforms compare across the criteria that matter most."
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="max-w-4xl mx-auto rounded-2xl border border-gray-200 p-2 sm:p-3 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Platform</th>
                      <th className="px-4 py-3 font-medium">Match Rate</th>
                      <th className="px-4 py-3 font-medium">ID Level</th>
                      <th className="px-4 py-3 font-medium">Integrations</th>
                      <th className="px-4 py-3 font-medium">Key Limitation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {platformRows.map((row) => (
                      <tr key={row.name} className={row.highlight ? "bg-primary/[0.04]" : ""}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{row.name}</td>
                        <td className="px-4 py-3 text-gray-700">{row.rate}</td>
                        <td className="px-4 py-3 text-gray-700">{row.level}</td>
                        <td className="px-4 py-3 text-gray-700">{row.integrations}</td>
                        <td className="px-4 py-3 text-gray-500">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
            <p className="mt-6 text-center text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
              For head-to-head detail, see our{" "}
              <Link href="/blog/clearbit-alternatives-comparison" className="text-primary hover:underline">Clearbit alternatives</Link>,{" "}
              <Link href="/blog/warmly-vs-cursive-comparison" className="text-primary hover:underline">Warmly vs. Cursive</Link>, and{" "}
              <Link href="/blog/apollo-vs-cursive-comparison" className="text-primary hover:underline">Apollo vs. Cursive</Link> comparisons.
            </p>
          </Container>
        </section>

        {/* FAQ */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading plain="Frequently Asked" script="Questions" />
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, i) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7"
                >
                  <h3 className="text-base font-medium text-gray-900">{faq.question}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Related Resources */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading plain="Related" script="Resources" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {relatedResources.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 hover:border-primary hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {link.title}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary flex-shrink-0" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">{link.desc}</p>
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
                See who&apos;s already
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                  on your site
                </span>
              </h2>
              <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                Install the Cursive pixel in 60 seconds and resolve 40–60% of your anonymous traffic. Plans
                from $97/mo — self-serve, month-to-month, cancel anytime.
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
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">What is Website Visitor Identification? Complete Guide (2026)</h1>

          <p className="text-gray-700 mb-6">
            Website visitor identification is the process of revealing the companies and individuals who browse your website without filling out a form. It uses technologies like reverse IP lookup, device fingerprinting, and cookie matching to de-anonymize traffic and provide firmographic and contact data for sales and marketing teams. Published: January 15, 2026.
          </p>

          <MachineSection title="Key Takeaways">
            <MachineList items={[
              "95-98% of B2B website visitors leave without filling out a form",
              "Visitor identification reveals companies and contacts behind anonymous traffic",
              "Methods: Cookie matching (2–5%), reverse IP lookup (10–15%), device fingerprinting, email resolution",
              "Cursive uses a deterministic pixel achieving 40–60% match rates with 60–80% pixel-level accuracy — backed by 280M+ verified consumer and 140M+ business profiles refreshed every 30 days via NCOA",
              "Legal under GDPR (legitimate interest) and CCPA (with disclosure) for B2B use cases"
            ]} />
          </MachineSection>

          <MachineSection title="How Website Visitor Identification Works">
            <MachineList items={[
              "Step 1: JavaScript tag collects IP address, user agent, device fingerprint, and behavioral data",
              "Step 2: IP Resolution — Map IP to company via ISP registrations and corporate IP databases",
              "Step 3: Contact Resolution — Match company + behavioral signals to individual contacts in identity graph",
              "Step 4: Data Enrichment — Append firmographic, technographic, and contact data to identified visitors",
              "Step 5: Scoring — Assign engagement and fit scores based on pages viewed, time spent, return visits",
              "Step 6: Activation — Push identified visitors to CRM, marketing automation, and sales engagement tools"
            ]} />
          </MachineSection>

          <MachineSection title="Identification Methods">
            <MachineList items={[
              "Cookie-Based Tracking — Links return visits to known users; resolves 2–5% of visitors",
              "Reverse IP Lookup — Maps IP addresses to companies; resolves 10–15% of B2B traffic at company level",
              "Device Fingerprinting — Combines browser, OS, screen, fonts, and WebGL data for unique device signatures",
              "Email-Based Resolution — Matches hashed email addresses from ad platforms and data cooperatives",
              "Cross-Device Identity Graphs — Links multiple devices to single user profiles for complete journey tracking",
              "Cursive Deterministic Pixel — Resolves visitors against 280M+ verified consumer and 140M+ business profiles for a 40–60% match rate with 60–80% pixel-level accuracy"
            ]} />
          </MachineSection>

          <MachineSection title="Accuracy Benchmarks">
            <MachineList items={[
              "Match Rate Comparison: Cookies 2–5%, IP databases 10–15%, Cursive deterministic pixel 40–60%",
              "Individual-Level Identification: 10-20% (basic), 30-50% (advanced platforms with email resolution)",
              "Email Accuracy: 92-97% deliverability for verified enriched emails",
              "Firmographic Data: 90-95% accuracy for company size, industry, location",
              "Key metric: Identification rate = identified visitors / total unique visitors"
            ]} />
          </MachineSection>

          <MachineSection title="Use Cases">
            <MachineList items={[
              "Sales Prospecting — Alert sales when target accounts visit your site; prioritize follow-up by engagement level",
              "Account-Based Marketing — Trigger personalized campaigns when ABM target accounts show up on your website",
              "Retargeting — Build ad audiences from identified visitors who did not convert",
              "Content Intelligence — Understand which companies consume which content to refine marketing strategy",
              "Pipeline Attribution — Connect anonymous pre-form-fill visits to downstream pipeline and revenue",
              "Intent Signal — Website visits to pricing/product pages are high-value first-party intent signals"
            ]} />
          </MachineSection>

          <MachineSection title="Compliance & Privacy">
            <MachineList items={[
              "GDPR — Permissible under legitimate interest (Article 6(1)(f)) for B2B marketing with proper DPIA",
              "CCPA/CPRA — Requires disclosure of data collection and opt-out mechanism",
              "ePrivacy — Cookie consent needed for tracking cookies in EU",
              "Best practices: Consent management, data minimization, retention policies, suppression lists",
              "B2B-focused identification using business data has more permissive treatment than consumer tracking"
            ]} />
          </MachineSection>

          <MachineSection title="Implementation Guide">
            <MachineList items={[
              "Step 1: Choose provider based on identification rates, data accuracy, and integration support",
              "Step 2: Deploy JavaScript tracking tag (typically one line of code)",
              "Step 3: Configure CRM/marketing automation integration for real-time data flow",
              "Step 4: Set up alerts and workflows for high-value visitor activity",
              "Step 5: Define lead scoring rules incorporating visitor identification data",
              "Step 6: Monitor identification rates and data quality; optimize over time"
            ]} />
          </MachineSection>

          <MachineSection title="Provider Comparison">
            <MachineList items={[
              "Cursive — Deterministic individual + company ID (40–60% match, 60–80% pixel-level accuracy) with integrated enrichment; self-serve from $97/mo (Visitor Pixel), $197/mo (Custom Audience), or $247/mo for both",
              "Clearbit Reveal — Company-level IP resolution, deep HubSpot integration (included in HubSpot plans)",
              "6sense — Company-level ID with predictive buying stage AI ($60,000+/yr)",
              "Demandbase — Company-level ID with ABM ad activation ($50,000+/yr)",
              "Lead Forensics — Company-level IP identification for SMBs ($800+/mo)",
              "RB2B — Individual-level ID via email resolution (free tier available)"
            ]} />
          </MachineSection>

          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) — identify the companies and people visiting your site",
              "Custom Audience ($197/month) — a fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) — both, in one feed"
            ]} />
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "B2B Intent Data Guide", href: "/what-is-b2b-intent-data", description: "Intent signals from identified visitor behavior" },
              { label: "Cursive Visitor Identification", href: "/visitor-identification", description: "40–60% deterministic pixel match rate for B2B traffic" },
              { label: "Audience Builder", href: "/audience-builder", description: "Build targeted segments from identified visitors" },
              { label: "Cursive Platform", href: "/platform", description: "Full-stack visitor ID, enrichment, and activation" },
              { label: "Pricing", href: "/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" }
            ]} />
          </MachineSection>

          <MachineSection title="Get Started">
            <p className="text-gray-700 mb-3">
              Cursive is the identity layer for outbound, intent, and enrichment — resolving visitors against 280M+ verified consumer and 140M+ business profiles with a 40–60% deterministic pixel match rate (vs 2–5% for cookies, 10–15% for IP databases) and 60–80% pixel-level accuracy. Self-serve from $97/month, live in minutes.
            </p>
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team before you buy" }
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
