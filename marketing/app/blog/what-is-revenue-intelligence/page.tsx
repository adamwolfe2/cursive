"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft, Check } from "lucide-react"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"

const faqs = [
  {
    question: 'What is revenue intelligence?',
    answer: 'Revenue intelligence is the use of AI and data analysis to capture, analyze, and act on all signals across the revenue process — including sales calls, emails, CRM data, website behavior, and market intent signals. It gives revenue teams a unified view of pipeline health, deal risk, and buyer intent so they can prioritize the right accounts and take the right actions at the right time.',
  },
  {
    question: 'What is the difference between revenue intelligence and sales intelligence?',
    answer: 'Sales intelligence focuses on prospecting data — contact information, company data, and technographics. Revenue intelligence is broader: it analyzes what happens after a prospect enters your pipeline — how calls go, which deals are at risk, how pipeline is trending, and what buyers are doing between your touchpoints.',
  },
  {
    question: 'What are the main components of a revenue intelligence platform?',
    answer: 'Revenue intelligence platforms typically include: conversation intelligence (AI analysis of sales calls and emails), deal intelligence (pipeline health scoring and forecast accuracy), activity intelligence (tracking all rep activities automatically), and market intelligence (intent data, visitor identification, and external signals about buyer behavior).',
  },
  {
    question: 'What tools are used for revenue intelligence?',
    answer: 'Leading revenue intelligence tools include: Gong (conversation and deal intelligence), Clari (pipeline and forecast intelligence), People.ai (activity intelligence), Chorus.ai (conversation intelligence), Salesforce Einstein (native CRM intelligence), and Cursive (market and visitor intelligence — identifying website visitors and triggering automated outreach based on intent signals).',
  },
  {
    question: 'How does visitor identification fit into revenue intelligence?',
    answer: 'Visitor identification is the market intelligence layer of revenue intelligence. When a prospect visits your pricing page or returns for the third time — that is a buying signal. Tools like Cursive identify who is on your website right now, score their intent, and feed that signal into your revenue stack so sales can act on it immediately.',
  },
  {
    question: 'How much do revenue intelligence platforms cost?',
    answer: 'Gong starts at approximately $1,200/user/year. Clari starts at around $1,500/user/year. Full enterprise stacks can cost $50,000-$200,000+ per year. Cursive adds the market and visitor intelligence layer starting at $1,000/month.',
  },
  {
    question: 'Do I need a revenue intelligence platform if I have a CRM?',
    answer: 'A CRM stores your data but does not analyze it intelligently. Revenue intelligence sits on top of your CRM to surface insights you would otherwise miss: which deals are at risk, which accounts are showing buying intent before they contact you, which talk tracks lead to closed-won deals.',
  },
]

const relatedPosts = [
  {
    title: 'What Is Sales Intelligence?',
    href: '/blog/what-is-sales-intelligence',
    description: 'How sales intelligence data powers modern B2B prospecting.',
  },
  {
    title: 'What Is Buyer Intent Data?',
    href: '/blog/what-is-buyer-intent',
    description: 'The complete guide to buyer intent signals for B2B teams.',
  },
  {
    title: 'Best B2B Data Providers in 2026',
    href: '/blog/best-b2b-data-providers-2026',
    description: '10 platforms compared for data coverage, pricing, and use cases.',
  },
]

const intelligenceLayers = [
  {
    layer: 'Conversation Intelligence',
    description: 'AI analysis of sales calls, emails, and meetings',
    what_it_captures: 'Talk tracks, objections, sentiment, competitor mentions',
    leading_tools: 'Gong, Chorus.ai, Salesloft',
    best_for: 'Sales coaching, deal risk, winning messaging',
  },
  {
    layer: 'Deal Intelligence',
    description: 'Pipeline health, deal risk, and forecast accuracy',
    what_it_captures: 'Engagement patterns, stakeholder activity, deal velocity',
    leading_tools: 'Clari, Gong Forecast, Salesforce Einstein',
    best_for: 'Revenue forecasting, at-risk deals, pipeline management',
  },
  {
    layer: 'Activity Intelligence',
    description: 'Automatic capture of all rep activities',
    what_it_captures: 'Calls made, emails sent, meetings booked, CRM updates',
    leading_tools: 'People.ai, Outreach, HubSpot',
    best_for: 'Rep productivity, CRM hygiene, activity attribution',
  },
  {
    layer: 'Market Intelligence',
    description: 'External signals about buyer behavior and intent',
    what_it_captures: 'Website visits, content research, intent signals, competitor comparisons',
    leading_tools: 'Cursive, 6sense, Bombora, ZoomInfo',
    best_for: 'Identifying in-market buyers before they raise their hand',
  },
]

