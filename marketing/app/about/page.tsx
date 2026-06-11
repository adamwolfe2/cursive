"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Users, ShieldCheck, Zap, Target, Gauge,
  RefreshCw, Search, Database, Sparkles, ArrowRight,
} from "lucide-react"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { GET_LEADS_URL } from "@/lib/cta"

const EASE = [0.22, 1, 0.36, 1] as const

// What we sell, framed as capabilities for the About narrative.
const capabilities = [
  {
    icon: Eye,
    title: "Identify your visitors",
    body: "The Visitor Pixel resolves 40–60% of anonymous traffic to real companies and people, deterministically, the moment they land.",
  },
  {
    icon: Search,
    title: "Surface in-market buyers",
    body: "A fresh weekly Custom Audience of people actively searching for what you sell, built to your ICP and delivered to your sheet.",
  },
  {
    icon: ShieldCheck,
    title: "Trust every record",
    body: "Every contact carries a verified work email, validated continuously through Deep Verify at roughly 20 million records a day.",
  },
]

const cycle = [
  { step: "Identify", desc: "High-intent visitors and engagement signals" },
  { step: "Enrich", desc: "Turn signals into actionable data and lookalikes" },
  { step: "Reach", desc: "Export verified contacts to your CRM or sequencer" },
  { step: "Convert", desc: "Close deals with messaging that already worked" },
  { step: "Learn", desc: "Feed every outcome back into targeting" },
]

const values = [
  {
    icon: Zap,
    title: "Speed Over Perfection",
    body: "We ship fast, test fast, and iterate fast. Your pipeline can't wait for perfect.",
  },
  {
    icon: Target,
    title: "Quality Over Quantity",
    body: "We'd rather send you a hundred perfect prospects than ten thousand garbage contacts.",
  },
  {
    icon: ShieldCheck,
    title: "Transparency Always",
    body: "Flat monthly pricing, month-to-month, cancel anytime. No hidden fees, no nonsense.",
  },
]

const culture = [
  { icon: RefreshCw, title: "Async by Default", body: "Clear docs, recorded walkthroughs, and tight briefs keep everyone aligned without constant meetings." },
  { icon: Gauge, title: "Outcome-Driven", body: "We measure ourselves by results delivered, for customers and for each other. No busywork, no vanity metrics." },
  { icon: Sparkles, title: "Always Learning", body: "The data and AI landscape moves fast. We stay at the edge and ship improvements every week." },
]

