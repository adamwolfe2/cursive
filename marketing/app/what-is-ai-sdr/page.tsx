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
  Bot, Search, PenLine, Send, MessageSquare, Filter,
  CalendarCheck, Users, Zap, Megaphone, RefreshCw, Briefcase,
  Scale, ShieldCheck, Network, Target, ArrowRight, type LucideIcon,
} from "lucide-react"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { GET_LEADS_URL, BOOKING_URL } from "@/lib/cta"

const EASE = [0.22, 1, 0.36, 1] as const

const faqs = [
  {
    question: "What is an AI SDR?",
    answer:
      "An AI SDR (Sales Development Representative) is an AI-powered software agent that automates the prospecting, outreach, and qualification tasks traditionally performed by human SDRs. AI SDRs use artificial intelligence and machine learning to research prospects, write personalized emails, send multi-channel sequences, handle responses, qualify leads, and book meetings on behalf of sales teams.",
  },
  {
    question: "Can an AI SDR replace human SDRs?",
    answer:
      "AI SDRs are best suited to augment rather than fully replace human SDRs. They excel at high-volume repetitive tasks like initial outreach, follow-ups, and qualification of inbound leads. However, human SDRs remain superior for complex enterprise deals, relationship-driven sales, and situations requiring nuanced judgment. Most companies in 2026 use a hybrid model where AI SDRs handle volume while human reps focus on strategic accounts.",
  },
  {
    question: "How much does an AI SDR cost compared to a human SDR?",
    answer:
      "AI SDR platforms vary widely in price depending on volume, channels, and whether they bundle data. A fully-loaded human SDR costs $75,000 to $120,000 per year when you factor in salary, benefits, management overhead, tools, and training. The bigger lever on cost-per-meeting, though, is data quality: an AI SDR pointed at cold, untargeted lists burns sending reputation and budget, while one fed warm, in-market prospects converts far more efficiently.",
  },
  {
    question: "How does an AI SDR personalize outreach?",
    answer:
      "AI SDRs personalize outreach by researching each prospect using data from CRMs, LinkedIn, company websites, news articles, and intent signals. They use large language models to craft unique messages that reference the prospect's role, company, recent activities, and specific challenges. The best AI SDRs achieve personalization quality comparable to a well-trained human SDR while operating at much higher volume — but personalization only converts when the prospect is a genuine fit and actively in-market.",
  },
  {
    question: "What channels can AI SDRs use for outreach?",
    answer:
      "Modern AI SDRs operate across multiple channels including email, LinkedIn messages, LinkedIn connection requests, SMS, and in some cases phone calls through AI voice technology. Multi-channel sequences that combine email and LinkedIn touchpoints typically generate 2-3x higher response rates than single-channel approaches. The AI manages channel selection, timing, and follow-up cadence automatically.",
  },
  {
    question: "How long does it take to set up an AI SDR?",
    answer:
      "Initial setup typically takes 1-2 weeks, including defining your ideal customer profile, training the AI on your messaging and value proposition, connecting your email and CRM systems, and configuring outreach sequences. Most platforms require a 2-4 week ramp period during which the AI learns from initial results and human feedback to optimize its approach. After ramp, AI SDRs run autonomously with periodic review.",
  },
  {
    question: "What results can I expect from an AI SDR?",
    answer:
      "Results vary based on your market, ICP, and messaging, but typical benchmarks include email open rates of 45-65%, response rates of 8-15%, and 30-80 qualified meetings per month per AI SDR. The single biggest driver of those results is who you target: teams that point their AI SDR (or their human reps) at prospects already researching relevant solutions see materially better numbers. That is where an intent and identity layer like Cursive fits — it tells you who is in-market so your outreach lands warm.",
  },
  {
    question: "Are AI SDR emails compliant with anti-spam laws?",
    answer:
      "Reputable AI SDR platforms build compliance into their systems, including CAN-SPAM compliance with required unsubscribe mechanisms, GDPR compliance with legitimate interest documentation, email warm-up and sending best practices to maintain deliverability, and automatic suppression of opt-outs. However, compliance ultimately remains the responsibility of the user, so it is important to review your AI SDR's practices against applicable regulations.",
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
    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

const pipeline: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Search,
    title: "Data ingestion & research",
    body: "The AI pulls from your CRM, LinkedIn, company news, and enrichment databases, cross-referencing dozens of data points per prospect in seconds — work that would take a human rep 15-30 minutes each.",
  },
  {
    icon: PenLine,
    title: "Personalization engine",
    body: "Large language models fine-tuned on sales messaging craft unique emails and messages that reference the prospect's role, company news, and specific challenges, adapted to your brand voice and value proposition.",
  },
  {
    icon: Send,
    title: "Multi-channel outreach",
    body: "Coordinated sequences span email, LinkedIn connection requests, and follow-ups, with send-time optimization and cadence adjustments based on partial engagement signals like opens without replies.",
  },
  {
    icon: MessageSquare,
    title: "Response handling",
    body: "Replies are classified and routed: interest goes to booking, questions are answered from a knowledge base, objections get trained rebuttals, and opt-outs are honored and logged automatically.",
  },
  {
    icon: Filter,
    title: "Qualification",
    body: "Before booking, the AI scores prospects against your criteria — company size, industry, tech stack, budget authority, timeline — passing only qualified leads to account executives.",
  },
  {
    icon: CalendarCheck,
    title: "Handoff to AE",
    body: "Qualified meetings are booked directly on a rep's calendar with a briefing doc covering background, pain points, and full conversation context, so the AE walks in prepared.",
  },
]

