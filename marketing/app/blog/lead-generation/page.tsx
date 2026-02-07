import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft, ArrowRight, TrendingUp, Check, X } from "lucide-react"
import { generateMetadata } from "@/lib/seo/metadata"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"
import Link from "next/link"

export const metadata = generateMetadata({
  title: "B2B Lead Generation: Intent-Based Strategies That Build Pipeline (2026)",
  description: "Proven B2B lead generation strategies that prioritize intent over volume. Learn how to build predictable pipeline using visitor identification, intent data, and multi-channel outreach.",
  keywords: [
    "B2B lead generation",
    "lead generation strategies",
    "intent-based lead generation",
    "pipeline generation",
    "outbound lead generation",
    "qualified leads",
    "B2B sales leads",
    "lead gen tactics",
    "visitor identification leads",
    "demand generation",
  ],
  canonical: "https://meetcursive.com/blog/lead-generation",
})

const faqs = [
  {
    question: "What is the difference between lead generation and demand generation?",
    answer: "Lead generation focuses on capturing contact information from prospective buyers through forms, gated content, and outbound outreach. Demand generation is the broader strategy of creating awareness and interest in your product through ungated content, brand marketing, and community building. The most effective B2B strategies combine both: demand generation creates the initial interest, and lead generation captures and qualifies that interest into actionable pipeline.",
  },
  {
    question: "How does intent-based lead generation work?",
    answer: "Intent-based lead generation identifies companies that are actively researching solutions in your category, then targets them with personalized outreach. Intent signals come from two sources: first-party data (companies visiting your website, especially high-intent pages like pricing) and third-party data (companies researching relevant topics across the web). By prioritizing prospects showing buying intent, you reach companies when they are ready to evaluate, resulting in 3-5x higher conversion rates than cold outreach.",
  },
  {
    question: "What is a good cost per qualified lead for B2B?",
    answer: "Cost per qualified lead varies significantly by industry, deal size, and sales cycle. For B2B SaaS with average deal sizes of $25k-$100k, a cost per qualified lead of $200-$500 is typical. For enterprise deals above $100k, $500-$2,000 per qualified lead can still deliver strong ROI. The key metric is not cost per lead but cost per opportunity: what does it cost to generate a real sales opportunity? Target a cost per opportunity that is less than 10% of your average deal size.",
  },
  {
    question: "Is cold outreach still effective for B2B lead generation in 2026?",
    answer: "Cold outreach still works but requires a fundamentally different approach than it did even two years ago. Generic mass emails to purchased lists get less than 1% response rates. However, warm outreach to companies showing intent signals, personalized based on their specific behavior and business context, achieves 8-15% response rates. The line between cold and warm has blurred: if you know a company visited your pricing page, your outreach is not truly cold even if you have never spoken before.",
  },
  {
    question: "How many leads should a B2B company generate per month?",
    answer: "The right number depends on your sales capacity and conversion rates, not on industry benchmarks. Work backward from your revenue target: if you need $1M in new pipeline per quarter and your average deal is $50k, you need 20 new opportunities. If your lead-to-opportunity conversion rate is 20%, you need 100 qualified leads per quarter or about 33 per month. Focus on generating enough high-quality leads to keep your sales team fully utilized without creating a backlog that leads to slow follow-up.",
  },
]

