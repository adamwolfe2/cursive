import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft, ArrowRight, BarChart3, Check, X } from "lucide-react"
import { generateMetadata } from "@/lib/seo/metadata"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"
import Link from "next/link"

export const metadata = generateMetadata({
  title: "Marketing Analytics & Attribution: The Complete B2B Dashboard Guide (2026)",
  description: "Build marketing analytics dashboards that prove ROI. Learn multi-touch attribution modeling, pipeline metrics, and how to measure what actually drives B2B revenue.",
  keywords: [
    "marketing analytics",
    "marketing attribution",
    "B2B analytics dashboard",
    "multi-touch attribution",
    "marketing ROI",
    "pipeline analytics",
    "revenue attribution",
    "data-driven marketing",
    "marketing metrics",
    "campaign attribution",
  ],
  canonical: "https://meetcursive.com/blog/analytics",
})

const faqs = [
  {
    question: "What is multi-touch attribution and why does it matter for B2B?",
    answer: "Multi-touch attribution is a method of assigning credit to every marketing touchpoint that influences a deal, not just the first or last interaction. It matters for B2B because the average enterprise deal involves 27 touchpoints across 6-10 months. Last-click attribution gives 100% credit to the final action (like a demo request) while ignoring the blog post, webinar, and retargeting ads that built awareness and trust over months. Multi-touch models show the true ROI of each channel.",
  },
  {
    question: "What metrics should B2B marketers track in their analytics dashboard?",
    answer: "The essential B2B marketing metrics are pipeline generated (total dollar value of opportunities created from marketing activities), marketing-influenced pipeline (deals where marketing had at least one touchpoint), marketing-sourced revenue (closed deals directly attributed to marketing), cost per qualified lead, speed-to-lead, website-to-pipeline conversion rate, and channel-specific ROI. Vanity metrics like page views and social followers matter far less than pipeline and revenue metrics.",
  },
  {
    question: "How do you connect website visitor data to pipeline attribution?",
    answer: "Connecting visitor data to pipeline requires identity resolution. When a visitor identification tool like Cursive identifies a company on your website, that visit is logged against the company record. When a deal is created in your CRM for that company, attribution models trace back through every website visit, email interaction, and ad impression to assign credit. This closed-loop reporting shows exactly which marketing activities influenced each deal.",
  },
  {
    question: "What is the best attribution model for B2B marketing?",
    answer: "The best attribution model depends on your sales cycle and goals. For most B2B companies, a position-based (U-shaped) model works well: 40% credit to the first touch, 40% to the lead creation touch, and 20% distributed across middle interactions. For enterprise deals with very long cycles, time-decay models work better because they weight recent touchpoints more heavily. Start with position-based and adjust based on your data.",
  },
  {
    question: "How accurate is marketing attribution in 2026?",
    answer: "No attribution model is 100% accurate because of offline interactions, dark social sharing, and multi-device behavior. However, combining first-party visitor identification with CRM integration and multi-touch modeling gives you 70-85% visibility into the buyer journey. This is dramatically better than the 10-20% visibility most companies have with last-click analytics alone. The goal is directionally correct insights that inform budget decisions, not perfect precision.",
  },
]

