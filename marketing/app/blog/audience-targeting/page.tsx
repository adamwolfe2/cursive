import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { ArrowLeft, ArrowRight, Calendar, Clock, Target, CheckCircle, Users, BarChart3, Layers, Zap } from "lucide-react"
import { generateMetadata } from "@/lib/seo/metadata"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"
import Link from "next/link"

export const metadata = generateMetadata({
  title: "B2B Audience Targeting: The Complete Guide to Data-Driven Segmentation (2026)",
  description: "Master B2B audience targeting with data-driven segmentation strategies. Learn how to build your ICP, use firmographic and intent data, and create high-converting audience segments at scale.",
  keywords: [
    "audience targeting",
    "B2B audience segmentation",
    "audience builder",
    "intent-based targeting",
    "firmographic targeting",
    "customer segmentation",
    "target audience identification",
    "ideal customer profile",
    "ICP targeting",
    "B2B marketing segmentation",
    "behavioral targeting",
    "account-based marketing",
  ],
  canonical: "https://meetcursive.com/blog/audience-targeting",
})

const faqs = [
  {
    question: "What is B2B audience targeting and why does it matter?",
    answer: "B2B audience targeting is the process of identifying and reaching specific companies and decision-makers who match your ideal customer profile. It matters because targeted campaigns generate 3-5x higher conversion rates than generic outreach. By focusing on accounts that match your ICP based on firmographic, technographic, and intent data, you reduce wasted spend and increase pipeline velocity.",
  },
  {
    question: "How do I build an ideal customer profile (ICP) for targeting?",
    answer: "Start by analyzing your top 20 existing customers across revenue, retention, and expansion metrics. Identify common firmographic traits like industry, company size, revenue range, and geography. Layer on technographic signals such as their current tech stack and buying triggers. Validate with intent data to confirm which segments are actively researching solutions like yours. Update your ICP quarterly based on win/loss analysis.",
  },
  {
    question: "What data sources are best for B2B audience segmentation?",
    answer: "The most effective B2B segmentation combines four data layers: firmographic data (company size, industry, revenue), technographic data (technology stack, tools used), intent data (content consumption, search behavior, website visits), and behavioral data (engagement history, email opens, page views). Platforms like Cursive unify 220M+ consumer and 140M+ business profiles with 450B+ monthly intent signals for comprehensive segmentation.",
  },
  {
    question: "How is intent-based targeting different from firmographic targeting?",
    answer: "Firmographic targeting filters by static company attributes like industry and size, identifying who could buy. Intent-based targeting identifies who is actively buying right now by tracking content consumption, search queries, and website behavior. Intent data adds a timing dimension, helping you prioritize accounts showing purchase signals over those that merely fit your ICP but have no current need.",
  },
  {
    question: "What are the biggest mistakes in B2B audience targeting?",
    answer: "The five most common mistakes are: targeting too broadly instead of focusing on a specific ICP, relying on outdated or incomplete data, ignoring intent signals and only using firmographic filters, failing to exclude existing customers and competitors from campaigns, and not testing segment performance iteratively. Companies that avoid these mistakes see 40-60% improvements in campaign response rates.",
  },
]