const capabilities: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: PenLine,
    title: "Email personalization at scale",
    body: "LLMs trained on successful sales messaging produce emails that read like an experienced rep wrote them, lifting response rates well above the 1-3% typical of generic mass campaigns.",
  },
  {
    icon: Network,
    title: "LinkedIn outreach",
    body: "Automated connection requests with personalized notes, direct messaging, and content engagement — most effective when paired with email in a multi-channel sequence.",
  },
  {
    icon: CalendarCheck,
    title: "Meeting booking",
    body: "When a prospect shows interest, the AI shares time slots, sends invites, and manages reschedules, removing the friction between a positive reply and a meeting on the calendar.",
  },
  {
    icon: Filter,
    title: "Lead scoring & qualification",
    body: "Firmographic data, behavioral signals, and conversational inputs combine into a score that prioritizes which prospects reach a human rep and which are nurtured or disqualified.",
  },
  {
    icon: RefreshCw,
    title: "CRM updates & logging",
    body: "Every touch, response, and qualification detail is logged automatically in Salesforce, HubSpot, or Pipedrive — eliminating the manual entry human reps often skip.",
  },
  {
    icon: Target,
    title: "Intent-driven prioritization",
    body: "The strongest results come from working in-market accounts first. When a target account is actively researching, timely outreach generates far higher response rates than static cold lists.",
  },
]

const useCases: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Send,
    title: "Outbound prospecting",
    body: "Given a target list or ICP, the AI researches each prospect, runs personalized multi-channel sequences, and books qualified meetings at volumes that would take a team of human reps.",
  },
  {
    icon: Zap,
    title: "Inbound lead follow-up",
    body: "Responding within 5 minutes is 21x more effective than after 30. The AI follows up on every inbound lead instantly, regardless of time zone, so nothing falls through the cracks.",
  },
  {
    icon: RefreshCw,
    title: "Re-engagement campaigns",
    body: "Systematically revive cold leads and lost opportunities already in your CRM with fresh, relevant messaging — high-ROI pipeline from contacts you have already paid to acquire.",
  },
  {
    icon: Megaphone,
    title: "Event follow-up",
    body: "Process an entire conference or webinar lead list within hours, sending messages that reference the specific event, session, or booth conversation before interest fades.",
  },
  {
    icon: Briefcase,
    title: "Expansion revenue",
    body: "Monitor usage patterns and trigger events inside existing accounts, reaching new contacts to drive upsell and cross-sell conversations human teams rarely have time for.",
  },
  {
    icon: Users,
    title: "Hybrid coverage",
    body: "AI handles high-volume outbound and qualification while human reps own strategic, relationship-driven accounts — the model most teams settle on in 2026.",
  },
]

