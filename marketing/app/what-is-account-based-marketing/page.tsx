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
  Target, Users, Layers, Workflow, BarChart3, ListChecks,
  Crosshair, Network, FileText, Megaphone, Database, Eye,
  AlertTriangle, ArrowRight, type LucideIcon,
} from "lucide-react"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { GET_LEADS_URL, BOOKING_URL } from "@/lib/cta"

const EASE = [0.22, 1, 0.36, 1] as const

const faqs = [
  {
    question: "What is account-based marketing (ABM)?",
    answer: "Account-based marketing is a strategic B2B marketing approach that concentrates resources on a defined set of target accounts. Instead of casting a wide net to generate leads, ABM identifies high-value accounts first, then creates personalized campaigns tailored to each account's specific needs, buying committee, and stage in the purchasing process. ABM aligns marketing and sales teams around shared account-level goals."
  },
  {
    question: "How is ABM different from traditional lead generation?",
    answer: "Traditional lead generation uses broad campaigns to attract as many leads as possible, then qualifies them after capture. ABM flips this by identifying and qualifying target accounts first, then creating tailored campaigns to engage them. ABM focuses on account-level metrics like engagement score and pipeline generated rather than lead volume. It typically produces higher win rates (40-50% higher) and larger deal sizes but requires more upfront research and personalization."
  },
  {
    question: "What are the three types of ABM?",
    answer: "The three types are Strategic ABM (one-to-one) for your top 10-50 accounts with fully customized campaigns, ABM Lite (one-to-few) for clusters of 50-500 accounts that share similar characteristics receiving semi-personalized campaigns, and Programmatic ABM (one-to-many) for 500+ accounts using technology to deliver personalized experiences at scale. Most mature programs use all three tiers simultaneously."
  },
  {
    question: "What technology do I need for ABM?",
    answer: "A modern ABM tech stack includes four core layers: identification and intent data (a platform like Cursive that identifies the accounts visiting your site and delivers in-market audiences), orchestration (for coordinating multi-channel campaigns), engagement tools (email, LinkedIn, display ads), and measurement (CRM and attribution platforms). You do not need every tool to start -- begin with identification and intent data, then add orchestration and channels as your program matures."
  },
  {
    question: "How do you measure ABM success?",
    answer: "ABM success is measured with account-level metrics rather than lead-level metrics. Key metrics include account engagement score (measuring buying committee activity), pipeline generated from target accounts, deal velocity (time from first touch to closed-won), win rate on ABM accounts versus non-ABM, average deal size, and expansion revenue from existing ABM accounts. Leading programs track a composite ABM index that weighs these metrics based on business priorities."
  },
  {
    question: "How long does it take for ABM to show results?",
    answer: "ABM is a long-term strategy. Most programs see initial engagement improvements within 30-60 days, pipeline impact within 90-180 days, and measurable revenue impact within 6-12 months. Strategic one-to-one ABM targeting enterprise accounts with long sales cycles may take 12-18 months to show full revenue impact. The key is setting realistic expectations and tracking leading indicators like account engagement and pipeline creation early in the program."
  },
  {
    question: "What are the most common ABM mistakes?",
    answer: "The five most common ABM mistakes are targeting too many accounts (spreading resources too thin), not aligning sales and marketing on account selection and engagement strategy, using generic messaging instead of account-specific personalization, ignoring the full buying committee and focusing only on one contact, and measuring ABM with traditional lead generation metrics instead of account-level KPIs. Starting small with 25-50 accounts and expanding based on results avoids most of these pitfalls."
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

const howItWorks: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Crosshair,
    title: "Identify target accounts",
    body: "Start from your ICP and the total addressable market, filtering by firmographic fit, technographic signals, and intent. The best programs pair historical win analysis with the accounts already showing buying interest.",
  },
  {
    icon: Network,
    title: "Map buying committees",
    body: "B2B purchases involve 6-10 decision makers, per Gartner. Map the economic buyer, technical evaluator, champion, influencer, and blocker at each account — with verified contacts where available.",
  },
  {
    icon: FileText,
    title: "Develop personalized content",
    body: "Speak to each account's specific challenges, industry context, and competitive situation. Personalization depth scales by tier: fully custom for strategic accounts, dynamic templates for programmatic.",
  },
  {
    icon: Workflow,
    title: "Orchestrate multi-channel campaigns",
    body: "Coordinate messaging across every channel the committee uses — email, LinkedIn, display, web personalization, and sales calls — so each touch builds on the last instead of landing in isolation.",
  },
  {
    icon: BarChart3,
    title: "Measure account-level metrics",
    body: "Track engagement scores, pipeline from target accounts, deal velocity, win rate, and average contract value — judging marketing on revenue contribution, not activity volume.",
  },
]

