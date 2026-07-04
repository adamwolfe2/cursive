"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { DashboardCTA } from "@/components/dashboard-cta"
import { motion } from "framer-motion"
import {
  Check, X, ArrowRight, Cpu, Linkedin, Newspaper,
  MessageSquareText, Layers, type LucideIcon,
} from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { GET_LEADS_URL, BOOKING_URL } from "@/lib/cta"

const EASE = [0.22, 1, 0.36, 1] as const

const faqs = [
  {
    question: "What does RB2B do that Cursive doesn't?",
    answer: "RB2B delivers identified visitors directly into Slack channels in real time with a clean, Slack-native UX. If your team lives in Slack and wants frictionless delivery without logging into a dashboard, that is their core strength. Cursive integrates with Slack too, but the experience is dashboard-first."
  },
  {
    question: "What does Cursive do that RB2B doesn't?",
    answer: "Cursive enriches every identified visitor with a verified work email plus LinkedIn work history, social profiles, news mentions, and tech-stack detection. RB2B delivers a name and a LinkedIn URL. Cursive delivers a complete, contactable record — and adds a weekly in-market Custom Audience built to your ICP, which RB2B has no equivalent of."
  },
  {
    question: "How does pricing compare?",
    answer: "RB2B has a free tier for up to 100 identified visitors per month and paid plans based on volume. Cursive is flat, self-serve, and month-to-month: the Visitor Pixel is $97/mo, a weekly Custom Audience is $197/mo, and the Pixel + Audience Bundle is $247/mo. Enrichment is included on every record — no per-record metering, no surprises."
  },
  {
    question: "Can I migrate from RB2B to Cursive?",
    answer: "Yes — the Cursive Visitor Pixel replaces the RB2B pixel. Installation takes under 2 minutes and covers the same identity-resolution capability, plus you immediately get a verified work email and full enrichment on every newly identified visitor."
  },
]

const comparisonRows = [
  { feature: "Website visitor identification", cursive: true, rb2b: true },
  { feature: "Slack + CRM integrations", cursive: true, rb2b: true },
  { feature: "Verified work email on every record", cursive: true, rb2b: false },
  { feature: "LinkedIn profile enrichment", cursive: true, rb2b: false },
  { feature: "Social profile data", cursive: true, rb2b: false },
  { feature: "Tech stack detection", cursive: true, rb2b: false },
  { feature: "News & press mention tracking", cursive: true, rb2b: false },
  { feature: "Weekly in-market Custom Audience", cursive: true, rb2b: false },
  { feature: "Flat self-serve pricing", cursive: true, rb2b: false },
]

