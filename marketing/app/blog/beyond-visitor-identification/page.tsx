"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"

const relatedPosts = [
  { title: "Cursive vs RB2B: Full Feature Comparison (2026)", description: "14-point breakdown of what each tool does and does not do.", href: "/cursive-vs-rb2b" },
  { title: "RB2B Alternative: Why Teams Switch to Cursive", description: "The case for moving beyond pure visitor identification.", href: "/blog/rb2b-alternative" },
  { title: "What Is Website Visitor Identification?", description: "A plain-English guide to how person-level ID works.", href: "/what-is-website-visitor-identification" },
]

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateBlogPostSchema({
        title: "Beyond Visitor Identification: Why Your Pixel Data Needs an AI Intelligence Layer",
        description: "Knowing who visited your site is the beginning, not the end. The gap between identification and conversation is where deals are won or lost — and where the Intelligence Layer comes in.",
        author: "Cursive Team",
        publishDate: "2026-02-25",
        image: "https://www.meetcursive.com/cursive-logo.png"
      })} />

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
                Strategy
              </div>
              <h1 className="text-5xl font-bold mb-6">
                Beyond Visitor Identification: Why Your Pixel Data Needs an AI Intelligence Layer
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Knowing who visited your site is the beginning, not the end. The gap between identification and conversation is where deals are won or lost.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>February 25, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>10 min read</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Article Content */}
        <section className="py-16 bg-white">
          <Container>
            <article className="max-w-3xl mx-auto prose prose-lg prose-blue">

              <p>
                Most visitor identification tools solve a narrow problem. They tell you that someone named James Sullivan, VP of Sales at Meridian Technology, visited your pricing page today. That is genuinely useful signal. But useful alone is not revenue. The question is not "who was on my site?" — it is "what do I say to them, and why should they care?" The gap between identification and conversation is where most B2B teams are leaving money on the table.
              </p>

              <h2>The Data-to-Conversation Gap</h2>
              <p>
                When all you have is a name, title, company, and a LinkedIn URL, your outreach defaults to generic: "Hi James, I noticed you visited our pricing page..." Every other SDR using a visitor ID tool is sending the same email. Your response rate reflects that.
              </p>
              <p>
                Raw visitor identification data, used as-is, converts at under 2% in most B2B contexts. Not because the data is bad — but because it is incomplete. Data tells you <em>who</em>. Intelligence tells you <em>why to care</em>, and <em>what to say</em>.
              </p>
              <p>
                The difference between a 2% and a 6% conversion rate on identified visitors is not a better email template. It is context. It is knowing that James Sullivan spent 18 months as a BDR before moving into sales leadership, that his company just closed a Series B round in November, and that he spoke on a panel about outbound efficiency at SaaStr last month. That context transforms a generic cold email into a relevant conversation starter.
              </p>

              <div className="not-prose bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 my-8 border border-blue-200">
                <h3 className="font-bold text-lg mb-2">The core insight</h3>
                <p className="text-gray-700">
                  Raw visitor identification data converts at under 2% in most B2B contexts. Not because the data is bad — but because it is incomplete. Data tells you who. Intelligence tells you why to care and what to say.
                </p>
              </div>

              <h2>What the Intelligence Layer Actually Does</h2>
              <p>
                The Intelligence Layer is not a single feature. It is a tiered research process that runs automatically on each identified visitor, building progressively deeper context depending on how much you invest per lead.
              </p>

              <h3>Auto-Tier (free on every lead)</h3>
              <p>
                Tech stack detection via BuiltWith shows you what software James is already paying for — before you write a single word. If he is on HubSpot, your Salesforce pitch needs work. If he is on Intercom, you know the team cares about customer communication tooling. Email quality scoring via EmailRep tells you whether the contact is deliverable before you add it to a sequence. Both run automatically on every identified visitor. No credits, no clicks required.
              </p>
              <p>
                This alone eliminates a category of waste: sending sequences to undeliverable addresses, or pitching the wrong product because you did not know what they were already using. The auto-tier is not glamorous. It is infrastructure — the foundation that makes everything else more efficient.
              </p>

              <h3>Intelligence Pack (2 credits, ~$1)</h3>
              <p>
                Pull James's full LinkedIn work history via Proxycurl. Understand his career trajectory, what he has accomplished, how long he has been in his current role. Pull his social profiles via FullContact — Twitter, GitHub, personal site — to understand how he communicates publicly. Pull news mentions via Serper — has his company been in the press recently? Did he speak at a conference? Did his company raise a round?
              </p>
              <p>
                Every one of these is a natural conversation hook. The difference between "I noticed you visited our site" and "I saw the piece in TechCrunch about Meridian's Series B — the scaling challenges that come 18 months after a round are exactly where we typically help." One of those emails gets deleted. The other gets a reply.
              </p>

              <h3>Deep Research (10 credits, ~$5)</h3>
              <p>
                Perplexity AI reads everything — the LinkedIn history, the social profiles, the news mentions — and synthesizes it into two things: a research brief (a 3-paragraph dossier on this specific person) and a personalized outreach angle (a single sentence explaining the most compelling reason to reach out to this person, today, given everything the AI knows about them).
              </p>
              <p>
                You do not write the outreach angle. The AI does. You review and send. For high-value targets — the ones who hit your pricing page, the ones whose company profile matches your ICP perfectly — this is the most efficient use of a sales rep's time that exists right now. They spend thirty seconds reviewing an AI-generated brief and firing off a message that reads like it was written by someone who spent an hour on research.
              </p>

              <h2>The Natural Language Query Advantage</h2>
              <p>
                A visitor identification tool shows you a list. An intelligence platform lets you interrogate it.
              </p>
              <p>
                Ask Your Data is a natural language interface to your entire visitor database. Type "Which VP-level visitors from SaaS companies with 50-500 employees visited my pricing page in the last 7 days and have not been contacted yet?" and get an instant answer. No SQL. No analyst. No waiting for a report to run.
              </p>
              <p>
                This changes how sales and marketing teams think about their visitor data. Instead of logging in to scan a list, they ask questions — the same way they would ask a colleague. The database becomes a resource you can have a conversation with, rather than a spreadsheet you have to interpret manually.
              </p>
              <p>
                The difference between a CRM full of data and a CRM you can actually converse with is the difference between information and intelligence. One requires a human to extract meaning. The other surfaces meaning on demand.
              </p>

              <h2>The ROI Math</h2>
              <p>
                If raw visitor identification converts at 2% and intelligence-augmented outreach converts at 6%, the math is simple.
              </p>
              <p>
                If your ACV is $20,000 and you have 50 qualified visitors per month, the difference between 2% and 6% conversion is 2 additional deals per month — $40,000 in added monthly revenue. The cost of running Deep Research on all 50 visitors: $250 per month (50 visits at $5 each). The ROI: 160x.
              </p>
              <p>
                You do not need to run Deep Research on every visitor. Run it on the top 10 per day — the ones who hit your pricing page, visited three or more times, or match your ICP by title and company size. That is $50 per day, $1,500 per month — against whatever your deal size is.
              </p>

              <div className="not-prose overflow-x-auto my-8">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <th className="border border-gray-300 p-3 text-left font-bold">Intelligence Tier</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Cost</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">What You Get</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Auto Tier</td>
                      <td className="border border-gray-300 p-3 text-green-700 font-bold">Free</td>
                      <td className="border border-gray-300 p-3">Tech stack + email deliverability on every lead</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-3 font-medium">Intelligence Pack</td>
                      <td className="border border-gray-300 p-3 font-bold">~$1 per lead</td>
                      <td className="border border-gray-300 p-3">LinkedIn history + social profiles + news mentions</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Deep Research</td>
                      <td className="border border-gray-300 p-3 font-bold">~$5 per lead</td>
                      <td className="border border-gray-300 p-3">AI research brief + personalized outreach angle</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                The economics only work in one direction. The marginal cost of intelligence is fixed and small. The marginal value of a converted lead is your ACV. At any ACV above $5,000, Deep Research pays for itself on the first booked meeting.
              </p>

              <h2>Visitor Identification Is the Input. Intelligence Is the Product.</h2>
              <p>
                If you are running a pixel and stopping at a name and LinkedIn URL, you are using 10% of what your data can do. The other 90% is the conversation — and the Intelligence Layer is what makes that conversation possible.
              </p>
              <p>
                The companies winning at outbound right now are not the ones with the most contacts in their CRM. They are the ones whose reps walk into every first conversation with enough context to make the other person feel genuinely understood. That context used to require hours of manual research per account. The Intelligence Layer automates it in seconds, for a dollar.
              </p>
              <p>
                The visitors are already on your site. The question is what you do with that signal once you have it.
              </p>
            </article>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-white">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">See the Intelligence Layer in Action</h2>
              <p className="text-xl mb-8 text-white/90">
                Start free at leads.meetcursive.com. Install the SuperPixel in under 2 minutes and get automatic enrichment on every identified visitor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="default" className="bg-white text-primary hover:bg-white/90" asChild>
                  <a href="https://leads.meetcursive.com/signup" target="_blank" rel="noopener noreferrer">
                    Start Free
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                  <Link href="/cursive-vs-rb2b">Compare Cursive vs RB2B</Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>

        {/* Related Posts */}
        <section className="py-16 bg-white">
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <SimpleRelatedPosts posts={relatedPosts} />
            </div>
          </Container>
        </section>

        <DashboardCTA />
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">Beyond Visitor Identification: Why Your Pixel Data Needs an AI Intelligence Layer</h1>

          <p className="text-gray-700 mb-6">
            Most visitor identification tools solve a narrow problem: they tell you who visited your site. But knowing who visited is the beginning, not the end. The gap between identification and conversation is where deals are won or lost. This article explains the Intelligence Layer — the tier of AI-powered research that transforms a name and LinkedIn URL into a complete sales dossier. Published: February 25, 2026.
          </p>

          <MachineSection title="The Data-to-Conversation Gap">
            <MachineList items={[
              "Raw visitor identification converts at under 2% in most B2B contexts — not because the data is bad, but because it is incomplete.",
              "Data tells you who visited. Intelligence tells you why to care and what to say.",
              "Generic outreach like 'I noticed you visited our pricing page' gets deleted. Context-rich outreach referencing recent funding, press coverage, or career moves gets replies.",
            ]} />
          </MachineSection>

          <MachineSection title="Intelligence Layer — Three Tiers">
            <MachineList items={[
              "Auto Tier (free, every lead): Tech stack detection via BuiltWith. Email deliverability via EmailRep. Runs automatically — no credits, no clicks.",
              "Intelligence Pack (2 credits, ~$1): Full LinkedIn work history via Proxycurl. Social profiles via FullContact. News and press mentions via Serper. Each is a natural conversation hook.",
              "Deep Research (10 credits, ~$5): Perplexity AI synthesizes all data into a 3-paragraph research brief and a single AI-written personalized outreach angle.",
            ]} />
          </MachineSection>

          <MachineSection title="Ask Your Data">
            <MachineList items={[
              "Natural language interface to your entire visitor database — no SQL required.",
              "Example query: 'Which VP-level visitors from SaaS companies with 50-500 employees visited my pricing page in the last 7 days and have not been contacted yet?'",
              "Turns a static list into a resource you can interrogate in plain English.",
            ]} />
          </MachineSection>

          <MachineSection title="ROI Math">
            <MachineList items={[
              "Raw ID converts at 2%. Intelligence-augmented outreach converts at 6%.",
              "With 50 qualified visitors/month at $20k ACV: 2% = 1 deal/mo, 6% = 3 deals/mo. Delta = $40k/month.",
              "Cost of Deep Research on all 50: $250/month. ROI: 160x.",
              "Run Deep Research only on top-10 daily visitors (pricing page, 3+ visits, ICP match) = $1,500/month cost.",
            ]} />
          </MachineSection>

          <MachineSection title="Key Takeaway">
            <MachineList items={[
              "Visitor identification is the input. Intelligence is the product.",
              "If you stop at a name and LinkedIn URL, you are using 10% of what your data can do.",
              "The Intelligence Layer automates what used to require hours of manual research per account — for a dollar.",
            ]} />
          </MachineSection>

          <MachineSection title="Related Pages">
            <MachineList items={[
              { label: "Cursive vs RB2B Comparison", href: "/cursive-vs-rb2b", description: "14-feature side-by-side breakdown" },
              { label: "RB2B Alternative", href: "/blog/rb2b-alternative", description: "Why teams switch from RB2B to Cursive" },
              { label: "Start Free", href: "https://leads.meetcursive.com/signup", description: "Create a Cursive account" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
