"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  ArrowRight, CheckCircle2, Shield, Database, Globe, Clock, Users, TrendingUp,
  ChevronDown, ChevronUp, Zap, BarChart3, Layers, X
} from "lucide-react"
import { DashboardCTA } from "@/components/dashboard-cta"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"

const CAL_LINK = "https://cal.com/cursive/30min"

const faqs = [
  {
    question: "How is this different from other pixel tools claiming 60–80% match rates?",
    answer: "Match rate claims are misleading without context. A 60% claimed match rate typically yields ~15% usable contacts after data decay. Our geo-framed, NCOA-verified methodology means the matches we deliver are real, verified contacts — not bulk IP grabs padded to inflate numbers.",
  },
  {
    question: "Where does your data come from?",
    answer: "We go straight to the source — licensing directly from primary data providers and maintaining our own proprietary identity graph. Our data is refreshed via NCOA every 30 days and email-verified at 10–15M records per day.",
  },
  {
    question: "What's the bounce rate on your emails?",
    answer: "0.05% — verified against millions of records. Industry average for low-quality, diluted data is 20%+. The difference is sourcing.",
  },
  {
    question: "Can I run the Super Pixel alongside my existing pixel?",
    answer: "Yes. The Super Pixel runs alongside other pixels simultaneously on the same site with no conflicts.",
  },
  {
    question: "How do I get leads into my CRM?",
    answer: "Via persistent API, native workflow integrations (GoHighLevel, Klaviyo), or custom HTTP endpoints. We have templates and a walkthrough covering every scenario.",
  },
  {
    question: "What if my leads don't convert immediately?",
    answer: "Intent level matters. Medium-intent leads require a nurture-first approach — run DSP exposure before calling. High-intent leads are ready for direct outreach. We'll help you match your approach to the intent level.",
  },
]

const superPixelFeatures = [
  "Super Pixel installation & setup",
  "Verified business email on every match",
  "Verified mobile number on every match",
  "Company name, industry & description",
  "Intent score (Low / Medium / High)",
  "Page visited + timestamp",
  "Access to Cursive Studio (segment building)",
  "GoHighLevel, Klaviyo, Make integrations",
  "Persistent API delivery",
  "Dedicated onboarding support",
  "Run alongside existing pixels",
  "Cancel anytime, no contracts",
]