const abmTypes: Array<{ icon: LucideIcon; title: string; range: string; body: string }> = [
  {
    icon: Target,
    title: "Strategic ABM (1:1)",
    range: "10–50 accounts",
    body: "Your top accounts get fully customized campaigns — a dedicated account plan, bespoke content, and executive engagement. Reserved for $100K+ ACV opportunities, it consistently delivers 2–5x higher win rates than untargeted outreach.",
  },
  {
    icon: Users,
    title: "ABM Lite (1:Few)",
    range: "50–500 accounts",
    body: "Cluster accounts by industry, size, or challenge, then run semi-personalized campaigns per cluster with dynamic account-level details. Delivers 70–80% of strategic ABM's impact at a fraction of the cost.",
  },
  {
    icon: Layers,
    title: "Programmatic ABM (1:Many)",
    range: "500+ accounts",
    body: "Use technology to personalize at scale across hundreds or thousands of accounts. Lighter per-account personalization, dramatically greater reach — ideal for mid-market motions where one-to-one isn't justified.",
  },
]

const framework: Array<{ title: string; body: string }> = [
  {
    title: "ICP definition",
    body: "Analyze your top 20-30 customers to define firmographic, technographic, buying-process, and outcome attributes. The ICP should be specific enough to disqualify non-fit accounts while broad enough to sustain pipeline.",
  },
  {
    title: "Account selection",
    body: "Score the addressable market against ICP criteria, then layer in intent signals to find accounts actively in-market. Prioritize strong fit combined with active buying signals.",
  },
  {
    title: "Intelligence gathering",
    body: "For each account, research org structure, strategic priorities, competitive landscape, and recent events — plus which pages and topics they're already researching on your site.",
  },
  {
    title: "Content creation",
    body: "Build a content matrix that maps assets to buying stages and committee roles: thought leadership for the full committee, technical depth for evaluators, ROI analyses for economic buyers.",
  },
  {
    title: "Channel orchestration",
    body: "Create a surround-sound effect across channels — display for awareness, then personalized email, LinkedIn, and SDR outreach — sequenced to the persona's preferences and engagement history.",
  },
  {
    title: "Sales enablement",
    body: "Equip sales with account briefs, tailored talk tracks, warm-intro pathways, and real-time alerts when a target account spikes in engagement or hits a high-intent page like pricing.",
  },
  {
    title: "Measurement and optimization",
    body: "Track reach, engagement depth, pipeline progression, and revenue impact at the account level — then continuously refine selection, messaging, and channel mix.",
  },
]

const channels: Array<{ channel: string; bestFor: string; effectiveness: string }> = [
  { channel: "Email", bestFor: "Nurture sequences, content delivery", effectiveness: "High" },
  { channel: "LinkedIn", bestFor: "Executive engagement, social selling", effectiveness: "Very High" },
  { channel: "Display Ads", bestFor: "Awareness, air cover for outbound", effectiveness: "Medium" },
  { channel: "Website Personalization", bestFor: "Conversion for known accounts", effectiveness: "High" },
  { channel: "Events / Webinars", bestFor: "Relationship building, thought leadership", effectiveness: "High" },
  { channel: "Phone / Video", bestFor: "Sales conversations, demos", effectiveness: "Very High" },
]