export default function WhatIsRevenueIntelligencePage() {
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
                Guide
              </div>
              <h1 className="text-5xl font-bold mb-6">
                What Is Revenue Intelligence? Complete Guide for B2B Sales Teams (2026)
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Revenue intelligence combines AI analysis of sales activities, customer interactions, and market
                signals to give revenue teams a complete picture of pipeline health and buyer intent. Here is
                everything you need to know — how it works, what tools are involved, and how to use it.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>February 18, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>10 min read</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 bg-gray-50">
          <Container>
            <div className="max-w-4xl space-y-8">

              {/* Definition */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-4">Revenue Intelligence: The Definition</h2>
                <div className="bg-primary/5 border-l-4 border-primary p-5 rounded-r-lg mb-6">
                  <p className="text-gray-800 text-lg leading-relaxed">
                    <strong>Revenue intelligence</strong> is the use of AI and machine learning to automatically
                    capture, analyze, and surface actionable insights from all data across the revenue process —
                    including sales conversations, customer interactions, pipeline data, and market signals.
                  </p>
                </div>
                <p className="text-gray-700 mb-4">
                  The goal is to give every member of the revenue team — sales reps, managers, and executives —
                  complete visibility into what is happening in the pipeline, why deals are won or lost, and
                  which accounts to prioritize right now.
                </p>
                <p className="text-gray-700">
                  Revenue intelligence sits on top of your CRM and sales execution tools, analyzing data that
                  would otherwise require hours of manual work to surface — or that would never surface at all.
                </p>
              </div>

              {/* 4 Layers */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">The 4 Layers of Revenue Intelligence</h2>
                <p className="text-gray-700 mb-6">
                  Modern revenue intelligence covers four distinct data layers. Most platforms specialize in
                  one or two; best-in-class revenue teams combine tools to cover all four.
                </p>
                <div className="space-y-4">
                  {intelligenceLayers.map((layer, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-6 hover:border-primary/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{layer.layer}</h3>
                          <p className="text-gray-600 text-sm mb-3">{layer.description}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="font-semibold text-gray-700">Captures: </span>
                              <span className="text-gray-600">{layer.what_it_captures}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">Tools: </span>
                              <span className="text-gray-600">{layer.leading_tools}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">Best for: </span>
                              <span className="text-gray-600">{layer.best_for}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RI vs Sales Intelligence */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">Revenue Intelligence vs Sales Intelligence</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 pr-4 font-semibold text-gray-700">Dimension</th>
                        <th className="text-center py-3 px-4 font-semibold text-primary">Revenue Intelligence</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Sales Intelligence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        ["Focus", "Internal + external signals", "External prospecting data"],
                        ["Data sources", "Calls, emails, CRM, website, intent", "Company/contact databases"],
                        ["Primary use", "Pipeline management & coaching", "Prospecting & targeting"],
                        ["When it applies", "Mid and late funnel", "Top of funnel"],
                        ["Example tools", "Gong, Clari, Cursive", "ZoomInfo, Apollo, Lusha"],
                        ["Output", "Deal risk, forecast, coaching", "Contact lists, ICP targeting"],
                      ].map(([dim, ri, si]) => (
                        <tr key={dim} className="hover:bg-gray-50">
                          <td className="py-3 pr-4 text-gray-700 font-medium">{dim}</td>
                          <td className="py-3 px-4 text-center text-sm text-primary font-medium">{ri}</td>
                          <td className="py-3 px-4 text-center text-sm text-gray-600">{si}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Note: The best B2B revenue stacks combine both — sales intelligence to fill the top of funnel,
                  and revenue intelligence to maximize conversion from prospect to closed-won.
                </p>
              </div>

              {/* Market Intelligence + Cursive */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-4">The Missing Layer: Market Intelligence</h2>
                <p className="text-gray-700 mb-4">
                  Most revenue intelligence platforms analyze what happens <em>inside</em> your pipeline — calls,
                  emails, CRM data. But they miss what buyers are doing <em>before</em> they engage: visiting
                  your website, reading your content, comparing you to competitors.
                </p>
                <p className="text-gray-700 mb-4">
                  This is where market intelligence tools like Cursive complete the picture. When a prospect
                  visits your pricing page three times in a week but has not filled out a form, that is a
                  high-intent signal. Revenue intelligence that lacks this layer is flying half-blind.
                </p>
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="font-bold text-lg mb-3">What Cursive adds to your revenue intelligence stack:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Identify 70% of anonymous website visitors by name, email, and company</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Score visitor intent based on pages visited, time on site, and return visits</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Push high-intent signals to your CRM alongside Gong and Clari data</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Automatically trigger outreach when intent thresholds are hit</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Access 60B+ behaviors & URLs scanned weekly across 30,000+ categories</li>
                  </ul>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-primary rounded-xl p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-3">Add the Market Intelligence Layer to Your Revenue Stack</h2>
                <p className="text-white/80 mb-6">
                  See how Cursive identifies the anonymous buyers already visiting your site — and automatically
                  turns them into pipeline your revenue intelligence tools can track.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/free-audit">Get Your Free Audit</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                    <Link href="/platform">See the Platform</Link>
                  </Button>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
                <div className="space-y-6">
                  {faqs.map((faq, i) => (
                    <div key={i} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                      <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              <SimpleRelatedPosts posts={relatedPosts} />

            </div>
          </Container>
        </section>

        <DashboardCTA />
      </HumanView>

      <MachineView>
        <MachineContent>
          <MachineSection heading="What Is Revenue Intelligence?">
            Revenue intelligence is the use of AI and machine learning to capture, analyze, and surface actionable
            insights from all signals across the revenue process — including sales calls, emails, CRM data, website
            behavior, and market intent signals. It gives revenue teams a unified view of pipeline health, deal
            risk, and buyer intent.
          </MachineSection>
          <MachineSection heading="The Four Layers of Revenue Intelligence">
            <MachineList items={[
              'Conversation Intelligence: AI analysis of sales calls and emails (Gong, Chorus.ai)',
              'Deal Intelligence: Pipeline health scoring and forecast accuracy (Clari, Gong Forecast)',
              'Activity Intelligence: Automatic capture of all rep activities (People.ai)',
              'Market Intelligence: External signals about buyer behavior and intent (Cursive, 6sense, Bombora)',
            ]} />
          </MachineSection>
          <MachineSection heading="Revenue Intelligence vs Sales Intelligence">
            Sales intelligence focuses on prospecting data — contact information, company data, and technographics
            used to identify potential buyers. Revenue intelligence is broader: it analyzes pipeline health, call
            quality, deal risk, and buyer signals across the entire revenue process from first touch to close.
          </MachineSection>
          <MachineSection heading="Revenue Intelligence Pricing">
            Gong starts at approximately $1,200 per user per year. Clari starts at approximately $1,500 per user
            per year. Full enterprise revenue intelligence stacks can cost $50,000 to $200,000+ per year.
            Cursive adds market and visitor intelligence starting at $1,000 per month.
          </MachineSection>
          <MachineSection heading="About Cursive">
            <MachineLink href="https://www.meetcursive.com">Cursive</MachineLink> provides the market intelligence
            layer of revenue intelligence — identifying 70% of anonymous website visitors by name, email, and
            company, scoring their intent, and automatically triggering personalized outreach. Starts at
            $1,000/month with no annual contract.
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
