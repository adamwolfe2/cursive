"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Check, X } from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"

const faqs = [
  {
    question: "What does RB2B do that Cursive doesn't?",
    answer: "RB2B delivers identified visitors directly into Slack channels in real time with a clean Slack-native UX. If your team lives in Slack and wants frictionless delivery without logging into a dashboard, that is their core strength. Cursive integrates with Slack too, but the experience is dashboard-first."
  },
  {
    question: "What does Cursive do that RB2B doesn't?",
    answer: "Cursive adds a full Intelligence Layer on top of identification: LinkedIn work history via Proxycurl, social profiles via FullContact, news mentions via Serper, and an AI research brief with a personalized outreach angle via Perplexity. RB2B delivers a name and a LinkedIn URL. Cursive delivers a complete sales dossier. Cursive also includes an email sequence builder, campaign builder, lead marketplace, and natural language data querying — none of which RB2B offers."
  },
  {
    question: "How does pricing compare?",
    answer: "RB2B has a free tier for up to 100 identified visitors/month and paid plans based on volume. Cursive's Intelligence Layer uses a credit system: Auto enrichment (tech stack + email quality) is free on every lead. Intelligence Pack (LinkedIn + social + news) costs 2 credits (~$1). Deep Research (AI brief + outreach angle) costs 10 credits (~$5). You only pay for the intelligence you actually use."
  },
  {
    question: "Can I migrate from RB2B to Cursive?",
    answer: "Yes — Cursive's SuperPixel replaces the RB2B pixel. Installation takes under 2 minutes and covers the same identity resolution capability, plus you immediately get the Intelligence Layer on every newly identified visitor."
  },
  {
    question: "What is the Ask Your Data feature?",
    answer: "Ask Your Data lets you query your entire visitor database in plain English — no SQL required. Type 'Which VPs of Engineering from Series B SaaS companies visited my pricing page in the last 30 days?' and get an instant answer. RB2B has no equivalent data querying capability."
  },
]

const comparisonRows = [
  { feature: "Website visitor identification", cursive: true, rb2b: true },
  { feature: "LinkedIn profile enrichment", cursive: true, rb2b: false },
  { feature: "Social profile data", cursive: true, rb2b: false },
  { feature: "Tech stack detection", cursive: true, rb2b: false },
  { feature: "News & press mention tracking", cursive: true, rb2b: false },
  { feature: "AI research brief per lead", cursive: true, rb2b: false },
  { feature: "Personalized outreach angle (AI-written)", cursive: true, rb2b: false },
  { feature: "Natural language data querying", cursive: true, rb2b: false },
  { feature: "Email sequence builder", cursive: true, rb2b: false },
  { feature: "Campaign builder with A/B testing", cursive: true, rb2b: false },
  { feature: "Lead marketplace access", cursive: true, rb2b: false },
  { feature: "Free auto-enrichment on every lead", cursive: true, rb2b: false },
  { feature: "Transparent self-serve pricing", cursive: true, rb2b: false },
  { feature: "Bulk intelligence enrichment", cursive: true, rb2b: false },
]