const scoring: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Database,
    title: "Firmographic fit",
    body: "Score how closely an account matches your ICP on industry, revenue, employee count, geography, and growth — weighted by correlation with your closed-won deals.",
  },
  {
    icon: Layers,
    title: "Technographic signals",
    body: "What tools and technologies a company uses reveals both fit and readiness — current stack, infrastructure maturity, and recent technology change signals.",
  },
  {
    icon: Target,
    title: "Intent data",
    body: "First-party (site visits, content engagement) and third-party (research across the web) signals flag active buying cycles. High-intent accounts are 2-3x more likely to convert.",
  },
  {
    icon: BarChart3,
    title: "Engagement scoring",
    body: "Score every committee interaction into a composite that decays over time, so a burst three months ago doesn't permanently elevate an account that has gone quiet.",
  },
  {
    icon: ListChecks,
    title: "Predictive models",
    body: "ML models trained on win/loss history combine the signals above with relationship proximity and look-alike modeling to flag accounts manual analysis might miss.",
  },
]

const contentTypes = [
  { title: "Account-specific research", body: "Custom analysis of the account's market position and strategic opportunities. Highest-impact, reserved for strategic targets." },
  { title: "Industry insights", body: "Thought leadership tailored to the account's vertical — trends, challenges, and benchmarks relevant to their context." },
  { title: "Competitive battlecards", body: "Content that directly addresses the alternatives an account is evaluating, with honest comparisons and clear positioning." },
  { title: "ROI calculators", body: "Interactive tools that estimate business impact using the account's actual metrics — revenue, team size, conversion rates." },
  { title: "Executive briefs", body: "One-to-two-page summaries for C-suite consumption, focused on strategic outcomes over technical features." },
  { title: "Custom demos", body: "Pre-configured demonstrations using the account's branding or use cases to make value immediately tangible." },
]

const techStack: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Eye,
    title: "Identification & intent",
    body: "The foundational layer reveals who's visiting your site and which accounts are in-market. Cursive sits here — its Visitor Pixel resolves anonymous traffic to the companies and people on your site, while Custom Audiences deliver a fresh weekly list of in-market buyers built to your ICP.",
  },
  {
    icon: Workflow,
    title: "Orchestration",
    body: "Orchestration platforms coordinate multi-channel campaigns — managing targeting, timing, and sequencing. Cursive feeds this layer with named accounts and audiences you can activate across email and ads.",
  },
  {
    icon: Megaphone,
    title: "Engagement",
    body: "Engagement tools execute the actual touches — email automation, LinkedIn Sales Navigator, and conversational marketing. The most effective programs use 4-6 channels in coordinated sequences.",
  },
  {
    icon: Database,
    title: "CRM",
    body: "The CRM is the system of record for account data and pipeline. Salesforce and HubSpot dominate; every identification, engagement, and intent signal should flow in to give sales a complete view.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body: "ABM analytics attribute revenue to account-level campaigns using multi-touch models that credit the full committee — something traditional lead-based analytics can't support.",
  },
]

const implementation: Array<{ title: string; body: string }> = [
  {
    title: "Define your ICP (weeks 1-2)",
    body: "Analyze your top 20-30 customers by revenue, retention, and time to close. Document the attributes that define best-fit accounts and validate the ICP with both marketing and sales leadership.",
  },
  {
    title: "Build your account list (weeks 2-3)",
    body: "Start small — 25-50 accounts scored against your ICP and prioritized by intent. Cursive's Custom Audiences surface accounts that match your ICP and are actively researching relevant topics.",
  },
  {
    title: "Set up your tech stack (weeks 3-4)",
    body: "A minimum viable stack is an identification and intent platform (Cursive's Visitor Pixel), a CRM, and an email tool. Install the pixel, then wire identified accounts into your sales workflow.",
  },
  {
    title: "Create content (weeks 4-6)",
    body: "Build a library for each buying stage: an industry thought-leadership piece, a competitive comparison, a relevant case study, and a personalized email sequence. Custom for strategic, templated for programmatic.",
  },
  {
    title: "Launch campaigns (weeks 6-8)",
    body: "Run a coordinated multi-channel campaign at your pilot accounts — display for awareness, then email to the committee, then LinkedIn from sales. Monitor engagement in real time and adjust.",
  },
  {
    title: "Measure and optimize (ongoing)",
    body: "At 30 days review engagement, at 90 days assess pipeline impact, and at 6 months measure revenue attribution and ABM ROI. Use results to justify expanding the program.",
  },
]

