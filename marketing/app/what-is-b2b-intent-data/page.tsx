"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { OrganizationSchema, ArticleSchema } from "@/components/schema/SchemaMarkup"
import { motion } from "framer-motion"
import {
  Radar, Layers, Database, Gauge, Target, ShieldCheck,
  Search, FileText, Users, Star, Share2, ArrowRight,
  CheckCircle2, type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { GET_LEADS_URL, BOOKING_URL } from "@/lib/cta"

const EASE = [0.22, 1, 0.36, 1] as const

const faqs = [
  {
    question: "What is B2B intent data?",
    answer:
      "B2B intent data is information that reveals when companies or individuals are actively researching products, services, or topics related to a potential purchase. It is derived from online behavioral signals such as web searches, content consumption, review site visits, and competitor research. Intent data helps sales and marketing teams identify prospects who are in an active buying cycle.",
  },
  {
    question: "What is the difference between first-party and third-party intent data?",
    answer:
      "First-party intent data comes from your own digital properties, such as your website, app, or email campaigns. Third-party intent data is collected from external sources across the broader web, including content publishers, review sites, and ad networks. First-party data is more accurate but limited in scope, while third-party data provides broader coverage but may have lower precision.",
  },
  {
    question: "How accurate is B2B intent data?",
    answer:
      "Accuracy varies by source and methodology. First-party intent data from your own website is highly accurate because you directly observe the behavior. Third-party intent data ranges from 60-85% accuracy depending on the provider and validation methods used. The best results come from combining multiple intent data sources and validating signals against your CRM data.",
  },
  {
    question: "How do you use intent data for sales prospecting?",
    answer:
      "Sales teams use intent data to prioritize outreach by focusing on accounts showing active buying signals. When a target account surges on topics related to your solution, reps can reach out with timely, relevant messaging. This approach increases connect rates by 2-3x compared to cold outreach because you are contacting prospects when they are actively evaluating solutions.",
  },
  {
    question: "What are intent data signals?",
    answer:
      "Intent data signals are specific behavioral actions that indicate purchase interest. Common signals include searching for solution-related keywords, reading product comparison articles, visiting competitor websites, downloading industry reports, engaging with review sites like G2 or TrustRadius, and repeatedly visiting your pricing page. Each signal type carries a different weight in predicting buying intent.",
  },
  {
    question: "How much does B2B intent data cost?",
    answer:
      "B2B intent data pricing varies widely. Standalone intent data feeds from legacy providers like Bombora typically cost between $25,000 and $100,000 per year. Cursive takes a different approach: intent data powers our Custom Audience, a fresh weekly list of in-market buyers built to your ICP, for a flat $197/month. It is self-serve and month-to-month, with no annual contract or enterprise minimum.",
  },
  {
    question: "Can intent data predict when a company will buy?",
    answer:
      "Intent data cannot predict the exact timing of a purchase, but it reliably indicates when a company is in an active research or evaluation phase. Companies showing intent signals are statistically 2-3x more likely to enter a buying process within 90 days compared to companies without intent signals. The more signals a company triggers, the closer they tend to be to a purchase decision.",
  },
  {
    question: "How do you integrate intent data with your CRM?",
    answer:
      "Most intent data platforms offer native CRM integrations with Salesforce, HubSpot, and other major platforms. With Cursive, your weekly Custom Audience is delivered straight to a Google Sheet and syncs to 200+ tools, so in-market contacts land in your existing stack with no engineering work. Once connected, reps can prioritize their pipeline based on real-time buying signals.",
  },
]

const pipeline: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Radar,
    title: "Signal collection",
    body: "Behavioral signals are captured across the web — searches, content consumption, review-site activity, and your own identified website visitors.",
  },
  {
    icon: Layers,
    title: "Processing & normalization",
    body: "Raw signals are deduplicated, baselined against typical behavior per company, and mapped to topic taxonomies that match real buying categories.",
  },
  {
    icon: Gauge,
    title: "Scoring & delivery",
    body: "Signals become quantified intent scores. A pricing-page visit outweighs a blog read; clustered signals create a surge — then it ships to your tools.",
  },
]

