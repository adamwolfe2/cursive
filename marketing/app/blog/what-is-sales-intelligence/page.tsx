"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft, Database, Users, Zap, Target, BarChart2, Search } from "lucide-react"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"

const relatedPosts = [
  { title: "What Is Demand Generation?", description: "How demand generation turns market awareness into qualified pipeline.", href: "/blog/what-is-demand-generation" },
  { title: "Best B2B Data Providers in 2026", description: "10 platforms compared for data coverage, pricing, and use cases.", href: "/blog/best-b2b-data-providers-2026" },
  { title: "What Is Revenue Intelligence?", description: "How AI and data analysis power smarter revenue decisions.", href: "/blog/what-is-revenue-intelligence" },
]

export default function WhatIsSalesIntelligence() {
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
                <Database className="w-3 h-3 inline mr-1" />
                Sales Intelligence
              </div>
              <h1 className="text-5xl font-bold mb-6">
                What Is Sales Intelligence? B2B Guide to Data-Driven Selling (2026)
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Sales intelligence gives your team the data to find the right buyers, understand their context, and
                reach out at exactly the right moment. Here is everything you need to know.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>February 18, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>12 min read</span>
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
                <h2 className="text-3xl font-bold mb-4">What Is Sales Intelligence?</h2>
                <p className="text-gray-700 mb-4">
                  <strong>Sales intelligence</strong> is the collection of data, insights, and real-time signals
                  that help sales teams identify high-fit prospects, understand their current context, prioritize
                  outreach, and personalize engagement. It transforms cold prospecting into informed, timely
                  conversations that are far more likely to convert.
                </p>
                <p className="text-gray-700 mb-4">
                  Where traditional sales relied on static lists and cold calling, sales intelligence gives reps
                  a dynamic, real-time view of who is a good fit, why now is the right moment to reach out, and
                  what message will resonate. This means reaching buyers when they are actively in-market — not
                  six months before or after their buying window.
                </p>
                <p className="text-gray-700">
                  Modern sales intelligence platforms combine multiple data types: firmographic, technographic,
                  intent, contact, and relationship data — updated in real time and surfaced where sales teams
                  already work.
                </p>
              </div>

              {/* Types of Sales Intelligence Data */}
              <div className="bg-white rounded-xl p-8 mb-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">5 Types of Sales Intelligence Data</h2>

                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-blue-500" />
                      1. Firmographic Data
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Firmographic data describes company-level characteristics — the B2B equivalent of
                      demographics. It tells you whether an account fits your ideal customer profile before
                      you invest any sales time.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Key firmographic fields:</p>
                      <div className="grid grid-cols-2 gap-1 text-sm text-gray-700">
                        <span>Company size (employees)</span>
                        <span>Annual revenue range</span>
                        <span>Industry / vertical</span>
                        <span>Funding stage and amount</span>
                        <span>Headquarters location</span>
                        <span>Year founded</span>
                        <span>Growth rate (headcount trend)</span>
                        <span>Public vs. private status</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-green-500 pl-6">
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <Search className="w-5 h-5 text-green-500" />
                      2. Technographic Data
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Technographic data reveals the software and technology infrastructure a company uses.
                      This is one of the most powerful ICP filters because technology choices signal budget,
                      sophistication, integration requirements, and competitive displacement opportunities.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                      <p className="font-medium mb-2">Use cases for technographic intelligence:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Target only companies already using your integration partners (e.g., Salesforce, HubSpot)</li>
                        <li>Identify companies using a competitor product as displacement opportunities</li>
                        <li>Filter out companies on incompatible tech stacks before outreach</li>
                        <li>Personalize messaging around specific pain points of their current tools</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-6">
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-500" />
                      3. Intent Data
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Intent data captures behavioral signals that indicate a prospect is actively researching
                      a purchase decision. This is the highest-value intelligence because it tells you not just
                      who fits your ICP, but who is in an active buying window right now.
                    </p>
                    <div className="bg-purple-50 rounded-lg p-4 text-sm text-gray-700">
                      <p className="font-medium mb-2">Intent signals that matter:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Visiting your website (especially pricing, demo, and comparison pages)</li>
                        <li>Researching your category on G2, Capterra, or TrustRadius</li>
                        <li>Reading competitor reviews or viewing competitor pricing pages</li>
                        <li>Consuming industry content about problems your product solves</li>
                        <li>Engaging with your LinkedIn ads or organic content</li>
                      </ul>
                    </div>
                    <p className="text-gray-700 mt-3 text-sm">
                      <Link href="/blog/what-is-buyer-intent" className="text-primary hover:underline font-medium">
                        See our full guide to buyer intent data →
                      </Link>
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-6">
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-500" />
                      4. Contact Data
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Contact data identifies the individual decision-makers and influencers at target accounts.
                      Good contact data includes verified work emails, direct phone numbers, and LinkedIn URLs —
                      not just names scraped from a website.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                      <div className="grid grid-cols-2 gap-1">
                        <span>Full name</span>
                        <span>Work email (verified)</span>
                        <span>Direct phone number</span>
                        <span>LinkedIn profile URL</span>
                        <span>Job title and seniority</span>
                        <span>Department</span>
                        <span>Time in role</span>
                        <span>Prior companies</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-red-500 pl-6">
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-5 h-5 text-red-500" />
                      5. Relationship Intelligence
                    </h3>
                    <p className="text-gray-700">
                      Relationship intelligence maps existing connections between your team and prospects:
                      mutual LinkedIn connections, prior email conversations, shared alma maters, or common
                      community memberships. This data enables warm introductions instead of cold outreach —
                      dramatically improving response rates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sales Intelligence vs CRM */}
              <div className="bg-white rounded-xl p-8 mb-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">Sales Intelligence vs. CRM: What Is the Difference?</h2>
                <p className="text-gray-700 mb-6">
                  This is one of the most common questions from B2B sales leaders. The short answer: your CRM
                  records the past; sales intelligence tells you what is happening right now.
                </p>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Dimension</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">CRM Data</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Sales Intelligence</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 font-medium">Nature</td>
                        <td className="border border-gray-200 px-4 py-3">Static, historical records</td>
                        <td className="border border-gray-200 px-4 py-3">Real-time, external signals</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 font-medium">Data source</td>
                        <td className="border border-gray-200 px-4 py-3">Your team&apos;s past interactions</td>
                        <td className="border border-gray-200 px-4 py-3">Market activity, behavior, databases</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 font-medium">Updates</td>
                        <td className="border border-gray-200 px-4 py-3">When a rep logs an activity</td>
                        <td className="border border-gray-200 px-4 py-3">Continuously or weekly refresh</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 font-medium">What it answers</td>
                        <td className="border border-gray-200 px-4 py-3">What happened with this account?</td>
                        <td className="border border-gray-200 px-4 py-3">Who should I contact today and why?</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 font-medium">Coverage</td>
                        <td className="border border-gray-200 px-4 py-3">Only accounts you have touched</td>
                        <td className="border border-gray-200 px-4 py-3">Your entire addressable market</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 font-medium">Use case</td>
                        <td className="border border-gray-200 px-4 py-3">Relationship management</td>
                        <td className="border border-gray-200 px-4 py-3">Prospecting and prioritization</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-gray-700">
                  Best-in-class sales teams use both together: the CRM provides relationship history and deal
                  management; sales intelligence provides daily prioritization signals (who visited the site today,
                  who is showing intent, who just hit a trigger event like a new funding round).
                </p>
              </div>

              {/* Key Use Cases */}
              <div className="bg-white rounded-xl p-8 mb-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">Key Sales Intelligence Use Cases</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-5">
                    <h3 className="font-semibold text-lg mb-2">ICP Scoring and Prioritization</h3>
                    <p className="text-gray-700 text-sm">
                      Score every account in your TAM against your ideal customer profile using firmographic and
                      technographic data. Focus SDR capacity on the top 20% of accounts that fit perfectly,
                      not the entire market.
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-5">
                    <h3 className="font-semibold text-lg mb-2">Territory Planning</h3>
                    <p className="text-gray-700 text-sm">
                      Distribute accounts across sales territories based on data-driven potential scores —
                      company size, industry concentration, and intent signal volume — instead of geographic
                      proximity alone.
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-5">
                    <h3 className="font-semibold text-lg mb-2">Competitive Displacement</h3>
                    <p className="text-gray-700 text-sm">
                      Use technographic data to identify companies using competitor products. Layer in intent
                      signals showing dissatisfaction or competitor research to find accounts in active
                      displacement mode.
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-5">
                    <h3 className="font-semibold text-lg mb-2">Trigger-Based Outreach</h3>
                    <p className="text-gray-700 text-sm">
                      Set up alerts for buying triggers: new funding rounds, executive hires, job postings for
                      roles your product supports, company expansions, or technology stack changes. Reach out
                      within 48 hours of a trigger for maximum relevance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cursive as Solution */}
              <div className="bg-white rounded-xl p-8 mb-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">How Cursive Delivers Sales Intelligence</h2>
                <p className="text-gray-700 mb-4">
                  Cursive is a sales intelligence platform built for teams that want real-time data at a price
                  that makes sense for their stage. Instead of paying $50,000/year for a database your reps
                  barely use, Cursive surfaces the accounts that are actively raising their hand right now.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">70%</div>
                    <div className="text-sm text-gray-700">Visitor identification rate — name + email for anonymous website traffic</div>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">60B+</div>
                    <div className="text-sm text-gray-700">Intent signals tracked across the web, refreshed weekly</div>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">250M+</div>
                    <div className="text-sm text-gray-700">Professional profiles for contact enrichment</div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">
                  At $1,000/month, Cursive gives growing B2B teams enterprise-grade sales intelligence without
                  long-term contracts. The platform combines website visitor identification (who is on your site),
                  intent data (what they are researching across the web), and contact enrichment (how to reach them)
                  in a single workflow.
                </p>

                <div className="flex gap-4">
                  <Link href="https://leads.meetcursive.com">
                    <Button>Start Free Trial</Button>
                  </Link>
                  <Link href="/blog/best-b2b-data-providers-2026" className="inline-flex items-center text-primary hover:underline font-medium">
                    Compare B2B data providers →
                  </Link>
                </div>
              </div>

              {/* CTA */}
              <SimpleRelatedPosts posts={relatedPosts} />
              <DashboardCTA
                title="Turn Anonymous Visitors Into Sales Intelligence"
                description="Cursive identifies 70% of your website visitors by name and email, enriches them with firmographic data and intent signals, and pushes them directly into your CRM. No more guessing who visited your site."
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
                    <Link href="/blog/what-is-demand-generation" className="text-primary hover:underline">What Is Demand Generation?</Link>
                  </li>
                  <li>
                    <Link href="/blog/best-b2b-data-providers-2026" className="text-primary hover:underline">Best B2B Data Providers (2026)</Link>
                  </li>
                  <li>
                    <Link href="/blog/zoominfo-alternatives-comparison" className="text-primary hover:underline">ZoomInfo Alternatives Comparison</Link>
                  </li>
                  <li>
                    <Link href="/blog/intent-data-providers-comparison" className="text-primary hover:underline">Intent Data Providers Comparison</Link>
                  </li>
                </ul>
              </div>

            </div>
          </Container>
        </section>
      </HumanView>

      <MachineView>
        <MachineContent>
          <MachineSection title="What Is Sales Intelligence?">
            Sales intelligence is the collection of data, insights, and real-time signals that help B2B sales teams identify high-fit prospects, understand their current context, prioritize outreach, and personalize engagement. It includes five data types: firmographic (company size, industry, revenue, funding stage), technographic (software and technology stack), intent (behavioral buying signals), contact (name, email, phone, LinkedIn), and relationship intelligence (mutual connections, prior interactions). Sales intelligence differs from CRM data in that it is real-time and external rather than historical and internal.
          </MachineSection>

          <MachineSection title="Types of Sales Intelligence Data">
            <MachineList items={[
              "Firmographic data: company size, annual revenue, industry, funding stage, headquarters location, growth rate, and public/private status — used to score accounts against ICP criteria.",
              "Technographic data: software, cloud infrastructure, and tools a company uses — reveals integration requirements, budget signals, and competitive displacement opportunities.",
              "Intent data: behavioral signals showing what topics and solutions a prospect is actively researching, including website visits, review site activity, and competitor page views.",
              "Contact data: verified name, work email, direct phone, LinkedIn URL, job title, seniority, and department for individual decision-makers at target accounts.",
              "Relationship intelligence: mutual LinkedIn connections, prior email interactions, and shared communities that enable warm introductions instead of cold outreach.",
            ]} />
          </MachineSection>

          <MachineSection title="Sales Intelligence vs. CRM">
            CRM data is static and historical, capturing past interactions logged by sales reps. Sales intelligence is real-time and external, reflecting current market activity. CRM answers: what happened with this account? Sales intelligence answers: who should I contact today and why? CRM covers only accounts already in the pipeline; sales intelligence covers the entire addressable market. Best-practice revenue teams combine both: CRM for relationship history and deal management, sales intelligence for daily prospecting and intent-based prioritization.
          </MachineSection>

          <MachineSection title="Sales Intelligence Use Cases">
            <MachineList items={[
              "ICP scoring: rank every account in the TAM against ideal customer profile criteria to focus SDR capacity on the highest-potential accounts.",
              "Territory planning: distribute accounts based on data-driven potential scores rather than geographic proximity.",
              "Competitive displacement: identify accounts using competitor products and layer intent signals to find those actively evaluating alternatives.",
              "Trigger-based outreach: alert reps to buying triggers such as new funding, executive hires, job postings, or technology stack changes within 48 hours.",
            ]} />
          </MachineSection>

          <MachineSection title="Cursive Sales Intelligence Platform">
            <MachineLink href="https://www.meetcursive.com">Cursive</MachineLink> is a sales intelligence platform that identifies 70% of anonymous website visitors by name, email, and LinkedIn, enriches them with firmographic data and 60B+ behaviors & URLs scanned weekly refreshed weekly, and provides access to 250M+ professional profiles for contact enrichment. Priced at $1,000/month with no long-term commitment, Cursive makes enterprise-grade sales intelligence accessible to growing B2B teams. It integrates with Salesforce, HubSpot, Pipedrive, and Close CRM.
          </MachineSection>

          <MachineSection title="Related Topics">
            <MachineList items={[
              "Buyer intent data: " + "https://www.meetcursive.com/blog/what-is-buyer-intent",
              "Demand generation: " + "https://www.meetcursive.com/blog/what-is-demand-generation",
              "B2B data providers comparison: " + "https://www.meetcursive.com/blog/best-b2b-data-providers-2026",
              "ZoomInfo alternatives: " + "https://www.meetcursive.com/blog/zoominfo-alternatives-comparison",
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