const implementation: Array<{ title: string; body: string }> = [
  {
    title: "Define your ideal customer profile",
    body: "Start from your best existing customers, not aspirational targets. Combine firmographic, technographic, and behavioral criteria so the AI works a list that actually converts.",
  },
  {
    title: "Train the AI on your messaging",
    body: "Feed it your best-performing templates, value propositions, case studies, and objection handling so output stays consistent with your go-to-market voice.",
  },
  {
    title: "Set up channels and infrastructure",
    body: "Configure dedicated sending domains with SPF/DKIM/DMARC, warm up new addresses gradually, connect LinkedIn and your CRM, and verify deliverability before scaling.",
  },
  {
    title: "Start with a controlled pilot",
    body: "Target 100-500 contacts, review every email and response for 2-4 weeks, and establish baseline open, response, and meeting-rate metrics before increasing volume.",
  },
  {
    title: "Feed it warm, in-market prospects",
    body: "The fastest way to lift every downstream metric is to point outreach at people already researching your category — identity and intent data does this before the AI ever sends.",
  },
  {
    title: "Monitor and optimize",
    body: "Track deliverability, open, response, meetings booked, and meeting-to-opportunity rates weekly. Refine messaging and targeting, and scale volume only as quality holds.",
  },
]

const aiVsHuman: Array<[string, string, string]> = [
  ["Speed", "Thousands of prospects/day", "50-100 prospects/day"],
  ["Cost (annual)", "$12,000-$60,000", "$75,000-$120,000"],
  ["Ramp time", "2-4 weeks", "3-6 months"],
  ["Consistency", "100% consistent", "Variable by rep and day"],
  ["Personalization", "Data-driven, scalable", "Intuitive, deeply empathetic"],
  ["Complex objections", "Handles common patterns", "Nuanced, creative responses"],
  ["Relationship building", "Limited", "Strong interpersonal skills"],
  ["Availability", "24/7/365", "Business hours, minus PTO"],
]

const platformRows: Array<{ name: string; approach: string; channels: string; note: string }> = [
  { name: "Artisan (Ava)", approach: "AI agent", channels: "Email, LinkedIn", note: "SMB outbound automation" },
  { name: "11x (Alice)", approach: "AI digital worker", channels: "Email, LinkedIn, phone", note: "Enterprise outbound" },
  { name: "Regie.ai", approach: "AI content + sequencing", channels: "Email", note: "Email copy generation" },
  { name: "Outreach", approach: "Sales engagement + AI assist", channels: "Email, phone, LinkedIn", note: "Human-assisted selling" },
  { name: "Instantly", approach: "High-volume email + AI", channels: "Email", note: "Cold email at scale" },
]

const limitations: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Briefcase,
    title: "Complex enterprise deals",
    body: "Six- and seven-figure deals with long procurement cycles and many stakeholders need strategic thinking AI can't yet replicate. Use the AI to open the door; let humans run the relationship.",
  },
  {
    icon: Users,
    title: "Relationship building",
    body: "In trust-driven industries — professional services, financial advisory, healthcare — genuine human rapport still closes deals an AI cannot.",
  },
  {
    icon: ShieldCheck,
    title: "Brand voice & authenticity",
    body: "Thousands of AI-generated messages can drift off-tone or read robotic. Regular review and human oversight of edge cases keep quality and reputation intact.",
  },
  {
    icon: Scale,
    title: "Deliverability & targeting",
    body: "Poor lists and rushed warm-up damage domain reputation for every email you send. Targeting fit, in-market prospects is the single biggest protection against burning deliverability.",
  },
]