export default function AnalyticsPage() {
  return (
    <main>
      <StructuredData data={generateFAQSchema({ faqs })} />
      <StructuredData data={generateBlogPostSchema({ title: "Marketing Analytics & Attribution: The Complete B2B Dashboard Guide (2026)", description: "Build marketing analytics dashboards that prove ROI. Learn multi-touch attribution modeling, pipeline metrics, and how to measure what actually drives B2B revenue.", author: "Cursive Team", publishDate: "2026-02-01", image: "https://meetcursive.com/cursive-logo.png" })} />

      {/* Breadcrumb */}
      <section className="py-6 bg-gray-50 border-b border-gray-200">
        <Container>
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/blog" className="hover:text-primary">
              Blog
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Analytics</span>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-full text-sm font-medium mb-6">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </div>

            <h1 className="text-5xl font-bold mb-6">
              Marketing Analytics &amp; Attribution: The Complete B2B Dashboard Guide
            </h1>

            <p className="text-xl text-gray-600 mb-6">
              Most B2B marketing teams can tell you how many leads they generated last month. Very few can tell you
              which specific campaigns influenced which deals and what the true cost per opportunity was. This guide
              shows you how to build dashboards, attribution models, and reporting that prove marketing&apos;s
              impact on revenue.
            </p>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>February 5, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>15 min read</span>
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
              <a href="#analytics-problem" className="text-primary hover:underline">1. The B2B Analytics Problem</a>
              <a href="#metrics-that-matter" className="text-primary hover:underline">2. Metrics That Actually Matter</a>
              <a href="#attribution-models" className="text-primary hover:underline">3. Attribution Models Explained</a>
              <a href="#building-dashboard" className="text-primary hover:underline">4. Building Your Marketing Dashboard</a>
              <a href="#visitor-data-attribution" className="text-primary hover:underline">5. Visitor Data in Attribution</a>
              <a href="#channel-roi" className="text-primary hover:underline">6. Measuring Channel-Specific ROI</a>
              <a href="#advanced-analytics" className="text-primary hover:underline">7. Advanced Analytics Strategies</a>
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
            <h2 id="analytics-problem">The B2B Analytics Problem</h2>
            <p>
              Here&apos;s a scenario every B2B marketing leader knows: the CEO asks &quot;What&apos;s our
              marketing ROI?&quot; and you scramble to pull numbers from five different tools, reconcile
              conflicting data, and present a slide that everyone knows is directionally approximate at best.
              This isn&apos;t a failure of effort&mdash;it&apos;s a failure of infrastructure.
            </p>

            <p>
              B2B marketing analytics are fundamentally harder than B2C for three reasons:
            </p>

            <div className="not-prose bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 my-8 border border-red-200">
              <h3 className="font-bold text-lg mb-3">Why B2B Analytics Are So Hard</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">1.</span>
                  <span><strong>Long, multi-touch buyer journeys:</strong> The average enterprise B2B deal involves 27 touchpoints over 6-10 months. A prospect might read a blog post in January, attend a webinar in March, click a retargeting ad in May, and book a demo in July. No single analytics tool captures this entire journey natively.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">2.</span>
                  <span><strong>Multiple stakeholders per deal:</strong> B2B purchases involve 6-10 decision-makers on average. One person researches on your website, another attends the webinar, a third requests the demo. Traditional analytics track individuals, not buying committees, creating blind spots in attribution.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">3.</span>
                  <span><strong>Anonymous traffic:</strong> 98% of B2B website visitors never fill out a form. Without <Link href="/visitor-identification" className="text-blue-600 hover:underline">visitor identification</Link>, these visitors are invisible to your analytics&mdash;creating a massive gap between actual interest and reported engagement.</span>
                </li>
              </ul>
            </div>

            <p>
              The result is that most B2B marketing teams operate with incomplete data, use simplistic attribution
              models (last-click or first-click), and can&apos;t confidently answer the question that matters
              most: &quot;Which marketing activities drive revenue?&quot; Let&apos;s fix that.
            </p>

            {/* Section 2 */}
            <h2 id="metrics-that-matter">Metrics That Actually Matter</h2>
            <p>
              Before building dashboards, you need to decide what to measure. The biggest mistake B2B marketers
              make is tracking vanity metrics&mdash;page views, social followers, email open rates&mdash;while
              ignoring the numbers that predict revenue. Here&apos;s the hierarchy of metrics from most to least
              important.
            </p>

            <h3>Tier 1: Revenue Metrics (Report to the Board)</h3>
            <ul>
              <li><strong>Marketing-sourced revenue:</strong> Closed-won revenue from deals where marketing generated the initial lead. This is your ultimate ROI metric.</li>
              <li><strong>Marketing-influenced revenue:</strong> Closed-won revenue from deals where marketing had at least one touchpoint, even if sales sourced the lead. Often 2-3x larger than marketing-sourced.</li>
              <li><strong>Pipeline generated:</strong> Total dollar value of new opportunities created from marketing activities this month/quarter.</li>
              <li><strong>Cost per opportunity:</strong> Total marketing spend divided by qualified opportunities generated. The metric CFOs care about most.</li>
            </ul>

            <h3>Tier 2: Efficiency Metrics (Report to Marketing Leadership)</h3>
            <ul>
              <li><strong>Speed-to-lead:</strong> Time from first website visit to first sales touch. Industry benchmark is under 5 minutes for inbound, under 24 hours for identified visitors.</li>
              <li><strong>Marketing-qualified lead (MQL) to opportunity conversion rate:</strong> What percentage of qualified leads become real deals? Target 15-25% for B2B.</li>
              <li><strong>Cost per qualified lead:</strong> Total spend per channel divided by qualified leads generated. Allows channel-to-channel comparison.</li>
              <li><strong>Pipeline velocity:</strong> How quickly deals move through your pipeline. Marketing can influence this through nurture content and retargeting.</li>
            </ul>

            <h3>Tier 3: Activity Metrics (Report to Marketing Team)</h3>
            <ul>
              <li><strong>Website visitors identified:</strong> How many anonymous visitors were resolved to company-level identity through <Link href="/visitor-identification">visitor identification</Link>.</li>
              <li><strong>Engagement by account tier:</strong> Are your target accounts engaging more than last month? Track by ICP tier.</li>
              <li><strong>Content performance:</strong> Which pages, posts, and resources drive the most pipeline (not just traffic).</li>
              <li><strong>Channel contribution:</strong> What percentage of pipeline came from each channel (organic, paid, email, referral, direct).</li>
            </ul>

            <div className="not-prose bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 my-8 border border-green-200">
              <h3 className="font-bold text-lg mb-3">The One Metric That Changes Everything</h3>
              <p className="text-sm text-gray-700">
                If you could only track one new metric, track <strong>website-to-pipeline conversion rate</strong>:
                the percentage of identified website visitors that become qualified pipeline within 90 days.
                Most B2B companies have no idea what this number is because they can&apos;t identify their visitors.
                With visitor identification, you can measure it precisely and optimize every marketing channel to
                improve it. Top-performing B2B companies convert 2-5% of identified visitors to pipeline.
              </p>
            </div>

            {/* Section 3 */}
            <h2 id="attribution-models">Attribution Models Explained</h2>
            <p>
              Attribution models determine how credit for a conversion (lead, opportunity, or closed deal) is
              distributed across the touchpoints that influenced it. Choosing the wrong model leads to
              misinformed budget decisions. Here&apos;s what each model looks like in practice.
            </p>

            <h3>First-Touch Attribution</h3>
            <p>
              <strong>How it works:</strong> 100% of credit goes to the first marketing touchpoint.
            </p>
            <p>
              <strong>Example:</strong> A prospect reads your blog post in January, clicks a retargeting ad in
              March, attends a webinar in May, and requests a demo in June. The blog post gets 100% credit.
            </p>
            <p>
              <strong>Best for:</strong> Understanding which channels drive awareness and top-of-funnel demand.
              Useful for content marketing teams measuring discovery.
            </p>
            <p>
              <strong>Limitation:</strong> Ignores everything that happened between first touch and conversion.
              Over-credits awareness channels, under-credits conversion channels.
            </p>

            <h3>Last-Touch Attribution</h3>
            <p>
              <strong>How it works:</strong> 100% of credit goes to the last touchpoint before conversion.
            </p>
            <p>
              <strong>Example:</strong> Same journey as above. The demo request page gets 100% credit.
            </p>
            <p>
              <strong>Best for:</strong> Understanding which channels directly drive conversions. Useful for
              optimizing bottom-of-funnel campaigns.
            </p>
            <p>
              <strong>Limitation:</strong> Ignores the entire nurture journey. Massively under-credits content
              marketing, brand, and awareness channels. This is the default in Google Analytics and most CRMs,
              which is why it&apos;s so common and so misleading.
            </p>

            <h3>Linear Attribution</h3>
            <p>
              <strong>How it works:</strong> Credit is split equally across all touchpoints.
            </p>
            <p>
              <strong>Example:</strong> Blog post, retargeting ad, webinar, and demo each get 25% credit.
            </p>
            <p>
              <strong>Best for:</strong> A balanced starting point when you don&apos;t have enough data to
              choose a more sophisticated model. Fair to all channels.
            </p>
            <p>
              <strong>Limitation:</strong> Treats every touchpoint as equally important, which isn&apos;t
              realistic. The first touch that created awareness and the last touch that converted the lead
              are typically more impactful than a retargeting impression in between.
            </p>

            <h3>Position-Based (U-Shaped) Attribution</h3>
            <p>
              <strong>How it works:</strong> 40% credit to the first touch, 40% to the lead creation touch,
              and 20% distributed across all touches in between.
            </p>
            <p>
              <strong>Example:</strong> Blog post gets 40%, demo request gets 40%, retargeting ad and webinar
              split the remaining 20%.
            </p>
            <p>
              <strong>Best for:</strong> Most B2B companies. Properly weights the moments that matter most
              (discovery and conversion) while still giving credit to nurture activities.
            </p>
            <p>
              <strong>Limitation:</strong> Arbitrary weight distribution. For very long sales cycles, the
              middle touchpoints may deserve more credit than 20% combined.
            </p>

            <h3>Time-Decay Attribution</h3>
            <p>
              <strong>How it works:</strong> Touchpoints closer to the conversion receive more credit than
              earlier ones, following an exponential decay curve.
            </p>
            <p>
              <strong>Example:</strong> Demo request gets 40% credit, webinar gets 30%, retargeting ad gets
              20%, blog post gets 10%.
            </p>
            <p>
              <strong>Best for:</strong> Enterprise sales cycles where recent engagement is the strongest
              signal of purchase intent. Good for companies with 6+ month sales cycles.
            </p>
            <p>
              <strong>Limitation:</strong> Under-credits the initial discovery that started the entire journey.
              Can lead to under-investment in top-of-funnel channels.
            </p>

            <div className="not-prose overflow-x-auto my-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="border border-gray-300 p-3 text-left font-bold">Model</th>
                    <th className="border border-gray-300 p-3 text-left font-bold">Best For</th>
                    <th className="border border-gray-300 p-3 text-left font-bold">Complexity</th>
                    <th className="border border-gray-300 p-3 text-left font-bold">B2B Accuracy</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td className="border border-gray-300 p-3 font-bold">First-Touch</td>
                    <td className="border border-gray-300 p-3">Awareness measurement</td>
                    <td className="border border-gray-300 p-3 text-green-600">Simple</td>
                    <td className="border border-gray-300 p-3 text-red-600">Low</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-bold">Last-Touch</td>
                    <td className="border border-gray-300 p-3">Conversion optimization</td>
                    <td className="border border-gray-300 p-3 text-green-600">Simple</td>
                    <td className="border border-gray-300 p-3 text-red-600">Low</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-bold">Linear</td>
                    <td className="border border-gray-300 p-3">Balanced starting point</td>
                    <td className="border border-gray-300 p-3 text-green-600">Simple</td>
                    <td className="border border-gray-300 p-3 text-amber-600">Medium</td>
                  </tr>
                  <tr className="bg-blue-50 border-2 border-blue-500">
                    <td className="border border-gray-300 p-3 font-bold">Position-Based</td>
                    <td className="border border-gray-300 p-3">Most B2B companies</td>
                    <td className="border border-gray-300 p-3 text-amber-600">Medium</td>
                    <td className="border border-gray-300 p-3 text-green-600 font-bold">High</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-bold">Time-Decay</td>
                    <td className="border border-gray-300 p-3">Long enterprise cycles</td>
                    <td className="border border-gray-300 p-3 text-amber-600">Medium</td>
                    <td className="border border-gray-300 p-3 text-green-600">High</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              <strong>Our recommendation:</strong> Start with position-based (U-shaped) attribution. It properly
              values both demand creation and demand capture while acknowledging the nurture journey in between.
              As your data matures, consider custom-weighted or data-driven models that learn from your actual
              conversion patterns.
            </p>

            {/* Section 4 */}
            <h2 id="building-dashboard">Building Your Marketing Dashboard</h2>
            <p>
              A great marketing dashboard tells a story in under 30 seconds. Leadership should be able to glance
              at it and understand: Are we on track for pipeline targets? Which channels are working? Where should
              we invest more? Here&apos;s how to structure it.
            </p>

            <h3>Dashboard Section 1: Pipeline Summary</h3>
            <p>
              The top of your dashboard should show three numbers: pipeline generated this month vs. target,
              marketing-sourced revenue this quarter vs. target, and cost per opportunity trend. These are the
              numbers your CEO cares about. Everything else supports them.
            </p>

            <h3>Dashboard Section 2: Channel Performance</h3>
            <p>
              A bar chart comparing pipeline generated by channel: organic search, paid ads, email, referral,
              direct, social, and visitor identification. Include cost per opportunity for each channel so you
              can see both volume and efficiency. Highlight the top-performing channel and the one with the most
              room for improvement.
            </p>

            <h3>Dashboard Section 3: Visitor Intelligence</h3>
            <p>
              Show the companies identified on your website this week, segmented by ICP fit and intent level.
              How many high-intent visitors were identified? How many matched your ICP? What was the conversion
              rate from identified visitor to qualified meeting? This section, powered by{" "}
              <Link href="/visitor-identification">visitor identification data</Link>, reveals demand that
              traditional analytics completely miss.
            </p>

            <h3>Dashboard Section 4: Content &amp; Campaign Performance</h3>
            <p>
              Which blog posts, landing pages, and campaigns influenced the most pipeline? Don&apos;t rank by
              traffic&mdash;rank by pipeline influence. A blog post that got 500 views but influenced $200k in
              pipeline is more valuable than one that got 10,000 views and influenced nothing. This reframes
              content strategy around revenue impact.
            </p>

            <h3>Dashboard Section 5: Funnel Conversion Rates</h3>
            <p>
              Track conversion rates at each stage: visitor to identified visitor, identified visitor to qualified
              lead, qualified lead to opportunity, opportunity to closed-won. When any conversion rate drops below
              benchmark, you know exactly where to focus optimization efforts. Include trend lines so you can see
              whether each stage is improving or degrading over time.
            </p>

            <div className="not-prose bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 my-8 border border-blue-200">
              <h3 className="font-bold text-lg mb-3">Dashboard Best Practices</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Update in real-time or daily&mdash;weekly is too slow for B2B</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Show trends, not just current numbers&mdash;direction matters more than position</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Include benchmarks or targets so every metric has context</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Limit to 10-12 KPIs maximum&mdash;more dilutes focus</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Build separate views for CEO, marketing leadership, and campaign managers</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-600" />
                  <span>Don&apos;t include vanity metrics (page views, social followers) in executive dashboards</span>
                </li>
              </ul>
            </div>

            {/* Section 5 */}
            <h2 id="visitor-data-attribution">Visitor Data in Attribution</h2>
            <p>
              The biggest gap in most B2B attribution models is anonymous website traffic. When 98% of visitors
              are invisible, your attribution model only sees the tip of the iceberg. Visitor identification
              changes this by resolving anonymous traffic to company-level identities, creating a complete
              picture of the buyer journey.
            </p>

            <h3>How Visitor Identification Improves Attribution</h3>
            <p>
              Consider a typical B2B buyer journey:
            </p>
            <ol>
              <li>VP of Marketing at Acme Corp reads your blog post via organic search (anonymous&mdash;no form fill)</li>
              <li>Same person returns two days later and browses your solution pages (still anonymous)</li>
              <li>A colleague at Acme Corp clicks a retargeting ad and visits pricing (anonymous, different device)</li>
              <li>The VP books a demo three weeks later via a direct link from a colleague</li>
            </ol>

            <p>
              Without visitor identification, your analytics show: one organic visit (bounced), one direct visit
              (pricing page), one paid click, and one demo booking attributed to &quot;direct&quot; traffic.
              Four disconnected sessions with no story.
            </p>

            <p>
              With visitor identification, all four sessions are resolved to Acme Corp. Your attribution model
              now shows the complete journey: organic search (first touch, 40% credit), solution pages (nurture,
              10% credit), retargeting ad (nurture, 10% credit), and demo booking (conversion, 40% credit).
              You can prove that the blog post started a $100k deal.
            </p>

            <div className="not-prose bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 my-8 border border-blue-200">
              <h3 className="font-bold text-lg mb-3">Attribution Visibility: Before and After Visitor Identification</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-2 text-red-700">Without Visitor ID</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-600" />
                      See 2-5% of buyer journey
                    </li>
                    <li className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-600" />
                      Attribution starts at form fill
                    </li>
                    <li className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-600" />
                      Can&apos;t connect multi-person journeys
                    </li>
                    <li className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-600" />
                      Over-credits bottom-of-funnel
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-green-700">With Visitor ID</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      See 70-85% of buyer journey
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Attribution starts at first visit
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Account-level journey stitching
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Fair credit across full funnel
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <h2 id="channel-roi">Measuring Channel-Specific ROI</h2>
            <p>
              Once your attribution model is in place, you can measure the true ROI of each marketing channel.
              Here&apos;s how to think about channel measurement for the major B2B marketing channels.
            </p>

            <h3>Organic Search</h3>
            <p>
              Track pipeline influenced by organic landing pages, not just organic traffic volume. A blog post
              that ranks #1 for a high-intent keyword and generates 20 identified high-intent visitors per month
              is worth more than a post ranking #1 for an informational keyword generating 2,000 visitors who
              never return. Use visitor identification to see which organic visitors become pipeline.
            </p>

            <h3>Paid Advertising</h3>
            <p>
              For paid channels (Google Ads, LinkedIn Ads, Meta), calculate cost per qualified opportunity, not
              just cost per click or cost per lead. A LinkedIn campaign that generates 10 leads at $50 each
              but zero opportunities is worse than one generating 3 leads at $150 each that converts 2 into
              $50k opportunities. Include{" "}
              <Link href="/blog/retargeting">retargeting campaign</Link> attribution in this analysis.
            </p>

            <h3>Email Marketing</h3>
            <p>
              Measure email&apos;s pipeline influence, not just open and click rates. Track which email sends
              occurred before opportunity creation and attribute credit accordingly. Email is typically
              under-valued by last-click models because it&apos;s often a nurture touchpoint rather than a
              conversion point.
            </p>

            <h3>Events &amp; Webinars</h3>
            <p>
              Calculate event ROI as: (pipeline influenced by attendees) minus (total event cost including
              time, travel, sponsorship). Track both sourced deals (attendees who became leads at the event)
              and influenced deals (existing pipeline contacts who attended). Events often have the highest
              cost per touch but also the highest conversion rate.
            </p>

            <h3>Visitor Identification</h3>
            <p>
              This is the newest channel in most marketing stacks and often the highest-ROI. Track: identified
              visitors per month, identified visitors matching ICP, meetings booked from identified accounts,
              and pipeline generated from visitor-sourced outreach. Most companies see 3-5x ROI within the
              first quarter. See <Link href="/platform">how the Cursive platform</Link> tracks these metrics.
            </p>

            {/* Section 7 */}
            <h2 id="advanced-analytics">Advanced Analytics Strategies</h2>

            <h3>Strategy 1: Dark Funnel Measurement</h3>
            <p>
              The &quot;dark funnel&quot; refers to buyer activity that traditional analytics can&apos;t see:
              word-of-mouth recommendations, Slack community discussions, podcast mentions, and private social
              sharing. While you can&apos;t track these directly, you can measure their impact indirectly.
              Track &quot;direct&quot; and &quot;organic brand&quot; traffic separately. Spike in direct traffic
              after a podcast appearance? That&apos;s dark funnel influence. Survey new leads on
              &quot;how did you first hear about us?&quot; for qualitative data.
            </p>

            <h3>Strategy 2: Cohort Analysis</h3>
            <p>
              Group leads by the month they were first identified and track how each cohort progresses through
              the funnel over time. This reveals whether your marketing is getting better at generating leads
              that convert or just generating more leads. If January&apos;s cohort converts at 12% but
              June&apos;s cohort converts at 18%, your targeting improvements are working.
            </p>

            <h3>Strategy 3: Account-Level Attribution</h3>
            <p>
              Instead of lead-level attribution (which credits a single person), implement account-level
              attribution that aggregates all touchpoints across all stakeholders at a company. This is
              especially important for enterprise B2B where 6-10 people influence the decision. Visitor
              identification makes this possible by resolving multiple anonymous visits to the same company.
            </p>

            <h3>Strategy 4: Incrementality Testing</h3>
            <p>
              The gold standard for measuring channel effectiveness is incrementality testing: run a controlled
              experiment where you turn off a channel for a random segment and measure the difference in outcomes.
              Pause retargeting for 20% of identified accounts for 30 days and compare their pipeline conversion
              rate to the 80% who continued receiving retargeting. The difference is the true incremental value
              of that channel.
            </p>

            <h3>Strategy 5: Predictive Pipeline Modeling</h3>
            <p>
              Use historical data to build models that predict future pipeline based on current activity. If you
              know that a 10% increase in identified high-intent visitors this month correlates with a 15%
              increase in pipeline next quarter, you can forecast revenue more accurately and adjust marketing
              spend proactively. This transforms analytics from backward-looking reporting to forward-looking
              intelligence.
            </p>

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
            <h2>From Reporting to Revenue Intelligence</h2>
            <p>
              Marketing analytics in 2026 isn&apos;t about counting clicks and impressions. It&apos;s about
              building a closed-loop system that connects every marketing touchpoint&mdash;from anonymous
              website visit to closed deal&mdash;and proves exactly how marketing drives revenue. Start with
              the metrics that matter (pipeline and revenue, not pageviews). Implement multi-touch attribution
              (position-based for most B2B companies). Add visitor identification to close the anonymous
              traffic gap. And build dashboards that tell a revenue story in 30 seconds.
            </p>

            <p>
              The companies that master marketing analytics don&apos;t just report on the past&mdash;they
              predict the future, optimize in real-time, and earn marketing its seat at the revenue table.
              Your data infrastructure determines your competitive advantage. Invest in it accordingly.
            </p>

            <p>
              Ready to see what your analytics are missing?{" "}
              <Link href="/platform">Explore Cursive&apos;s real-time analytics platform</Link> to see how
              visitor identification, attribution, and pipeline reporting work together in a single dashboard.
            </p>

            <h2>About the Author</h2>
            <p>
              <strong>Adam Wolfe</strong> is the founder of Cursive. After spending years watching B2B marketing
              teams struggle to prove ROI with incomplete data, he built Cursive to close the biggest analytics
              gap: identifying anonymous website visitors and connecting their behavior to pipeline and revenue
              through integrated attribution.
            </p>
          </article>
        </Container>
      </section>

      {/* CTA Section */}
      <DashboardCTA
        headline="See Exactly What"
        subheadline="Drives Pipeline"
        description="Real-time visitor tracking. Multi-channel attribution. Revenue reporting. Know which campaigns generate qualified leads and prove marketing ROI with data, not guesswork."
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
                title: "CRM Integration & Data Enrichment Guide",
                description: "Connect your visitor identification data to HubSpot, Salesforce, and your entire marketing stack.",
                href: "/blog/crm-integration",
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
