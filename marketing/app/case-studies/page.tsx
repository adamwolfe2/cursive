"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { motion } from "framer-motion"
import {
  TrendingUp, Shield, Target, ShoppingCart, ArrowRight,
  Eye, Users, type LucideIcon,
} from "lucide-react"
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
    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

type Study = {
  icon: LucideIcon
  industry: string
  product: "Custom Audience" | "Visitor Pixel" | "Pixel + Audience"
  metric: string
  result: string
  summary: string
  stats: Array<{ value: string; label: string }>
}

const studies: Study[] = [
  {
    icon: TrendingUp,
    industry: "AI SaaS Company",
    product: "Custom Audience",
    metric: "40x",
    result: "$11M revenue in 30 days",
    summary:
      "A weekly Custom Audience of agencies actively searching for AI tooling, built to a tight ICP and synced to ads — $11M from a single quarter's spend.",
    stats: [
      { value: "40x", label: "Return on investment" },
      { value: "$11M", label: "Revenue in 30 days" },
      { value: "50%", label: "Lift in lead quality" },
    ],
  },
  {
    icon: Shield,
    industry: "Insurtech App",
    product: "Custom Audience",
    metric: "5x",
    result: "Cost-per-click cut 5x",
    summary:
      "An in-market audience of people researching specialty auto coverage replaced broad targeting — cheaper clicks and 1,200+ qualified leads in 90 days.",
    stats: [
      { value: "5x", label: "Lower cost per click" },
      { value: "2.24%", label: "Click-through rate" },
      { value: "1,200+", label: "Qualified leads / 90d" },
    ],
  },
  {
    icon: Target,
    industry: "Medical Technology",
    product: "Custom Audience",
    metric: "$24M",
    result: "$24M pipeline in 3 days",
    summary:
      "A Custom Audience filtered to medical professionals searching for diagnostic equipment surfaced 600+ buyers from a 60K pool — built and delivered in 3 days.",
    stats: [
      { value: "$24M", label: "Pipeline value" },
      { value: "600+", label: "Qualified leads" },
      { value: "3 days", label: "Setup to results" },
    ],
  },
  {
    icon: ShoppingCart,
    industry: "E-Commerce Brand",
    product: "Visitor Pixel",
    metric: "60%",
    result: "$200K in 90 days",
    summary:
      "The Visitor Pixel resolved 60% of anonymous traffic — 20 points above their old tool — feeding reactivation emails that won 500 new customers.",
    stats: [
      { value: "$200K+", label: "Added revenue / 90d" },
      { value: "80%", label: "Email open rate" },
      { value: "500", label: "New customers" },
    ],
  },
]

const aggregate: Array<{ value: string; label: string }> = [
  { value: "40x", label: "Best-in-class ROI from a targeted audience" },
  { value: "3 days", label: "Fastest setup-to-pipeline turnaround" },
  { value: "60%", label: "Pixel match rate on anonymous traffic" },
  { value: "5x", label: "Average cost-per-click improvement" },
]

