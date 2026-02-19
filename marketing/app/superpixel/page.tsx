"use client"

import { useState } from "react"
import { Container } from "@/components/ui/container"
import {
  CheckCircle2,
  ArrowRight,
  Play,
  Shield,
  TrendingUp,
  Clock,
  Users,
  Database,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

const CAL_LINK = "https://cal.com/cursive/30min"

const faqs = [
  {
    question: "How is this different from other pixel tools claiming 60–80% match rates?",
    answer:
      "Match rate claims are misleading without context. A 60% claimed match rate typically yields ~15% usable contacts after data decay. Our geo-framed, NCOA-verified methodology means the matches we deliver are real, verified contacts — not bulk IP grabs padded to inflate numbers.",
  },
  {
    question: "Where does your data come from?",
    answer:
      "We license directly from primary data providers and maintain our own proprietary identity graph. We are not a reseller. We do not buy derivatives. Our data is refreshed via NCOA every 30 days and email-verified at 10–15M records per day.",
  },
  {
    question: "What's the bounce rate on your emails?",
    answer:
      "0.05% — verified against millions of records. Industry average for derivative-based data is 20%+.",
  },
  {
    question: "Can I run V4 alongside V3?",
    answer: "Yes. Both can run simultaneously on the same site.",
  },
  {
    question: "How do I get leads into my CRM?",
    answer:
      "Via persistent API, native workflow integrations (GoHighLevel, Klaviyo), or custom HTTP endpoints. We have templates and a 17-minute walkthrough video covering every scenario.",
  },
  {
    question: "What if my leads don't convert immediately?",
    answer:
      "Intent level matters. Medium-intent leads require a nurture-first approach — run DSP exposure before calling. High-intent leads are ready for direct outreach. We'll help you match your approach to the intent level.",
  },
]

export default function SuperPixelPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <main className="w-full">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1 — HERO
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#0A0E1A] text-white py-20 md:py-28">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            {/* Live badge */}
            <div className="inline-block bg-red-600/20 border border-red-500/40 text-red-400 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide mb-8">
              🔴 LIVE — Super Pixel V4 Now Available
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Turn Anonymous Website Visitors Into Verified, Contactable Leads —{" "}
              <span className="text-blue-400">Automatically</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed">
              The Cursive Super Pixel identifies, enriches, and delivers your website visitors as
              verified leads — complete with name, email, mobile, company, and intent score — in
              real time.
            </p>

            <p className="text-lg text-gray-400 mb-10 max-w-3xl mx-auto">
              Most businesses have no idea who&apos;s visiting their website. They run ads, drive
              traffic, and watch 97% of visitors leave without a trace. The Cursive Super Pixel
              changes that forever.
            </p>

            {/* CTA #1 */}
            <a
              href={CAL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-colors duration-200"
            >
              Book Your Free Demo Call <ArrowRight className="w-5 h-5" />
            </a>

            {/* Trust bar */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-10">
              {[
                "98% of US Households Covered",
                "60 Billion Intent Signals Daily",
                "10–15M Emails Verified Every Day",
                "Proprietary Identity Graph — Not a Reseller",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-left">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2 — VSL VIDEO
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                See the Super Pixel in Action
              </h2>
            </div>

            {/* Watch Demo CTA */}
            <div className="bg-gray-900 rounded-xl p-12 flex flex-col items-center text-center mb-6">
              <p className="text-gray-300 text-base max-w-md mb-6">
                See how Cursive&apos;s Super Pixel turns anonymous traffic into a pipeline
                of verified, high-intent leads in under 5 minutes.
              </p>
              <a
                href={CAL_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors duration-200"
              >
                <Play className="w-5 h-5 fill-white" />
                Watch Live Demo
              </a>
            </div>

            {/* Results Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { stat: "70%", label: "ID Rate" },
                { stat: "420M+", label: "Verified Contacts" },
                { stat: "2-min", label: "Setup Time" },
                { stat: "$0", label: "Setup Fee" },
              ].map(({ stat, label }) => (
                <div key={label} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{stat}</div>
                  <div className="text-sm text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Warning box */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-8 text-center">
              <p className="text-orange-800 font-medium">
                ⚠️ If you&apos;re currently buying leads, running cold outreach, or paying for ads
                without knowing who&apos;s visiting your site — you&apos;re leaving serious money on
                the table.
              </p>
            </div>

            {/* CTA #2 */}
            <div className="text-center">
              <a
                href={CAL_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors duration-200"
              >
                Book a Call to See It Live <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3 — PROBLEM
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#F8F9FA] py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700 mb-4">
                The Problem
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Most Lead Generation Is Broken
              </h2>
              <p className="text-lg text-gray-600">
                The lead generation industry has a dirty secret. Most data you&apos;re buying is...
              </p>
            </div>

            {/* Problem bullets */}
            <ul className="space-y-4 mb-10">
              {[
                "2–3 generations removed from the original source — diluted derivatives of derivatives",
                "12–15% decayed every single year because 12–15% of the US population moves annually, and most providers never run NCOA (National Change of Address) verification",
                "Delivering 50% invalid emails and mobile numbers with only 25–30% accuracy",
                "Claiming 60–80% match rates that in reality produce only ~15% usable contacts after data decay is factored in",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <span className="text-red-600 font-bold text-sm">✕</span>
                  </span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>

            {/* Callout quote */}
            <blockquote className="bg-white border-l-4 border-gray-900 rounded-r-xl p-6 mb-8 shadow-sm">
              <p className="text-gray-800 italic text-lg leading-relaxed">
                &ldquo;If a data company popped up out of nowhere and they&apos;re doing it cheaper
                — it doesn&apos;t make financial sense. Economically, it doesn&apos;t make sense for
                them to charge that price if they actually have the real thing.&rdquo;
              </p>
            </blockquote>

            <p className="text-gray-700 mb-4">
              Your sales team is calling dead numbers, emailing bounced addresses, and chasing
              people who moved two years ago.
            </p>
            <p className="text-gray-900 font-bold text-lg">
              Cursive is different. Here&apos;s why.
            </p>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4 — SOLUTION
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700 mb-4">
                The Solution
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Introducing the Cursive Super Pixel — The V4
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The Cursive Super Pixel is not a data reseller product. It is a proprietary identity
                resolution and lead generation engine built on:
              </p>
            </div>

            {/* Feature cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Shield className="w-6 h-6 text-blue-600" />,
                  title: "Proprietary Identity Graph",
                  desc: "Not sourced from a reseller, not a derivative. We built and own our identity graph.",
                },
                {
                  icon: <Database className="w-6 h-6 text-blue-600" />,
                  title: "Direct Licensing",
                  desc: "Direct licensing with primary data providers. We go to the source — no middlemen, no derivatives.",
                },
                {
                  icon: <Globe className="w-6 h-6 text-blue-600" />,
                  title: "UID2 Integration",
                  desc: "The only universal identifier dispersed across every website in the United States. We're integrated.",
                },
                {
                  icon: <Clock className="w-6 h-6 text-blue-600" />,
                  title: "NCOA Refreshed Every 30 Days",
                  desc: "Continuous address verification so your data never goes stale — unlike static datasets.",
                },
                {
                  icon: <Users className="w-6 h-6 text-blue-600" />,
                  title: "98% US Household Coverage",
                  desc: "7 billion historic hashed emails tied to UID2 and cookies. 98% of US households observed.",
                },
                {
                  icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
                  title: "50,000 Records/Second",
                  desc: "Stateless worker architecture. Your data flows don't time out, bottleneck, or fall behind.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                    <p className="text-gray-600 text-sm">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="text-gray-500 italic text-lg">
                This is not a static dataset you buy once and hope for the best. Data is a living,
                breathing thing — and we treat it that way.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5 — HOW IT WORKS
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#0A0E1A] text-white py-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white/10 text-white border border-white/20 mb-4">
                How It Works
              </span>
              <h2 className="text-3xl md:text-4xl font-bold">
                How the Cursive Super Pixel Identifies Your Visitors
              </h2>
            </div>

            <div className="space-y-10">
              {/* Step 1 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Install the V4 Pixel</h3>
                  <p className="text-gray-400">
                    Drop a single line of code on your website. Takes minutes. Works alongside V3 if
                    you&apos;re already running it.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Visitor Identification Begins</h3>
                  <p className="text-gray-400 mb-4">
                    The moment someone lands on your site, our pixel fires across three resolution
                    layers:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-2 pr-4 text-gray-300 font-semibold">Layer</th>
                          <th className="text-left py-2 pr-4 text-gray-300 font-semibold">Method</th>
                          <th className="text-left py-2 text-gray-300 font-semibold">Contribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/10">
                          <td className="py-2 pr-4 text-gray-300">Cookie-to-Hash</td>
                          <td className="py-2 pr-4 text-gray-400">UID2 integration</td>
                          <td className="py-2 text-gray-400">10–15% of matches</td>
                        </tr>
                        <tr className="border-b border-white/10">
                          <td className="py-2 pr-4 text-gray-300">IP-to-Hash</td>
                          <td className="py-2 pr-4 text-gray-400">Geo-verified matching</td>
                          <td className="py-2 text-gray-400">~50% of matches</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 text-gray-300">Device + Geo</td>
                          <td className="py-2 pr-4 text-gray-400">Quality control framing</td>
                          <td className="py-2 text-gray-400">Verification layer</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Geo Framing & Quality Control</h3>
                  <p className="text-gray-400">
                    Unlike competitors who grab IPs in bulk and call it a match, we match the logged
                    IP to the exact consumer latitude and longitude, build a geo-radius around that
                    household, and verify whether the IP is tied to that individual or shared. This
                    is why our bounce rate is{" "}
                    <span className="text-green-400 font-semibold">0.05%</span> — vs the industry
                    standard of 20%+.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Intent Scoring</h3>
                  <p className="text-gray-400">
                    Every matched visitor is scored against 60 billion daily intent signals across
                    250,000+ domains using distance scoring and 7-day behavioral baseline deviation
                    detection.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                  5
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Enriched Lead Delivered</h3>
                  <p className="text-gray-400 mb-3">
                    Within minutes, you receive:
                  </p>
                  <ul className="space-y-1.5">
                    {[
                      "First & last name",
                      "Verified business email",
                      "Verified mobile number",
                      "Company name & description",
                      "Intent score (Low / Medium / High)",
                      "Page visited + timestamp",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-gray-400 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                  6
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Activate Across Your Stack</h3>
                  <p className="text-gray-400">
                    Push leads directly to GoHighLevel, Klaviyo, Make / Zapier / n8n, Custom HTTP /
                    DSP endpoints, or any platform via persistent API.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA #3 */}
            <div className="mt-14 text-center">
              <a
                href={CAL_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors duration-200"
              >
                Book a Demo — We&apos;ll Show It Running on Your Website <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6 — STATS
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-green-100 text-green-700 mb-4">
                By the Numbers
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                The Numbers Don&apos;t Lie
              </h2>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { number: "98%", label: "US Households Covered" },
                { number: "60B+", label: "Daily Intent Signals" },
                { number: "10–15M", label: "Daily Email Verifications" },
                { number: "0.05%", label: "Email Bounce Rate" },
                { number: "30 Days", label: "NCOA Refresh Cycle" },
                { number: "$250K/mo", label: "Internal Data Maintenance" },
                { number: "50,000", label: "Records Per Second" },
                { number: "7B", label: "Historic Hashed Emails" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm"
                >
                  <div className="text-3xl font-bold text-blue-600 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Callout box */}
            <div className="border-l-4 border-blue-600 bg-blue-50 rounded-r-xl p-6 mb-10">
              <p className="text-gray-800">
                <span className="font-semibold">What competitors don&apos;t tell you:</span> A
                claimed 60% match rate typically yields only ~15% usable contacts after data decay.
                Our geo-framed, NCOA-verified methodology means the matches we deliver are real.
              </p>
            </div>

            {/* CTA #4 */}
            <div className="text-center">
              <a
                href={CAL_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors duration-200"
              >
                See Your Actual Visitor Data — Book a Demo <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7 — INTENT DATA
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#F8F9FA] py-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-purple-100 text-purple-700 mb-4">
                Intent Intelligence
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Not All Intent Is Created Equal
              </h2>
              <p className="text-lg text-gray-600">
                Every intent data provider will tell you they have the best signals. Here&apos;s
                what they won&apos;t tell you: Most intent models are built on the same 3–4 core
                feeds. The difference isn&apos;t the feed — it&apos;s the model.
              </p>
            </div>

            {/* Two scenario cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-gray-100 border border-gray-200 rounded-xl p-6">
                <div className="inline-block bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
                  Not Intent
                </div>
                <p className="text-gray-700 text-base leading-relaxed">
                  Someone reads a Yahoo Finance article about a lawyer who got sued for tax fraud.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="inline-block bg-green-200 text-green-800 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
                  True Intent
                </div>
                <p className="text-gray-700 text-base leading-relaxed">
                  Someone posts on a forum: &ldquo;Who is the best personal injury lawyer in Texas?
                  I need to hire someone.&rdquo;
                </p>
              </div>
            </div>

            {/* How our model works */}
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              How Cursive&apos;s Intent Model Works
            </h3>
            <ul className="space-y-3 mb-10">
              {[
                "Trained on hard negatives and false positives — real feedback from real campaigns",
                "Closed feedback loop: audiences are called, results reported back, the model learns",
                "Distance scoring between URL and topic — if the distance is too far, it's excluded entirely",
                "7-day behavioral baseline per profile — we only surface genuine intent spikes, not noise",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>

            {/* Intent level table */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-sm border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Intent Level</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">What It Means</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Best Approach</th>
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
                    <td className="py-3 px-4 text-gray-600">Nurture first — run DSP exposure before calling</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">🟢 Low</td>
                    <td className="py-3 px-4 text-gray-600">Early awareness, passive interest</td>
                    <td className="py-3 px-4 text-gray-600">Brand awareness, retargeting</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pro tip */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-amber-800">
                <span className="font-semibold">Pro tip:</span> If you&apos;re getting medium-intent
                leads and going straight for the close, they&apos;ll hang up. Match your script to
                the intent level.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8 — WHY CURSIVE
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Why Cursive Is the Only Pixel You Should Be Running
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  num: "1",
                  title: "We Own Our Identity Graph",
                  desc: "Building a proprietary identity graph required significant capital investment. No reseller can replicate this overnight. This is infrastructure-level differentiation.",
                },
                {
                  num: "2",
                  title: "We License Directly — No Derivatives",
                  desc: "Every time data passes through another reseller, it gets diluted. We go to the source. Our data doesn't have three generations of decay baked in.",
                },
                {
                  num: "3",
                  title: "We Verify Continuously — Not Once",
                  desc: "NCOA every 30 days. Email validation at 10–15M records/day. IP-to-household matching refreshed on a rolling basis.",
                },
                {
                  num: "4",
                  title: "UID2 Integration",
                  desc: "The only universal identifier dispersed across every website in the US. Competitors claiming unique fingerprinting without UID2 simply don't have the infrastructure.",
                },
                {
                  num: "5",
                  title: "Stateless Worker Architecture",
                  desc: "Processes up to 50,000 records per second. Your data flows don't time out, don't bottleneck, and scale with your volume.",
                },
                {
                  num: "6",
                  title: "The V4 Pixel",
                  desc: "Our most advanced pixel build. Runs alongside V3, supports B2B and B2C segmentation, feeds directly into Studio for real-time segment building.",
                },
              ].map((card) => (
                <div key={card.num} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    {card.num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                    <p className="text-gray-600 text-sm">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8.5 — INTERACTIVE DEMO
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#F8F9FA] py-20">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700 mb-4">
                See It In Action
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                This Is What You&apos;ll Receive for Every Matched Visitor
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                A real enriched lead record — delivered to your CRM, inbox, or platform in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* Sample Lead Card */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                  <span className="text-white font-semibold text-sm uppercase tracking-wide">Sample Lead Record</span>
                  <span className="bg-green-400 text-green-900 text-xs font-bold px-2.5 py-1 rounded-full">🔴 High Intent</span>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">James Sullivan</p>
                    <p className="text-gray-500 text-sm mt-0.5">VP of Sales · Meridian Technology Group</p>
                  </div>
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    {[
                      { label: "Email", value: "j.sullivan@meridiantech.com", verified: true },
                      { label: "Mobile", value: "+1 (512) 847-2391", verified: true },
                      { label: "Company", value: "Meridian Technology Group" },
                      { label: "Page Visited", value: "/pricing" },
                      { label: "Visit Time", value: "Today at 2:14 PM CST" },
                      { label: "Intent Score", value: "High (7-day spike detected)" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 w-28 flex-shrink-0">{row.label}</span>
                        <span className="text-sm text-gray-900 font-medium flex-1">{row.value}</span>
                        {row.verified && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-6 pb-5">
                  <p className="text-xs text-gray-400 text-center">* Sample record — actual data fields vary by match quality</p>
                </div>
              </div>

              {/* Pipeline steps */}
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-6">
                  From Anonymous Visitor to Contactable Lead in 5 Steps
                </h3>
                <div className="space-y-0">
                  {[
                    { step: "1", label: "Visitor lands on your site", detail: "Pixel fires instantly — no delay, no lag" },
                    { step: "2", label: "Identity resolution begins", detail: "UID2 + IP geo-framing + device matching" },
                    { step: "3", label: "NCOA verification", detail: "Address and contact freshness confirmed against 30-day refresh cycle" },
                    { step: "4", label: "Intent scoring applied", detail: "60B+ daily signals — 7-day behavioral baseline deviation checked" },
                    { step: "5", label: "Lead delivered to your stack", detail: "To your CRM, inbox, dialer, or API — in real time" },
                  ].map((item, i) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {item.step}
                        </div>
                        {i < 4 && <div className="w-px h-8 bg-blue-200 my-1" />}
                      </div>
                      <div className="pb-5">
                        <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                        <p className="text-gray-500 text-sm mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href={CAL_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200 text-sm mt-2"
                >
                  See It Running on Your Website <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 9 — THE OFFER
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#0A0E1A] text-white py-20">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white/10 text-white border border-white/20 mb-4">
                How It Works With Cursive
              </span>
              <h2 className="text-3xl md:text-4xl font-bold">How the Engagement Works</h2>
            </div>

            {/* 3 phase cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  phase: "Phase 1",
                  title: "Trial Period",
                  desc: "Install the V4 Pixel on your website. We'll set it up with you. Within days, you'll see verified, enriched lead records flowing in from your existing traffic — traffic you were previously losing forever.",
                },
                {
                  phase: "Phase 2",
                  title: "Activation",
                  desc: "Connect your leads to your CRM, dialer, or email platform. Start working the list. See the quality firsthand.",
                },
                {
                  phase: "Phase 3",
                  title: "Scale",
                  desc: "Build out your full workflow — intent audiences, DSP exposure campaigns, automated outreach sequences, and persistent API delivery.",
                },
              ].map((phase) => (
                <div key={phase.phase} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-blue-400 text-xs font-bold uppercase tracking-wide mb-1">
                    {phase.phase}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{phase.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{phase.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-gray-300 italic text-lg mb-10">
              You&apos;re not buying a static list. You&apos;re installing a lead generation engine
              that runs 24/7 on your existing traffic.
            </p>

            {/* What you get */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-10">
              <h3 className="text-xl font-semibold mb-6 text-center">What You Get</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "V4 Pixel installation & onboarding",
                  "Access to Cursive Studio for segment building",
                  "Verified emails + mobiles on every matched visitor",
                  "Intent scoring (Low / Medium / High)",
                  "Deep email verification API access",
                  "Workflow templates for GoHighLevel, Klaviyo, Make, and more",
                  "Dedicated onboarding support",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA #5 */}
            <div className="text-center">
              <a
                href={CAL_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 py-4 rounded-xl text-lg transition-colors duration-200"
              >
                Book Your Demo Call Now <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 10 — ONBOARDING
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Getting Started Is Simple
              </h2>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 hidden md:block" />

              <div className="space-y-8">
                {[
                  { n: 1, text: "Book a call with our team" },
                  {
                    n: 2,
                    text: "Trial kickoff — we walk you through pixel installation (V3 or V4, or both)",
                  },
                  {
                    n: 3,
                    text: "First leads arrive — typically within 24–48 hours of installation",
                  },
                  {
                    n: 4,
                    text: "Studio setup — we build your first segments together (B2B, B2C, or both)",
                  },
                  {
                    n: 5,
                    text: "CRM integration — connect to your platform of choice via workflow or persistent API",
                  },
                  {
                    n: 6,
                    text: "Intent layering — add intent scoring to your segments for prioritized outreach",
                  },
                  {
                    n: 7,
                    text: "Scale — expand to DSP exposure, cold email sequences, and multi-channel workflows",
                  },
                ].map((step) => (
                  <div key={step.n} className="flex gap-6 relative">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold z-10">
                      {step.n}
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-gray-700">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 11 — FAQ
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#F8F9FA] py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                >
                  <button
                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-5">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 12 — FINAL CTA
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#007AFF] text-white py-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Stop Losing Your Website Traffic?
            </h2>
            <p className="text-xl text-white/90 mb-4 leading-relaxed">
              Every day your pixel isn&apos;t installed, verified leads are leaving your website and
              going to your competitors.
            </p>
            <p className="text-white/80 mb-10 leading-relaxed">
              The V4 Pixel turns that traffic into a contactable, enriched, intent-scored pipeline —
              automatically. Book a call. We&apos;ll show you exactly how it works on your website,
              live.
            </p>

            {/* CTA #6 */}
            <a
              href={CAL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-[#007AFF] hover:bg-gray-100 font-bold px-10 py-5 rounded-xl text-xl transition-colors duration-200 mb-6"
            >
              Book Your Free Demo Call <ArrowRight className="w-6 h-6" />
            </a>

            <p className="text-white/70 text-sm">
              No commitment. No pressure. Just a live demonstration of what the Cursive Super Pixel
              can do for your business.
            </p>

            {/* Footer line */}
            <div className="mt-16 pt-8 border-t border-white/20 flex items-center justify-center gap-2">
              <span className="text-white/60 text-sm">
                &copy; {new Date().getFullYear()} Cursive. All rights reserved.
              </span>
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}