const layers: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Cpu,
    title: "Tech stack + email quality",
    body: "Runs automatically on every identified visitor. Know what software they already pay for, and whether the work email is deliverable, before you write a word.",
  },
  {
    icon: Linkedin,
    title: "LinkedIn + social + news",
    body: "Full LinkedIn work history, social profiles, and recent press mentions — every result a natural conversation hook you would not have had otherwise.",
  },
  {
    icon: Newspaper,
    title: "News & press signals",
    body: "Recent news and press mentions tied to each person and their company — natural conversation hooks RB2B's name-and-LinkedIn-URL output can't give you.",
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

export default function CursiveVsRb2bPage() {
  return (
    <main>
      <StructuredData data={generateFAQSchema({ faqs })} />

      <HumanView>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Cursive vs RB2B", href: "/cursive-vs-rb2b" },
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
                Comparison
              </span>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                Cursive vs. RB2B
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                  identification vs. enrichment
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                RB2B tells you who was on your site. Cursive tells you who was on your site — then gives
                you a verified work email and a full profile on each one, so you can actually reach them.
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

        {/* Comparison Table */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Feature"
              script="Comparison"
              sub="The capabilities that matter, side by side. RB2B starts the conversation. Cursive makes every record contactable."
            />
            <div className="max-w-4xl mx-auto">
              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#F7F9FB]">
                      <th className="p-4 text-left font-medium text-gray-900">Feature</th>
                      <th className="p-4 text-center font-medium text-primary w-32">Cursive</th>
                      <th className="p-4 text-center font-medium text-gray-500 w-32">RB2B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, index) => (
                      <tr key={row.feature} className="border-b border-gray-100 last:border-0">
                        <td className="p-4 font-medium text-gray-800">{row.feature}</td>
                        <td className="p-4 text-center">
                          {row.cursive ? (
                            <Check className="w-5 h-5 text-primary inline" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 inline" />
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {row.rb2b ? (
                            <Check className="w-5 h-5 text-primary inline" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 inline" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Container>
        </section>

        {/* The Enrichment Layer */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="The Enrichment Layer,"
              script="explained"
              sub="RB2B delivers a name, title, company, and LinkedIn URL — and that is the end of the product. Cursive enriches the same identification event with a verified work email and a full profile on every record. Included on every plan."
            />
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {layers.map((layer, i) => (
                <motion.div
                  key={layer.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={layer.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{layer.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{layer.body}</p>
                </motion.div>
              ))}
            </div>

            {/* Custom Audience */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mt-10 max-w-5xl mx-auto rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
            >
              <IconChip Icon={MessageSquareText} />
              <h3 className="mt-5 text-lg font-medium text-gray-900">The weekly in-market Custom Audience</h3>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Visitor identification only covers people who already found your site. Cursive adds a
                fresh weekly list of in-market buyers matched to your ICP — verified work email and
                full enrichment on every record, delivered to Google Sheets. RB2B has no equivalent:
                it only reports on traffic you already have.
              </p>
            </motion.div>
          </Container>
        </section>

        {/* Pricing snapshot */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Simple, Flat"
              script="Pricing"
              sub="Self-serve, month-to-month, cancel anytime. Verified work email and full enrichment included on every plan."
            />
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { name: "Visitor Pixel", price: "$97", desc: "Identify the companies and people visiting your site, with a verified work email and full enrichment on every lead." },
                { name: "Custom Audience", price: "$197", desc: "A fresh weekly list of in-market buyers built to your ICP, delivered to Google Sheets." },
                { name: "Pixel + Audience Bundle", price: "$247", desc: "Site traffic and in-market intent in one feed. Best value vs. buying separately." },
              ].map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={Layers} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-light text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{plan.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                See plans &amp; get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading plain="Frequently Asked" script="Questions" />
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, i) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 p-6 sm:p-7"
                >
                  <h3 className="text-base font-medium text-gray-900">{faq.question}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Related */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading plain="Keep" script="Exploring" />
            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {[
                { title: "How the Visitor Pixel works", href: "/visitor-identification" },
                { title: "Full RB2B alternative guide", href: "/blog/rb2b-alternative" },
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

        <DashboardCTA
          headline="Move Beyond"
          subheadline="identification"
          description="Install the Visitor Pixel in under 2 minutes and get a verified work email plus full enrichment on every visitor automatically. Plans from $97/mo, month-to-month."
          ctaText="Get Started"
        />
      </HumanView>

      <MachineView>
        <MachineContent>
          <h2 className="text-2xl font-semibold mb-4">Cursive vs. RB2B: Visitor Identification vs. Enrichment (2026)</h2>

          <p className="text-gray-700 mb-6">
            RB2B identifies website visitors and delivers their name and LinkedIn URL to Slack. Cursive identifies the same visitors and enriches every record with a verified work email plus LinkedIn history, social profiles, tech stack, and news mentions — and adds a weekly in-market Custom Audience matched to your ICP. Enrichment is included on every plan. This page compares the two tools.
          </p>

          <MachineSection title="Feature Comparison">
            <MachineList items={[
              "Website visitor identification: Cursive YES, RB2B YES",
              "Slack + CRM integrations: Cursive YES, RB2B YES",
              "Verified work email on every record: Cursive YES, RB2B NO",
              "LinkedIn profile enrichment: Cursive YES, RB2B NO",
              "Social profile data: Cursive YES, RB2B NO",
              "Tech stack detection: Cursive YES, RB2B NO",
              "News & press mention tracking: Cursive YES, RB2B NO",
              "Weekly in-market Custom Audience: Cursive YES, RB2B NO",
              "Flat self-serve pricing: Cursive YES, RB2B NO",
            ]} />
          </MachineSection>

          <MachineSection title="Cursive Enrichment Layer (included on every plan)">
            <MachineList items={[
              "Verified work email on every identified record",
              "Tech stack + email deliverability: runs automatically on every identified visitor",
              "LinkedIn work history + social profiles + recent news mentions",
            ]} />
          </MachineSection>

          <MachineSection title="Key Differentiators">
            <MachineList items={[
              "RB2B delivers a name and LinkedIn URL to Slack. Cursive delivers a verified work email plus full enrichment on every identified record.",
              "RB2B only reports on traffic you already have. Cursive adds a weekly in-market Custom Audience matched to your ICP, delivered to Google Sheets.",
              "Both integrate with Slack and CRMs; Cursive pricing is flat, self-serve, and month-to-month.",
              "Cursive Visitor Pixel replaces the RB2B pixel. Installation takes under 2 minutes.",
            ]} />
          </MachineSection>

          <MachineSection title="Pricing">
            <MachineList items={[
              "RB2B: Free tier up to 100 identified visitors/month. Paid plans based on volume.",
              "Cursive Visitor Pixel ($97/month): identify the companies and people visiting your site, verified work email and full enrichment included.",
              "Cursive Custom Audience ($197/month): a fresh weekly list of in-market buyers, delivered to Google Sheets.",
              "Cursive Pixel + Audience Bundle ($247/month): both, in one feed. Self-serve, month-to-month, cancel anytime.",
            ]} />
          </MachineSection>

          <MachineSection title="Related Pages">
            <MachineList items={[
              { label: "Visitor Pixel Installation", href: "/visitor-identification", description: "Replaces RB2B pixel in under 2 minutes" },
              { label: "RB2B Alternative", href: "/blog/rb2b-alternative", description: "Full guide to switching from RB2B" },
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" },
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
