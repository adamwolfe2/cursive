"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Database, Clock, Users, Globe, ShieldCheck,
  Zap, Cpu, ArrowRight, Check, CheckCircle2,
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
    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

// How the Super Pixel resolves a visitor — self-serve, no install team.
const engine = [
  { icon: Zap, title: "Drop the snippet", desc: "One lightweight tag. 60 seconds, any platform. No code changes." },
  { icon: Eye, title: "Resolve in real time", desc: "Each visitor matched to a real person against the identity graph the moment they land." },
  { icon: ArrowRight, title: "Sync everywhere", desc: "Verified records flow into your portal, CRM, and sequences automatically." },
]

// Why the match holds up — the tech behind the Visitor Pixel.
const tech: Array<{ icon: LucideIcon; title: string; tag: string; body: string }> = [
  { icon: Database, title: "We own the source", tag: "Proprietary identity graph", body: "Built from primary providers, not rented third-party lists. Fresher in, fresher out." },
  { icon: Globe, title: "Universal match", tag: "UID2 infrastructure", body: "Built on UID2, the one identifier shared across US sites. Others guess — we match." },
  { icon: Clock, title: "Never goes stale", tag: "30-day NCOA refresh", body: "12–15% of people move yearly. Monthly address verification keeps every record reachable." },
  { icon: Users, title: "Offline-rooted", tag: "280M+ verified profiles", body: "Sourced from offline partners like TransUnion and Experian — verified records, not cookie guesses." },
  { icon: Cpu, title: "Real-time delivery", tag: "50K records/sec", body: "Visitors resolve in seconds, so contacts land in your stack minutes after the visit." },
  { icon: ShieldCheck, title: "Clean by design", tag: "0.05% bounce rate", body: "Direct-from-source data keeps deliverability high and your sender reputation intact." },
]

const stats = [
  { number: "40–60%", label: "Deterministic match rate" },
  { number: "280M+", label: "Verified profiles" },
  { number: "0.05%", label: "Email bounce rate" },
  { number: "30 days", label: "NCOA refresh cycle" },
]

// Standard pixels vs the Super Pixel — lean, no "managed" framing.
const compare: Array<{ cap: string; standard: string; cursive: string }> = [
  { cap: "Match rate", standard: "Cookie 2–5% / IP 10–15%", cursive: "40–60% deterministic" },
  { cap: "Email bounce", standard: "~20%", cursive: "0.05%" },
  { cap: "Data freshness", standard: "Quarterly", cursive: "30-day NCOA" },
  { cap: "Delivery", standard: "Batch (24h)", cursive: "Under 30 seconds" },
  { cap: "Intent scoring", standard: "None", cursive: "High / Med / Low" },
]

const faqs = [
  {
    q: "What does the Super Pixel actually do?",
    a: "It identifies the real people visiting your site who never fill out a form — name, verified work email, company, and an intent score — synced straight to your portal and CRM.",
  },
  {
    q: "How is it different from other pixels?",
    a: "Most pixels claim high match rates but deliver contacts that bounce. Our data comes direct from primary sources and is verified monthly, so the bounce rate is 0.05% versus an industry 20%+. RB2B only catches LinkedIn users; we identify the actual person.",
  },
  {
    q: "How fast is it live?",
    a: "Drop the snippet and you are live in about 60 seconds. Most sites see their first identified visitors the same day.",
  },
  {
    q: "Is it privacy compliant?",
    a: "Yes. We honor opt-outs, use hashed identifiers, and comply with GDPR, CCPA, and regional rules out of the box. Every record carries DNC suppression flags.",
  },
  {
    q: "What does it cost?",
    a: "The Visitor Pixel is $97/mo, self-serve and month-to-month. Add a weekly Custom Audience for $197/mo, or get both in the Bundle for $247/mo. Cancel anytime.",
  },
]

const SAMPLE = [
  { label: "Name", value: "James Sullivan" },
  { label: "Title", value: "VP of Sales" },
  { label: "Company", value: "Meridian Technology Group" },
  { label: "Verified email", value: "j.sullivan@meridiantech.com" },
  { label: "Page visited", value: "/pricing" },
  { label: "Intent", value: "High — 7-day spike" },
]