export default function LeadGenerationPage() {
  return (
    <main>
      <StructuredData data={generateFAQSchema({ faqs })} />
      <StructuredData data={generateBlogPostSchema({ title: "B2B Lead Generation: Intent-Based Strategies That Build Pipeline (2026)", description: "Proven B2B lead generation strategies that prioritize intent over volume. Learn how to build predictable pipeline using visitor identification, intent data, and multi-channel outreach.", author: "Cursive Team", publishDate: "2026-02-01", image: "https://meetcursive.com/cursive-logo.png" })} />

      {/* Breadcrumb */}
      <section className="py-6 bg-gray-50 border-b border-gray-200">
        <Container>
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/blog" className="hover:text-primary">
              Blog
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Lead Generation</span>
          </nav>
        </Container>
      </section>

      {/* Hero Section */}
      <section className="py-16 bg-white">
        <Container>
          <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              Lead Generation
            </div>

            <h1 className="text-5xl font-bold mb-6">
              B2B Lead Generation: Intent-Based Strategies That Build Pipeline
            </h1>

            <p className="text-xl text-gray-600 mb-6">
              The B2B lead generation playbook has changed. Cold lists and generic outreach generate volume,
              but intent-based strategies generate pipeline. Learn how to identify companies that are actively
              shopping, reach them across every channel, and build a predictable revenue engine that scales.
            </p>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>February 5, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>16 min read</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Table of Contents */}
      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-bold mb-4">Table of Contents</h2>
            <nav className="grid md:grid-cols-2 gap-2 text-sm">
              <a href="#lead-gen-evolution" className="text-primary hover:underline">1. The Evolution of B2B Lead Generation</a>
              <a href="#intent-vs-cold" className="text-primary hover:underline">2. Intent-Based vs. Cold Outreach</a>
              <a href="#visitor-identification" className="text-primary hover:underline">3. Visitor Identification as Lead Gen</a>
              <a href="#building-pipeline" className="text-primary hover:underline">4. Building a Predictable Pipeline</a>
              <a href="#multi-channel" className="text-primary hover:underline">5. Multi-Channel Lead Generation</a>
              <a href="#qualifying-leads" className="text-primary hover:underline">6. Qualifying and Scoring Leads</a>
              <a href="#scaling-lead-gen" className="text-primary hover:underline">7. Scaling Without Sacrificing Quality</a>
              <a href="#faq" className="text-primary hover:underline">8. Frequently Asked Questions</a>
            </nav>
          </div>
        </Container>
      </section>

      {/* Article Content */}
      <section className="py-16 bg-white">
        <Container>
          <article className="max-w-3xl mx-auto prose prose-lg prose-blue">

            {/* Section 1 */}
            <h2 id="lead-gen-evolution">The Evolution of B2B Lead Generation</h2>
            <p>
              B2B lead generation has gone through three distinct eras. Understanding where we&apos;ve been
              explains why what used to work no longer does&mdash;and what to do instead.
            </p>

            <p>
              <strong>Era 1: The List Era (2005-2015).</strong> Buy a list of companies matching your ICP, hire
              SDRs, and have them cold call and email their way through it. Volume was the strategy. A 2% response
              rate was acceptable because lists were cheap and labor was the main cost. This era produced
              predictable revenue for early movers, but the playbook was eventually commoditized.
            </p>

            <p>
              <strong>Era 2: The Content/Inbound Era (2015-2023).</strong> Create content, gate it behind forms,
              and nurture leads through email sequences. HubSpot popularized this model. It worked brilliantly
              when few companies were doing it, but by 2020, every company had a blog, a whitepaper, and a
              drip campaign. Buyer inboxes overflowed. Form conversion rates dropped from 5% to under 1%.
              MQL inflation meant marketing celebrated numbers that sales ignored.
            </p>

            <p>
              <strong>Era 3: The Intent Era (2023-present).</strong> Instead of casting a wide net (lists) or
              waiting for prospects to come to you (inbound), identify companies showing active buying signals
              and reach them with personalized, timely outreach. This approach combines the proactive nature of
              outbound with the relevance of inbound. It&apos;s the future of B2B lead generation.
            </p>

            <div className="not-prose bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 my-8 border border-blue-200">
              <h3 className="font-bold text-lg mb-3">Lead Generation Eras: Response Rate Comparison</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Cold list outreach (generic)</span>
                    <span className="text-sm text-gray-600">1-2% response rate</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-red-400 h-3 rounded-full" style={{ width: "8%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Inbound MQLs (form fills)</span>
                    <span className="text-sm text-gray-600">3-5% response rate</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-amber-400 h-3 rounded-full" style={{ width: "20%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Intent-based outreach (warm)</span>
                    <span className="text-sm text-gray-600">8-15% response rate</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: "60%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Visitor identification + personalized outreach</span>
                    <span className="text-sm text-gray-600">12-25% response rate</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: "90%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <h2 id="intent-vs-cold">Intent-Based vs. Cold Outreach</h2>
            <p>
              The most important distinction in modern B2B lead generation is between cold and intent-based
              outreach. Both involve proactive outreach to prospects who haven&apos;t explicitly raised their
              hand. The difference is <em>who</em> you reach out to and <em>what</em> you say.
            </p>

            <h3>Cold Outreach: The Volume Play</h3>
            <p>
              Cold outreach targets companies that match your ICP but have shown no signals of interest. You
              know they <em>could</em> be a customer based on firmographic criteria (right size, right industry,
              right tech stack) but you don&apos;t know if they&apos;re actively looking for a solution.
            </p>
            <p>
              The advantage of cold outreach is scale: you can target any company that matches your ICP,
              giving you a much larger addressable market. The disadvantage is timing: most prospects aren&apos;t
              in a buying cycle when you contact them, so response rates are low and sales cycles are long.
              For current best practices, read our{" "}
              <Link href="/blog/cold-email-2026">cold email guide for 2026</Link>.
            </p>

            <h3>Intent-Based Outreach: The Precision Play</h3>
            <p>
              Intent-based outreach targets companies that match your ICP <em>and</em> are actively showing
              buying signals. These signals include:
            </p>
            <ul>
              <li><strong>First-party intent:</strong> Visiting your pricing page, viewing case studies, returning to your site multiple times</li>
              <li><strong>Third-party intent:</strong> Researching your product category, reading competitor reviews, engaging with industry reports</li>
              <li><strong>Trigger events:</strong> New funding rounds, leadership changes, technology migrations, job postings for roles that use your product</li>
            </ul>

            <p>
              The advantage of intent-based outreach is conversion: you&apos;re reaching companies when
              they&apos;re already thinking about the problem you solve. Response rates are 5-10x higher
              than cold. The disadvantage is volume: the pool of actively in-market companies is smaller
              at any given time. That&apos;s why the smartest teams use both approaches.
            </p>

            <div className="not-prose overflow-x-auto my-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="border border-gray-300 p-3 text-left font-bold">Factor</th>
                    <th className="border border-gray-300 p-3 text-left font-bold">Cold Outreach</th>
                    <th className="border border-gray-300 p-3 text-left font-bold">Intent-Based Outreach</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Response Rate</td>
                    <td className="border border-gray-300 p-3 text-red-600">1-3%</td>
                    <td className="border border-gray-300 p-3 text-green-600 font-bold">8-25%</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Addressable Market</td>
                    <td className="border border-gray-300 p-3 text-green-600">Large</td>
                    <td className="border border-gray-300 p-3 text-amber-600">Smaller (in-market only)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Personalization Required</td>
                    <td className="border border-gray-300 p-3 text-amber-600">Moderate</td>
                    <td className="border border-gray-300 p-3 text-green-600">High (behavior-based)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Sales Cycle Length</td>
                    <td className="border border-gray-300 p-3 text-red-600">6-12 months</td>
                    <td className="border border-gray-300 p-3 text-green-600 font-bold">2-4 months</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Cost Per Opportunity</td>
                    <td className="border border-gray-300 p-3 text-red-600">High</td>
                    <td className="border border-gray-300 p-3 text-green-600 font-bold">Low</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Scalability</td>
                    <td className="border border-gray-300 p-3 text-green-600">High (volume play)</td>
                    <td className="border border-gray-300 p-3 text-amber-600">Medium (quality play)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              <strong>The winning formula:</strong> Use intent-based outreach as your primary lead generation
              engine (high conversion, efficient pipeline). Supplement with cold outreach to expand your
              addressable market into accounts that match your ICP but haven&apos;t shown intent yet. Allocate
              70% of outreach resources to intent-based, 30% to cold.
            </p>

            {/* Section 3 */}
            <h2 id="visitor-identification">Visitor Identification as Lead Gen</h2>
            <p>
              Your website is your best lead generation asset&mdash;it already attracts companies researching
              solutions like yours. The problem is that 98% of these visitors leave without identifying
              themselves. <Link href="/visitor-identification">Visitor identification</Link> turns this anonymous
              traffic into a lead generation engine.
            </p>

            <h3>How Visitor Identification Generates Leads</h3>
            <p>
              When Cursive identifies a company on your website, the system automatically:
            </p>
            <ol>
              <li><strong>Identifies the company:</strong> Matches the visitor to a company using IP intelligence and device fingerprinting, identifying up to 70% of B2B traffic</li>
              <li><strong>Enriches the data:</strong> Appends firmographic data (industry, size, revenue, location), technographic data (tech stack), and contact information for decision-makers</li>
              <li><strong>Scores the lead:</strong> Calculates an intent score based on pages viewed, visit frequency, session duration, and ICP fit</li>
              <li><strong>Routes to the right rep:</strong> Based on territory, account ownership, or round-robin rules, the qualified lead appears in the rep&apos;s CRM with full context</li>
              <li><strong>Triggers outreach:</strong> High-intent leads automatically enter personalized sequences across email, LinkedIn, and <Link href="/direct-mail">direct mail</Link></li>
            </ol>

            <div className="not-prose bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 my-8 border border-green-200">
              <h3 className="font-bold text-lg mb-3">Visitor Identification Lead Gen Results</h3>
              <p className="text-sm text-gray-700 mb-4">
                Aggregate results from B2B SaaS companies using Cursive for lead generation:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <p className="text-3xl font-bold text-green-600">70%</p>
                  <p className="text-xs text-gray-600 mt-1">Anonymous traffic identified</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <p className="text-3xl font-bold text-green-600">3-5x</p>
                  <p className="text-xs text-gray-600 mt-1">More qualified pipeline</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <p className="text-3xl font-bold text-green-600">62%</p>
                  <p className="text-xs text-gray-600 mt-1">Lower cost per opportunity</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <p className="text-3xl font-bold text-green-600">2.1x</p>
                  <p className="text-xs text-gray-600 mt-1">Faster deal velocity</p>
                </div>
              </div>
            </div>

            <p>
              The key insight is that visitor identification isn&apos;t replacing your existing lead generation
              channels&mdash;it&apos;s unlocking the massive pool of interested companies that your current
              process misses. Every visitor who doesn&apos;t fill out a form is a lead you&apos;re losing to
              competitors who follow up faster.
            </p>

            {/* Section 4 */}
            <h2 id="building-pipeline">Building a Predictable Pipeline</h2>
            <p>
              Predictable pipeline doesn&apos;t happen by accident. It requires a systematic approach to lead
              generation that balances multiple sources, maintains consistent quality, and provides clear
              visibility into future revenue. Here&apos;s the framework.
            </p>

            <h3>Step 1: Define Your ICP with Precision</h3>
            <p>
              Most companies define their ICP too broadly. &quot;Mid-market SaaS companies&quot; is not specific
              enough. A precise ICP includes: industry vertical (e.g., B2B SaaS, not just &quot;technology&quot;),
              company size range (e.g., 100-500 employees), growth stage (e.g., Series B-D), technology
              requirements (e.g., uses Salesforce CRM), budget authority (e.g., VP-level and above), and
              geographic focus. Read our complete{" "}
              <Link href="/blog/icp-targeting-guide">ICP targeting framework</Link> for the full methodology.
            </p>

            <h3>Step 2: Establish Multiple Lead Sources</h3>
            <p>
              Relying on a single lead source creates fragility. Build a portfolio of lead generation channels:
            </p>
            <ul>
              <li><strong>Visitor identification (30-40% of pipeline):</strong> The highest-quality source because these companies are already on your site researching solutions</li>
              <li><strong>Content &amp; SEO (20-30% of pipeline):</strong> Blog posts, guides, and tools that attract organic search traffic matching buyer intent keywords</li>
              <li><strong>Outbound (20-25% of pipeline):</strong> Proactive outreach to ICP-match companies showing intent signals from third-party data</li>
              <li><strong>Paid advertising (10-15% of pipeline):</strong> LinkedIn Ads, Google Ads, and <Link href="/blog/retargeting">retargeting</Link> campaigns targeting specific account lists</li>
              <li><strong>Referrals &amp; partners (5-10% of pipeline):</strong> Customer referrals, technology partner leads, and community-driven opportunities</li>
            </ul>

            <h3>Step 3: Build a Lead Scoring Model</h3>
            <p>
              Not every lead deserves the same level of attention. Build a scoring model that combines ICP fit
              (firmographic match) with intent signals (behavioral match). A company that perfectly matches your
              ICP and visited your pricing page three times this week scores differently than one that loosely
              matches your ICP and read a single blog post. Route leads based on score tier. See the{" "}
              <Link href="/blog/crm-integration">CRM integration guide</Link> for how scoring syncs to your
              sales tools.
            </p>

            <h3>Step 4: Set Up Automated Workflows</h3>
            <p>
              Speed-to-lead is the strongest predictor of conversion. Leads contacted within 5 minutes are 21x
              more likely to convert than those contacted after 30 minutes. Build automated workflows that:
            </p>
            <ul>
              <li>Instantly notify the assigned rep when a high-intent lead is identified</li>
              <li>Automatically enroll qualified leads in personalized email sequences</li>
              <li>Add identified accounts to retargeting audiences in real-time</li>
              <li>Trigger direct mail for enterprise-tier target accounts</li>
              <li>Create CRM tasks with full context so reps can act immediately</li>
            </ul>

            <h3>Step 5: Measure and Optimize Weekly</h3>
            <p>
              Review these metrics weekly: leads generated by source, lead-to-opportunity conversion rate
              by source, pipeline generated vs. target, cost per qualified opportunity, and speed-to-lead.
              Double down on channels producing high-quality pipeline. Fix or cut channels that generate
              volume but not quality. See our{" "}
              <Link href="/blog/analytics">marketing analytics guide</Link> for dashboard best practices.
            </p>

            {/* Section 5 */}
            <h2 id="multi-channel">Multi-Channel Lead Generation</h2>
            <p>
              B2B buyers don&apos;t live on a single channel. They research on Google, network on LinkedIn,
              check email throughout the day, and occasionally receive physical mail. The most effective lead
              generation strategies meet prospects where they are with coordinated messaging across channels.
            </p>

            <h3>Email Outreach</h3>
            <p>
              Email remains the backbone of B2B lead generation. When powered by visitor identification data,
              email outreach becomes highly personalized: &quot;I noticed your team has been researching
              [category] and wanted to share how companies like [similar customer] are solving [specific
              problem].&quot; This context-aware approach achieves response rates that generic sequences
              cannot match. Build sequences of 4-6 touches over 2-3 weeks, mixing value-add content with
              direct asks.
            </p>

            <h3>LinkedIn Outreach</h3>
            <p>
              LinkedIn connection requests and InMails complement email outreach. When a prospect sees your
              name in both their inbox and LinkedIn feed, you build credibility through multi-channel presence.
              Use LinkedIn for softer touches: commenting on their posts, sharing relevant content, and
              building genuine rapport before making a direct ask. Keep LinkedIn messages under 300 characters
              for maximum response rates.
            </p>

            <h3>Paid Advertising for Lead Gen</h3>
            <p>
              Don&apos;t use paid ads for cold lead generation alone&mdash;CPLs are typically too high. Instead,
              use paid ads to amplify your other channels: retarget identified website visitors on LinkedIn,
              run Google Ads against high-intent keywords that match your visitor behavior data, and use Meta
              ads for building awareness with target account lists. The combination of organic visitor
              identification plus paid retargeting is more efficient than either channel alone.
            </p>

            <h3>Direct Mail for High-Value Accounts</h3>
            <p>
              For enterprise prospects with deal sizes above $50k, <Link href="/direct-mail">direct mail</Link>{" "}
              is one of the most effective lead generation channels. When you identify a high-intent enterprise
              account on your website, send a personalized physical piece within 48 hours. The combination of
              digital identification and physical follow-up creates a memorable experience that stands out from
              the hundreds of emails and ads competing for attention.
            </p>

            <div className="not-prose bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 my-8 border border-amber-200">
              <h3 className="font-bold text-lg mb-3">Pro Tip: The Multi-Channel Sequence</h3>
              <p className="text-sm text-gray-700 mb-3">
                The highest-converting lead generation approach combines multiple channels in a single
                coordinated sequence. Here&apos;s a proven framework for high-intent identified visitors:
              </p>
              <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                <li><strong>Day 0:</strong> Visitor identified on pricing page. Alert sent to rep. Added to retargeting audiences.</li>
                <li><strong>Day 1:</strong> Personalized email referencing their research behavior and a relevant case study.</li>
                <li><strong>Day 2:</strong> LinkedIn connection request with a brief, value-oriented note.</li>
                <li><strong>Day 3:</strong> Retargeting ads begin serving on LinkedIn and Google Display.</li>
                <li><strong>Day 4:</strong> Follow-up email with a different angle (ROI calculator, customer testimonial).</li>
                <li><strong>Day 5:</strong> Direct mail piece arrives (for enterprise accounts).</li>
                <li><strong>Day 7:</strong> Phone call with full context from all prior touches.</li>
              </ol>
              <p className="text-sm text-gray-600 mt-3">
                This coordinated approach typically achieves 3-4x the meeting rate of single-channel outreach.
              </p>
            </div>

            {/* Section 6 */}
            <h2 id="qualifying-leads">Qualifying and Scoring Leads</h2>
            <p>
              More leads is not always better. A common mistake is celebrating lead volume while ignoring lead
              quality. One qualified lead that converts to a $100k opportunity is worth more than 100 unqualified
              leads that waste your sales team&apos;s time. Effective qualification starts with clear criteria.
            </p>

            <h3>The BANT Framework (Updated for 2026)</h3>
            <p>
              The classic BANT framework (Budget, Authority, Need, Timeline) still works but needs modernization:
            </p>
            <ul>
              <li><strong>Budget:</strong> Does the company have budget for a solution in your price range? Use funding data, company size, and technology spend as proxies.</li>
              <li><strong>Authority:</strong> Are you reaching decision-makers or influencers? Identify the buying committee, not just one contact. Cursive enriches contacts by title and seniority.</li>
              <li><strong>Need:</strong> Do they have a problem your product solves? Intent signals (visiting specific solution pages) and firmographic fit (right industry, right size) indicate need.</li>
              <li><strong>Timeline:</strong> Are they buying now or in 12 months? High-frequency website visits, pricing page views, and competitive research suggest an active buying timeline.</li>
            </ul>

            <h3>Building a Lead Scoring Model</h3>
            <p>
              Assign numerical scores to each qualification criterion and automatically calculate a total score
              for every lead. Here&apos;s a practical scoring framework:
            </p>

            <div className="not-prose overflow-x-auto my-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="border border-gray-300 p-3 text-left font-bold">Signal</th>
                    <th className="border border-gray-300 p-3 text-left font-bold">Points</th>
                    <th className="border border-gray-300 p-3 text-left font-bold">Category</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td className="border border-gray-300 p-3">Perfect ICP match (size + industry + tech)</td>
                    <td className="border border-gray-300 p-3 font-bold text-green-600">+30</td>
                    <td className="border border-gray-300 p-3">Fit</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Partial ICP match</td>
                    <td className="border border-gray-300 p-3 font-bold text-amber-600">+15</td>
                    <td className="border border-gray-300 p-3">Fit</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Visited pricing page</td>
                    <td className="border border-gray-300 p-3 font-bold text-green-600">+25</td>
                    <td className="border border-gray-300 p-3">Intent</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Visited demo/trial page</td>
                    <td className="border border-gray-300 p-3 font-bold text-green-600">+25</td>
                    <td className="border border-gray-300 p-3">Intent</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">3+ visits in one week</td>
                    <td className="border border-gray-300 p-3 font-bold text-green-600">+20</td>
                    <td className="border border-gray-300 p-3">Intent</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Visited case study or comparison page</td>
                    <td className="border border-gray-300 p-3 font-bold text-amber-600">+15</td>
                    <td className="border border-gray-300 p-3">Intent</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Single blog visit only</td>
                    <td className="border border-gray-300 p-3 font-bold text-gray-600">+5</td>
                    <td className="border border-gray-300 p-3">Intent</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Third-party intent signals detected</td>
                    <td className="border border-gray-300 p-3 font-bold text-green-600">+20</td>
                    <td className="border border-gray-300 p-3">Intent</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Recent funding or hiring trigger</td>
                    <td className="border border-gray-300 p-3 font-bold text-amber-600">+10</td>
                    <td className="border border-gray-300 p-3">Timing</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              <strong>Score tiers:</strong> 80+ points = Sales-ready (immediate rep outreach). 50-79 points =
              Marketing-qualified (nurture sequence + retargeting). 20-49 points = Monitoring (add to
              retargeting, no outreach). Under 20 = Low priority (organic nurture only).
            </p>

            {/* Section 7 */}
            <h2 id="scaling-lead-gen">Scaling Without Sacrificing Quality</h2>
            <p>
              The biggest challenge in B2B lead generation is scaling volume while maintaining quality. Here are
              the strategies that let you grow pipeline without degrading conversion rates.
            </p>

            <h3>Automate the Repetitive, Personalize the Critical</h3>
            <p>
              Use automation for lead identification, scoring, routing, and sequence enrollment. But keep
              personalization in the critical moments: the first email&apos;s opening line, the LinkedIn
              connection request, and the discovery call preparation. AI tools can draft personalized content
              based on visitor behavior and firmographic data, but human review ensures authenticity. Read our{" "}
              <Link href="/blog/scaling-outbound">guide to scaling outbound</Link> for tactical frameworks.
            </p>

            <h3>Expand ICP Tiers Gradually</h3>
            <p>
              Once you&apos;ve saturated your primary ICP, expand into adjacent segments. If your core ICP is
              B2B SaaS companies with 100-500 employees, test expanding to 50-100 employees (smaller but
              similar) or 500-1000 employees (larger, potentially longer sales cycle). Measure conversion
              rates for each tier separately and only scale the tiers that produce quality pipeline.
            </p>

            <h3>Invest in Content That Attracts Buyers</h3>
            <p>
              Scale organic lead generation by creating content around the keywords your best customers searched
              before buying. Competitive comparison pages, ROI calculators, and technical guides attract
              late-stage buyers who are ready to evaluate. This content, combined with visitor identification,
              creates a flywheel: better content attracts more relevant visitors, visitor identification
              converts them to leads, and lead data informs the next round of content creation.
            </p>

            <h3>Use AI to Scale Personalization</h3>
            <p>
              Modern AI can analyze a company&apos;s website, recent news, job postings, and technology stack
              to generate personalized outreach messages at scale. The key is providing AI with rich context
              (which visitor identification data provides) rather than generic templates. A message that
              references a company&apos;s specific challenges and recent activity feels personal even when
              drafted by AI. Explore how{" "}
              <Link href="/blog/ai-sdr-vs-human-bdr">AI SDRs compare to human BDRs</Link> for pipeline
              generation.
            </p>

            <div className="not-prose bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 my-8 border border-green-200">
              <h3 className="font-bold text-lg mb-3">The Lead Gen Scaling Checklist</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Visitor identification deployed and synced to CRM</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Lead scoring model built and calibrated</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Automated routing and sequence enrollment active</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Multi-channel sequences running (email + LinkedIn + ads)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Content attracting high-intent organic traffic</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Weekly pipeline review with conversion rate analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Direct mail activated for enterprise-tier accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Retargeting audiences synced and campaigns running</span>
                </li>
              </ul>
            </div>

            {/* FAQ Section */}
            <h2 id="faq">Frequently Asked Questions</h2>

            <div className="not-prose space-y-6 my-8">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-bold text-lg mb-3">{faq.question}</h3>
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </div>

            {/* Conclusion */}
            <h2>From Volume to Value</h2>
            <p>
              The B2B lead generation companies that thrive in 2026 aren&apos;t the ones generating the most
              leads&mdash;they&apos;re the ones generating the right leads at the right time. Intent-based
              strategies, powered by visitor identification, flip the traditional model: instead of casting
              a wide net and hoping for responses, you identify companies already showing buying signals and
              meet them with personalized, timely, multi-channel outreach.
            </p>

            <p>
              Start by deploying <Link href="/visitor-identification">visitor identification</Link> to capture
              the 98% of interested companies your current process misses. Build a lead scoring model that
              prioritizes intent and ICP fit. Set up automated workflows that put qualified leads in front of
              reps within minutes, not days. And orchestrate multi-channel sequences that surround the buying
              committee with relevant messaging across every touchpoint.
            </p>

            <p>
              The result is a pipeline that&apos;s not just bigger, but better: higher conversion rates,
              shorter sales cycles, and a clear line from marketing investment to closed revenue.{" "}
              <Link href="/platform">See how Cursive&apos;s platform</Link> brings this entire lead
              generation engine together in one place.
            </p>

            <h2>About the Author</h2>
            <p>
              <strong>Adam Wolfe</strong> is the founder of Cursive. After watching B2B sales teams waste time
              chasing unqualified leads from purchased lists, he built Cursive to help companies generate pipeline
              from the companies already showing buying intent&mdash;identified visitors, enriched data, and
              automated outreach that converts at 5-10x the rate of cold prospecting.
            </p>
          </article>
        </Container>
      </section>

      {/* CTA Section */}
      <DashboardCTA
        headline="Turn Anonymous Visitors into"
        subheadline="Qualified Pipeline"
        description="Stop losing 98% of your website visitors. Cursive reveals who they are, enriches their data, and triggers multi-channel outreach automatically so you never miss a warm lead."
      />

      {/* Related Posts */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <div className="max-w-5xl mx-auto">
            <SimpleRelatedPosts posts={[
              {
                title: "AI SDR vs. Human BDR: Which Drives More Pipeline?",
                description: "We ran a 90-day experiment comparing AI SDR against human BDRs. The results surprised even us.",
                href: "/blog/ai-sdr-vs-human-bdr",
              },
              {
                title: "Cold Email in 2026: What Still Works",
                description: "The cold email landscape has changed dramatically. Here is what top performers do differently.",
                href: "/blog/cold-email-2026",
              },
              {
                title: "The 5-Step Framework for Perfect ICP Targeting",
                description: "Stop wasting money on bad leads. Define and target your ideal customer profile.",
                href: "/blog/icp-targeting-guide",
              },
            ]} />
          </div>
        </Container>
      </section>
    </main>
  )
}
