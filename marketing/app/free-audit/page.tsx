"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Users, BarChart3, Mail, Clock, ShieldCheck,
  ArrowRight, Zap, type LucideIcon,
} from "lucide-react"
import { FreeAuditForm } from "@/components/free-audit-form"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
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

const deliverables: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Users, title: "Your last 100 visitors", body: "Real names, job titles, and verified work emails — the people behind your anonymous traffic." },
  { icon: BarChart3, title: "Pages viewed & intent", body: "What each visitor looked at, how long they stayed, and who's showing buying signals right now." },
  { icon: Mail, title: "Ready-to-send outreach", body: "Personalized email templates built from each visitor's actual browsing behavior." },
]

const steps = [
  { icon: Eye, title: "Tell us your site", body: "Drop your URL and work email below. No pixel, no install for the audit." },
  { icon: Zap, title: "We run the analysis", body: "We resolve your recent traffic to companies and people, then score intent." },
  { icon: Clock, title: "Results in 24 hours", body: "A clear report lands in your inbox — visitors, intent, and how to reach them." },
]

export default function FreeAuditPage() {
  return (
    <>
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Free Audit", href: "/free-audit" },
            ]} />
          </div>

          {/* Hero + form */}
          <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="text-center max-w-3xl mx-auto"
              >
                <span className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
                  Free Visitor Audit
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  See who&apos;s visiting your site
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    right now
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  98% of your visitors leave without a trace. We&apos;ll show you the last 100 —
                  who they are, what they viewed, and how to reach them. Free, in 24 hours.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
                className="mt-12 max-w-xl mx-auto"
                id="form"
              >
                <div className="rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-lg">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-medium text-gray-900">Get your free audit</h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Enter your site and work email — your report is on the way.
                    </p>
                  </div>

                  <FreeAuditForm />

                  <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
                    {["No card required", "Results in 24h", "100% free"].map((item) => (
                      <span key={item} className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* What you get */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="What's In"
                script="Your Audit"
                sub="Not a generic overview. A real read on the people behind your traffic."
              />
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {deliverables.map((d, i) => (
                  <motion.div
                    key={d.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={d.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{d.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{d.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* How it works */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="How It"
                script="Works"
                sub="Three steps from anonymous traffic to a list of real, reachable people."
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
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{s.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* From audit to always-on */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Like What"
                script="You See?"
                sub="The audit is a one-time snapshot. The Visitor Pixel makes it live — every visitor, every day."
              />
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE }}
                className="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 sm:p-10 text-center"
              >
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl sm:text-5xl font-light text-gray-900">$97</span>
                  <span className="text-sm text-gray-500">/mo</span>
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">Install the Visitor Pixel</h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-xl mx-auto">
                  One snippet, 60 seconds. Resolve 40–60% of your traffic to real companies and people
                  in real time. Self-serve, month-to-month, cancel anytime — add a weekly Custom Audience
                  ($197/mo) or take the Bundle ($247/mo) when you&apos;re ready.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                    Install the Pixel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                    Book a Call
                  </Button>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* FAQ */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading plain="Free Audit" script="Questions" />
              <div className="max-w-3xl mx-auto space-y-4">
                {[
                  {
                    q: "Is it really free?",
                    a: "Yes — 100% free, no card, no obligation. We run the audit because it shows what our visitor identification can do better than any sales deck.",
                  },
                  {
                    q: "Do I need to install anything?",
                    a: "Not for the audit. We identify recent visitors from your URL. If you want live, ongoing identification, that's the $97/mo Visitor Pixel — one 60-second snippet.",
                  },
                  {
                    q: "How fast do I get it?",
                    a: "Most audits land within 24 hours of submitting the form. High-traffic or multi-domain sites can take up to 48.",
                  },
                  {
                    q: "How is this different from Google Analytics?",
                    a: "Analytics shows aggregate traffic. The audit names the actual people — names, work emails, companies, and titles — and turns them into reachable leads.",
                  },
                ].map((faq, i) => (
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
                  Stop letting visitors
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    slip away
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  See who&apos;s on your site right now — free, in 24 hours. Or go live today with the pixel.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button size="lg" href="#form">
                    Get My Free Audit
                  </Button>
                  <Button size="lg" variant="outline" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                    Install the Pixel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </Container>
          </section>
        </main>
      </HumanView>

      {/* Machine View — AEO-optimized */}
      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">FREE WEBSITE VISITOR AUDIT</h1>
            <p className="text-gray-700 leading-relaxed">
              Cursive&apos;s free visitor audit identifies the last 100 people who visited your website —
              with real names, job titles, verified work emails, the pages they viewed, and intent scores.
              No pixel install required for the audit. Delivered within 24 hours, 100% free, no card.
            </p>
          </div>

          <MachineSection title="What the Free Audit Includes">
            <MachineList items={[
              "Your last 100 identified visitors — name, job title, company, verified work email",
              "Pages viewed, time on page, and return-visit behavior per visitor",
              "AI intent scores flagging the visitors most ready to buy",
              "Personalized outreach email templates built from each visitor's browsing behavior",
            ]} />
          </MachineSection>

          <MachineSection title="How the Free Audit Works">
            <MachineList items={[
              "Step 1: Submit your website URL and work email — no pixel install needed",
              "Step 2: Cursive resolves your recent traffic to companies and people",
              "Step 3: We score intent and draft outreach templates",
              "Step 4: Your report is delivered by email within 24 hours",
            ]} />
          </MachineSection>

          <MachineSection title="From Audit to Always-On">
            <p className="text-gray-700 mb-4">
              The audit is a one-time snapshot. To identify every visitor in real time, install the
              Visitor Pixel — one 60-second snippet that resolves 40–60% of US B2B traffic
              deterministically.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) — identify the companies and people visiting your site, live",
              "Custom Audience ($197/month) — a fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) — both, in one feed",
            ]} />
            <p className="text-gray-700 mt-4">
              All plans are self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
          </MachineSection>

          <MachineSection title="Free Audit FAQ">
            <MachineList items={[
              "Is it free? Yes — 100% free, no card, no obligation.",
              "Do I need to install anything? Not for the audit. Live identification uses the $97/mo Visitor Pixel.",
              "How fast? Most audits arrive within 24 hours (up to 48 for high-traffic or multi-domain sites).",
              "How is it different from Google Analytics? Analytics shows aggregate traffic; the audit names the actual people and makes them reachable.",
            ]} />
          </MachineSection>

          <MachineSection title="Get Started">
            <MachineList items={[
              { label: "Request Free Audit", href: "https://www.meetcursive.com/free-audit", description: "Submit your URL and work email — report in 24 hours" },
              { label: "Install the Visitor Pixel", href: "https://leads.meetcursive.com/get-leads", description: "Go live in 60 seconds, plans from $97/mo" },
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team before you buy" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