const mistakes: Array<{ title: string; body: string }> = [
  {
    title: "Targeting too many accounts",
    body: "If you're hitting 5,000 accounts with the same generic content, that's demand gen with an account list — not ABM. Start with 25-50 and invest deeply. Expand only after you've proven the model.",
  },
  {
    title: "Not aligning sales and marketing",
    body: "ABM requires both teams to operate as one. Establish shared account plans, joint KPIs, regular pipeline reviews, and clear handoff protocols around account selection and qualification.",
  },
  {
    title: "Generic messaging",
    body: "If your emails could be sent to any company in your market without changes, they aren't personalized. Reference the account's industry context, specific challenges, and competitive dynamics.",
  },
  {
    title: "Ignoring buying committees",
    body: "Targeting one contact leaves you exposed to politics and role changes. Map all 6-10 stakeholders and tailor messaging to each role — technical for evaluators, ROI for buyers, validation for champions.",
  },
  {
    title: "Wrong metrics",
    body: "Measuring ABM on MQL volume rewards quantity over account quality. Use account-centric metrics: engagement scores, pipeline from target accounts, deal velocity, and revenue attribution.",
  },
]

const providerRows: Array<{ name: string; id: string; intent: string; contract: string; highlight?: boolean }> = [
  { name: "Cursive", id: "Individual + company", intent: "Visitor Pixel + Custom Audience", contract: "From $97/mo", highlight: true },
  { name: "Demandbase", id: "Company-level", intent: "Bombora partnership", contract: "$50K-$250K/yr" },
  { name: "6sense", id: "Company-level", intent: "Proprietary AI model", contract: "$60K-$300K/yr" },
  { name: "Terminus", id: "Company-level", intent: "Bombora partnership", contract: "$30K-$150K/yr" },
  { name: "RollWorks", id: "Company-level", intent: "Bombora partnership", contract: "$15K-$75K/yr" },
]