export default function CaseStudiesPage() {
  return (
    <main className="overflow-hidden">
      <HumanView>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Case Studies", href: "/case-studies" },
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
                Customer Results
              </span>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                Real pipeline from
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                  real companies
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                What B2B teams ship when they run on Cursive&apos;s Visitor Pixel and Custom Audiences.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                  Get Results Like These
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                  Book a Call
                </Button>
              </div>
            </motion.div>
          </Container>
        </section>

        {/* Result cards — scannable */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Results at"
              script="a Glance"
              sub="One metric per customer. Full stories below."
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {studies.map((s, i) => (
                <motion.a
                  key={s.industry}
                  href={`#${s.industry.toLowerCase().replace(/\s+/g, "-")}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={s.icon} />
                  <div className="mt-5 text-3xl sm:text-4xl font-light text-primary">{s.metric}</div>
                  <p className="mt-1 text-sm font-medium text-gray-900">{s.result}</p>
                  <p className="mt-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">{s.industry}</p>
                </motion.a>
              ))}
            </div>
          </Container>
        </section>

        {/* Full case studies — alternating */}
        {studies.map((s, idx) => {
          const dark = idx % 2 === 1
          return (
            <section
              key={s.industry}
              id={s.industry.toLowerCase().replace(/\s+/g, "-")}
              className={`py-20 sm:py-24 scroll-mt-24 ${dark ? "bg-[#F7F9FB]" : "bg-white"}`}
            >
              <Container>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <IconChip Icon={s.icon} />
                    <span className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                      {s.industry}
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-light text-gray-900">{s.result}</h2>
                  <p className="mt-4 text-lg text-gray-600 leading-relaxed">{s.summary}</p>

                  <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-6">
                    {s.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className={`rounded-2xl p-5 sm:p-6 text-center border ${
                          dark ? "bg-white border-gray-200" : "bg-[#F7F9FB] border-gray-200"
                        }`}
                      >
                        <div className="text-2xl sm:text-3xl font-light text-primary">{stat.value}</div>
                        <p className="mt-1.5 text-xs sm:text-sm text-gray-600 leading-snug">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
                    {s.product === "Visitor Pixel" ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <Users className="w-4 h-4 text-primary" />
                    )}
                    Powered by Cursive {s.product}
                  </div>
                </motion.div>
              </Container>
            </section>
          )
        })}

        {/* Aggregate */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Why Teams"
              script="Choose Cursive"
              sub="Across industries: sharper targeting, better leads, stronger ROI."
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
              {aggregate.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                  className="rounded-2xl bg-[#F7F9FB] border border-gray-200 p-6 text-center"
                >
                  <div className="text-3xl sm:text-4xl font-light text-primary">{m.value}</div>
                  <p className="mt-2 text-sm text-gray-600 leading-snug">{m.label}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" href="/pricing" variant="outline">
                View Pricing
              </Button>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <DashboardCTA
          headline="Want Results"
          subheadline="Like These?"
          description="Install the pixel in 60 seconds, or get your first audience within 24 hours. Plans from $97/mo, month-to-month."
          ctaText="Get Started"
        />
      </HumanView>

      {/* Machine View — AEO-optimized */}
      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">CURSIVE CASE STUDIES — CUSTOMER RESULTS &amp; METRICS</h1>
            <p className="text-gray-700 leading-relaxed">
              Real results from B2B teams running on Cursive&apos;s two products: the Visitor Pixel
              ($97/mo), which identifies anonymous website visitors, and Custom Audiences ($197/mo),
              a weekly list of in-market buyers. Four case studies across AI SaaS, Insurtech, Medical
              Technology, and E-Commerce.
            </p>
          </div>

          <MachineSection title="Results Summary">
            <MachineList items={[
              "AI SaaS Company (Custom Audience): 40x ROI, $11M revenue in 30 days, 50% lift in lead quality",
              "Insurtech App (Custom Audience): 5x lower cost per click, 2.24% CTR, 1,200+ qualified leads in 90 days",
              "Medical Technology (Custom Audience): $24M pipeline, 600+ qualified leads from a 60K pool, results in 3 days",
              "E-Commerce Brand (Visitor Pixel): $200K+ added revenue in 90 days, 60% match rate, 80% email open rate, 500 new customers",
            ]} />
          </MachineSection>

          <MachineSection title="Case Study 1: AI SaaS Company — 40x ROI">
            <p className="text-gray-700 mb-3">
              Challenge: An AI SaaS company needed to reach agencies with both the intent to adopt AI
              tooling and the budget for annual subscriptions — hard to isolate with broad targeting.
            </p>
            <p className="text-gray-700 mb-3">
              Solution: A Cursive Custom Audience of agencies above a revenue threshold, cross-referenced
              with in-market signals for AI tooling, refreshed weekly and synced to their ad platforms.
            </p>
            <p className="text-gray-700 mb-3">
              Results: $11M revenue in 30 days (40x return), with a 50% lift in lead quality.
            </p>
            <MachineList items={[
              "Custom Audience built to a precise ICP (company size, revenue, intent)",
              "Fresh weekly audience kept targeting current",
              "50% improvement in lead quality",
              "40x return on investment",
            ]} />
          </MachineSection>

          <MachineSection title="Case Study 2: Insurtech App — 5x Lower CPC">
            <p className="text-gray-700 mb-3">
              Challenge: A consumer Insurtech app needed to reach a niche specialty-auto audience at the
              lowest cost, ideally while prospects were actively researching insurance.
            </p>
            <p className="text-gray-700 mb-3">
              Solution: A Cursive Custom Audience of people searching insurance keywords, refined with
              demographic parameters and delivered to their ad platforms each week.
            </p>
            <p className="text-gray-700 mb-3">
              Results: 5x lower cost per click, 2.24% CTR, 1,200+ qualified leads in 90 days.
            </p>
            <MachineList items={[
              "In-market audience for a niche segment",
              "5x cost-per-click reduction",
              "2.24% click-through rate",
              "1,200+ qualified leads in 90 days",
            ]} />
          </MachineSection>

          <MachineSection title="Case Study 3: Medical Technology — $24M Pipeline">
            <p className="text-gray-700 mb-3">
              Challenge: A medical device company selling $40K+ equipment struggled to reach medical
              professionals using specific diagnostic testing equipment.
            </p>
            <p className="text-gray-700 mb-3">
              Solution: A Cursive Custom Audience using competitor and keyword inputs identified profiles
              searching for diagnostic equipment within 24 hours, filtered to medical professionals only.
            </p>
            <p className="text-gray-700 mb-3">
              Results: 600+ qualified leads from a 60,000 pool in 3 days, $24M in pipeline.
            </p>
            <MachineList items={[
              "Custom Audience for a niche B2B segment",
              "3-day setup to results",
              "600+ qualified leads from a 60K pool",
              "$24M pipeline value",
            ]} />
          </MachineSection>

          <MachineSection title="Case Study 4: E-Commerce — $200K in 90 Days">
            <p className="text-gray-700 mb-3">
              Challenge: An e-commerce brand had low match rates with their existing identity tool,
              leaving revenue on the table.
            </p>
            <p className="text-gray-700 mb-3">
              Solution: The Cursive Visitor Pixel resolved 60% of anonymous traffic — 20 points above
              their prior tool — and enrolled identified visitors in reactivation email sequences.
            </p>
            <p className="text-gray-700 mb-3">
              Results: 80% email open rate, 500 new customers at a $280 average order value, $200K+ in
              added revenue in 90 days.
            </p>
            <MachineList items={[
              "60% Visitor Pixel match rate",
              "80% email open rate",
              "500 new customers acquired",
              "$200K+ added revenue in 90 days",
            ]} />
          </MachineSection>

          <MachineSection title="Aggregate Performance Metrics">
            <MachineList items={[
              "Up to 40x ROI from a targeted Custom Audience",
              "Results in as few as 3 days from setup",
              "60% Visitor Pixel match rate on anonymous traffic",
              "Average 5x cost-per-click improvement",
            ]} />
          </MachineSection>

          <MachineSection title="Cursive Products Used">
            <MachineList items={[
              { label: "Visitor Pixel", href: "https://www.meetcursive.com/visitor-identification", description: "Identify the companies and people visiting your site — $97/mo" },
              { label: "Custom Audience", href: "https://www.meetcursive.com/pricing", description: "A fresh weekly list of in-market buyers built to your ICP — $197/mo" },
              { label: "Pixel + Audience Bundle", href: "https://www.meetcursive.com/pricing", description: "Both products in one feed — $247/mo" },
            ]} />
          </MachineSection>

          <MachineSection title="Get Started">
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team before you buy" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
