"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { OrganizationSchema, ArticleSchema } from "@/components/schema/SchemaMarkup"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Radar, Fingerprint, Network, Gauge, ShieldCheck, Wrench,
  AlertTriangle, BarChart3, ArrowRight, type LucideIcon,
} from "lucide-react"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { GET_LEADS_URL, BOOKING_URL } from "@/lib/cta"

const EASE = [0.22, 1, 0.36, 1] as const

const faqs = [
  {
    question: "What is visitor deanonymization?",
    answer: "Visitor deanonymization is the technical process of resolving anonymous website visitor sessions into identified individual or company profiles. It works by matching device fingerprints, IP signals, cookies, and behavioral patterns against databases of known business contacts to reveal the identity behind anonymous web traffic."
  },
  {
    question: "How accurate is visitor deanonymization?",
    answer: "Accuracy varies by method. Deterministic matching (email or login-based) achieves 95%+ accuracy. High-confidence probabilistic matching typically reaches 85-95% accuracy. Moderate probabilistic approaches deliver 70-85%, while low-confidence matches fall below 70%. Cursive's Visitor Pixel uses a deterministic, offline-rooted identity graph to deliver a 40–60% match rate with 60–80% accuracy on each matched record."
  },
  {
    question: "Is visitor deanonymization legal?",
    answer: "Visitor deanonymization is legal when implemented with proper consent frameworks and compliance measures. Under GDPR, businesses can process visitor data under legitimate interest (Article 6(1)(f)) for B2B marketing purposes, provided they maintain transparency, offer opt-out mechanisms, and practice data minimization. US regulations are generally more permissive, though CCPA requires disclosure of data collection practices."
  },
  {
    question: "What is the difference between deanonymization and visitor identification?",
    answer: "Visitor identification is the broader category that includes any method of recognizing website visitors. Deanonymization is a specific subset focused on resolving truly anonymous visitors who have never identified themselves through forms or logins. Deanonymization relies more heavily on probabilistic matching and third-party data, while identification can include deterministic methods like login tracking."
  },
  {
    question: "How does IP-based deanonymization work?",
    answer: "IP-based deanonymization maps a visitor's IP address to a known business using commercial IP-to-company databases. These databases contain millions of verified business IP ranges, ISP assignments, and geolocation records. When a visitor arrives, the system resolves their IP against these databases to identify the company, then enriches with firmographic data like employee count, industry, and revenue."
  },
  {
    question: "Can visitor deanonymization identify individual people?",
    answer: "Yes, advanced deanonymization platforms can resolve anonymous visitors to individual contacts, not just companies. This is achieved by combining IP intelligence with device fingerprinting, cookie data, and behavioral pattern matching against databases of known business professionals. Individual-level identification typically requires higher confidence thresholds and more data signals than company-level matching."
  },
  {
    question: "What happens when a visitor uses a VPN or proxy?",
    answer: "VPN and proxy traffic presents a significant challenge for IP-based deanonymization because the visible IP address belongs to the VPN provider, not the visitor's company. Advanced platforms mitigate this by detecting VPN usage and falling back to device fingerprinting, behavioral analysis, and cookie-based methods. Some platforms can identify the visitor even behind a VPN if they have matching device fingerprint or cookie data from a previous unmasked session."
  },
  {
    question: "How does visitor deanonymization differ from cookies?",
    answer: "Cookies are just one signal used in the broader deanonymization process. Traditional cookie-based tracking requires a visitor to have previously accepted a cookie, limiting reach to return visitors. Deanonymization combines cookies with IP intelligence, device fingerprints, and behavioral data to identify visitors even on their first visit and even as third-party cookies are deprecated. Deanonymization is the complete identity resolution process; cookies are one input to that process."
  },
]

const toc = [
  { id: "how-visitor-deanonymization-works", label: "How Visitor Deanonymization Works" },
  { id: "technical-methods", label: "Technical Methods of Deanonymization" },
  { id: "identity-resolution-process", label: "The Identity Resolution Process" },
  { id: "accuracy-confidence-scoring", label: "Accuracy and Confidence Scoring" },
  { id: "privacy-ethics", label: "Privacy and Ethics" },
  { id: "technical-implementation", label: "Technical Implementation" },
  { id: "challenges", label: "Challenges in Visitor Deanonymization" },
  { id: "provider-comparison", label: "Provider Comparison" },
  { id: "faqs", label: "Frequently Asked Questions" },
  { id: "related-resources", label: "Related Resources" },
]