const relatedResources = [
  { title: "What is Website Visitor Identification?", href: "/what-is-website-visitor-identification", desc: "How visitor ID powers the account-intelligence layer of ABM." },
  { title: "What is B2B Intent Data?", href: "/what-is-b2b-intent-data", desc: "Understanding intent signals for ABM account selection and prioritization." },
  { title: "Cursive Visitor Identification", href: "/visitor-identification", desc: "Identify which target accounts are visiting your website." },
  { title: "Audience Builder", href: "/audience-builder", desc: "Build in-market audiences from firmographic and intent filters." },
  { title: "Cursive Platform", href: "/platform", desc: "The identity and intent data layer behind modern ABM programs." },
  { title: "Pricing", href: "/pricing", desc: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo." },
]

export default function WhatIsAccountBasedMarketing() {
  return (
    <main className="overflow-hidden">
      <OrganizationSchema />
      <ArticleSchema
        title="What is Account-Based Marketing (ABM)? Complete Guide (2026)"
        description="A comprehensive guide to account-based marketing covering ABM types, frameworks, technology stacks, channel strategies, measurement, implementation, and common mistakes for B2B revenue teams."
        publishedAt="2026-01-15"
      />
      <StructuredData data={generateFAQSchema({ faqs })} />

      <HumanView>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Resources", href: "/resources" },
              { name: "What is Account-Based Marketing?", href: "/what-is-account-based-marketing" },
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
                What is account-based
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                  marketing (ABM)?
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                <strong className="text-gray-900 font-medium">Account-Based Marketing (ABM)</strong> focuses
                your resources on a defined set of target accounts, using personalized campaigns across
                multiple channels to engage specific buying committees — a shift from volume-based lead
                generation to precision-targeted account engagement.
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
                ABM has moved from an emerging tactic to a core B2B strategy. According to ITSMA, 87% of B2B
                marketers report that ABM delivers higher ROI than any other approach, and 91% of companies
                using ABM report larger average deal sizes. It works by aligning marketing and sales around
                shared revenue goals. Platforms like{" "}
                <Link href="/platform" className="text-primary hover:underline font-medium">Cursive</Link>{" "}
                provide the identification and{" "}
                <Link href="/what-is-b2b-intent-data" className="text-primary hover:underline font-medium">intent data foundation</Link>{" "}
                modern ABM programs require.
              </p>
            </motion.div>
          </Container>
        </section>

        {/* How ABM Works */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="How ABM"
              script="Works"
              sub="ABM inverts the funnel: identify the accounts you want to win, then work backward to the campaigns, content, and experiences that engage them."
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

        {/* ABM vs Traditional */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="ABM vs."
              script="Traditional Marketing"
              sub="The fundamental difference is directionality. Traditional marketing casts a wide net and filters down; ABM selects targets and builds up."
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
                      <th className="px-4 py-3 font-medium">Dimension</th>
                      <th className="px-4 py-3 font-medium">Traditional Marketing</th>
                      <th className="px-4 py-3 font-medium">Account-Based Marketing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ["Targeting", "Broad segments, persona-based", "Named accounts, committee-focused"],
                      ["Key metrics", "MQLs, lead volume, cost per lead", "Engagement, pipeline, deal velocity"],
                      ["Content", "Scaled for broad appeal", "Personalized per account / industry"],
                      ["Sales alignment", "Handoff model", "Collaborative, shared account plans"],
                      ["Budget", "Spread across channels", "Concentrated on target accounts"],
                      ["Typical win rate", "10–15%", "25–40%"],
                      ["Average deal size", "Market average", "30–50% larger"],
                    ].map((row) => (
                      <tr key={row[0]} className="text-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900">{row[0]}</td>
                        <td className="px-4 py-3 text-gray-500">{row[1]}</td>
                        <td className="px-4 py-3 text-primary font-medium">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </Container>
        </section>

        {/* Types of ABM */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Three Types"
              script="of ABM"
              sub="ABM isn't one-size-fits-all. The most successful programs run all three tiers at once, allocating the deepest personalization to the highest-value accounts."
            />
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {abmTypes.map((t, i) => (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <IconChip Icon={t.icon} />
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {t.range}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{t.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{t.body}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* The ABM Framework */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="The ABM"
              script="Framework"
              sub="Seven interconnected stages, from defining your ideal customer profile through ongoing measurement. Skipping steps typically leads to underperformance."
            />
            <div className="max-w-3xl mx-auto space-y-4">
              {framework.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                  className="flex gap-5 rounded-2xl border border-gray-200 p-6 sm:p-7"
                >
                  <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-gray-900 capitalize">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{step.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Key ABM Channels */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Key ABM"
              script="Channels"
              sub="ABM is inherently multi-channel. The most effective programs use several channels in coordinated sequences."
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
                      <th className="px-4 py-3 font-medium">Channel</th>
                      <th className="px-4 py-3 font-medium">Best For</th>
                      <th className="px-4 py-3 font-medium">ABM Effectiveness</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {channels.map((c) => (
                      <tr key={c.channel} className="text-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.channel}</td>
                        <td className="px-4 py-3 text-gray-500">{c.bestFor}</td>
                        <td className="px-4 py-3 text-primary font-medium">{c.effectiveness}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </Container>
        </section>

        {/* Account Selection & Scoring */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Account Selection"
              script="and Scoring"
              sub="Selecting the wrong accounts wastes resources and demoralizes sales. A robust model combines five categories of signals to rank and prioritize."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {scoring.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={s.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{s.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{s.body}</p>
                </motion.div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Surface the highest-priority accounts with Cursive's{" "}
              <Link href="/audience-builder" className="text-primary hover:underline">audience builder</Link>{" "}
              and prioritize the hottest{" "}
              <Link href="/what-is-b2b-intent-data" className="text-primary hover:underline">intent signals</Link> first.
            </p>
          </Container>
        </section>

        {/* Content Strategy */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Content Strategy"
              script="for ABM"
              sub="ABM content must be relevant at three levels — the industry, the company, and the individual. Generic content fails because target accounts expect messaging that understands their situation."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {contentTypes.map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-base font-medium text-gray-900">{c.title}</h3>
                  <p className="mt-2.5 text-sm text-gray-600 leading-relaxed">{c.body}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* ABM Technology Stack */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="ABM Technology"
              script="Stack"
              sub="Five layers, each serving a distinct function. The right combination depends on your ABM maturity, budget, and existing investments."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {techStack.map((t, i) => (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={t.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{t.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{t.body}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Measuring ABM Success */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Measuring ABM"
              script="Success"
              sub="Traditional marketing metrics are insufficient for ABM. Account-based programs require account-level metrics that track target accounts through the buying journey."
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
                      <th className="px-4 py-3 font-medium">Metric</th>
                      <th className="px-4 py-3 font-medium">Definition</th>
                      <th className="px-4 py-3 font-medium">ABM</th>
                      <th className="px-4 py-3 font-medium">Non-ABM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ["Account engagement", "Contacts engaged per account", "3–5 per account", "1–2 per account"],
                      ["Pipeline generated", "Pipeline from target accounts", "3–5x of target", "2–3x of target"],
                      ["Deal velocity", "Days from creation to close", "20–30% faster", "Industry baseline"],
                      ["Win rate", "Opportunities that close", "25–40%", "10–15%"],
                      ["Average deal size", "Mean ACV of sourced deals", "30–50% larger", "Baseline average"],
                      ["Expansion revenue", "Upsell from ABM accounts", "120–140% NRR", "100–110% NRR"],
                    ].map((row) => (
                      <tr key={row[0]} className="text-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900">{row[0]}</td>
                        <td className="px-4 py-3 text-gray-500">{row[1]}</td>
                        <td className="px-4 py-3 text-primary font-medium">{row[2]}</td>
                        <td className="px-4 py-3 text-gray-500">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </Container>
        </section>

        {/* Implementation Guide */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Implementation"
              script="Guide"
              sub="Implementing ABM is a phased process. Rushing to launch before the foundation is set leads to poor results — follow these six phases."
            />
            <div className="max-w-3xl mx-auto space-y-4">
              {implementation.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                  className="flex gap-5 rounded-2xl border border-gray-200 p-6 sm:p-7"
                >
                  <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-gray-900 capitalize">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{step.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Common ABM Mistakes */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Common ABM"
              script="Mistakes"
              sub="ABM programs fail more often from execution errors than strategy problems. Here are the five most common — and how to avoid them."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {mistakes.map((m, i) => (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={AlertTriangle} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{m.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{m.body}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Provider Comparison */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Provider"
              script="Comparison"
              sub="ABM platforms span a wide range of price points and capabilities. Here's how the leading providers compare."
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
                      <th className="px-4 py-3 font-medium">Visitor ID</th>
                      <th className="px-4 py-3 font-medium">Intent / Data</th>
                      <th className="px-4 py-3 font-medium">Typical Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {providerRows.map((row) => (
                      <tr key={row.name} className={row.highlight ? "bg-primary/[0.04]" : ""}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{row.name}</td>
                        <td className="px-4 py-3 text-gray-700">{row.id}</td>
                        <td className="px-4 py-3 text-gray-700">{row.intent}</td>
                        <td className={`px-4 py-3 ${row.highlight ? "text-primary font-medium" : "text-gray-500"}`}>{row.contract}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
            <p className="mt-6 text-center text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
              For head-to-head detail, see our{" "}
              <Link href="/blog/6sense-vs-cursive-comparison" className="text-primary hover:underline">6sense vs. Cursive</Link>{" "}
              and{" "}
              <Link href="/blog/clearbit-alternatives-comparison" className="text-primary hover:underline">Clearbit alternatives</Link> comparisons.
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
                Power your ABM with
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                  Cursive
                </span>
              </h2>
              <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                See which target accounts are on your site with the Visitor Pixel, and get a fresh weekly
                list of in-market buyers with Custom Audiences. Plans from $97/mo — self-serve,
                month-to-month, cancel anytime.
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
          <h1 className="text-2xl font-bold mb-4">What is Account-Based Marketing (ABM)? Complete Guide (2026)</h1>

          <p className="text-gray-700 mb-6">
            Account-Based Marketing (ABM) is a strategic B2B marketing approach that focuses resources on a defined set of target accounts, using personalized campaigns across multiple channels to engage specific buying committees and drive revenue from high-value opportunities. Published: January 15, 2026.
          </p>

          <MachineSection title="Key Takeaways">
            <MachineList items={[
              "ABM flips traditional lead gen: identify high-value accounts first, then create personalized campaigns",
              "Three tiers: Strategic (1:1, top 10-50 accounts), ABM Lite (1:few, 50-500), Programmatic (1:many, 500+)",
              "ABM produces 40-50% higher win rates and larger deal sizes vs. traditional lead generation",
              "Requires alignment between sales and marketing around shared account-level goals",
              "Average B2B purchase involves 6-10 stakeholders; ABM maps and engages the full buying committee"
            ]} />
          </MachineSection>

          <MachineSection title="ABM Framework (7 Stages)">
            <MachineList items={[
              "Stage 1: ICP Definition — Analyze top customers to define firmographic, technographic, and behavioral fit",
              "Stage 2: Account Selection — Score the market against ICP criteria and layer in intent signals",
              "Stage 3: Intelligence Gathering — Research each account's context, tech stack, org structure, and research behavior",
              "Stage 4: Content Creation — Map account- or segment-specific content to buying stages and committee roles",
              "Stage 5: Channel Orchestration — Coordinate outreach across email, ads, LinkedIn, web, and phone",
              "Stage 6: Sales Enablement — Equip sales with account briefs, talk tracks, and real-time engagement alerts",
              "Stage 7: Measurement & Optimization — Track account-level engagement, pipeline velocity, and revenue attribution"
            ]} />
          </MachineSection>

          <MachineSection title="Three Types of ABM">
            <MachineList items={[
              "Strategic ABM (1:1) — Top 10-50 accounts, fully customized campaigns, dedicated team per account",
              "ABM Lite (1:Few) — 50-500 accounts in clusters, semi-personalized by segment/industry",
              "Programmatic ABM (1:Many) — 500+ accounts, technology-driven personalization at scale"
            ]} />
          </MachineSection>

          <MachineSection title="ABM Technology Stack">
            <MachineList items={[
              "Identification & Intent — Identify the accounts visiting your site and surface in-market buyers (Cursive provides the Visitor Pixel for individual + company-level identification and Custom Audiences for in-market intent)",
              "Orchestration — Coordinate multi-channel campaigns; activate named accounts and audiences across email and ads",
              "Engagement — Email automation, LinkedIn Sales Navigator, and conversational marketing tools",
              "CRM — Salesforce or HubSpot as the system of record for account data and pipeline",
              "Analytics — Account-level engagement scoring and multi-touch pipeline attribution"
            ]} />
          </MachineSection>

          <MachineSection title="How Cursive Fits ABM">
            <p className="text-gray-700 mb-3">
              Cursive is the identification and intent layer for ABM. The Visitor Pixel resolves anonymous website traffic to the companies and people on your site, so you can see which target accounts are already engaging. Custom Audiences deliver a fresh weekly list of in-market buyers built to your exact ICP, so you can prioritize the accounts most likely to convert. Cursive does not run your ad campaigns or send your email — it supplies the account intelligence that makes the rest of your ABM stack effective.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) — Identify the companies and people visiting your site",
              "Custom Audience ($197/month) — A fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) — Both, in one feed"
            ]} />
          </MachineSection>

          <MachineSection title="ABM Channels">
            <MachineList items={[
              "Email: Personalized sequences referencing account-specific insights, 15-25% open rates for ABM vs. 5-10% for mass email",
              "Display Advertising: Account-targeted ads on LinkedIn and programmatic networks; IP-based targeting for known accounts",
              "LinkedIn: Multi-threaded engagement across the buying committee with personalized connection requests",
              "Website Personalization: Dynamic messaging and CTAs for known accounts",
              "Phone: Warm calling after multi-channel touches significantly increases connect rates"
            ]} />
          </MachineSection>

          <MachineSection title="Measuring ABM Success">
            <MachineList items={[
              "Account Engagement Score — Composite metric tracking all touchpoints across the buying committee",
              "Pipeline from Target Accounts — Revenue pipeline generated from ABM-targeted accounts",
              "Deal Velocity — Speed at which ABM deals move through the pipeline vs. non-ABM",
              "Win Rate — ABM deals typically close at 40-50% higher rates",
              "Average Deal Size — ABM deals are typically 20-30% larger",
              "Customer Lifetime Value — ABM-acquired customers show higher retention and expansion"
            ]} />
          </MachineSection>

          <MachineSection title="Common ABM Mistakes">
            <MachineList items={[
              "Targeting too many accounts — Start with 25-50 and invest deeply before scaling",
              "Not aligning sales and marketing — Shared account plans and joint KPIs are essential",
              "Generic messaging — ABM messaging must reference account-specific challenges and context",
              "Ignoring buying committees — Target 6-10 stakeholders per account, not just one decision maker",
              "Wrong metrics — Use account-centric metrics, not lead-volume metrics"
            ]} />
          </MachineSection>

          <MachineSection title="Provider Comparison">
            <MachineList items={[
              "Cursive — Individual + company visitor identification (Visitor Pixel) plus in-market Custom Audiences; self-serve from $97/mo, month-to-month",
              "Demandbase — Company-level ID, Bombora intent, display ads + web personalization ($50K-$250K/yr)",
              "6sense — Company-level ID, proprietary AI intent model, display ads + email orchestration ($60K-$300K/yr)",
              "Terminus — Company-level ID, Bombora intent, display ads + email + chat ($30K-$150K/yr)",
              "RollWorks — Company-level ID, Bombora intent, display ads + LinkedIn ($15K-$75K/yr)"
            ]} />
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "Website Visitor Identification Guide", href: "/what-is-website-visitor-identification", description: "How visitor ID powers ABM account intelligence" },
              { label: "B2B Intent Data Guide", href: "/what-is-b2b-intent-data", description: "Intent signals for ABM account selection" },
              { label: "Cursive Visitor Identification", href: "/visitor-identification", description: "Identify which target accounts visit your site" },
              { label: "Audience Builder", href: "/audience-builder", description: "Build in-market audiences for ABM" },
              { label: "Cursive Platform", href: "/platform", description: "The identity and intent data layer for ABM" },
              { label: "6sense vs Cursive", href: "/blog/6sense-vs-cursive-comparison", description: "Compare account-based intelligence approaches" },
              { label: "Pricing", href: "/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" }
            ]} />
          </MachineSection>

          <MachineSection title="Get Started with ABM">
            <p className="text-gray-700 mb-3">
              Cursive provides the identification and intent layer that modern ABM programs require — see which target accounts are already visiting your website, and get a fresh weekly list of in-market buyers built to your ICP. Self-serve from $97/month, month-to-month.
            </p>
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team before you buy" },
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" }
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
