"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft, TrendingUp, Target, BarChart2, Zap } from "lucide-react"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"

const relatedPosts = [
  { title: "What Is Sales Intelligence?", description: "How sales intelligence data powers modern B2B prospecting.", href: "/blog/what-is-sales-intelligence" },
  { title: "Best AI SDR Tools for 2026", description: "9 AI SDR platforms ranked and compared with pricing.", href: "/blog/best-ai-sdr-tools-2026" },
  { title: "Visitor Identification Platform", description: "Turn anonymous website traffic into identified leads and pipeline.", href: "/visitor-identification" },
]

export default function WhatIsDemandGeneration() {
  return (
    <main>
      <HumanView>
        {/* Header */}
        <section className="py-12 bg-white">
          <Container>
            <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            <div className="max-w-4xl">
              <div className="inline-block px-3 py-1 bg-primary text-white rounded-full text-sm font-medium mb-4">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Demand Generation
              </div>
              <h1 className="text-5xl font-bold mb-6">
                What Is Demand Generation? Complete B2B Guide (2026)
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Demand generation creates awareness and interest before buyers are ready to purchase.
                Here is how it works, how it differs from lead gen, and how intent data makes it measurably more effective.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>February 18, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>11 min read</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Main Content */}
        <section className="py-12 bg-gray-50">
          <Container>
            <div className="max-w-4xl">

              {/* Definition */}
              <div className="bg-white rounded-xl p-8 mb-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-4">What Is Demand Generation?</h2>
                <p className="text-gray-700 mb-4">
                  <strong>Demand generation</strong> is a marketing strategy focused on creating awareness and interest
                  in your product or service among buyers who are not yet actively looking to purchase. The goal is to
                  plant your brand in the minds of your ideal customers so that when they enter a buying process, you
                  are already a known, trusted option.
                </p>
                <p className="text-gray-700 mb-4">
                  Unlike lead generation — which captures contact information from buyers already in-market — demand
                  generation works upstream. It educates, entertains, and builds credibility across the entire market,
                  not just the 5% actively buying at any given time.
                </p>
                <p className="text-gray-700">
                  Effective demand gen programs run across multiple channels: content marketing, SEO, paid social,
                  webinars, podcasts, and events. They are measured by pipeline influenced, not just MQL volume.
                </p>
              </div>

              {/* Demand Gen vs Lead Gen */}
              <div className="bg-white rounded-xl p-8 mb-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">Demand Generation vs. Lead Generation</h2>
                <p className="text-gray-700 mb-6">
                  The most common confusion in B2B marketing is conflating demand gen with lead gen. They serve
                  different functions in the revenue funnel:
                </p>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Dimension</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Demand Generation</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Lead Generation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 font-medium">Goal</td>
                        <td className="border border-gray-200 px-4 py-3">Create awareness and interest</td>
                        <td className="border border-gray-200 px-4 py-3">Capture contact information</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 font-medium">Buyer stage</td>
                        <td className="border border-gray-200 px-4 py-3">Not yet in-market</td>
                        <td className="border border-gray-200 px-4 py-3">Actively evaluating options</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 font-medium">Tactics</td>
                        <td className="border border-gray-200 px-4 py-3">Blog posts, podcasts, webinars, paid social</td>
                        <td className="border border-gray-200 px-4 py-3">Gated content, demos, trials, forms</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 font-medium">Primary metric</td>
                        <td className="border border-gray-200 px-4 py-3">Pipeline influenced</td>
                        <td className="border border-gray-200 px-4 py-3">MQLs, demos booked</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 font-medium">Time horizon</td>
                        <td className="border border-gray-200 px-4 py-3">6-18 months to show ROI</td>
                        <td className="border border-gray-200 px-4 py-3">Immediate pipeline impact</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 font-medium">Analogy</td>
                        <td className="border border-gray-200 px-4 py-3">Warming the market</td>
                        <td className="border border-gray-200 px-4 py-3">Harvesting the market</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-gray-700">
                  Most high-growth B2B companies need both. Demand gen fills the top of the funnel with educated
                  prospects; lead gen converts them. Skipping demand gen means constantly fighting for attention
                  against competitors who have been building trust for years.
                </p>
              </div>

              {/* Key Channels */}
              <div className="bg-white rounded-xl p-8 mb-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">Key Demand Generation Channels</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">1. Content Marketing and SEO</h3>
                    <p className="text-gray-700">
                      The highest-ROI demand gen channel long-term. Educational blog posts, comparison guides,
                      and how-to content rank in search engines and attract buyers actively researching your
                      category — without paying for each click. SEO demand gen compounds: a post written today
                      continues driving traffic and awareness for years. Focus on informational queries (what is,
                      how to, best practices) that your ICP searches before they know which vendor to use.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">2. Paid Social (LinkedIn, Meta)</h3>
                    <p className="text-gray-700">
                      LinkedIn is the primary paid demand gen channel for B2B because of its professional targeting
                      — you can reach specific job titles, company sizes, and industries. Run thought leadership
                      posts, video content, and ungated educational content to build familiarity before running
                      lead gen campaigns. Meta (Facebook/Instagram) works for B2B audiences at lower CPMs but
                      with less precise professional targeting.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">3. Webinars and Virtual Events</h3>
                    <p className="text-gray-700">
                      Webinars generate the highest engagement of any demand gen format — attendees spend
                      30-60 minutes learning from you. They also collect strong intent signals: who attended,
                      which questions they asked, and what topics they engaged with most. On-demand webinar
                      libraries become evergreen demand gen assets that educate buyers 24/7.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">4. Podcasts</h3>
                    <p className="text-gray-700">
                      Podcasts reach buyers in intimate, distraction-free moments — commutes, workouts, and
                      travel. Hosting a podcast positions your company as the category authority. Sponsoring
                      industry podcasts reaches established audiences of your ICP. Audio content builds
                      parasocial trust that is difficult to achieve through text or video alone.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">5. Events and Conferences</h3>
                    <p className="text-gray-700">
                      In-person and virtual events create high-quality brand impressions through face-to-face
                      interaction. Speaking at industry conferences positions your team as experts. Sponsoring
                      relevant events puts your brand in front of concentrated ICP audiences. Executive dinners
                      and roundtables are especially effective for enterprise demand gen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="bg-white rounded-xl p-8 mb-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">Demand Generation Metrics That Matter</h2>
                <p className="text-gray-700 mb-6">
                  The biggest mistake in demand gen measurement is optimizing for MQL volume. That incentivizes
                  quantity over quality — leading to SDR teams drowning in unqualified leads. Here are the metrics
                  that actually reflect demand gen health:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart2 className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">Pipeline Influenced</h3>
                    </div>
                    <p className="text-sm text-gray-700">Total pipeline value where a prospect touched demand gen content before entering a sales opportunity. The gold standard metric.</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold">Cost Per Pipeline Dollar</h3>
                    </div>
                    <p className="text-sm text-gray-700">Demand gen spend divided by pipeline created. Best-in-class teams achieve $0.05-$0.10 per pipeline dollar.</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold">MQL-to-SQL Rate</h3>
                    </div>
                    <p className="text-sm text-gray-700">Percentage of marketing-qualified leads accepted by sales. Strong demand gen quality produces 25-40% MQL-to-SQL rates.</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold">Brand Search Volume</h3>
                    </div>
                    <p className="text-sm text-gray-700">Branded search queries in Google Search Console. Rising branded searches signal growing demand gen awareness in your market.</p>
                  </div>
                </div>
              </div>

              {/* Intent Data and Cursive */}
              <div className="bg-white rounded-xl p-8 mb-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">How Intent Data Supercharges Demand Generation</h2>
                <p className="text-gray-700 mb-4">
                  The fundamental challenge with demand gen is that most of the buyers you reach are not ready
                  to buy yet. You spend money building awareness across your entire market — but you cannot tell
                  which demand gen visitors are now in an active buying cycle.
                </p>
                <p className="text-gray-700 mb-4">
                  Intent data solves this. By combining website visitor identification with third-party buying
                  signals, you can identify the subset of your demand gen audience that is actively in-market
                  right now — and route them to sales immediately instead of letting them drop into a 6-month
                  nurture sequence.
                </p>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-bold mb-4">How Cursive Connects Demand Gen to Pipeline</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                      <div>
                        <strong>Identify demand gen visitors</strong> — Cursive identifies 70% of anonymous website visitors by name, email, and LinkedIn, including everyone who reads your blog posts, watches your webinar recordings, or browses your pricing page.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                      <div>
                        <strong>Layer intent signals</strong> — Match those visitors against 60B+ behaviors & URLs scanned weekly to see which ones are also researching your category on G2, Capterra, competitor sites, and industry publications.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                      <div>
                        <strong>Route in-market accounts to sales</strong> — Buyers who hit your demand gen content AND show third-party intent signals are the highest-priority prospects. Route them to SDRs within hours, not weeks.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                      <div>
                        <strong>Weekly intent refresh</strong> — Buying windows are short. Cursive refreshes intent signals weekly so your team is always working with current data, not signals from 60 days ago.
                      </div>
                    </li>
                  </ul>
                </div>

                <p className="text-gray-700">
                  At $1,000/month with access to 250M+ professional profiles, Cursive makes it affordable for
                  demand gen teams of any size to identify which content visitors are actually in-market —
                  without enterprise-level contracts or complex integrations.
                </p>

                <div className="mt-4">
                  <Link href="/blog/what-is-buyer-intent" className="text-primary hover:underline font-medium">
                    Learn more about buyer intent data →
                  </Link>
                </div>
              </div>

              {/* Demand Gen Funnel */}
              <div className="bg-white rounded-xl p-8 mb-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">The Demand Generation Funnel</h2>
                <p className="text-gray-700 mb-6">
                  A demand gen funnel maps the journey from first brand awareness to sales-ready opportunity:
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Awareness</h3>
                      <p className="text-gray-700 text-sm">Buyer encounters your brand through a blog post, podcast mention, social post, or event. No active purchase intent yet — just brand recognition.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Education</h3>
                      <p className="text-gray-700 text-sm">Buyer engages with deeper content — webinars, case studies, comparison guides. They are learning about the problem and potential solutions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg">
                    <div className="w-12 h-12 bg-yellow-600 text-white rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0">3</div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Consideration</h3>
                      <p className="text-gray-700 text-sm">Buyer visits your site, views pricing, and compares vendors. This is where visitor identification is most valuable — surface these buyers to sales immediately.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg">
                    <div className="w-12 h-12 bg-red-600 text-white rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0">4</div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Intent</h3>
                      <p className="text-gray-700 text-sm">Buyer is actively evaluating, requesting demos, or trialing competitors. Speed to contact determines win rate. Intent data from Cursive identifies these buyers before they reach out.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <SimpleRelatedPosts posts={relatedPosts} />
              <DashboardCTA
                title="See Which Demand Gen Visitors Are Actually In-Market"
                description="Cursive identifies 70% of anonymous website visitors — including everyone who reads your blog, watches your webinars, and browses your pricing page. Start seeing names and emails behind your demand gen traffic."
                ctaText="Start Free Trial"
                ctaHref="https://leads.meetcursive.com"
              />

              {/* Related Links */}
              <div className="bg-white rounded-xl p-8 mt-8 border border-gray-200">
                <h2 className="text-2xl font-bold mb-4">Related Resources</h2>
                <ul className="space-y-2">
                  <li>
                    <Link href="/blog/what-is-buyer-intent" className="text-primary hover:underline">What Is Buyer Intent Data?</Link>
                  </li>
                  <li>
                    <Link href="/blog/what-is-sales-intelligence" className="text-primary hover:underline">What Is Sales Intelligence?</Link>
                  </li>
                  <li>
                    <Link href="/blog/how-to-identify-anonymous-website-visitors" className="text-primary hover:underline">How to Identify Anonymous Website Visitors</Link>
                  </li>
                  <li>
                    <Link href="/blog/icp-targeting-guide" className="text-primary hover:underline">ICP Targeting Guide</Link>
                  </li>
                  <li>
                    <Link href="/blog/intent-data-providers-comparison" className="text-primary hover:underline">Best Intent Data Providers (2026)</Link>
                  </li>
                </ul>
              </div>

            </div>
          </Container>
        </section>
      </HumanView>

      <MachineView>
        <MachineContent>
          <MachineSection title="What Is Demand Generation?">
            Demand generation is a B2B marketing strategy that creates awareness and interest in a product or service among buyers who are not yet ready to purchase. It encompasses content marketing, SEO, paid social, webinars, podcasts, and events designed to educate the market and build brand recognition before a buying process begins. Unlike lead generation, which captures contact information from in-market buyers, demand generation works upstream to warm the entire addressable market. It is measured by pipeline influenced, MQL-to-SQL rate, and cost per pipeline dollar rather than raw lead volume.
          </MachineSection>

          <MachineSection title="Demand Generation vs. Lead Generation">
            Demand generation creates demand where none existed; lead generation captures existing demand. Demand gen targets buyers not yet in an active evaluation; lead gen targets buyers already comparing vendors. Demand gen channels include blog posts, podcasts, webinars, and paid social awareness campaigns. Lead gen channels include gated content, demo requests, free trials, and contact forms. Best-practice B2B marketing programs use both: demand gen fills the funnel with educated prospects, lead gen converts them into pipeline. Demand gen ROI takes 6-18 months to materialize; lead gen produces immediate pipeline impact.
          </MachineSection>

          <MachineSection title="Key Demand Generation Channels">
            <MachineList items={[
              "Content marketing and SEO: Educational blog posts, comparison guides, and how-to content that ranks organically for category queries and compounds over time.",
              "LinkedIn paid social: Professional targeting by job title, company size, and industry for thought leadership and brand awareness campaigns.",
              "Webinars and virtual events: High-engagement format (30-60 min) that builds trust and captures intent signals from attendees.",
              "Podcasts: Reaches buyers during commutes and off-hours; hosting a podcast positions the brand as category authority.",
              "Events and conferences: In-person brand impressions and executive networking for enterprise demand gen programs.",
            ]} />
          </MachineSection>

          <MachineSection title="Demand Generation Metrics">
            <MachineList items={[
              "Pipeline influenced: Total pipeline value where prospects touched demand gen content before entering a sales opportunity.",
              "Cost per pipeline dollar: Demand gen spend divided by pipeline created; best-in-class is $0.05-$0.10 per pipeline dollar.",
              "MQL-to-SQL rate: Percentage of marketing-qualified leads accepted by sales; strong demand gen quality produces 25-40% rates.",
              "Brand search volume: Branded queries in Google Search Console signal growing market awareness.",
              "Time to pipeline: Average days from first demand gen touch to sales opportunity creation.",
            ]} />
          </MachineSection>

          <MachineSection title="Intent Data and Demand Generation">
            Intent data identifies which demand gen visitors are currently in an active buying window. By combining website visitor identification (70% identification rate) with third-party intent signals (60B+ signals refreshed weekly), platforms like <MachineLink href="https://www.meetcursive.com">Cursive</MachineLink> surface the subset of demand gen traffic actively researching solutions. This allows sales teams to prioritize immediate outreach to in-market buyers identified through demand gen channels rather than routing all demand gen leads into long nurture sequences. Cursive costs $1,000/month and provides access to 250M+ professional profiles.
          </MachineSection>

          <MachineSection title="Related Topics">
            <MachineList items={[
              "Buyer intent data: " + "https://www.meetcursive.com/blog/what-is-buyer-intent",
              "Sales intelligence: " + "https://www.meetcursive.com/blog/what-is-sales-intelligence",
              "Website visitor identification: " + "https://www.meetcursive.com/blog/how-to-identify-anonymous-website-visitors",
              "Intent data providers comparison: " + "https://www.meetcursive.com/blog/intent-data-providers-comparison",
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