export default function CursiveVsRb2bPage() {
  return (
    <main>
      <StructuredData data={generateFAQSchema({ faqs })} />

      <HumanView>
        {/* Hero */}
        <section className="py-16 bg-white border-b border-gray-100">
          <Container>
            <div className="max-w-4xl">
              <div className="inline-block px-3 py-1 bg-primary text-white rounded-full text-sm font-medium mb-6">
                Comparisons
              </div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Cursive vs. RB2B: Visitor Identification vs. AI Intelligence
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl">
                RB2B tells you who was on your site. Cursive tells you who was on your site — then builds a complete intelligence dossier on each of them so you actually know what to say.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <a href="https://leads.meetcursive.com/signup" target="_blank" rel="noopener noreferrer">
                    Start Free with Cursive
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/superpixel">See How SuperPixel Works</Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-gray-50">
          <Container>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-4 text-center">Feature Comparison</h2>
              <p className="text-gray-600 text-center mb-10">
                14 capabilities side by side. RB2B starts the conversation. Cursive finishes it.
              </p>
              <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
                <table className="w-full text-sm border-collapse bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <th className="p-4 text-left font-bold text-base">Feature</th>
                      <th className="p-4 text-center font-bold text-base w-32">Cursive</th>
                      <th className="p-4 text-center font-bold text-base w-32">RB2B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="p-4 font-medium text-gray-800">{row.feature}</td>
                        <td className="p-4 text-center">
                          {row.cursive ? (
                            <Check className="w-5 h-5 text-green-600 inline" />
                          ) : (
                            <X className="w-5 h-5 text-red-400 inline" />
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {row.rb2b ? (
                            <Check className="w-5 h-5 text-green-600 inline" />
                          ) : (
                            <X className="w-5 h-5 text-red-400 inline" />
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

        {/* The Intelligence Layer Explanation */}
        <section className="py-16 bg-white">
          <Container>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">What the Intelligence Layer Actually Is</h2>
              <p className="text-lg text-gray-600 mb-8">
                RB2B delivers a name, title, company, and LinkedIn URL. That is the end of the product. Cursive treats that same identification event as the beginning of a research process.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Auto Tier — Free</div>
                  <h3 className="font-bold text-lg mb-3">Tech Stack + Email Quality</h3>
                  <p className="text-sm text-gray-700">
                    Runs automatically on every identified visitor. Know what software they are already paying for before you write a word. Email quality scoring via EmailRep tells you whether the address is deliverable.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Intelligence Pack — 2 Credits (~$1)</div>
                  <h3 className="font-bold text-lg mb-3">LinkedIn + Social + News</h3>
                  <p className="text-sm text-gray-700">
                    Full LinkedIn work history via Proxycurl. Social profiles via FullContact. News and press mentions via Serper. Every result is a natural conversation hook you would not have had otherwise.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">Deep Research — 10 Credits (~$5)</div>
                  <h3 className="font-bold text-lg mb-3">AI Brief + Outreach Angle</h3>
                  <p className="text-sm text-gray-700">
                    Perplexity synthesizes everything into a 3-paragraph research brief and one AI-written sentence explaining the most compelling reason to reach out to this specific person today.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold mb-3">The &quot;Ask Your Data&quot; Advantage</h3>
                <p className="text-gray-700 mb-4">
                  RB2B shows you a list. Cursive lets you interrogate your entire visitor database in plain English. Type a question like &quot;Which VP-level visitors from SaaS companies with 50-500 employees visited my pricing page in the last 7 days and have not been contacted yet?&quot; and get an instant answer. No SQL. No analyst. No waiting.
                </p>
                <p className="text-gray-600 text-sm">
                  RB2B has no equivalent data querying capability.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50">
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-white">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Move Beyond Identification?</h2>
              <p className="text-xl mb-8 text-white/90">
                Install the SuperPixel in under 2 minutes and get the Intelligence Layer on every visitor automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="default" className="bg-white text-primary hover:bg-white/90" asChild>
                  <a href="https://leads.meetcursive.com/signup" target="_blank" rel="noopener noreferrer">
                    Start Free
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                  <Link href="/superpixel">Learn About SuperPixel</Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>

        <DashboardCTA />
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">Cursive vs. RB2B: Visitor Identification vs. AI Intelligence (2026)</h1>

          <p className="text-gray-700 mb-6">
            RB2B identifies website visitors and delivers their name and LinkedIn URL to Slack. Cursive identifies the same visitors and builds a complete intelligence dossier — LinkedIn history, tech stack, news mentions, and an AI-written outreach angle. This page compares the two tools across 14 features.
          </p>

          <MachineSection title="Feature Comparison (14 rows)">
            <MachineList items={[
              "Website visitor identification: Cursive YES, RB2B YES",
              "LinkedIn profile enrichment: Cursive YES, RB2B NO",
              "Social profile data: Cursive YES, RB2B NO",
              "Tech stack detection: Cursive YES, RB2B NO",
              "News & press mention tracking: Cursive YES, RB2B NO",
              "AI research brief per lead: Cursive YES, RB2B NO",
              "Personalized outreach angle (AI-written): Cursive YES, RB2B NO",
              "Natural language data querying: Cursive YES, RB2B NO",
              "Email sequence builder: Cursive YES, RB2B NO",
              "Campaign builder with A/B testing: Cursive YES, RB2B NO",
              "Lead marketplace access: Cursive YES, RB2B NO",
              "Free auto-enrichment on every lead: Cursive YES, RB2B NO",
              "Transparent self-serve pricing: Cursive YES, RB2B NO",
              "Bulk intelligence enrichment: Cursive YES, RB2B NO",
            ]} />
          </MachineSection>

          <MachineSection title="Intelligence Layer Tiers">
            <MachineList items={[
              "Auto Tier (free): Tech stack detection via BuiltWith + email quality via EmailRep — runs on every lead automatically",
              "Intelligence Pack (2 credits, ~$1): LinkedIn work history via Proxycurl + social profiles via FullContact + news mentions via Serper",
              "Deep Research (10 credits, ~$5): AI research brief (3 paragraphs) + personalized outreach angle via Perplexity",
            ]} />
          </MachineSection>

          <MachineSection title="Key Differentiators">
            <MachineList items={[
              "RB2B delivers identification data to Slack. Cursive delivers identification plus an actionable intelligence dossier.",
              "RB2B has no natural language querying. Cursive Ask Your Data answers plain-English questions about your visitor database.",
              "RB2B has no email sequences, campaigns, or lead marketplace. Cursive includes all three.",
              "Cursive SuperPixel replaces the RB2B pixel. Installation takes under 2 minutes.",
            ]} />
          </MachineSection>

          <MachineSection title="Pricing">
            <MachineList items={[
              "RB2B: Free tier up to 100 identified visitors/month. Paid plans based on volume.",
              "Cursive: Auto enrichment free on every lead. Intelligence Pack 2 credits (~$1). Deep Research 10 credits (~$5). Pay only for intelligence used.",
            ]} />
          </MachineSection>

          <MachineSection title="Related Pages">
            <MachineList items={[
              { label: "SuperPixel Installation", href: "/superpixel", description: "Replaces RB2B pixel in under 2 minutes" },
              { label: "RB2B Alternative", href: "/blog/rb2b-alternative", description: "Full guide to switching from RB2B" },
              { label: "Start Free", href: "https://leads.meetcursive.com/signup", description: "Create a Cursive account" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