export default function SuperPixelPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showLeadModal, setShowLeadModal] = useState(false)

  return (
    <>
      <HumanView>
        <main className="overflow-hidden">

          {/* ── HERO ─────────────────────────────────────────────── */}
          <section className="relative py-24 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center max-w-4xl mx-auto"
              >
                {/* Exclusive launch badge */}
                <div className="inline-flex items-center gap-2 bg-[#007AFF]/8 border border-[#007AFF]/20 text-[#007AFF] text-sm font-medium px-4 py-2 rounded-full mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007AFF] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007AFF]" />
                  </span>
                  Introducing the Cursive Super Pixel — Our Most Advanced Model Yet
                </div>

                <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
                  97% of Your Visitors Leave
                  <span className="block font-cursive text-6xl lg:text-7xl text-gray-500 mt-2">
                    Without a Name.
                  </span>
                </h1>

                <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
                  The Super Pixel is the only visitor identification engine built on a{" "}
                  <strong className="text-gray-900 font-semibold">proprietary identity graph sourced directly from primary providers</strong>.
                  It delivers verified leads with name, email, mobile, company, and intent score within minutes of every visit.
                </p>
                <p className="text-base text-gray-500 mb-8 max-w-2xl mx-auto">
                  No other tool has this. Book a call and see it running live on your website.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" href={CAL_LINK} target="_blank">
                    See It Running on My Website
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button size="lg" variant="outline" href="#how-it-works">
                    How It Works
                  </Button>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
                  {[
                    "Identifies 70% of US Web Visitors",
                    "0.05% Email Bounce Rate",
                    "420M+ Verified Contacts",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Container>
          </section>

          {/* ── INTERACTIVE DEMO: SAMPLE LEAD CARD ──────────────── */}
          <section className="py-24 bg-[#F7F9FB]">
            <Container>
              <div className="text-center mb-14">
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
                  See It In Action
                </span>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  This Is What You Receive
                  <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                    For Every Visitor
                  </span>
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  A real enriched lead record delivered to your CRM, inbox, or platform within minutes of a visit.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
                {/* Sample Lead Card — click to expand */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  onClick={() => setShowLeadModal(true)}
                  className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-2xl transition-shadow duration-300 group"
                >
                  <div className="bg-[#007AFF] px-6 py-4 flex items-center justify-between">
                    <span className="text-white font-semibold text-sm uppercase tracking-wide">
                      Sample Lead Record
                    </span>
                    {/* Live Visitor badge — pulsing green gradient */}
                    <span className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-400 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      Live Visitor
                    </span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">James Sullivan</p>
                      <p className="text-gray-500 text-sm mt-0.5">VP of Sales · Meridian Technology Group</p>
                    </div>
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      {[
                        { label: "Email", value: "j.sullivan@meridiantech.com" },
                        { label: "Mobile", value: "+1 (512) 847-2391" },
                        { label: "Company", value: "Meridian Technology Group" },
                        { label: "Page Visited", value: "/pricing" },
                        { label: "Visit Time", value: "Today at 2:14 PM CST" },
                        { label: "Intent Score", value: "High — 7-day spike detected" },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 w-28 flex-shrink-0">{row.label}</span>
                          <span className="text-sm text-gray-900 font-medium flex-1">{row.value}</span>
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 pb-5 flex items-center justify-between">
                    <p className="text-xs text-gray-400">* Sample record — actual fields vary by match quality</p>
                    <span className="text-xs text-[#007AFF] font-medium group-hover:underline">View full record →</span>
                  </div>
                </motion.div>

                {/* 5-Step Pipeline */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <h3 className="font-medium text-gray-900 text-xl mb-6">
                    From Anonymous Visitor to Contactable Lead in 5 Steps
                  </h3>
                  <div className="space-y-0">
                    {[
                      { label: "Visitor lands on your site", detail: "Pixel fires instantly — no delay, no lag" },
                      { label: "Identity resolution begins", detail: "UID2 + IP geo-framing + device matching" },
                      { label: "NCOA verification", detail: "Freshness confirmed against 30-day refresh cycle" },
                      { label: "Intent scoring applied", detail: "60B+ daily signals — 7-day behavioral baseline checked" },
                      { label: "Lead delivered to your stack", detail: "To your CRM, inbox, dialer, or API — in real time" },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-9 h-9 rounded-full bg-[#007AFF] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                            {i + 1}
                          </div>
                          {i < 4 && <div className="w-px h-8 bg-blue-200 my-1" />}
                        </div>
                        <div className="pb-5">
                          <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                          <p className="text-gray-500 text-sm mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button href={CAL_LINK} target="_blank" className="mt-2">
                    See It Running on Your Website
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </Container>
          </section>

          {/* ── WHAT YOU GET ─────────────────────────────────────── */}
          <section className="py-24 bg-white">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Everything in Every Lead Record
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Not just a name. A complete, verified, intent-scored profile — delivered automatically.
                </p>
              </div>
              <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10 border border-gray-200 shadow-lg">
                <div className="text-center mb-8">
                  <div className="text-sm text-[#007AFF] font-medium mb-3 uppercase tracking-wide">Cursive Super Pixel</div>
                  <div className="text-lg text-gray-600 mb-1">Starting at</div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-light text-[#007AFF]">$1,000</span>
                    <span className="text-xl text-gray-500">/mo</span>
                  </div>
                  <div className="text-gray-600 mt-2">Flat pricing. No per-visitor fees. No contracts.</div>
                </div>
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Everything included:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {superPixelFeatures.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <Button size="lg" className="w-full" href={CAL_LINK} target="_blank">
                    Book Your Free Demo Call
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <p className="text-xs text-gray-500 mt-3">No setup fees. Cancel anytime.</p>
                </div>
              </div>
            </Container>
          </section>

          {/* ── WHY SUPER PIXEL: DIFFERENTIATORS ────────────────── */}
          <section className="py-24 bg-[#F7F9FB]">
            <Container>
              <div className="text-center mb-16">
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
                  The Technology
                </span>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Cheap Data Costs More.
                  <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                    Ours Comes From the Source.
                  </span>
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Diluted data that&apos;s passed through multiple hands bounces, wastes budget, and erodes your sender reputation. We go straight to the source — and own the infrastructure to prove it.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {[
                  {
                    icon: Shield,
                    title: "Proprietary Identity Graph",
                    desc: "We built and own our identity graph outright — sourced from the same primary providers others can't access directly. No competitor can replicate this overnight.",
                  },
                  {
                    icon: Database,
                    title: "Primary Source Licensing",
                    desc: "We license directly from primary data providers. Data that passes through multiple hands decays — ours doesn't. That's why our bounce rate is 0.05% while the industry sits at 20%+.",
                  },
                  {
                    icon: Globe,
                    title: "UID2 Integration",
                    desc: "The only universal identifier dispersed across every website in the United States. Competitors without UID2 simply don't have the infrastructure.",
                  },
                  {
                    icon: Clock,
                    title: "NCOA Refreshed Every 30 Days",
                    desc: "12–15% of the US population moves annually. We verify addresses monthly so your data never goes stale.",
                  },
                  {
                    icon: Users,
                    title: "98% US Household Coverage",
                    desc: "7 billion historic hashed emails tied to UID2 and cookies. 98% of US households observed.",
                  },
                  {
                    icon: TrendingUp,
                    title: "50,000 Records/Second",
                    desc: "Stateless worker architecture. Your data flows don't time out, bottleneck, or fall behind.",
                  },
                ].map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all flex gap-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <card.icon className="w-6 h-6 text-[#007AFF]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">{card.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-10">
                <p className="text-gray-500 italic text-lg max-w-2xl mx-auto">
                  This is not a static dataset you buy once and hope for the best. Data is a living, breathing thing — and we treat it that way.
                </p>
              </div>
            </Container>
          </section>

          {/* ── HOW IT WORKS ─────────────────────────────────────── */}
          <section id="how-it-works" className="py-24 bg-white">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  We Handle Everything
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Book a call, we set everything up. First leads typically arrive within 24–48 hours.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                {[
                  {
                    step: "1",
                    title: "Book Demo Call",
                    desc: "15-minute call to understand your website, goals, and CRM. We scope the installation and answer every question.",
                    icon: Layers,
                  },
                  {
                    step: "2",
                    title: "We Install & Configure",
                    desc: "Our team installs the Super Pixel, configures CRM sync, sets up bot/internal traffic filters, and connects your chosen integrations.",
                    icon: Zap,
                  },
                  {
                    step: "3",
                    title: "Leads Start Flowing",
                    desc: "Within 24–48 hours you'll see verified, enriched, intent-scored visitor records in your dashboard and CRM — automatically.",
                    icon: BarChart3,
                  },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="relative"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-6">
                        <step.icon className="h-10 w-10 text-gray-700" />
                      </div>
                      <div className="text-sm text-[#007AFF] font-medium mb-2">Step {step.step}</div>
                      <h3 className="text-2xl text-gray-900 mb-3 font-medium">{step.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* ── STATS ────────────────────────────────────────────── */}
          <section className="py-24 bg-[#F7F9FB]">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Predictable Costs,
                  <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                    Unlimited Upside
                  </span>
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Flat monthly pricing means your cost stays the same no matter how much traffic you get.
                </p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-5xl mx-auto bg-white rounded-2xl p-8 shadow-xl border border-gray-200"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { number: "98%", label: "US Households Covered" },
                    { number: "60B+", label: "Daily Intent Signals" },
                    { number: "0.05%", label: "Email Bounce Rate" },
                    { number: "70%", label: "Average ID Rate" },
                    { number: "30 days", label: "NCOA Refresh Cycle" },
                    { number: "10–15M", label: "Daily Email Verifications" },
                    { number: "50,000", label: "Records Per Second" },
                    { number: "7B", label: "Historic Hashed Emails" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#F7F9FB] rounded-xl p-5 text-center">
                      <div className="text-3xl font-light text-[#007AFF] mb-1">{stat.number}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="border-l-4 border-[#007AFF] bg-blue-50 rounded-r-xl p-5">
                  <p className="text-gray-800 text-sm">
                    <span className="font-semibold">What competitors don't tell you:</span> A claimed 60% match rate
                    typically yields only ~15% usable contacts after data decay. Our geo-framed, NCOA-verified methodology
                    means every match we deliver is a real, contactable person.
                  </p>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* ── INTENT DATA ──────────────────────────────────────── */}
          <section className="py-24 bg-white">
            <Container>
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
                    Intent Intelligence
                  </span>
                  <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                    Not All Intent Is Created Equal
                  </h2>
                  <p className="text-lg text-gray-600">
                    Most intent models are built on the same 3–4 core feeds. The difference isn't the feed — it's the model.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <div className="bg-[#F7F9FB] border border-gray-200 rounded-xl p-6">
                    <div className="inline-block bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
                      Not Intent
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      Someone reads a Yahoo Finance article about a lawyer who got sued for tax fraud.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="inline-block bg-green-200 text-green-800 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
                      True Intent
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      Someone posts on a forum: &ldquo;Who is the best personal injury lawyer in Texas? I need to hire someone.&rdquo;
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto mb-8">
                  <table className="w-full text-sm border-collapse bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    <thead>
                      <tr className="bg-[#F7F9FB] border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Intent Level</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">What It Means</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Best Approach</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium">🔴 High</td>
                        <td className="py-3 px-4 text-gray-600">Actively searching, ready to buy</td>
                        <td className="py-3 px-4 text-gray-600">Direct outreach, close-focused script</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium">🟡 Medium</td>
                        <td className="py-3 px-4 text-gray-600">In research phase, comparing options</td>
                        <td className="py-3 px-4 text-gray-600">Nurture first — run DSP before calling</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium">🟢 Low</td>
                        <td className="py-3 px-4 text-gray-600">Early awareness, passive interest</td>
                        <td className="py-3 px-4 text-gray-600">Brand awareness, retargeting</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <p className="text-amber-800 text-sm">
                    <span className="font-semibold">Pro tip:</span> If you&apos;re getting medium-intent leads and going straight
                    for the close, they&apos;ll hang up. Match your script to the intent level.
                  </p>
                </div>
              </div>
            </Container>
          </section>

          {/* ── FAQ ──────────────────────────────────────────────── */}
          <section className="py-24 bg-[#F7F9FB]">
            <Container>
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                    Frequently Asked Questions
                  </h2>
                </div>
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <button
                        className="w-full flex items-center justify-between px-6 py-5 text-left"
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      >
                        <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                        {openFaq === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                      {openFaq === index && (
                        <div className="px-6 pb-5">
                          <p className="text-gray-600 leading-relaxed text-sm">{faq.answer}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </Container>
          </section>

          {/* ── FINAL CTA ────────────────────────────────────────── */}
          <section className="py-24 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto"
              >
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
                  Ready to Stop Losing
                  <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                    Your Website Traffic?
                  </span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Every day your Super Pixel isn&apos;t installed, verified leads are leaving your website and going to your competitors.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                  <Button size="lg" href={CAL_LINK} target="_blank">
                    Book Your Free Demo Call
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button size="lg" variant="outline" href="/pixel">
                    See the Standard Pixel
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-gray-500 text-sm">
                  No commitment. No pressure. Just a live demonstration of what the Cursive Super Pixel can do for your business.
                </p>
              </motion.div>
            </Container>
          </section>

          {/* Dashboard CTA */}
          <DashboardCTA
            headline="Install the Super Pixel."
            subheadline="Start getting leads."
            description="Book a call and we'll set up the Super Pixel on your website within 48 hours. Start seeing verified, enriched, intent-scored visitors flowing into your CRM automatically."
            ctaText="Book Your Free Demo Call"
            ctaUrl={CAL_LINK}
          />

          {/* ── LEAD RECORD MODAL ───────────────────────────────── */}
          {showLeadModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowLeadModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-full max-w-lg"
              >
                {/* Modal header */}
                <div className="bg-[#007AFF] px-6 py-4 flex items-center justify-between">
                  <div>
                    <span className="text-white font-semibold text-sm uppercase tracking-wide block">
                      New Lead Identified
                    </span>
                    <span className="text-blue-200 text-xs">Cursive Super Pixel</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-400 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      Live Visitor
                    </span>
                    <button
                      onClick={() => setShowLeadModal(false)}
                      className="text-white/70 hover:text-white transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal body */}
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">James Sullivan</p>
                    <p className="text-gray-500 text-sm mt-0.5">VP of Sales · Meridian Technology Group</p>
                  </div>
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    {[
                      { label: "Email", value: "j.sullivan@meridiantech.com" },
                      { label: "Mobile", value: "+1 (512) 847-2391" },
                      { label: "Company", value: "Meridian Technology Group" },
                      { label: "Job Title", value: "VP of Sales" },
                      { label: "Location", value: "Austin, TX" },
                      { label: "Company Size", value: "51–200 employees" },
                      { label: "Industry", value: "B2B SaaS / Technology" },
                      { label: "LinkedIn", value: "linkedin.com/in/james-sullivan" },
                      { label: "Page Visited", value: "/pricing" },
                      { label: "Visit Time", value: "Today at 2:14 PM CST" },
                      { label: "Intent Score", value: "High — 7-day spike detected" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 w-28 flex-shrink-0">{row.label}</span>
                        <span className="text-sm text-gray-900 font-medium flex-1">{row.value}</span>
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal footer */}
                <div className="px-6 pb-6">
                  <p className="text-xs text-gray-400 mb-4 text-center">* Sample record — actual fields vary by match quality</p>
                  <div className="flex gap-3">
                    <Button size="sm" className="flex-1" href={CAL_LINK} target="_blank">
                      Get These Leads
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowLeadModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

        </main>
      </HumanView>

      {/* ── MACHINE VIEW (AEO) ───────────────────────────────── */}
      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold mb-4">Cursive Super Pixel — Visitor Identification & Lead Generation</h1>
            <p className="text-gray-700 leading-relaxed">
              The Cursive Super Pixel identifies anonymous website visitors and delivers enriched, verified lead records — including name, verified email, mobile number, company, and intent score — in real time. Built on a proprietary identity graph with direct data licensing, NCOA refresh every 30 days, and UID2 integration. Starting at $1,000/month flat. Setup in 24–48 hours.
            </p>
          </div>

          <MachineSection title="What the Super Pixel Delivers">
            <MachineList items={[
              "First and last name of the identified visitor",
              "Verified business email (0.05% bounce rate)",
              "Verified mobile phone number",
              "Company name, industry, and description",
              "Intent score: Low, Medium, or High",
              "Page visited and timestamp",
              "7-day behavioral baseline intent analysis",
            ]} />
          </MachineSection>

          <MachineSection title="Technology Differentiators">
            <MachineList items={[
              "Proprietary identity graph sourced directly from primary providers",
              "Direct licensing with primary data providers",
              "UID2 integration — the only universal identifier across US websites",
              "NCOA address verification refreshed every 30 days",
              "98% US household coverage — 7 billion historic hashed emails",
              "10–15M email verifications per day",
              "50,000 records per second (stateless worker architecture)",
              "60 billion daily intent signals across 250,000+ domains",
            ]} />
          </MachineSection>

          <MachineSection title="Pricing and Setup">
            <MachineList items={[
              "Starting at $1,000/month flat — no per-visitor or per-lead fees",
              "No setup fees. No long-term contracts. Cancel anytime.",
              "Setup completed within 24–48 hours of booking call",
              "Runs alongside existing V3 pixel with no conflicts",
              "Integrates with GoHighLevel, Klaviyo, Salesforce, HubSpot, Make, Zapier, n8n",
              "Persistent API delivery to any platform",
            ]} />
          </MachineSection>

          <MachineSection title="Intent Scoring">
            <MachineList items={[
              "High intent: actively searching, ready to buy — use direct outreach",
              "Medium intent: research phase — nurture first, then call",
              "Low intent: early awareness — brand awareness and retargeting",
              "Model trained on hard negatives and real campaign feedback",
              "7-day behavioral baseline per profile — surfaces genuine intent spikes only",
            ]} />
          </MachineSection>

          <MachineSection title="Get Started">
            <MachineList items={[
              { label: "Book Free Demo Call", href: "https://cal.com/cursive/30min", description: "See the Super Pixel running on your website live." },
              { label: "See the Standard Pixel", href: "https://www.meetcursive.com/pixel", description: "Done-for-you pixel setup at $1,000/month." },
              { label: "View All Services", href: "https://www.meetcursive.com/services", description: "Full-stack AI SDR and lead generation services." },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