const types: Array<{ icon: LucideIcon; label: string; title: string; body: string }> = [
  {
    icon: Database,
    label: "Most accurate",
    title: "First-party intent",
    body: "Signals from your own website, product, and content. Highest accuracy because you observe behavior directly — but visitor identification is required, since 95–98% of traffic is otherwise anonymous.",
  },
  {
    icon: Share2,
    label: "Mid-funnel",
    title: "Second-party intent",
    body: "Signals shared by a trusted intermediary like G2, TrustRadius, or an industry publisher. Strong indicator of active evaluation, limited to that platform's coverage.",
  },
  {
    icon: Target,
    label: "Broadest reach",
    title: "Third-party intent",
    body: "Aggregated from web-wide data cooperatives. The widest coverage of early research activity, with lower precision — best used alongside first-party validation.",
  },
]

const sources = [
  { icon: Search, title: "Search behavior", body: "Explicit queries like “best CRM for mid-market” signal clear research intent — among the strongest signals available." },
  { icon: FileText, title: "Content consumption", body: "Spikes in topic-specific reading across publisher networks reveal a company exploring a new category." },
  { icon: Radar, title: "Competitor visits", body: "Accounts engaging with competitor content are actively comparison shopping — ideal for displacement timing." },
  { icon: Star, title: "Review-site activity", body: "G2, TrustRadius, and Capterra research is high-quality, late-stage intent from buyers actively shortlisting." },
  { icon: Users, title: "Social signals", body: "LinkedIn engagement and group activity add context — weaker alone, valuable combined with other signals." },
  { icon: Database, title: "Identified visitors", body: "Your own resolved website traffic is the highest-precision intent source, attributable to specific accounts." },
]