const metrics = [
  { metric: "40–60%", label: "Of anonymous visitors identified, deterministically" },
  { metric: "95%+", label: "Email deliverability across every record" },
  { metric: "30 days", label: "Full identity-graph refresh cycle via NCOA" },
  { metric: "60s", label: "To install the pixel and go live" },
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

function IconChip({ Icon }: { Icon: typeof Eye }) {
  return (
    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

export default function AboutPage() {
  return (
    <>
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "About", href: "/about" },
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
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  We got tired of bad lead data
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    so we built something better
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Cursive started because we were tired of paying for lead lists that didn&apos;t
                  convert. Outdated contacts, generic blasts, no results. So we built the data layer
                  we wished existed.
                </p>
              </motion.div>
            </Container>
          </section>

          {/* Story */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE }}
                className="max-w-2xl mx-auto space-y-6 text-lg sm:text-xl text-gray-700 leading-relaxed text-center"
              >
                <p>
                  Instead of another static database, we built two things that actually move
                  pipeline: a pixel that tells you which companies and people are on your site, and
                  a weekly audience of buyers already searching for what you sell.
                </p>
                <p>
                  Today Cursive powers pipeline for B2B teams from bootstrapped startups to
                  growth-stage companies scaling fast. Self-serve, month-to-month, live in minutes.
                </p>
              </motion.div>
            </Container>
          </section>

          {/* What We Do */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="What We"
                script="Actually Do"
                sub="No army of BDRs, no stitching together ten tools. Two products and the verified data behind them."
              />
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {capabilities.map((c, i) => (
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
              <div className="mt-10 text-center">
                <Button href={GET_LEADS_URL} target="_blank" size="lg">
                  See plans &amp; get started
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </Container>
          </section>

          {/* Philosophy — Recursive Intelligence */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="space-y-8"
                >
                  <div className="rounded-xl bg-white border border-gray-200 p-5">
                    <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-1">re·cur·sive</p>
                    <p className="text-sm text-gray-600 italic leading-relaxed">
                      /rəˈkərsiv/ — a process that calls itself, using its own output as its next input.
                    </p>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900">
                    Our philosophy
                    <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                      Recursive Intelligence
                    </span>
                  </h2>

                  <div className="space-y-4 text-base sm:text-lg text-gray-700 leading-relaxed">
                    <p>
                      We&apos;re betting on one premise:{" "}
                      <strong className="text-gray-900 font-medium">the companies that learn from their own growth data will outrun the ones that don&apos;t.</strong>
                    </p>
                    <p>
                      Most tools hand you a static database and say &ldquo;go find leads.&rdquo; That&apos;s a
                      library card. Cursive gets smarter every time you use it: every visitor identified,
                      every audience built, every deal closed feeds back into the system.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">The cycle that compounds</h3>
                    <ol className="space-y-3">
                      {cycle.map((item, i) => (
                        <motion.li
                          key={item.step}
                          initial={{ opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.06, ease: EASE }}
                          className="flex items-start gap-3"
                        >
                          <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-sm sm:text-base text-gray-700">
                            <span className="font-medium text-gray-900">{item.step}</span> — {item.desc}
                          </span>
                        </motion.li>
                      ))}
                      <li className="flex items-center gap-3 pt-1">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-sm font-medium text-primary italic">Repeat, smarter</span>
                      </li>
                    </ol>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white border border-gray-200 p-6">
                      <h4 className="text-xs font-semibold text-gray-400 tracking-widest mb-4 uppercase">Most teams</h4>
                      <ul className="space-y-3 text-sm text-gray-500">
                        <li>Buy a lead list</li>
                        <li>Blast generic emails</li>
                        <li>Wonder why nothing converts</li>
                        <li>Buy another list</li>
                        <li>Repeat, no learning</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-primary/[0.06] border border-primary/20 p-6">
                      <h4 className="text-xs font-semibold text-primary tracking-widest mb-4 uppercase">With Cursive</h4>
                      <ul className="space-y-3 text-sm text-gray-700">
                        <li>Identify who&apos;s already interested</li>
                        <li>Enrich with real-time context</li>
                        <li>Reach through channels that work</li>
                        <li>Convert with proven messaging</li>
                        <li>Compound every cycle</li>
                      </ul>
                    </div>
                  </div>

                  <figure className="rounded-2xl bg-white border border-gray-200 p-6">
                    <blockquote className="text-base sm:text-lg font-light text-gray-800 leading-relaxed">
                      &ldquo;While your competitors treat every lead like the first one they&apos;ve ever
                      gotten, Cursive treats every lead like the thousandth.{" "}
                      <em className="text-primary not-italic font-medium">Because it is.</em>&rdquo;
                    </blockquote>
                    <figcaption className="mt-3 text-sm text-gray-500">
                      Your CAC drops, your LTV rises, your growth compounds instead of plateaus.
                    </figcaption>
                  </figure>
                </motion.div>
              </div>
            </Container>
          </section>

          {/* Values */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading plain="What We" script="Stand For" />
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {values.map((v, i) => (
                  <motion.div
                    key={v.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={v.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{v.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{v.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Team & Culture */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Who"
                script="We Are"
                sub="A remote team of growth operators, data engineers, and AI builders who have lived the pain of bad lead gen, and built Cursive to end it."
              />
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {culture.map((c, i) => (
                  <motion.div
                    key={c.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-8"
                  >
                    <IconChip Icon={c.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{c.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{c.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Results */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="Results That"
                script="Speak"
                sub="What teams running on Cursive see, on average."
              />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
                {metrics.map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl bg-[#F7F9FB] border border-gray-200 p-6 text-center"
                  >
                    <div className="text-3xl sm:text-4xl font-light text-primary">{m.metric}</div>
                    <p className="mt-2 text-sm text-gray-600 leading-snug">{m.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-10 text-center">
                <Button size="lg" href="/case-studies" variant="outline">
                  View case studies
                </Button>
              </div>
            </Container>
          </section>

          <DashboardCTA
            headline="Let's Build Your"
            subheadline="Pipeline"
            description="Install the pixel in 60 seconds, or get your first audience within 24 hours. Plans from $97/mo, month-to-month."
            ctaText="Get Started"
          />
        </main>
      </HumanView>

      {/* Machine View — AEO-optimized */}
      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">ABOUT CURSIVE</h1>
            <p className="text-gray-700 leading-relaxed">
              Cursive is a self-serve identity and intent data layer for B2B teams. We identify the
              companies and people visiting your website and deliver a weekly audience of in-market
              buyers, each with a verified work email. Built by founders frustrated with static lead
              lists that never converted.
            </p>
          </div>

          <MachineSection title="Company Overview">
            <p className="text-gray-700 mb-4">
              Cursive started because we were tired of paying for lead lists that didn&apos;t convert.
              Instead of another static database, we built two products that move pipeline: the
              Visitor Pixel, which resolves 40–60% of anonymous website traffic to real companies and
              people, and Custom Audiences, a fresh weekly list of buyers actively searching for your
              product. Every record carries a verified work email.
            </p>
            <p className="text-gray-700">
              Today Cursive powers pipeline for B2B teams from bootstrapped startups to growth-stage
              companies. Self-serve, month-to-month, live in minutes.
            </p>
          </MachineSection>

          <MachineSection title="What We Sell">
            <MachineList items={[
              "Visitor Pixel ($97/month) — identify the companies and people visiting your site",
              "Custom Audience ($197/month) — a fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) — both, in one feed",
            ]} />
            <p className="text-gray-700 mt-4">
              Every plan is self-serve and month-to-month with no setup fee. Cancel anytime.
            </p>
          </MachineSection>

          <MachineSection title="Our Philosophy: Recursive Intelligence">
            <p className="text-gray-700 mb-4">
              Recursive (adjective): a process that calls itself, using its own output as its next
              input. Cursive is built on the premise that the companies that learn from their own
              growth data will outrun the ones that don&apos;t. Most tools give you a static database;
              Cursive gets smarter every time you use it. Every visitor identified and every audience
              built feeds back into the system, so targeting compounds month over month.
            </p>
            <MachineList items={[
              "Identify — High-intent visitors and engagement signals",
              "Enrich — Turn signals into actionable data and lookalikes",
              "Reach — Export verified contacts to your CRM or sequencer",
              "Convert — Close deals with messaging that already worked",
              "Learn — Feed every outcome back into targeting",
              "Repeat Smarter — Each cycle compounds on the last",
            ]} />
          </MachineSection>

          <MachineSection title="Core Values">
            <MachineList items={[
              "Speed Over Perfection: We ship fast, test fast, and iterate fast.",
              "Quality Over Quantity: A hundred perfect prospects beats ten thousand garbage contacts.",
              "Transparency Always: Flat monthly pricing, month-to-month, no hidden fees.",
            ]} />
          </MachineSection>

          <MachineSection title="Who We Are">
            <p className="text-gray-700">
              A fully remote team of growth operators, data engineers, and AI builders across the
              United States, built on three principles: async by default, outcome-driven, and always
              learning.
            </p>
          </MachineSection>

          <MachineSection title="Results">
            <MachineList items={[
              "40–60% of anonymous website visitors identified, deterministically",
              "95%+ email deliverability across every record",
              "30-day full identity-graph refresh cycle via NCOA",
              "60 seconds to install the pixel and go live",
            ]} />
          </MachineSection>

          <MachineSection title="Learn More About Cursive">
            <MachineList items={[
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" },
              { label: "Case Studies", href: "https://www.meetcursive.com/case-studies", description: "Real results from Cursive clients across SaaS, agencies, financial services, and eCommerce" },
              { label: "Platform Overview", href: "https://www.meetcursive.com/platform", description: "Explore the full Cursive platform and its capabilities" },
            ]} />
          </MachineSection>

          <MachineSection title="Contact">
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Website", href: "https://www.meetcursive.com" },
              { label: "Email", href: "mailto:hey@meetcursive.com" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