export default function AudienceTargetingPage() {
  return (
    <main>
      <StructuredData data={generateFAQSchema({ faqs })} />
      <StructuredData data={generateBlogPostSchema({ title: "B2B Audience Targeting: The Complete Guide to Data-Driven Segmentation (2026)", description: "Master B2B audience targeting with data-driven segmentation strategies. Learn how to build your ICP, use firmographic and intent data, and create high-converting audience segments at scale.", author: "Cursive Team", publishDate: "2026-02-01", image: "https://meetcursive.com/cursive-logo.png" })} />

      {/* Header */}
      <section className="py-12 bg-white">
        <Container>
          <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <div className="max-w-4xl">
            <div className="inline-block px-3 py-1 bg-[#007AFF] text-white rounded-full text-sm font-medium mb-4">
              Audience Targeting
            </div>
            <h1 className="text-5xl font-bold mb-6">
              B2B Audience Targeting: The Complete Guide to Data-Driven Segmentation
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              The difference between good and great B2B marketing comes down to one thing: reaching the right people
              at the right time with the right message. This guide covers everything you need to build precise audience
              segments that convert, from ICP development to intent-based targeting strategies.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>January 27, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>14 min read</span>
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
              <a href="#why-targeting-matters" className="text-primary hover:underline">1. Why Audience Targeting Matters in B2B</a>
              <a href="#building-your-icp" className="text-primary hover:underline">2. Building Your Ideal Customer Profile</a>
              <a href="#four-pillars" className="text-primary hover:underline">3. The Four Pillars of B2B Segmentation</a>
              <a href="#intent-based-targeting" className="text-primary hover:underline">4. Intent-Based Targeting Strategies</a>
              <a href="#building-segments" className="text-primary hover:underline">5. Building High-Converting Segments</a>
              <a href="#implementation-guide" className="text-primary hover:underline">6. Implementation Guide</a>
              <a href="#measuring-success" className="text-primary hover:underline">7. Measuring Targeting Effectiveness</a>
              <a href="#faqs" className="text-primary hover:underline">8. Frequently Asked Questions</a>
            </nav>
          </div>
        </Container>
      </section>

      {/* Article Content */}
      <section className="py-16 bg-white">
        <Container>
          <article className="max-w-3xl mx-auto prose prose-lg prose-blue">

            {/* Section 1 */}
            <h2 id="why-targeting-matters">Why Audience Targeting Matters in B2B</h2>
            <p>
              Generic campaigns get ignored. Targeted campaigns that speak to specific pain points, industries, and buying
              stages get meetings booked. The data backs this up: according to Salesforce&apos;s State of Marketing report,
              B2B companies using advanced segmentation see <strong>760% more revenue from email campaigns</strong> compared
              to those sending batch-and-blast messages.
            </p>

            <p>
              Yet most B2B teams still target too broadly. They pull a list of companies by industry and size, blast the
              same message to everyone, and wonder why response rates hover at 1-2%. The problem isn&apos;t the channel or
              the copy. It&apos;s the targeting.
            </p>

            <div className="not-prose bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 my-8 border border-blue-200">
              <h3 className="font-bold text-lg mb-3">The Cost of Poor Targeting</h3>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">67%</div>
                  <p className="text-sm text-gray-600">of B2B marketing budget is wasted on unqualified leads</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">$15k</div>
                  <p className="text-sm text-gray-600">average cost per bad-fit customer that churns within 6 months</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">79%</div>
                  <p className="text-sm text-gray-600">of marketing leads never convert to sales due to poor qualification</p>
                </div>
              </div>
            </div>

            <p>
              Audience targeting isn&apos;t just about efficiency. It&apos;s about relevance. When you deeply understand
              your target accounts, you can personalize messaging at a level that resonates with decision-makers. You can
              reference their specific tech stack, acknowledge their industry challenges, and time your outreach to match
              their buying journey. That&apos;s what separates a 2% reply rate from a 15% one.
            </p>

            {/* Section 2 */}
            <h2 id="building-your-icp">Building Your Ideal Customer Profile</h2>
            <p>
              Your <Link href="/blog/icp-targeting-guide">ideal customer profile (ICP)</Link> is the foundation of all
              targeting. Without a clearly defined ICP, every segmentation effort downstream will be flawed. Here&apos;s
              a practical framework for building one that actually works.
            </p>

            <h3>Step 1: Analyze Your Best Customers</h3>
            <p>
              Start with your top 20 customers by revenue, retention, and net promoter score. Look for patterns across:
            </p>
            <ul>
              <li><strong>Company size:</strong> Employee count and revenue range where you win most often</li>
              <li><strong>Industry:</strong> Verticals where your product solves the most acute pain</li>
              <li><strong>Geography:</strong> Regions where you have the strongest market fit</li>
              <li><strong>Tech stack:</strong> Tools and platforms your best customers use alongside your product</li>
              <li><strong>Buying trigger:</strong> What event or need prompted them to purchase</li>
            </ul>

            <h3>Step 2: Identify Negative Signals</h3>
            <p>
              Equally important is understanding who you should <em>not</em> target. Analyze your churned customers and
              lost deals to identify disqualifying traits. Common negative signals include:
            </p>
            <ul>
              <li>Companies below a minimum revenue threshold that can&apos;t afford your solution</li>
              <li>Industries with regulatory constraints that prevent adoption</li>
              <li>Organizations without the technical infrastructure to integrate</li>
              <li>Companies already locked into multi-year contracts with competitors</li>
            </ul>

            <h3>Step 3: Weight Your Criteria</h3>
            <p>
              Not all ICP criteria are equal. Assign weights to each factor based on its correlation with customer success.
              For example, if industry is a stronger predictor of retention than company size, weight it more heavily in
              your scoring model.
            </p>

            <div className="not-prose bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 my-8 border border-green-200">
              <h3 className="font-bold text-lg mb-3">Example ICP Scoring Model</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-300">
                    <th className="text-left py-2 font-bold">Criteria</th>
                    <th className="text-center py-2 font-bold">Weight</th>
                    <th className="text-left py-2 font-bold">Ideal Range</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-green-100">
                    <td className="py-2">Industry</td>
                    <td className="text-center py-2">30%</td>
                    <td className="py-2">SaaS, FinTech, MarTech</td>
                  </tr>
                  <tr className="border-b border-green-100">
                    <td className="py-2">Employee Count</td>
                    <td className="text-center py-2">20%</td>
                    <td className="py-2">50-500 employees</td>
                  </tr>
                  <tr className="border-b border-green-100">
                    <td className="py-2">Revenue</td>
                    <td className="text-center py-2">20%</td>
                    <td className="py-2">$5M - $100M ARR</td>
                  </tr>
                  <tr className="border-b border-green-100">
                    <td className="py-2">Tech Stack</td>
                    <td className="text-center py-2">15%</td>
                    <td className="py-2">Uses Salesforce + HubSpot</td>
                  </tr>
                  <tr>
                    <td className="py-2">Intent Signals</td>
                    <td className="text-center py-2">15%</td>
                    <td className="py-2">Researching relevant topics</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>Step 4: Validate With Intent Data</h3>
            <p>
              An ICP based solely on firmographics tells you who <em>could</em> buy. Adding intent data tells you who
              is <em>likely</em> to buy right now. Use <Link href="/intent-audiences">intent signals</Link> to validate
              that your ICP segments correlate with actual buying behavior. If your highest-scoring ICP accounts aren&apos;t
              showing intent, refine your criteria.
            </p>

            {/* Section 3 */}
            <h2 id="four-pillars">The Four Pillars of B2B Segmentation</h2>
            <p>
              Effective B2B audience targeting combines four complementary data types. Each adds a different dimension to
              your understanding of target accounts, and the most successful teams layer all four.
            </p>

            <div className="not-prose grid md:grid-cols-2 gap-6 my-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">1. Firmographic Data</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Company-level attributes that define the organization. This is the foundation of all B2B segmentation.
                </p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Industry / SIC / NAICS codes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Company size (employees and revenue)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Geography and headquarters location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Funding stage and growth trajectory</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">2. Technographic Data</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Technology stack data reveals what tools and platforms a company uses, providing insight into maturity and compatibility.
                </p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>CRM platform (Salesforce, HubSpot, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Marketing automation tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Cloud infrastructure and hosting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Competitor product usage</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">3. Intent Data</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Behavioral signals indicating active research and purchase intent. This is the most powerful and underused data layer.
                </p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Content consumption patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Search query signals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Website visit behavior (pages, frequency)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Topic-level research surge detection</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">4. Engagement Data</h3>
                <p className="text-sm text-gray-600 mb-3">
                  First-party interaction data from your own channels, providing the most reliable signal of interest.
                </p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Email opens and click-through rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Website page views and session depth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Webinar and event attendance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Content downloads and form fills</span>
                  </li>
                </ul>
              </div>
            </div>

            <p>
              The key insight is that no single data layer is sufficient on its own. Firmographic data alone tells you
              which companies <em>could</em> be a fit but not when to reach out. Intent data tells you who&apos;s
              researching but not whether they match your ICP. The magic happens when you combine all four layers to
              create segments that are both well-fitted <em>and</em> actively in-market.
            </p>

            {/* Section 4 */}
            <h2 id="intent-based-targeting">Intent-Based Targeting Strategies</h2>
            <p>
              Intent data has transformed B2B audience targeting from static list-building to dynamic, real-time
              prioritization. Here&apos;s how to leverage intent signals effectively.
            </p>

            <h3>First-Party Intent: Your Website as a Signal Source</h3>
            <p>
              Your website is your richest source of intent data. When a prospect visits your pricing page, reads three
              case studies, and returns the next day, that&apos;s a stronger buying signal than any third-party data point.
              <Link href="/visitor-identification"> Visitor identification technology</Link> can reveal who these anonymous
              visitors are, even when they don&apos;t fill out a form.
            </p>

            <div className="not-prose bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 my-8 border border-blue-200">
              <h3 className="font-bold text-lg mb-3">High-Value Website Intent Signals</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">HOT</span>
                  <span className="text-sm">Visited pricing page + returned within 48 hours</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">HOT</span>
                  <span className="text-sm">Viewed comparison page (vs. competitor)</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">WARM</span>
                  <span className="text-sm">Read 3+ blog posts in a single session</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">WARM</span>
                  <span className="text-sm">Visited integrations or documentation pages</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">EARLY</span>
                  <span className="text-sm">Downloaded a top-of-funnel resource</span>
                </div>
              </div>
            </div>

            <h3>Third-Party Intent: Market-Wide Signals</h3>
            <p>
              Third-party intent data tracks content consumption across thousands of B2B websites. When a target account
              starts reading articles about topics related to your solution, they&apos;re likely entering a buying cycle.
              Cursive tracks <strong>450B+ monthly intent signals</strong> across 30,000+ behavioral categories to
              surface accounts showing research behavior relevant to your product.
            </p>

            <h3>Combining First and Third-Party Intent</h3>
            <p>
              The most powerful targeting combines both sources. Third-party intent alerts you that an account is
              researching your category. First-party intent confirms they&apos;re evaluating your specific solution.
              Together, they create a high-confidence targeting signal that dramatically outperforms either alone:
            </p>

            <ul>
              <li><strong>Third-party only:</strong> 3-5x better than no intent data</li>
              <li><strong>First-party only:</strong> 5-8x better than no intent data</li>
              <li><strong>Combined first + third-party:</strong> 10-15x better than no intent data</li>
            </ul>

            {/* Section 5 */}
            <h2 id="building-segments">Building High-Converting Audience Segments</h2>
            <p>
              With your ICP defined and data sources connected, it&apos;s time to build audience segments that drive
              results. Here are seven proven segment strategies for B2B teams.
            </p>

            <h3>Segment 1: In-Market ICP Accounts</h3>
            <p>
              The highest-priority segment. These are accounts that match your ICP <em>and</em> show active purchase
              intent. Filter your <Link href="/audience-builder">audience builder</Link> by ICP firmographic criteria,
              then layer on intent signals to isolate accounts actively researching your category.
            </p>

            <h3>Segment 2: Competitor Displacement</h3>
            <p>
              Target accounts that use a competitor product and show signs of dissatisfaction or contract renewal.
              Technographic data identifies the competitor usage, while intent signals like &quot;[competitor name]
              alternatives&quot; searches confirm the timing.
            </p>

            <h3>Segment 3: Technology Trigger</h3>
            <p>
              Certain technology adoptions create buying opportunities. If a company just implemented Salesforce,
              they likely need supporting tools. If they just switched CRMs, they&apos;re in a change management
              phase and open to new vendors.
            </p>

            <h3>Segment 4: Expansion Look-alikes</h3>
            <p>
              Identify companies that look like your best expanding customers. Use firmographic and technographic
              attributes from customers with the highest net revenue retention to build a look-alike segment.
            </p>

            <h3>Segment 5: Website Re-engagement</h3>
            <p>
              Companies that visited your website but didn&apos;t convert represent warm opportunities.
              <Link href="/visitor-identification"> Visitor identification</Link> reveals these accounts, and
              you can segment by pages visited, session depth, and recency to prioritize outreach.
            </p>

            <h3>Segment 6: Event-Triggered Audiences</h3>
            <p>
              Corporate events like funding rounds, leadership changes, office expansions, and product launches
              create buying windows. Build segments that trigger when target accounts experience these events.
            </p>

            <h3>Segment 7: Seasonal and Cyclical Buyers</h3>
            <p>
              Many B2B purchases follow predictable cycles tied to budgeting, contract renewals, or seasonal
              demand. Build segments that activate before these known buying periods.
            </p>

            <div className="not-prose bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 my-8 border border-amber-200">
              <h3 className="font-bold text-lg mb-3">Pro Tip: Segment Size Matters</h3>
              <p className="text-sm text-gray-700 mb-3">
                The ideal segment size depends on your sales capacity and channel:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Outbound email:</strong> 50-200 accounts per rep per month for personalized outreach</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Paid advertising:</strong> 500-5,000 accounts for sufficient reach and frequency</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Direct mail:</strong> 100-500 accounts for high-value physical touchpoints</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span><strong>ABM 1-to-1:</strong> 10-25 accounts for fully customized experiences</span>
                </li>
              </ul>
            </div>

            {/* Section 6 */}
            <h2 id="implementation-guide">Implementation Guide: Getting Started</h2>
            <p>
              Here&apos;s a practical week-by-week plan for implementing data-driven audience targeting at your organization.
            </p>

            <h3>Week 1: Audit and Foundation</h3>
            <ul>
              <li>Audit your current customer data for ICP patterns</li>
              <li>Document your ICP with weighted criteria</li>
              <li>Identify your top 3 data gaps (firmographic, technographic, intent, engagement)</li>
              <li>Select a <Link href="/blog/data-platforms">data platform</Link> that covers your gaps</li>
            </ul>

            <h3>Week 2: Data Integration</h3>
            <ul>
              <li>Connect your CRM data to your audience platform</li>
              <li>Implement <Link href="/blog/visitor-tracking">website visitor tracking</Link> for first-party intent</li>
              <li>Configure third-party intent signal tracking for your category keywords</li>
              <li>Set up data enrichment for existing contacts</li>
            </ul>

            <h3>Week 3: Segment Building</h3>
            <ul>
              <li>Build your first 3-5 audience segments using the strategies above</li>
              <li>Create suppression lists (existing customers, competitors, bad-fit industries)</li>
              <li>Assign segments to appropriate channels (outbound, ads, direct mail)</li>
              <li>Brief your sales team on targeting criteria and expected lead quality</li>
            </ul>

            <h3>Week 4: Launch and Optimize</h3>
            <ul>
              <li>Launch campaigns against your initial segments</li>
              <li>Track segment-level metrics: engagement rate, meeting rate, pipeline generated</li>
              <li>A/B test segment criteria to find optimal targeting parameters</li>
              <li>Schedule monthly reviews to refine ICP and segments based on performance data</li>
            </ul>

            {/* Section 7 */}
            <h2 id="measuring-success">Measuring Targeting Effectiveness</h2>
            <p>
              The ultimate measure of audience targeting is pipeline generated per dollar spent. But to optimize
              effectively, you need to track segment-level metrics at each funnel stage.
            </p>

            <div className="not-prose overflow-x-auto my-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="border border-gray-300 p-3 text-left font-bold">Metric</th>
                    <th className="border border-gray-300 p-3 text-left font-bold">Poor</th>
                    <th className="border border-gray-300 p-3 text-left font-bold">Good</th>
                    <th className="border border-gray-300 p-3 text-left font-bold">Excellent</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td className="border border-gray-300 p-3 font-bold">Email Reply Rate</td>
                    <td className="border border-gray-300 p-3 text-red-600">&lt;2%</td>
                    <td className="border border-gray-300 p-3 text-yellow-600">5-10%</td>
                    <td className="border border-gray-300 p-3 text-green-600">15%+</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-bold">Meeting Book Rate</td>
                    <td className="border border-gray-300 p-3 text-red-600">&lt;1%</td>
                    <td className="border border-gray-300 p-3 text-yellow-600">2-5%</td>
                    <td className="border border-gray-300 p-3 text-green-600">8%+</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-bold">Opportunity Rate</td>
                    <td className="border border-gray-300 p-3 text-red-600">&lt;10%</td>
                    <td className="border border-gray-300 p-3 text-yellow-600">15-25%</td>
                    <td className="border border-gray-300 p-3 text-green-600">30%+</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-bold">Win Rate</td>
                    <td className="border border-gray-300 p-3 text-red-600">&lt;15%</td>
                    <td className="border border-gray-300 p-3 text-yellow-600">20-30%</td>
                    <td className="border border-gray-300 p-3 text-green-600">35%+</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-bold">CAC Payback (months)</td>
                    <td className="border border-gray-300 p-3 text-red-600">18+</td>
                    <td className="border border-gray-300 p-3 text-yellow-600">9-12</td>
                    <td className="border border-gray-300 p-3 text-green-600">&lt;6</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              Compare these metrics across segments to identify your highest-performing targeting strategies.
              Double down on segments that convert efficiently, and deprecate or refine segments that
              underperform. Most teams find that their top 2-3 segments generate 80% of pipeline value.
            </p>

            <h3>The Feedback Loop</h3>
            <p>
              Great targeting is iterative. Build a monthly review cadence where marketing and sales jointly
              analyze segment performance. Use closed-loop reporting to connect targeting criteria all the way
              through to revenue. This feedback loop is what separates teams that plateau from those that
              continuously improve their targeting precision.
            </p>

            {/* FAQ Section */}
            <h2 id="faqs">Frequently Asked Questions</h2>

            <div className="not-prose space-y-6 my-8">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-bold text-lg mb-3">{faq.question}</h3>
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </div>

            <h2>The Bottom Line</h2>
            <p>
              B2B audience targeting has evolved far beyond simple firmographic filtering. Today&apos;s best-performing
              teams combine firmographic, technographic, intent, and engagement data to build dynamic segments that
              adapt as accounts move through their buying journey.
            </p>

            <p>
              The companies that master this approach don&apos;t just generate more leads. They generate better leads,
              shorter sales cycles, higher win rates, and stronger customer retention. That&apos;s the power of
              precision targeting.
            </p>

            <p>
              Cursive gives you access to 220M+ consumer and 140M+ business profiles with unlimited segmentation.
              Build audiences based on company size, industry, technology stack, intent signals, and 30,000+ behavioral
              categories. No size caps, no restrictive licensing. <Link href="/audience-builder">Try the audience builder</Link> and
              see how precise your targeting can get.
            </p>

            <h2>About the Author</h2>
            <p>
              <strong>Adam Wolfe</strong> is the founder of Cursive. After years of helping B2B companies build
              audience targeting programs using fragmented data tools, he built Cursive to unify firmographic,
              technographic, intent, and behavioral data into a single platform purpose-built for high-precision
              audience targeting and automated outreach.
            </p>
          </article>
        </Container>
      </section>

      {/* CTA Section */}
      <DashboardCTA
        headline="Build Your Perfect"
        subheadline="Audience in Minutes"
        description="Access 220M+ consumer and 140M+ business profiles. Build unlimited audiences with no size caps. Filter by firmographic, demographic, behavioral, and intent data."
      />

      {/* Related Posts */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <div className="max-w-5xl mx-auto">
            <SimpleRelatedPosts posts={[
              {
                title: "The 5-Step Framework for Perfect ICP Targeting",
                description: "Stop wasting money on bad leads. Learn how to define and target your ideal customer profile.",
                href: "/blog/icp-targeting-guide",
              },
              {
                title: "How to Identify Website Visitors: Technical Guide",
                description: "Turn anonymous website traffic into identified accounts with visitor tracking technology.",
                href: "/blog/how-to-identify-website-visitors-technical-guide",
              },
              {
                title: "How to Scale Outbound Without Killing Quality",
                description: "Go from 10 emails/day to 200+ without sacrificing personalization or deliverability.",
                href: "/blog/scaling-outbound",
              },
            ]} />
          </div>
        </Container>
      </section>
    </main>
  )
}