const useCases = [
  { audience: "Sales prioritization", body: "Reps work accounts showing active buying signals first. Intent-flagged accounts are ~2.5x more likely to convert than cold outreach." },
  { audience: "ABM targeting", body: "Concentrate ad and campaign budget on in-market accounts for 40–60% higher engagement and lower cost per opportunity." },
  { audience: "Content personalization", body: "Tailor the on-site experience to what a visiting company is researching, lifting conversion 15–30%." },
  { audience: "Competitive intelligence", body: "Get alerted when key accounts research a competitor, then reach out with differentiated messaging in time." },
  { audience: "Churn prevention", body: "Surface customers researching alternatives early so CS can intervene — teams report 20–30% better net retention." },
  { audience: "Pipeline acceleration", body: "Spot renewed research activity on open opportunities and time the next touch to a real moment of interest." },
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

export default function WhatIsB2BIntentDataPage() {
  return (
    <>
      <OrganizationSchema />
      <ArticleSchema
        title="What is B2B Intent Data? Complete Guide (2026)"
        description="A comprehensive guide to B2B intent data: types, sources, scoring models, use cases, and how to choose the right provider for your sales and marketing team."
        publishedAt="2026-01-15"
        updatedAt="2026-02-01"
      />
      <StructuredData data={generateFAQSchema({ faqs })} />

      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { name: "Home", href: "/" },
                { name: "Resources", href: "/resources" },
                { name: "What is B2B Intent Data?", href: "/what-is-b2b-intent-data" },
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
                  Resource &middot; Complete Guide 2026
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  What is B2B
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    intent data?
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  <strong className="font-medium text-gray-900">B2B intent data</strong> reveals when
                  companies are actively researching products or services based on their online behavior.
                  By tracking searches, content consumption, competitor visits, and review-site activity,
                  it identifies organizations in an active buying cycle — so you engage them at the precise
                  moment they are evaluating solutions.
                </p>
              </motion.div>
            </Container>
          </section>

          {/* Article body */}
          <section className="pb-8 bg-white">
            <Container>
              <article className="prose prose-lg max-w-3xl mx-auto">
                <p className="text-gray-600">
                  In 2026, intent data has evolved from a niche enterprise capability into a core part of
                  every modern B2B go-to-market strategy. According to Gartner, 70% of B2B marketers now
                  use intent data in some form, up from just 28% in 2021 — driven by a simple shift in
                  buyer behavior: decision-makers complete 70–80% of their research online before ever
                  contacting a vendor. Cursive&apos;s{" "}
                  <Link href="/custom-audiences" className="text-primary hover:underline">Custom Audience</Link>{" "}
                  is built directly on this signal, pairing intent data with{" "}
                  <Link href="/visitor-identification" className="text-primary hover:underline">visitor identification</Link>{" "}
                  so revenue teams see who is interested and what they are researching.
                </p>

                {/* Table of Contents */}
                <nav className="not-prose rounded-2xl border border-gray-200 bg-[#F7F9FB] p-6 my-10">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
                  <ol className="list-decimal list-inside space-y-2 text-primary">
                    <li><a href="#how-it-works" className="hover:underline">How B2B Intent Data Works</a></li>
                    <li><a href="#types-of-intent-data" className="hover:underline">Types of Intent Data</a></li>
                    <li><a href="#intent-data-sources" className="hover:underline">Intent Data Sources</a></li>
                    <li><a href="#intent-scoring" className="hover:underline">Intent Scoring</a></li>
                    <li><a href="#use-cases" className="hover:underline">Use Cases</a></li>
                    <li><a href="#accuracy-quality" className="hover:underline">Accuracy and Quality</a></li>
                    <li><a href="#implementation-guide" className="hover:underline">Implementation Guide</a></li>
                    <li><a href="#provider-comparison" className="hover:underline">Provider Comparison</a></li>
                    <li><a href="#faq" className="hover:underline">Frequently Asked Questions</a></li>
                  </ol>
                </nav>
              </article>
            </Container>
          </section>

          {/* Section 1: How It Works — cards */}
          <section id="how-it-works" className="py-20 sm:py-24 bg-[#F7F9FB] scroll-mt-24">
            <Container>
              <SectionHeading
                plain="How B2B Intent Data"
                script="Works"
                sub="Raw behavior becomes an actionable buying signal through a three-stage pipeline."
              />
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {pipeline.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
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
              <div className="mt-10 max-w-3xl mx-auto text-center text-gray-600 leading-relaxed">
                <p>
                  Modern systems process billions of signals daily. A single buyer might search for
                  &ldquo;best CRM for mid-market,&rdquo; read comparison articles on G2, visit three
                  vendor sites, and download an analyst report in one week — each action captured,
                  timestamped, and tied back to their company. Cursive&apos;s{" "}
                  <Link href="/intent-audiences" className="text-primary hover:underline">intent audiences</Link>{" "}
                  segment companies by intent level automatically and route them to the right workflow.
                </p>
              </div>
            </Container>
          </section>

          {/* Section 2: Types — cards */}
          <section id="types-of-intent-data" className="py-20 sm:py-24 bg-white scroll-mt-24">
            <Container>
              <SectionHeading
                plain="Types of"
                script="Intent Data"
                sub="Three types, defined by where the signal originates. The strongest strategies combine all three."
              />
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {types.map((t, i) => (
                  <motion.div
                    key={t.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <IconChip Icon={t.icon} />
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {t.label}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{t.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{t.body}</p>
                  </motion.div>
                ))}
              </div>

              {/* Type comparison table */}
              <div className="max-w-4xl mx-auto mt-12 overflow-x-auto">
                <table className="min-w-full border-collapse overflow-hidden rounded-2xl border border-gray-200">
                  <thead>
                    <tr className="bg-[#F7F9FB]">
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Attribute</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">First-Party</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Second-Party</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Third-Party</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700">
                    <tr>
                      <td className="border border-gray-200 px-4 py-3 font-medium">Source</td>
                      <td className="border border-gray-200 px-4 py-3">Your website and app</td>
                      <td className="border border-gray-200 px-4 py-3">Review sites, publishers</td>
                      <td className="border border-gray-200 px-4 py-3">Web-wide data cooperatives</td>
                    </tr>
                    <tr className="bg-[#F7F9FB]">
                      <td className="border border-gray-200 px-4 py-3 font-medium">Accuracy</td>
                      <td className="border border-gray-200 px-4 py-3">Very high (90%+)</td>
                      <td className="border border-gray-200 px-4 py-3">High (80-90%)</td>
                      <td className="border border-gray-200 px-4 py-3">Moderate (60-80%)</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-3 font-medium">Coverage</td>
                      <td className="border border-gray-200 px-4 py-3">Limited to your properties</td>
                      <td className="border border-gray-200 px-4 py-3">Specific platforms</td>
                      <td className="border border-gray-200 px-4 py-3">Broad web coverage</td>
                    </tr>
                    <tr className="bg-[#F7F9FB]">
                      <td className="border border-gray-200 px-4 py-3 font-medium">Signal Timing</td>
                      <td className="border border-gray-200 px-4 py-3">Late-stage (evaluating you)</td>
                      <td className="border border-gray-200 px-4 py-3">Mid-stage (comparing)</td>
                      <td className="border border-gray-200 px-4 py-3">Early-stage (researching)</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-3 font-medium">Resolution</td>
                      <td className="border border-gray-200 px-4 py-3">Individual + company</td>
                      <td className="border border-gray-200 px-4 py-3">Company</td>
                      <td className="border border-gray-200 px-4 py-3">Company</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="max-w-3xl mx-auto mt-8 text-center text-gray-600 leading-relaxed">
                First-party data is the most valuable but limited to your own properties —{" "}
                <Link href="/visitor-identification" className="text-primary hover:underline">visitor identification</Link>{" "}
                is its foundation, because without it 95–98% of your website visitors stay anonymous.
              </p>
            </Container>
          </section>

          {/* Section 3: Sources — cards */}
          <section id="intent-data-sources" className="py-20 sm:py-24 bg-[#F7F9FB] scroll-mt-24">
            <Container>
              <SectionHeading
                plain="Intent Data"
                script="Sources"
                sub="Where signals come from determines which providers have the best data for your market."
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {sources.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={s.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{s.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{s.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Section 4: Scoring — prose */}
          <section id="intent-scoring" className="py-20 sm:py-24 bg-white scroll-mt-24">
            <Container>
              <SectionHeading
                plain="Intent"
                script="Scoring"
                sub="Turning raw behavioral signals into a quantified measure of buying likelihood."
              />
              <article className="prose prose-lg max-w-3xl mx-auto">
                <h3 className="text-2xl font-medium text-gray-900">How signals are weighted</h3>
                <p className="text-gray-600">
                  Not all signals carry equal predictive value. A pricing-page visit is a far stronger
                  signal than a blog read. Scoring models assign weights based on historical correlation
                  with closed-won deals — demo requests and pricing views at the top, then competitor
                  comparison content, feature pages, case studies, and general educational content below.
                  Weights should be calibrated to your business using your own conversion data.
                </p>
                <h3 className="text-2xl font-medium text-gray-900">Scoring models</h3>
                <p className="text-gray-600">
                  <strong>Rule-based models</strong> use predefined weights and thresholds — a pricing
                  view might be worth 20 points, a blog visit 3. <strong>Machine-learning models</strong>{" "}
                  learn which signal patterns predict conversion and adjust continuously, growing more
                  accurate with enough historical data. Modern platforms, including Cursive, use hybrid
                  approaches that combine a rule-based foundation with ML-driven optimization.
                </p>
                <h3 className="text-2xl font-medium text-gray-900">Thresholds and surge detection</h3>
                <p className="text-gray-600">
                  A &ldquo;surge&rdquo; occurs when an account&apos;s research activity on a topic
                  significantly exceeds its normal baseline in a defined window. If a company usually
                  generates 5 content signals a week but suddenly produces 25, that 5x jump is a surge.
                  Relative change matters more than absolute volume — a construction firm suddenly reading
                  tech content shows intent that a tech firm reading tech content does not.
                </p>
              </article>
            </Container>
          </section>

          {/* Section 5: Use Cases — chips */}
          <section id="use-cases" className="py-20 sm:py-24 bg-[#F7F9FB] scroll-mt-24">
            <Container>
              <SectionHeading
                plain="Use"
                script="Cases"
                sub="The most impactful ways revenue teams put intent data to work."
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                {useCases.map((u, i) => (
                  <motion.div
                    key={u.audience}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-7"
                  >
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {u.audience}
                    </span>
                    <p className="mt-4 text-sm text-gray-600 leading-relaxed">{u.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Section 6: Accuracy & Quality — prose */}
          <section id="accuracy-quality" className="py-20 sm:py-24 bg-white scroll-mt-24">
            <Container>
              <SectionHeading
                plain="Accuracy and"
                script="Quality"
                sub="Intent data is only as good as its accuracy. Know what affects it before you trust it."
              />
              <article className="prose prose-lg max-w-3xl mx-auto">
                <h3 className="text-2xl font-medium text-gray-900">Signal decay</h3>
                <p className="text-gray-600">
                  Intent signals have a shelf life. A company researching CRMs three months ago may have
                  already bought. Signals are most predictive within the first 7–14 days, moderately
                  useful within 30, and largely unreliable beyond 60 — which is why real-time or
                  near-real-time delivery matters, and why weekly-refresh feeds beat monthly batches.
                </p>
                <h3 className="text-2xl font-medium text-gray-900">False positives</h3>
                <p className="text-gray-600">
                  False positives flag an account as in-market when it is not — caused by employees doing
                  competitive research, analysts and journalists, students, or bots. Quality providers use
                  bot detection, role-based filtering, and multi-source cross-referencing to reduce them,
                  but expect a 15–30% false-positive rate even with top-tier data.
                </p>
                <h3 className="text-2xl font-medium text-gray-900">Validation methods</h3>
                <ul className="text-gray-600">
                  <li><strong>Cross-reference with first-party data:</strong> validate third-party signals against your own visitor data and CRM records</li>
                  <li><strong>Track predictive accuracy:</strong> measure what share of intent-flagged accounts enter pipeline within 90 days</li>
                  <li><strong>A/B test outreach:</strong> compare intent-driven versus non-intent conversion to quantify the signal&apos;s value</li>
                  <li><strong>Feedback loops:</strong> have reps report when signals were accurate to continuously improve scoring</li>
                  <li><strong>Multi-source validation:</strong> require signals from multiple sources before flagging an account</li>
                </ul>
              </article>
            </Container>
          </section>

          {/* Section 7: Implementation — prose */}
          <section id="implementation-guide" className="py-20 sm:py-24 bg-[#F7F9FB] scroll-mt-24">
            <Container>
              <SectionHeading
                plain="Implementation"
                script="Guide"
                sub="Three phases: choose a provider, integrate your tools, and operationalize the workflow."
              />
              <article className="prose prose-lg max-w-3xl mx-auto">
                <h3 className="text-2xl font-medium text-gray-900">Phase 1: Choosing a provider</h3>
                <p className="text-gray-600">
                  Evaluate providers on the criteria that matter for your business: types of intent data
                  offered, topic-taxonomy coverage for your industry, geographic reach, integration
                  capabilities, and pricing model. Request sample data for your target accounts before
                  committing. Cursive&apos;s{" "}
                  <Link href="/free-audit" className="text-primary hover:underline">free audit</Link>{" "}
                  shows you intent data for your actual website visitors before you buy.
                </p>
                <h3 className="text-2xl font-medium text-gray-900">Phase 2: Integration</h3>
                <p className="text-gray-600">
                  Connect the intent feed to the tools your team already lives in — CRM (Salesforce,
                  HubSpot), marketing automation, sales engagement, and ad platforms. The goal is to make
                  intent data visible and actionable where reps work, not in a separate dashboard they
                  have to remember to check. Cursive delivers your weekly audience straight to a Google
                  Sheet that syncs across 200+ tools.
                </p>
                <h3 className="text-2xl font-medium text-gray-900">Phase 3: Workflow setup</h3>
                <p className="text-gray-600">
                  Define what happens at each intent level. High-intent accounts (surging on your category,
                  visiting your site, engaging competitors) trigger immediate outreach and targeted ads.
                  Medium-intent accounts enter nurture and ABM programs. Low-intent accounts are monitored
                  until signals strengthen. Automating these paths ensures consistent follow-through and
                  maximum ROI. Pair intent with a fresh weekly{" "}
                  <Link href="/custom-audiences" className="text-primary hover:underline">Custom Audience</Link>{" "}
                  so your team always has new in-market contacts to action.
                </p>
              </article>
            </Container>
          </section>

          {/* Section 8: Provider Comparison — table */}
          <section id="provider-comparison" className="py-20 sm:py-24 bg-white scroll-mt-24">
            <Container>
              <SectionHeading
                plain="Provider"
                script="Comparison"
                sub="How the leading options compare across the criteria that matter most in 2026."
              />
              <div className="max-w-5xl mx-auto overflow-x-auto">
                <table className="min-w-full border-collapse overflow-hidden rounded-2xl border border-gray-200">
                  <thead>
                    <tr className="bg-[#F7F9FB]">
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Provider</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Intent Types</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Visitor ID</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Pricing Model</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700">
                    <tr>
                      <td className="border border-gray-200 px-4 py-3 font-medium">Cursive</td>
                      <td className="border border-gray-200 px-4 py-3">First + third-party</td>
                      <td className="border border-gray-200 px-4 py-3">Yes (40&ndash;60% deterministic)</td>
                      <td className="border border-gray-200 px-4 py-3">Self-serve, $197/mo</td>
                      <td className="border border-gray-200 px-4 py-3">Lean B2B GTM teams</td>
                    </tr>
                    <tr className="bg-[#F7F9FB]">
                      <td className="border border-gray-200 px-4 py-3 font-medium">Bombora</td>
                      <td className="border border-gray-200 px-4 py-3">Third-party (co-op)</td>
                      <td className="border border-gray-200 px-4 py-3">No</td>
                      <td className="border border-gray-200 px-4 py-3">Annual data feed</td>
                      <td className="border border-gray-200 px-4 py-3">Enterprise data teams</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-3 font-medium">6sense</td>
                      <td className="border border-gray-200 px-4 py-3">First + third-party</td>
                      <td className="border border-gray-200 px-4 py-3">Limited</td>
                      <td className="border border-gray-200 px-4 py-3">Enterprise license</td>
                      <td className="border border-gray-200 px-4 py-3">Large ABM programs</td>
                    </tr>
                    <tr className="bg-[#F7F9FB]">
                      <td className="border border-gray-200 px-4 py-3 font-medium">G2</td>
                      <td className="border border-gray-200 px-4 py-3">Second-party (review site)</td>
                      <td className="border border-gray-200 px-4 py-3">No</td>
                      <td className="border border-gray-200 px-4 py-3">Per-category subscription</td>
                      <td className="border border-gray-200 px-4 py-3">Competitive intelligence</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-3 font-medium">TrustRadius</td>
                      <td className="border border-gray-200 px-4 py-3">Second-party (review site)</td>
                      <td className="border border-gray-200 px-4 py-3">No</td>
                      <td className="border border-gray-200 px-4 py-3">Per-category subscription</td>
                      <td className="border border-gray-200 px-4 py-3">Enterprise tech buyers</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="max-w-3xl mx-auto mt-8 text-center text-gray-600 leading-relaxed">
                For a detailed look at how Cursive stacks up against 6sense, see our{" "}
                <Link href="/blog/6sense-vs-cursive-comparison" className="text-primary hover:underline">6sense vs. Cursive comparison</Link>,
                or explore how intent data feeds the{" "}
                <Link href="/custom-audiences" className="text-primary hover:underline">Custom Audience</Link>.
              </p>
            </Container>
          </section>

          {/* FAQ */}
          <section id="faq" className="py-20 sm:py-24 bg-[#F7F9FB] scroll-mt-24">
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
                    className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7"
                  >
                    <h3 className="text-base font-medium text-gray-900">{faq.question}</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Related */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="Related"
                script="Resources"
                sub="The technologies and strategies that work alongside B2B intent data."
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[
                  { title: "Website Visitor Identification", href: "/what-is-website-visitor-identification" },
                  { title: "Intent Audiences", href: "/intent-audiences" },
                  { title: "Custom Audiences", href: "/custom-audiences" },
                  { title: "Cursive Platform", href: "/platform" },
                  { title: "Intent Data for B2B Software", href: "/industries/b2b-software" },
                  { title: "Intent Data for Technology", href: "/industries/technology" },
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
                  Put intent data
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    to work
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Cursive&apos;s Custom Audience turns intent signals into a fresh weekly list of
                  in-market buyers built to your ICP — delivered to your sheet for a flat $197/mo,
                  month-to-month, cancel anytime.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
                  {["Built to your ICP", "Fresh every week", "Self-serve, month-to-month"].map((item) => (
                    <span key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </span>
                  ))}
                </div>
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
        </main>
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">What is B2B Intent Data? Complete Guide (2026)</h1>

          <p className="text-gray-700 mb-6">
            B2B intent data is information that reveals when companies or individuals are actively researching products, services, or topics related to a potential purchase. It is derived from online behavioral signals such as web searches, content consumption, review site visits, and competitor research. Published: January 15, 2026.
          </p>

          <MachineSection title="Key Takeaways">
            <MachineList items={[
              "Intent data identifies companies showing active buying signals before they fill out a form",
              "Three types: First-party (your own properties), Second-party (partner data), Third-party (external web signals)",
              "Companies using intent data see 2-3x higher conversion rates on targeted accounts",
              "Intent scoring models combine topic relevance, signal strength, and recency for prioritization",
              "Best results come from combining first-party and third-party intent data sources",
            ]} />
          </MachineSection>

          <MachineSection title="Types of Intent Data">
            <MachineList items={[
              "First-Party Intent — Signals from your own website, app, and email (website visits, content downloads, pricing page views)",
              "Second-Party Intent — Partner or publisher data shared through data cooperatives",
              "Third-Party Intent — Aggregated from external sources: review sites, content networks, search behavior, ad interactions",
              "Topic-Level Intent — Tracks research on specific topics/keywords across the web",
              "Account-Level Intent — Aggregated signals showing company-wide research activity",
            ]} />
          </MachineSection>

          <MachineSection title="How Intent Data Works">
            <MachineList items={[
              "Step 1: Signal Collection — Behavioral signals gathered from searches, publishers, review sites, and identified website visitors",
              "Step 2: Company Resolution — Anonymous signals matched to companies via identity graphs and visitor identification",
              "Step 3: Topic Classification — NLP models classify content consumption into relevant buying topics",
              "Step 4: Baseline Calculation — Normal research activity is baselined per company to detect surges",
              "Step 5: Intent Scoring — Surge above baseline triggers intent signal with confidence score",
              "Step 6: Delivery — Intent signals delivered to your CRM, sheet, or sales engagement tools",
            ]} />
          </MachineSection>

          <MachineSection title="Use Cases">
            <MachineList items={[
              "Prioritize outbound prospecting — Focus rep time on accounts showing active buying research",
              "ABM targeting — Concentrate budget on in-market accounts for higher engagement",
              "Content personalization — Tailor the on-site experience to what an account is researching",
              "Competitive displacement — Target accounts researching your competitors",
              "Churn prevention — Detect customers researching competitor alternatives",
            ]} />
          </MachineSection>

          <MachineSection title="Intent Data Accuracy">
            <MachineList items={[
              "First-party intent: 95-99% accuracy (your own tracking data)",
              "Topic-level third-party: 65-80% accuracy (depends on provider and methodology)",
              "Account-level matching: 70-85% accuracy for company identification",
              "Best practice: Validate third-party signals against first-party data for higher confidence",
              "Freshness matters: Intent signals degrade quickly; weekly or real-time refresh recommended",
            ]} />
          </MachineSection>

          <MachineSection title="Provider Comparison">
            <MachineList items={[
              "Cursive — Intent data powers a fresh weekly Custom Audience built to your ICP, plus deterministic visitor ID ($197/mo, self-serve)",
              "Bombora — Largest B2B data cooperative, company-level topic surges ($25,000+/yr)",
              "G2 — Review site intent data showing active product evaluations ($15,000+/yr)",
              "6sense — Predictive AI model combining multiple intent sources ($60,000+/yr)",
              "TrustRadius — Review site intent with buyer-verified data ($15,000+/yr)",
            ]} />
          </MachineSection>

          <MachineSection title="Cursive Pricing">
            <p className="text-gray-700 mb-3">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Custom Audience ($197/month) — Intent data turned into a fresh weekly list of in-market buyers built to your ICP, delivered to Google Sheets",
              "Visitor Pixel ($97/month) — Identify the companies and people visiting your site (first-party intent)",
              "Pixel + Audience Bundle ($247/month) — Both, in one feed",
            ]} />
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "Website Visitor Identification Guide", href: "/what-is-website-visitor-identification", description: "First-party intent from identified website visitors" },
              { label: "Intent Audiences", href: "/intent-audiences", description: "Segment companies by real-time intent level" },
              { label: "Custom Audiences", href: "/custom-audiences", description: "A fresh weekly list of in-market buyers built to your ICP" },
              { label: "Cursive Platform", href: "/platform", description: "Integrated intent data and visitor identification" },
              { label: "Pricing", href: "/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, Bundle $247/mo" },
            ]} />
          </MachineSection>

          <MachineSection title="Get Started">
            <p className="text-gray-700 mb-3">
              Cursive turns intent signals into a fresh weekly Custom Audience of in-market buyers, paired with deterministic website visitor identification — so you reach interested accounts before your competitors.
            </p>
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Free Audit", href: "https://www.meetcursive.com/free-audit", description: "See which in-market accounts are visiting your site" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team before you buy" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