const relatedResources = [
  { title: "What is Website Visitor Identification?", href: "/what-is-website-visitor-identification", desc: "Identify the companies and people visiting your site so your reps reach out while interest is hot." },
  { title: "What is B2B Intent Data?", href: "/what-is-b2b-intent-data", desc: "How intent signals reveal which accounts are actively in-market before you ever send an email." },
  { title: "Cursive Visitor Identification", href: "/visitor-identification", desc: "Cursive's deterministic pixel resolves 40–60% of your website traffic into named prospects." },
  { title: "Audience Builder", href: "/audience-builder", desc: "Build targeted, in-market segments from real firmographic and behavioral data." },
  { title: "Cursive Platform", href: "/platform", desc: "The identity and intent layer that feeds warm prospects to your reps and tools." },
  { title: "Pricing", href: "/pricing", desc: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo." },
]

export default function WhatIsAISDRPage() {
  return (
    <main className="overflow-hidden">
      <OrganizationSchema />
      <ArticleSchema
        title="What is an AI SDR? Complete Guide to AI Sales Development (2026)"
        description="A comprehensive guide to AI SDRs: how they work, capabilities, cost analysis, implementation, and how they compare to human sales development representatives."
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
              { name: "What is an AI SDR?", href: "/what-is-ai-sdr" },
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
                What is an
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                  AI SDR?
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                An <strong className="text-gray-900 font-medium">AI SDR</strong> (Sales Development Representative)
                is an AI-powered software agent that automates prospecting, outreach, and qualification — researching
                prospects, writing personalized messages, running multi-channel sequences, handling responses, and
                booking meetings on behalf of a sales team.
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
                The AI SDR category exploded in 2026 as teams faced pressure to do more with less. But the platforms
                themselves don&apos;t solve the hardest part of outbound: <strong className="text-gray-900 font-medium">who
                to contact</strong>. Whether you run an AI SDR or human reps, results live and die on list quality.
                That&apos;s where Cursive fits — its{" "}
                <Link href="/visitor-identification" className="text-primary hover:underline font-medium">visitor identification</Link>{" "}
                and{" "}
                <Link href="/what-is-b2b-intent-data" className="text-primary hover:underline font-medium">intent data</Link>{" "}
                surface in-market, identified prospects so the outreach you do send actually converts.
              </p>
            </motion.div>
          </Container>
        </section>

        {/* How AI SDRs Work */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="How AI SDRs"
              script="Actually Work"
              sub="A six-stage pipeline that mirrors a top human SDR's workflow but runs at machine speed and scale."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pipeline.map((s, i) => (
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

        {/* AI SDR vs Human SDR */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="AI SDR vs."
              script="Human SDR"
              sub="The decision isn't binary. Understanding where each excels helps you build the right team structure."
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="max-w-3xl mx-auto rounded-2xl border border-gray-200 p-2 sm:p-3 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Dimension</th>
                      <th className="px-4 py-3 font-medium">AI SDR</th>
                      <th className="px-4 py-3 font-medium">Human SDR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {aiVsHuman.map((row) => (
                      <tr key={row[0]} className="text-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900">{row[0]}</td>
                        <td className="px-4 py-3 text-primary font-medium">{row[1]}</td>
                        <td className="px-4 py-3">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
            <p className="mt-8 text-center text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Most teams in 2026 run a hybrid model: AI handles high-volume outbound and inbound follow-up, while
              human reps focus on strategic accounts and relationship-driven selling.
            </p>
          </Container>
        </section>

        {/* Key Capabilities */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Key"
              script="Capabilities"
              sub="The core features that span the sales development workflow — evaluate these when comparing platforms."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {capabilities.map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={c.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{c.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{c.body}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Use Cases */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Use Cases for"
              script="AI SDRs"
              sub="Six of the highest-impact ways teams deploy AI SDRs across the sales development motion."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {useCases.map((u, i) => (
                <motion.div
                  key={u.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={u.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{u.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{u.body}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* The Data Problem (Cursive positioning) */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="An AI SDR Is Only as Good as"
              script="Its List"
              sub="The same outreach engine produces wildly different results depending on who it targets. Warm, in-market prospects are the lever."
            />
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Search,
                  title: "See who's already interested",
                  body: "Cursive's deterministic pixel resolves 40–60% of your anonymous website traffic into named companies and people — so you reach out to accounts that are already engaging, not a cold static list.",
                },
                {
                  icon: Target,
                  title: "Target in-market buyers",
                  body: "Custom Audience delivers a fresh weekly list of in-market prospects built from real firmographic and intent signals — the kind of warm list that lifts every downstream open, reply, and meeting rate.",
                },
                {
                  icon: Users,
                  title: "Feed reps or an AI SDR",
                  body: "Cursive isn't an AI SDR — it's the identity and intent layer underneath one. Pipe identified, in-market prospects into your human reps or your existing outreach tooling so the sending you do actually converts.",
                },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={c.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{c.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{c.body}</p>
                </motion.div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Plans start at $97/mo for the{" "}
              <Link href="/visitor-identification" className="text-primary hover:underline">Visitor Pixel</Link>,
              $197/mo for{" "}
              <Link href="/audience-builder" className="text-primary hover:underline">Custom Audience</Link>, or
              $247/mo for both — self-serve, month-to-month.
            </p>
          </Container>
        </section>

        {/* Implementation Guide */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Implementation"
              script="Guide"
              sub="Six steps to launch an AI SDR program and maximize results — without burning deliverability."
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
                  <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-sm font-semibold text-primary">
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
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Platform"
              script="Comparison"
              sub="The 2026 market spans purpose-built AI SDR agents and established sales engagement tools with AI bolted on."
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white p-2 sm:p-3 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Platform</th>
                      <th className="px-4 py-3 font-medium">Approach</th>
                      <th className="px-4 py-3 font-medium">Channels</th>
                      <th className="px-4 py-3 font-medium">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {platformRows.map((row) => (
                      <tr key={row.name} className="text-gray-700">
                        <td className="px-4 py-3 font-semibold text-gray-900">{row.name}</td>
                        <td className="px-4 py-3">{row.approach}</td>
                        <td className="px-4 py-3">{row.channels}</td>
                        <td className="px-4 py-3 text-gray-500">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
            <p className="mt-6 text-center text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Whichever outreach engine you choose, it performs best fed with warm, identified prospects. Cursive is the{" "}
              <Link href="/platform" className="text-primary hover:underline">identity and intent layer</Link>{" "}
              that sits upstream of it — not an AI SDR itself.
            </p>
          </Container>
        </section>

        {/* Limitations */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Limitations and"
              script="Considerations"
              sub="AI SDRs are powerful but not a silver bullet. Knowing the edges helps you deploy them where they win."
            />
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {limitations.map((l, i) => (
                <motion.div
                  key={l.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={l.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{l.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{l.body}</p>
                </motion.div>
              ))}
            </div>
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
                Give your outreach
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                  warmer prospects
                </span>
              </h2>
              <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                Cursive identifies who&apos;s already on your site and which accounts are in-market, then hands your
                reps warm, named prospects so outreach converts. Plans from $97/mo — self-serve, month-to-month,
                cancel anytime.
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
          <h1 className="text-2xl font-bold mb-4">What is an AI SDR? Complete Guide to AI Sales Development (2026)</h1>

          <p className="text-gray-700 mb-6">
            An AI SDR (Sales Development Representative) is an AI-powered software agent that automates prospecting, outreach, and qualification tasks traditionally performed by human SDRs. AI SDRs use machine learning to research prospects, write personalized emails, send multi-channel sequences, handle responses, qualify leads, and book meetings. Published: January 15, 2026.
          </p>

          <MachineSection title="Key Takeaways">
            <MachineList items={[
              "AI SDRs automate high-volume prospecting, outreach, and qualification that human SDRs traditionally handle",
              "Best suited to augment (not replace) human SDRs — AI handles volume, humans handle strategic accounts",
              "Core capabilities: prospect research, personalized email writing, multi-channel sequencing, response handling, meeting booking",
              "An AI SDR is only as good as its target list — results depend on contacting warm, in-market, qualified prospects",
              "Cursive is the identity and intent layer that feeds warm prospects to human reps or outreach tooling — it is not itself an AI SDR"
            ]} />
          </MachineSection>

          <MachineSection title="How AI SDRs Work">
            <MachineList items={[
              "Step 1: Data Ingestion — Pull prospect data from CRM, intent signals, visitor identification, enrichment sources",
              "Step 2: Prospect Research — AI analyzes company news, job changes, tech stack, competitive signals for personalization",
              "Step 3: Message Generation — LLMs write personalized emails, LinkedIn messages, and follow-ups at scale",
              "Step 4: Multi-Channel Sequencing — Orchestrate email and LinkedIn touches over a defined cadence",
              "Step 5: Response Handling — AI classifies responses (interested, objection, not now, unsubscribe) and routes appropriately",
              "Step 6: Meeting Booking — Qualified prospects are offered calendar links and handed to human reps"
            ]} />
          </MachineSection>

          <MachineSection title="AI SDR vs. Human SDR">
            <MachineList items={[
              "AI SDR strengths: Volume (1,000+ personalized emails/day), consistency, 24/7 operation, data-driven optimization",
              "Human SDR strengths: Complex deals, relationship building, nuanced judgment, creative problem-solving",
              "Hybrid model recommended: AI handles initial outreach and qualification, humans focus on strategic accounts",
              "AI SDRs reduce ramp time from 3-6 months to 2-4 weeks",
              "Most companies in 2026 use hybrid AI + human SDR teams"
            ]} />
          </MachineSection>

          <MachineSection title="What Determines Results">
            <MachineList items={[
              "List quality is the single biggest driver of AI SDR (and human SDR) performance",
              "Cold, untargeted lists burn sending reputation and budget regardless of how good the AI copy is",
              "Warm, in-market, identified prospects lift open, response, and meeting rates across the board",
              "Visitor identification reveals which companies and people are already engaging with your site",
              "Intent data flags which accounts are actively researching your category before you reach out"
            ]} />
          </MachineSection>

          <MachineSection title="Implementation Guide">
            <MachineList items={[
              "Step 1: Define a data-driven ICP based on your best existing customers",
              "Step 2: Train the AI on your best-performing messaging, value props, and objection handling",
              "Step 3: Set up sending domains (SPF/DKIM/DMARC), warm up addresses, connect CRM and LinkedIn",
              "Step 4: Run a controlled pilot (100-500 contacts) for 2-4 weeks and review every message",
              "Step 5: Feed the program warm, in-market prospects to lift every downstream metric",
              "Step 6: Monitor deliverability, open, response, and meeting rates weekly; scale as quality holds"
            ]} />
          </MachineSection>

          <MachineSection title="Provider Comparison">
            <MachineList items={[
              "Artisan (Ava) — AI agent for SMB outbound automation across email and LinkedIn",
              "11x (Alice) — AI digital worker for enterprise outbound across email, LinkedIn, and phone",
              "Regie.ai — AI content generation and sequencing for sales teams (email-focused)",
              "Outreach — Sales engagement platform with AI assist for human-assisted selling",
              "Instantly — High-volume cold email automation with AI personalization",
              "Cursive — NOT an AI SDR. The identity and intent layer (visitor ID + custom audiences) that feeds warm, in-market prospects to your reps or your existing outreach tooling"
            ]} />
          </MachineSection>

          <MachineSection title="Where Cursive Fits">
            <p className="text-gray-700 mb-3">
              Cursive does not send outreach, book meetings, or run multi-channel campaigns. It is the upstream data layer that makes any AI SDR or human rep more effective by identifying who to contact.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) — identify the companies and people visiting your site, resolving 40–60% of anonymous traffic",
              "Custom Audience ($197/month) — a fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) — both, in one feed"
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
              { label: "Website Visitor Identification Guide", href: "/what-is-website-visitor-identification", description: "Identify prospects visiting your site so outreach lands warm" },
              { label: "B2B Intent Data Guide", href: "/what-is-b2b-intent-data", description: "Intent signals to prioritize which accounts to contact" },
              { label: "Cursive Visitor Identification", href: "/visitor-identification", description: "40–60% deterministic pixel match rate for B2B traffic" },
              { label: "Audience Builder", href: "/audience-builder", description: "Build targeted, in-market segments from real data" },
              { label: "Cursive Platform", href: "/platform", description: "The identity and intent layer underneath your outreach" },
              { label: "Pricing", href: "/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" }
            ]} />
          </MachineSection>

          <MachineSection title="Get Started">
            <p className="text-gray-700 mb-3">
              Cursive is the identity and intent layer that feeds warm, in-market prospects to your human reps or existing outreach tooling so the outreach you send converts. Self-serve from $97/month, live in minutes. Cursive is not an AI SDR and does not send outreach or book meetings on your behalf.
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