const sectionIcons: Record<string, LucideIcon> = {
  "how-visitor-deanonymization-works": Radar,
  "technical-methods": Fingerprint,
  "identity-resolution-process": Network,
  "accuracy-confidence-scoring": Gauge,
  "privacy-ethics": ShieldCheck,
  "technical-implementation": Wrench,
  challenges: AlertTriangle,
  "provider-comparison": BarChart3,
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  const Icon = sectionIcons[id]
  return (
    <div id={id} className="flex items-center gap-3 mb-6 scroll-mt-24">
      {Icon && (
        <span className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-light text-gray-900">{children}</h2>
    </div>
  )
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

export default function WhatIsVisitorDeanonymization() {
  return (
    <main className="overflow-hidden">
      <OrganizationSchema />
      <ArticleSchema
        title="What is Visitor Deanonymization? Complete Technical Guide (2026)"
        description="A comprehensive technical guide to visitor deanonymization, covering IP resolution, device fingerprinting, probabilistic and deterministic matching, confidence scoring, privacy compliance, and implementation."
        publishedAt="2026-01-15"
      />
      <StructuredData data={generateFAQSchema({ faqs })} />

      <HumanView>
        {/* Hero */}
        <section className="bg-white pt-10 pb-16 sm:pt-12 sm:pb-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <Breadcrumbs
                items={[
                  { name: "Home", href: "/" },
                  { name: "Resources", href: "/resources" },
                  { name: "What is Visitor Deanonymization?", href: "/what-is-visitor-deanonymization" },
                ]}
              />

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="mt-8"
              >
                <span className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
                  Technical Guide · 2026
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  What is visitor
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    deanonymization?
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-700 leading-relaxed">
                  Visitor deanonymization is the technical process of resolving anonymous website
                  sessions into identified individual or company profiles &mdash; matching device
                  fingerprints, IP signals, cookies, and behavioral patterns against databases of
                  known business contacts. It turns unknown traffic into actionable sales intelligence.
                </p>
              </motion.div>
            </div>
          </Container>
        </section>

        {/* Intro + TOC */}
        <section className="bg-[#F7F9FB] py-16 sm:py-20">
          <Container>
            <div className="max-w-4xl mx-auto grid lg:grid-cols-[1fr_300px] gap-10 items-start">
              <FadeIn>
                <p className="text-gray-700 leading-relaxed">
                  In B2B marketing, roughly 97% of website visitors leave without ever filling out a
                  form or identifying themselves. Visitor deanonymization bridges that gap by combining
                  technical signals with data science to reveal who is visiting your site, what company
                  they represent, and how engaged they are. This is exactly what the{" "}
                  <Link href="/pixel" className="text-primary hover:underline">Cursive Visitor Pixel</Link>{" "}
                  does &mdash; it resolves 40&ndash;60% of your anonymous traffic to real companies and
                  people the moment they land, deterministically, for $97/mo.
                </p>
              </FadeIn>

              <FadeIn delay={0.1}>
                <nav className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                  <h2 className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase mb-4">
                    On this page
                  </h2>
                  <ol className="space-y-2.5 text-sm">
                    {toc.map((item, i) => (
                      <li key={item.id} className="flex gap-2.5">
                        <span className="text-gray-300 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                        <a href={`#${item.id}`} className="text-gray-600 hover:text-primary transition-colors">
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </FadeIn>
            </div>
          </Container>
        </section>

        {/* How It Works */}
        <section className="bg-white py-16 sm:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <SectionTitle id="how-visitor-deanonymization-works">
                  How Visitor Deanonymization Works
                </SectionTitle>
                <p className="text-gray-700 leading-relaxed">
                  Deanonymization runs a multi-stage pipeline that collects signals, generates identity
                  candidates, scores matches, and assembles enriched profiles &mdash; typically in
                  milliseconds, so sales teams get real-time intelligence. Understanding this pipeline is
                  key to evaluating{" "}
                  <Link href="/visitor-identification" className="text-primary hover:underline">visitor identification platforms</Link>.
                </p>
              </FadeIn>

              <div className="mt-8 space-y-5">
                {[
                  { n: "1", title: "Signal capture", body: "A lightweight pixel fires on page load and captures dozens of signals from the browser and network — IP address, HTTP headers, browser capabilities, screen dimensions, installed fonts, and WebGL rendering — without impacting page performance. Modern platforms capture 50–100+ distinct signals per session." },
                  { n: "2", title: "Fingerprint generation", body: "The system derives a composite device fingerprint from hardware, software, and configuration attributes. The Electronic Frontier Foundation found browser fingerprints are unique for ~83.6% of browsers; the fingerprint is hashed and stored for cross-session matching even when cookies are cleared." },
                  { n: "3", title: "Identity resolution", body: "Signals are matched against identity graphs that map device signatures, IP ranges, emails, and behavior to known contacts. Cursive resolves against a deterministic, offline-rooted graph of 280M+ verified consumer and 140M+ business profiles." },
                  { n: "4", title: "Confidence scoring", body: "Each match gets a confidence score based on signal overlap, data recency, and match specificity. An IP-plus-fingerprint match against a recently verified record scores far higher than a stale IP-only match." },
                  { n: "5", title: "Profile assembly", body: "High-confidence matches are enriched with firmographic, technographic, and behavioral data, then delivered through CRM integrations, webhooks, or your portal." },
                ].map((stage, i) => (
                  <FadeIn key={stage.n} delay={i * 0.04}>
                    <div className="rounded-2xl border border-gray-200 p-6 sm:p-8">
                      <div className="flex items-start gap-4">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base font-medium text-primary">
                          {stage.n}
                        </span>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{stage.title}</h3>
                          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{stage.body}</p>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Technical Methods */}
        <section className="bg-[#F7F9FB] py-16 sm:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <SectionTitle id="technical-methods">Technical Methods of Deanonymization</SectionTitle>
                <p className="text-gray-700 leading-relaxed">
                  Platforms employ five primary methods, each with distinct strengths and limits. The most
                  effective combine several to maximize identification while preserving accuracy.
                </p>
              </FadeIn>

              <div className="mt-8 grid sm:grid-cols-2 gap-5">
                {[
                  { title: "IP Address Resolution", body: "Maps a visitor's IP to a known business using commercial IP intelligence built from BGP routing, WHOIS records, and ISP partnerships. Business IP ranges are more reliable than consumer ISPs; advanced systems flag VPN providers for alternative matching. IP alone identifies 20–40% of B2B traffic at the company level — but can't distinguish individuals at the same company, and struggles with remote workers on residential connections." },
                  { title: "Device Fingerprinting", body: "Builds a unique identifier from dozens of browser and hardware attributes — canvas rendering, WebGL, AudioContext, font lists, screen resolution, CPU cores, and behavioral signals like mouse and scroll patterns. Combining canvas, WebGL, and audio fingerprints yields unique IDs for 90%+ of desktop browsers, ideal for return visitors who cleared cookies." },
                  { title: "Cookie-Based Tracking", body: "Uses first-party cookies to maintain a persistent identifier across visits. As third-party cookies are deprecated by Chrome's Privacy Sandbox, Safari ITP, and Firefox ETP, first-party and server-side methods become critical. Cursive relies primarily on first-party cookies and server-side identification, positioning it for the post-cookie landscape." },
                  { title: "Probabilistic & Deterministic Matching", body: "Probabilistic matching uses ML to predict identity from partial signal overlap, targeting a sub-5% false-positive rate (typically a 75–85% confidence threshold). Deterministic matching links via exact identifiers — email clicks, logins, form fills — for 95%+ accuracy. Deterministic matches anchor probabilistic models: once confirmed, a visitor's fingerprint identifies them on future anonymous visits." },
                ].map((m, i) => (
                  <FadeIn key={m.title} delay={i * 0.05}>
                    <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                      <h3 className="text-lg font-medium text-gray-900">{m.title}</h3>
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{m.body}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>

              {/* Methods Comparison Table */}
              <FadeIn delay={0.1}>
                <h3 className="text-2xl font-light text-gray-900 mt-12 mb-4">Comparison of Methods</h3>
                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/60">
                        {["Method", "Accuracy", "Reach", "Persistence", "Privacy Impact", "Best For"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        ["IP Resolution", "70-85% (company)", "High", "Session-based", "Low", "Company-level ID"],
                        ["Device Fingerprinting", "80-90%", "High", "Cross-session", "Medium", "Return visitor tracking"],
                        ["Cookie Tracking", "85-95%", "Medium (declining)", "Until cleared", "Medium-High", "Cross-session linking"],
                        ["Probabilistic Matching", "70-90%", "Very High", "Model-dependent", "Medium", "Maximizing match volume"],
                        ["Deterministic Matching", "95%+", "Low", "Permanent (until revoked)", "Low (consent-based)", "Anchoring identity graphs"],
                      ].map((row) => (
                        <tr key={row[0]}>
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{row[0]}</td>
                          {row.slice(1).map((cell, j) => (
                            <td key={j} className="px-4 py-3 text-gray-600">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </FadeIn>
            </div>
          </Container>
        </section>

        {/* Identity Resolution Process */}
        <section className="bg-white py-16 sm:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <SectionTitle id="identity-resolution-process">The Identity Resolution Process</SectionTitle>
                <p className="text-gray-700 leading-relaxed">
                  The resolution pipeline turns raw signals into enriched, actionable profiles across five
                  sequential stages, in real time (typically under 200ms) so sales alerts fire the moment
                  a visitor is identified.
                </p>
              </FadeIn>

              <div className="mt-8 space-y-5">
                {[
                  { title: "Stage 1 · Signal Collection", body: "The pixel collects network signals (IP, connection type, TLS fingerprint), browser signals (user agent, language, timezone), hardware signals (resolution, memory, CPU cores), and rendering signals (canvas hash, WebGL, fonts), transmitted via a non-blocking async request." },
                  { title: "Stage 2 · Candidate Generation", body: "The API queries the identity graph for candidate matches — IP lookups return all contacts at the matched organization; fingerprint lookups run a similarity search. This typically yields 1–50 candidates depending on company size and signal specificity." },
                  { title: "Stage 3 · Scoring", body: "Each candidate is scored by a weighted ensemble: signal overlap, temporal recency, behavioral consistency, and firmographic alignment — output as a normalized 0–100 confidence score." },
                  { title: "Stage 4 · Match Selection", body: "The highest-scoring candidate above the threshold wins. Ties are broken by relevance — a VP of Engineering on a docs page outranks an HR manager at the same company. Below threshold, the visitor is resolved at company level or flagged unresolved." },
                  { title: "Stage 5 · Enrichment", body: "The match is enriched with firmographics, verified contact details, technographics, and behavioral context, then routed to CRM records, Slack, sales engagement tools, or a Custom Audience segment." },
                ].map((stage, i) => (
                  <FadeIn key={stage.title} delay={i * 0.04}>
                    <div className="rounded-2xl border border-gray-200 p-6 sm:p-8">
                      <h3 className="text-base font-medium text-gray-900">{stage.title}</h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{stage.body}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Accuracy & Confidence Scoring */}
        <section className="bg-[#F7F9FB] py-16 sm:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <SectionTitle id="accuracy-confidence-scoring">Accuracy and Confidence Scoring</SectionTitle>
                <p className="text-gray-700 leading-relaxed">
                  Confidence scoring separates enterprise-grade deanonymization from basic reverse-IP
                  lookups. Tiering every identification lets teams act only on reliable matches, reducing
                  wasted outreach and improving conversion.
                </p>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white mt-8">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/60">
                        {["Confidence Level", "Score", "Typical Method", "Use Case", "Accuracy"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        ["Deterministic", "95-100", "Email match, login, form submission", "Direct sales outreach", "95%+"],
                        ["High Confidence", "85-94", "Multi-signal (IP + fingerprint + cookie)", "SDR outreach, ABM campaigns", "85-95%"],
                        ["Moderate Confidence", "70-84", "IP resolution + one additional signal", "Nurture, ad targeting", "70-85%"],
                        ["Low Confidence", "Below 70", "Single-signal IP or weak fingerprint", "Aggregate analytics", "Below 70%"],
                      ].map((row) => (
                        <tr key={row[0]}>
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{row[0]}</td>
                          {row.slice(1).map((cell, j) => (
                            <td key={j} className="px-4 py-3 text-gray-600">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </FadeIn>

              <FadeIn delay={0.15}>
                <p className="text-gray-700 leading-relaxed mt-6">
                  The tier distinction is critical for{" "}
                  <Link href="/what-is-lead-enrichment" className="text-primary hover:underline">lead enrichment</Link>{" "}
                  workflows. High-confidence matches can trigger immediate, personalized outreach.
                  Moderate matches suit lower-risk nurture campaigns. Low-confidence matches should drive
                  only aggregate reporting and audience sizing &mdash; never individual-level action.
                </p>
              </FadeIn>
            </div>
          </Container>
        </section>

        {/* Privacy & Ethics */}
        <section className="bg-white py-16 sm:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <SectionTitle id="privacy-ethics">Privacy and Ethics</SectionTitle>
                <p className="text-gray-700 leading-relaxed">
                  Responsible deanonymization requires a clear grasp of privacy regulations and ethical
                  data practices. The legal landscape varies by jurisdiction, and B2B marketers must
                  implement appropriate safeguards to stay compliant and maintain trust.
                </p>
              </FadeIn>

              <div className="mt-8 space-y-5">
                {[
                  { title: "Consent Frameworks", body: "Under GDPR, B2B visitor identification can run under Article 6(1)(f) legitimate interest when processing serves the business's interests without overriding the data subject's rights — common where individuals act in a professional capacity. Businesses should document a legitimate interest assessment, provide clear privacy notices, and keep records of processing. The ePrivacy Directive adds consent requirements for device storage access in the EU. In the US, CCPA and state laws require disclosure and opt-out but generally not affirmative consent for B2B processing." },
                  { title: "Data Minimization", body: "Ethical platforms collect only the signals needed for identification, retain data only as long as required, and process the minimum information for the stated purpose. Cursive enforces automated retention policies — purging raw signal data after identification and keeping only the enriched profile data needed for business use." },
                  { title: "Opt-Out & Right to Be Forgotten", body: "Visitors must have a clear path to opt out and request deletion: a visible opt-out mechanism, honored Do Not Track signals where applicable, deletion within regulatory timeframes (30 days under GDPR), and suppression lists that prevent re-identification of opted-out visitors." },
                ].map((item, i) => (
                  <FadeIn key={item.title} delay={i * 0.04}>
                    <div className="rounded-2xl border border-gray-200 p-6 sm:p-8">
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.body}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Technical Implementation */}
        <section className="bg-[#F7F9FB] py-16 sm:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <SectionTitle id="technical-implementation">Technical Implementation</SectionTitle>
                <p className="text-gray-700 leading-relaxed">
                  Implementation runs from pixel installation to ongoing pipeline management. Complexity
                  varies by platform, but the architecture follows a consistent pattern.
                </p>
              </FadeIn>

              <div className="mt-8 grid sm:grid-cols-2 gap-5">
                {[
                  { title: "Pixel Installation", body: "A lightweight JavaScript tag (2–5 KB gzipped) added to every page — directly in the HTML head, via a tag manager, or server-side. It loads asynchronously and starts collecting signals on execution. The Cursive Visitor Pixel installs in one line and 60 seconds on any framework." },
                  { title: "API Integration", body: "REST APIs give programmatic access to visitor data for custom enrichment, real-time CRM updates, and content personalization. Typical endpoints cover visitor lookup, contact enrichment, and audience management." },
                  { title: "Webhook Configuration", body: "Webhooks deliver real-time, event-driven data: when a visitor is identified, the platform POSTs the enriched profile to your endpoint — triggering a Slack alert, CRM update, or audience add. Payloads include identity, company data, session behavior, and the confidence score." },
                  { title: "Real-Time vs. Batch", body: "Real-time processing identifies visitors within seconds for immediate action; batch processing resolves sessions in bulk at intervals, which is more cost-effective for high-traffic informational content. Most platforms support both — real-time for high-intent pages, batch for the rest." },
                ].map((item, i) => (
                  <FadeIn key={item.title} delay={i * 0.05}>
                    <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.body}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Challenges */}
        <section className="bg-white py-16 sm:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <SectionTitle id="challenges">Challenges in Visitor Deanonymization</SectionTitle>
                <p className="text-gray-700 leading-relaxed">
                  Despite major advances, several challenges still limit the accuracy and reach of
                  deanonymization.
                </p>
              </FadeIn>

              <div className="mt-8 space-y-4">
                {[
                  { title: "VPN & Proxy Traffic", body: "An estimated 31% of internet users use a VPN regularly, and corporate policies mask many high-value B2B visitors. Platforms mitigate with VPN detection and fingerprint fallback, but it remains a real gap." },
                  { title: "Bot Detection", body: "Up to 42% of web traffic is bots (Imperva 2025 Bad Bot Report). Systems must filter bots before the identification pipeline using behavioral analysis and known bot IP/user-agent databases." },
                  { title: "Mobile Identification", body: "Mobile visitors switch between Wi-Fi and cellular (changing IPs), offer a smaller fingerprinting surface, and fragment sessions across app-to-web handoffs. Mobile match rates run 20–40% below desktop." },
                  { title: "Privacy Regulations", body: "New US state laws, GDPR enforcement, and emerging APAC frameworks impose differing consent, retention, and cross-border rules — requiring ongoing compliance monitoring." },
                  { title: "Data Freshness", body: "B2B contact data decays ~30% per year as people change jobs and companies change IPs. Without active validation and refresh, a third of matches go stale within 12 months — which is why Cursive refreshes its graph every 30 days against NCOA." },
                ].map((item, i) => (
                  <FadeIn key={item.title} delay={i * 0.04}>
                    <div className="rounded-2xl border border-gray-200 p-6 sm:p-7">
                      <h3 className="text-base font-medium text-gray-900">{item.title}</h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.body}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Provider Comparison */}
        <section className="bg-[#F7F9FB] py-16 sm:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <SectionTitle id="provider-comparison">Provider Comparison</SectionTitle>
                <p className="text-gray-700 leading-relaxed">
                  The market includes several platforms with different strengths. Here is how leading
                  providers compare. For a deeper analysis, see our{" "}
                  <Link href="/blog/clearbit-alternatives-comparison" className="text-primary hover:underline">Clearbit alternatives comparison</Link>.
                </p>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white mt-8">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/60">
                        {["Feature", "Cursive", "RB2B", "Warmly", "Leadfeeder", "Clearbit"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        ["Individual-Level ID", "Yes", "Yes", "Yes", "Company only", "Company + enrichment"],
                        ["Contact Database Size", "200M+ contacts", "Not disclosed", "100M+ contacts", "Company-level only", "100M+ contacts"],
                        ["Match Method", "Deterministic, offline-rooted", "Probabilistic", "Probabilistic", "IP-based", "IP + enrichment"],
                        ["Intent Audiences", "Custom Audience add-on", "Page-level only", "Bombora integration", "Basic page tracking", "Third-party integration"],
                        ["Pricing Model", "Flat monthly from $97", "Per-lead credits", "Seat-based", "Per-lead credits", "API call volume"],
                      ].map((row) => (
                        <tr key={row[0]}>
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{row[0]}</td>
                          {row.slice(1).map((cell, j) => (
                            <td key={j} className="px-4 py-3 text-gray-600">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </FadeIn>
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="bg-white py-16 sm:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <SectionTitle id="faqs">Frequently Asked Questions</SectionTitle>
              </FadeIn>
              <div className="mt-6 space-y-4">
                {faqs.map((faq, i) => (
                  <FadeIn key={faq.question} delay={i * 0.03}>
                    <div className="rounded-2xl border border-gray-200 p-6 sm:p-7">
                      <h3 className="text-base font-medium text-gray-900">{faq.question}</h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Related Resources */}
        <section className="bg-[#F7F9FB] py-16 sm:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <SectionTitle id="related-resources">Related Resources</SectionTitle>
                <p className="text-gray-700 leading-relaxed">
                  Continue learning about visitor identification and B2B data with these guides and
                  platform pages.
                </p>
              </FadeIn>
              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {[
                  { title: "What is Website Visitor Identification?", href: "/what-is-website-visitor-identification", desc: "How visitor identification works at the company and individual level" },
                  { title: "What is B2B Intent Data?", href: "/what-is-b2b-intent-data", desc: "How intent signals reveal buying behavior and accelerate pipeline" },
                  { title: "What is Lead Enrichment?", href: "/what-is-lead-enrichment", desc: "Appending firmographic, technographic, and contact data to leads" },
                  { title: "Cursive Visitor Identification", href: "/visitor-identification", desc: "See how Cursive identifies anonymous visitors in real time" },
                  { title: "The Cursive Visitor Pixel", href: "/pixel", desc: "Identify the companies and people on your site for $97/mo" },
                  { title: "Clearbit Alternatives Comparison", href: "/blog/clearbit-alternatives-comparison", desc: "Compare leading data enrichment and identification providers" },
                  { title: "Warmly vs. Cursive Comparison", href: "/blog/warmly-vs-cursive-comparison", desc: "A detailed comparison of two visitor identification approaches" },
                  { title: "B2B Software Industry Solutions", href: "/industries/b2b-software", desc: "How SaaS companies use deanonymization to grow pipeline" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-5 hover:border-primary transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                        {link.title}
                      </span>
                      <p className="mt-1 text-xs text-gray-500 leading-relaxed">{link.desc}</p>
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Final CTA */}
        <section className="bg-white py-20 sm:py-28">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900">
                See deanonymization
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                  in action
                </span>
              </h2>
              <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                The Cursive Visitor Pixel resolves anonymous traffic against a deterministic identity graph
                of 280M+ verified consumer and 140M+ business profiles &mdash; a 40&ndash;60% match rate vs
                2&ndash;5% for cookie tools and 10&ndash;15% for IP databases. Install in 60 seconds, $97/mo,
                month-to-month.
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
          <h1 className="text-2xl font-bold mb-4">What is Visitor Deanonymization? Complete Technical Guide (2026)</h1>

          <p className="text-gray-700 mb-6">
            Visitor deanonymization is the technical process of resolving anonymous website visitor sessions into identified individual or company profiles. It works by matching device fingerprints, IP signals, cookies, and behavioral patterns against databases of known business contacts. Published: January 15, 2026.
          </p>

          <MachineSection title="Key Takeaways">
            <MachineList items={[
              "95-98% of B2B website visitors leave without identifying themselves",
              "Deanonymization resolves anonymous sessions to company or individual profiles",
              "Methods: Deterministic matching (95%+ accuracy), Probabilistic matching (70-95% accuracy), IP resolution, device fingerprinting",
              "Confidence scoring tiers: High (85%+), Moderate (70-85%), Low (<70%)",
              "Legal under GDPR with legitimate interest basis for B2B marketing; CCPA requires disclosure"
            ]} />
          </MachineSection>

          <MachineSection title="Technical Methods">
            <MachineList items={[
              "IP Address Resolution — Map IP addresses to companies via ISP registrations and corporate IP databases (20-40% of B2B traffic)",
              "Device Fingerprinting — Browser, OS, screen resolution, installed fonts, WebGL create unique device signature",
              "Cookie Matching — First-party and third-party cookies link sessions to known identity graphs",
              "Deterministic Matching — Email/login-based exact matches (95%+ accuracy but limited coverage)",
              "Probabilistic Matching — Statistical models combining multiple signals for likely identification (70-95% accuracy)",
              "Cross-Device Graphs — Link desktop, mobile, and tablet sessions to single user profiles"
            ]} />
          </MachineSection>

          <MachineSection title="Confidence Scoring">
            <MachineList items={[
              "High Confidence (85%+) — Deterministic match from login, email click, or verified cookie; safe for direct outreach",
              "Moderate Confidence (70-85%) — Strong probabilistic match from multiple correlated signals; good for targeted campaigns",
              "Low Confidence (<70%) — Single-signal match like IP-only; use for company-level targeting and display ads only",
              "Best practice: Set different activation thresholds for different channels based on confidence level"
            ]} />
          </MachineSection>

          <MachineSection title="Data Pipeline Architecture">
            <MachineList items={[
              "Collection Layer — JavaScript tag captures IP, user agent, device fingerprint, page views, session behavior",
              "Resolution Layer — Multi-source matching against IP databases, identity graphs, and first-party data",
              "Enrichment Layer — Append firmographic, technographic, and contact data to resolved identities",
              "Scoring Layer — Assign confidence scores and engagement scores based on visit behavior",
              "Activation Layer — Push identified visitors to CRM, marketing automation, and sales engagement platforms"
            ]} />
          </MachineSection>

          <MachineSection title="Privacy & Compliance">
            <MachineList items={[
              "GDPR — B2B deanonymization permissible under Article 6(1)(f) legitimate interest with proper DPIA and transparency",
              "CCPA/CPRA — Requires disclosure of data collection practices and opt-out mechanism",
              "ePrivacy Directive — Cookie consent required for tracking cookies in EU jurisdictions",
              "Best practices: Consent management platform, data minimization, retention limits, suppression lists, regular DPIAs",
              "B2B-focused deanonymization (business contact data) generally has more permissive treatment than B2C"
            ]} />
          </MachineSection>

          <MachineSection title="Implementation Guide">
            <MachineList items={[
              "Step 1: Deploy JavaScript tracking tag on all website pages",
              "Step 2: Connect to identity resolution provider (IP database, cookie matching, device fingerprinting)",
              "Step 3: Configure confidence thresholds and enrichment pipeline",
              "Step 4: Integrate with CRM and marketing automation for activation",
              "Step 5: Set up privacy controls, consent management, and suppression lists",
              "Step 6: Monitor match rates, accuracy, and compliance on ongoing basis"
            ]} />
          </MachineSection>

          <MachineSection title="Provider Comparison">
            <MachineList items={[
              "Cursive — Individual + company-level identification, deterministic offline-rooted graph, flat monthly pricing from $97/mo",
              "RB2B — Individual-level identification, Slack/CRM alerts, per-lead credit pricing",
              "Warmly — Individual-level identification with chat, seat-based pricing",
              "Leadfeeder — Company-level IP resolution, CRM integration, per-lead credits",
              "Clearbit Reveal — Company-level IP resolution, deep HubSpot integration"
            ]} />
          </MachineSection>

          <MachineSection title="Cursive Offer">
            <p className="text-gray-700 mb-3">
              Cursive sells three self-serve, month-to-month plans. The Visitor Pixel performs deanonymization: it resolves anonymous B2B traffic against a deterministic identity graph of 280M+ verified consumer and 140M+ business profiles, delivering a 40–60% match rate (vs 2–5% for cookies, 10–15% for IP databases) with 60–80% accuracy on each matched record.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) — Deanonymize the companies and people visiting your site",
              "Custom Audience ($197/month) — A fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) — Both, in one feed",
            ]} />
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "Website Visitor Identification Guide", href: "/what-is-website-visitor-identification", description: "Broader guide to visitor identification strategies" },
              { label: "B2B Intent Data Guide", href: "/what-is-b2b-intent-data", description: "Intent signals from deanonymized visitor behavior" },
              { label: "Lead Enrichment Guide", href: "/what-is-lead-enrichment", description: "Enriching deanonymized visitor profiles" },
              { label: "Cursive Visitor Identification", href: "/visitor-identification", description: "40–60% deterministic pixel match rate for B2B traffic" },
              { label: "The Visitor Pixel", href: "/pixel", description: "The product that deanonymizes your traffic, $97/mo" },
              { label: "Pricing", href: "/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" }
            ]} />
          </MachineSection>

          <MachineSection title="Get Started">
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "View Pricing", href: "https://www.meetcursive.com/pricing", description: "Plans from $97/mo, month-to-month" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team before you buy" }
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