export function SuperPixelView() {
  return (
    <>
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Super Pixel", href: "/superpixel" },
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
                  Super Pixel V4 · Visitor Pixel engine
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Identify the 97% who leave
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    without buying
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  The Super Pixel matches 40–60% of your anonymous traffic to real people —
                  deterministically, the moment they land. It is the engine behind the Visitor Pixel plan.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                    Get the Pixel — $97/mo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                    Book a Call
                  </Button>
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-600">
                  {["60-second setup", "40–60% match rate", "0.05% bounce rate"].map((item) => (
                    <span key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </Container>
          </section>

          {/* How the engine works — stepper */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="How the Engine"
                script="Works"
                sub="From anonymous visitor to verified contact in three steps. Self-serve, start to finish."
              />
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {engine.map((s, i) => (
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

          {/* Sample record + stats */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <div className="grid lg:grid-cols-2 gap-10 max-w-5xl mx-auto items-center">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <h2 className="text-3xl sm:text-4xl font-light text-gray-900">
                    What you get
                    <span className="block font-cursive text-4xl sm:text-5xl text-gray-500 mt-1">
                      per visitor
                    </span>
                  </h2>
                  <p className="mt-5 text-gray-600 leading-relaxed">
                    A verified, enriched record for every match — no form, no waiting. Here is one,
                    the way it lands in your portal.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 max-w-md">
                    {stats.map((s) => (
                      <div key={s.label}>
                        <div className="text-2xl sm:text-3xl font-light text-primary">{s.number}</div>
                        <div className="text-xs text-gray-500 leading-snug">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
                  className="rounded-2xl border border-gray-200 overflow-hidden shadow-lg"
                >
                  <div className="bg-primary px-6 py-4 flex items-center justify-between">
                    <span className="text-white font-semibold text-sm uppercase tracking-wide">New Lead Identified</span>
                    <span className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
                      </span>
                      Score 94
                    </span>
                  </div>
                  <div className="p-6 space-y-3 bg-white">
                    {SAMPLE.map((row) => (
                      <div key={row.label} className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 w-28 flex-shrink-0">{row.label}</span>
                        <span className="text-sm text-gray-900 font-medium flex-1">{row.value}</span>
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </Container>
          </section>

          {/* The technology — varied 6-card grid with tags */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="The Technology"
                script="Behind the Match"
                sub="Cheap data bounces, wastes budget, and burns sender reputation. Ours comes from the source."
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {tech.map((t, i) => (
                  <motion.div
                    key={t.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={t.icon} />
                    <p className="mt-5 text-[11px] font-semibold tracking-widest text-primary uppercase">{t.tag}</p>
                    <h3 className="mt-1 text-lg font-medium text-gray-900">{t.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{t.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Standard vs Super Pixel — compact comparison */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading plain="Standard Pixel vs" script="Super Pixel" />
              <div className="max-w-3xl mx-auto rounded-2xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-3 bg-[#F7F9FB] border-b border-gray-200 text-xs font-semibold uppercase tracking-wide">
                  <span className="py-4 px-4 text-gray-600">Capability</span>
                  <span className="py-4 px-4 text-center text-gray-400">Standard</span>
                  <span className="py-4 px-4 text-center text-primary">Super Pixel</span>
                </div>
                {compare.map((row, i) => (
                  <motion.div
                    key={row.cap}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                    className="grid grid-cols-3 border-b border-gray-100 last:border-0 text-sm items-center"
                  >
                    <span className="py-3.5 px-4 text-gray-700">{row.cap}</span>
                    <span className="py-3.5 px-4 text-center text-gray-400">{row.standard}</span>
                    <span className="py-3.5 px-4 text-center text-primary font-semibold">{row.cursive}</span>
                  </motion.div>
                ))}
              </div>
              <p className="mt-6 text-center text-sm text-gray-500">
                Same traffic, 20–30× more identified contacts — every one a real, contactable person.
              </p>
            </Container>
          </section>

          {/* Plan callout — single, honest, $97 */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE }}
                className="max-w-xl mx-auto rounded-2xl border border-primary bg-white p-8 sm:p-10 text-center shadow-lg ring-1 ring-primary/20"
              >
                <IconChip Icon={Eye} />
                <div className="mt-5 flex items-baseline justify-center gap-1">
                  <span className="text-4xl sm:text-5xl font-light text-gray-900">$97</span>
                  <span className="text-sm text-gray-500">/mo</span>
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Visitor Pixel</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  The full Super Pixel engine. Self-serve, month-to-month, cancel anytime.
                </p>
                <ul className="mt-6 space-y-2.5 text-left max-w-xs mx-auto">
                  {[
                    "40–60% deterministic match rate",
                    "Verified work email on every match",
                    "Intent scoring + page-level signals",
                    "Synced to your portal and CRM",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer" className="w-full mt-8">
                  Get the Pixel
                </Button>
                <p className="mt-4 text-xs text-gray-500">
                  Want in-market buyers too? Add a Custom Audience for $197/mo, or get the Bundle for $247/mo.
                </p>
              </motion.div>
            </Container>
          </section>

          {/* FAQ */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading plain="Questions?" script="Answered" />
              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, i) => (
                  <motion.div
                    key={faq.q}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 p-6 sm:p-7"
                  >
                    <h3 className="text-base font-medium text-gray-900">{faq.q}</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          <DashboardCTA
            headline="See Who's"
            subheadline="on your site"
            description="Drop the Super Pixel in 60 seconds and start resolving 40–60% of your anonymous traffic to real people. $97/mo, month-to-month."
            ctaText="Get Started"
          />
        </main>
      </HumanView>

      {/* Machine View — AEO-optimized */}
      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE SUPER PIXEL (V4)</h1>
            <p className="text-gray-700 leading-relaxed">
              The Super Pixel is the visitor-identification engine behind the Cursive Visitor Pixel
              plan ($97/month). It matches 40–60% of anonymous website visitors deterministically
              against an offline-rooted identity graph of 280M+ verified profiles, refreshed every 30
              days against NCOA. Self-serve, live in about 60 seconds, with a 0.05% email bounce rate.
            </p>
          </div>

          <MachineSection title="Key Metrics">
            <MachineList items={[
              "40–60% - Deterministic pixel match rate on US traffic (not modeled)",
              "60–80% - Accuracy on a matched record",
              "2–5% - Industry cookie-sync match rate (for context)",
              "10–15% - Industry IP-database match rate (for context)",
              "280M+ - Verified profiles, refreshed every 30 days against NCOA",
              "0.05% - Email bounce rate (industry average is 20%+)",
              "50,000 records/second - Real-time processing throughput",
              "60 seconds - To install the pixel and go live",
            ]} />
          </MachineSection>

          <MachineSection title="How the Super Pixel Works">
            <MachineList items={[
              "Step 1: Drop the lightweight tracking snippet on your site (60 seconds, no code changes)",
              "Step 2: Visitors browse your website",
              "Step 3: The Super Pixel resolves each visitor to a real person in real time",
              "Step 4: Verified, intent-scored records sync to your portal and CRM automatically",
            ]} />
          </MachineSection>

          <MachineSection title="What You Get Per Visitor">
            <MachineList items={[
              "Full name and verified work email",
              "Job title, seniority, and company",
              "Page-level browsing behavior and intent score (High / Medium / Low)",
              "DNC suppression flags for compliance",
            ]} />
          </MachineSection>

          <MachineSection title="The Technology">
            <MachineList items={[
              "Proprietary identity graph licensed direct from primary providers (fresher, lower decay)",
              "UID2 integration — the universal identifier shared across US websites",
              "30-day NCOA refresh keeps every record reachable as people move",
              "Offline-rooted from partners like TransUnion and Experian — verified, not cookie-modeled",
              "50,000 records/second real-time delivery",
            ]} />
          </MachineSection>

          <MachineSection title="Standard Pixel vs Super Pixel">
            <MachineList items={[
              "Match rate: cookie 2–5% / IP 10–15% vs 40–60% deterministic",
              "Email bounce: ~20% vs 0.05%",
              "Data freshness: quarterly vs 30-day NCOA",
              "Delivery: batch (24h) vs under 30 seconds",
              "Intent scoring: none vs High / Medium / Low",
            ]} />
          </MachineSection>

          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) - The Super Pixel engine: identify the people visiting your site",
              "Custom Audience ($197/month) - A fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) - Both, in one feed",
            ]} />
          </MachineSection>

          <MachineSection title="Privacy & Compliance">
            <p className="text-gray-700">
              Fully compliant with GDPR, CCPA, and regional privacy regulations. We honor opt-outs,
              store only hashed identifiers, and include DNC suppression flags on every record.
            </p>
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
