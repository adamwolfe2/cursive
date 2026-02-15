"use client"

import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { ArrowLeft, ArrowRight, Calendar, Clock, RefreshCw, CheckCircle, X, Target, Layers, Eye, BarChart3 } from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"

const faqs = [
  {
    question: "What is B2B retargeting and how is it different from B2C?",
    answer: "B2B retargeting re-engages companies that visited your website but did not convert. Unlike B2C retargeting (which targets individuals based on product browsing), B2B retargeting focuses on account-level engagement, targets buying committees of multiple stakeholders, and runs across longer sales cycles. B2B retargeting also benefits from firmographic and intent data for smarter segmentation, rather than just behavioral pixel data.",
  },
  {
    question: "How does cookieless retargeting work?",
    answer: "Cookieless retargeting uses first-party data instead of third-party cookies to build audience segments. Tools like Cursive identify website visitors at the company level using IP intelligence and device fingerprinting, then match those companies to ad platform audiences via deterministic identifiers (like company email domains or LinkedIn company pages). This approach is more accurate than cookie-based retargeting and is not affected by browser privacy changes.",
  },
  {
    question: "What are the best platforms for B2B retargeting?",
    answer: "The most effective B2B retargeting platforms are LinkedIn Ads (best for targeting by job title and company), Google Display Network (broadest reach and lowest CPMs), Meta/Facebook Ads (good for awareness and nurturing), and direct mail (highest response rates for high-value accounts). Most B2B teams get the best results running coordinated retargeting across 2-3 platforms simultaneously rather than focusing on just one.",
  },
  {
    question: "What retargeting audience segments convert best in B2B?",
    answer: "The highest-converting B2B retargeting segments are: pricing page visitors who did not convert (5-8x higher conversion than general visitors), demo page abandoners, return visitors who have visited 3+ times in a week, and accounts that match your ICP and have shown intent signals. Generic all-visitors segments typically underperform because they include a mix of irrelevant traffic alongside real prospects.",
  },
  {
    question: "How much should I spend on B2B retargeting?",
    answer: "Most B2B companies allocate 10-20% of their digital ad budget to retargeting. For a company spending $10,000/month on ads, that means $1,000-$2,000/month on retargeting. Because retargeting audiences are smaller and more qualified, the cost per conversion is typically 50-70% lower than prospecting campaigns. Start with $500-$1,000/month and scale based on performance. The key metric is cost per pipeline opportunity, not just cost per click.",
  },
]

export default function RetargetingPage() {
  return (
    <main>
      <StructuredData data={generateFAQSchema({ faqs })} />
      <StructuredData data={generateBlogPostSchema({ title: "B2B Retargeting: Cross-Platform Strategies Using First-Party Data (2026)", description: "Master cross-platform B2B retargeting using first-party visitor data. Build high-converting audience segments for ads, email, and direct mail without relying on third-party cookies.", author: "Cursive Team", publishDate: "2026-02-01", image: "https://www.meetcursive.com/cursive-logo.png" })} />

      <HumanView>
        {/* Header */}
        <section className="py-12 bg-white">
          <Container>
            <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            <div className="max-w-4xl">
              <div className="inline-block px-3 py-1 bg-[#007AFF] text-white rounded-full text-sm font-medium mb-4">
                Retargeting
              </div>
              <h1 className="text-5xl font-bold mb-6">
                B2B Retargeting: Cross-Platform Strategies Using First-Party Data
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                98% of B2B website visitors leave without converting. This guide covers how to retarget those
                companies across every channel&mdash;LinkedIn, Google, Meta, email, and direct mail&mdash;using
                first-party visitor data instead of dying third-party cookies.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>January 28, 2026</span>
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
                <a href="#why-retargeting" className="text-primary hover:underline">1. Why B2B Retargeting Matters Now</a>
                <a href="#cookieless-approach" className="text-primary hover:underline">2. The Cookieless Retargeting Approach</a>
                <a href="#audience-segments" className="text-primary hover:underline">3. High-Converting Audience Segments</a>
                <a href="#platform-strategies" className="text-primary hover:underline">4. Platform-by-Platform Strategies</a>
                <a href="#cross-platform" className="text-primary hover:underline">5. Cross-Platform Orchestration</a>
                <a href="#creative-best-practices" className="text-primary hover:underline">6. Creative and Messaging Best Practices</a>
                <a href="#measurement" className="text-primary hover:underline">7. Measurement and Optimization</a>
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
              <h2 id="why-retargeting">Why B2B Retargeting Matters Now</h2>
              <p>
                Only 2% of B2B website visitors convert on their first visit. The other 98% leave, and without
                retargeting, most of them never come back. For companies investing thousands in SEO, content marketing,
                and paid advertising to drive traffic, letting those visitors disappear represents a massive waste of
                acquisition spend.
              </p>

              <p>
                But B2B retargeting in 2026 looks very different from the pixel-based approaches of the past. Third-party
                cookies are deprecated in most browsers. Privacy regulations have tightened. And the buyers you&apos;re
                retargeting are part of complex buying committees where multiple stakeholders need to be reached across
                multiple channels over long sales cycles.
              </p>

              <div className="not-prose bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 my-8 border border-blue-200">
                <h3 className="font-bold text-lg mb-3">The B2B Retargeting Opportunity</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-600 mb-1">98%</div>
                    <p className="text-sm text-gray-600">of B2B visitors leave without converting</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-600 mb-1">70%</div>
                    <p className="text-sm text-gray-600">higher conversion rate for retargeted visitors vs. cold traffic</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-600 mb-1">50-70%</div>
                    <p className="text-sm text-gray-600">lower cost per conversion compared to prospecting campaigns</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-600 mb-1">6-8</div>
                    <p className="text-sm text-gray-600">average touchpoints needed before a B2B buyer engages</p>
                  </div>
                </div>
              </div>

              <p>
                The shift to first-party data retargeting actually benefits B2B marketers. Instead of relying on
                anonymous cookie pools with questionable accuracy, tools like Cursive identify the actual companies
                visiting your website and let you build precise retargeting audiences based on firmographic fit,
                behavioral signals, and purchase intent. The result is retargeting that&apos;s more accurate, more
                relevant, and more effective than the cookie-based approach ever was.
              </p>

              {/* Section 2 */}
              <h2 id="cookieless-approach">The Cookieless Retargeting Approach</h2>
              <p>
                Traditional retargeting relies on third-party cookies to track visitors across the web and show
                them ads. But with Chrome joining Safari and Firefox in limiting third-party cookies, this approach
                is becoming less reliable every month. First-party data retargeting offers a more durable alternative.
              </p>

              <h3>How First-Party Retargeting Works</h3>

              <div className="not-prose bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 my-8 border border-gray-200">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                    <div className="bg-white rounded-lg p-4 flex-1">
                      <h4 className="font-bold text-sm mb-1">Visitor Identification</h4>
                      <p className="text-xs text-gray-600">
                        <Link href="/visitor-identification" className="text-blue-600 hover:underline">Cursive identifies companies</Link> visiting
                        your website using IP intelligence, device fingerprinting, and cross-reference databases. Up to 70% of B2B traffic
                        is identifiable at the company level.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                    <div className="bg-white rounded-lg p-4 flex-1">
                      <h4 className="font-bold text-sm mb-1">Audience Segmentation</h4>
                      <p className="text-xs text-gray-600">
                        Identified companies are segmented by behavior (pricing page views, return visits, content engagement),
                        firmographics (company size, industry, tech stack), and intent signals.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                    <div className="bg-white rounded-lg p-4 flex-1">
                      <h4 className="font-bold text-sm mb-1">Cross-Platform Sync</h4>
                      <p className="text-xs text-gray-600">
                        Audience segments sync automatically to ad platforms (LinkedIn, Google, Meta), email tools, and
                        direct mail systems via <Link href="/integrations" className="text-blue-600 hover:underline">200+ native integrations</Link>.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                    <div className="bg-white rounded-lg p-4 flex-1">
                      <h4 className="font-bold text-sm mb-1">Multi-Channel Retargeting</h4>
                      <p className="text-xs text-gray-600">
                        Each segment receives coordinated messaging across channels: ads, email sequences, and for high-value
                        accounts, <Link href="/blog/direct-mail" className="text-blue-600 hover:underline">automated direct mail</Link>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <h3>Cookie-Based vs. First-Party Retargeting</h3>

              <div className="not-prose overflow-x-auto my-8">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <th className="border border-gray-300 p-3 text-left font-bold">Dimension</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Cookie-Based</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">First-Party Data</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Identification</td>
                      <td className="border border-gray-300 p-3 text-red-600">Anonymous browser IDs</td>
                      <td className="border border-gray-300 p-3 text-green-600">Company-level with firmographics</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Accuracy</td>
                      <td className="border border-gray-300 p-3 text-red-600">Declining (cookie deprecation)</td>
                      <td className="border border-gray-300 p-3 text-green-600">High and improving</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Cross-Device</td>
                      <td className="border border-gray-300 p-3 text-red-600">Limited</td>
                      <td className="border border-gray-300 p-3 text-green-600">Company-level (device independent)</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Segmentation</td>
                      <td className="border border-gray-300 p-3 text-amber-600">Page-level behavior only</td>
                      <td className="border border-gray-300 p-3 text-green-600">Behavior + firmographics + intent</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Privacy Compliance</td>
                      <td className="border border-gray-300 p-3 text-red-600">Increasingly restricted</td>
                      <td className="border border-gray-300 p-3 text-green-600">Privacy-resilient</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Channels</td>
                      <td className="border border-gray-300 p-3 text-amber-600">Display ads only</td>
                      <td className="border border-gray-300 p-3 text-green-600">Ads + email + direct mail + sales</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3 */}
              <h2 id="audience-segments">High-Converting Audience Segments</h2>
              <p>
                Not all retargeting audiences are created equal. The segment you build determines your conversion rate,
                cost efficiency, and ROI. Here are six proven segments ordered by conversion potential.
              </p>

              <div className="not-prose space-y-4 my-8">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Pricing Page Visitors (No Conversion)</h3>
                      <p className="text-sm text-gray-700 mb-2">
                        Companies that viewed your pricing page but didn&apos;t request a demo or start a trial.
                        These are actively evaluating your solution.
                      </p>
                      <div className="flex gap-4 text-xs">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">5-8x higher conversion</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Recommended budget: 30%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">High-Frequency Return Visitors</h3>
                      <p className="text-sm text-gray-700 mb-2">
                        Companies that have visited your site 3+ times within the past 7 days. Escalating
                        engagement signals active evaluation or internal discussion about your product.
                      </p>
                      <div className="flex gap-4 text-xs">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">4-6x higher conversion</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Recommended budget: 25%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">ICP-Fit Companies (Any Behavior)</h3>
                      <p className="text-sm text-gray-700 mb-2">
                        Companies that match your ideal customer profile based on firmographic criteria
                        (industry, size, tech stack) regardless of which pages they visited.
                      </p>
                      <div className="flex gap-4 text-xs">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">3-4x higher conversion</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">Recommended budget: 20%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">4</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Content Engagers (Multi-Page Sessions)</h3>
                      <p className="text-sm text-gray-700 mb-2">
                        Companies that viewed 3+ pages in a single session, especially a mix of blog
                        content and product pages. Deep engagement signals research-phase interest.
                      </p>
                      <div className="flex gap-4 text-xs">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">2-3x higher conversion</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">Recommended budget: 15%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-600 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">5</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Comparison and Alternative Page Visitors</h3>
                      <p className="text-sm text-gray-700 mb-2">
                        Companies reading your &quot;vs.&quot; pages or alternative comparison content.
                        They&apos;re evaluating options and need reinforcement of your differentiation.
                      </p>
                      <div className="flex gap-4 text-xs">
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">2-3x higher conversion</span>
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">Recommended budget: 5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-600 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">6</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">All Identified Visitors (Broad)</h3>
                      <p className="text-sm text-gray-700 mb-2">
                        All companies identified on your site, regardless of behavior. Use for brand
                        awareness only. Lower conversion rate but keeps your brand visible.
                      </p>
                      <div className="flex gap-4 text-xs">
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">1-2x baseline</span>
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">Recommended budget: 5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p>
                The key insight is that <strong>precision beats volume</strong>. A small, highly-targeted retargeting
                audience of pricing page visitors from ICP-fit companies will outperform a large, untargeted &quot;all
                visitors&quot; audience by 5-8x. Use <Link href="/blog/audience-targeting">audience targeting strategies</Link> to
                build the right segments.
              </p>

              {/* Section 4 */}
              <h2 id="platform-strategies">Platform-by-Platform Strategies</h2>

              <h3>LinkedIn Ads</h3>
              <p>
                LinkedIn is the most effective B2B retargeting platform because it allows targeting by job title,
                company, and seniority within your retargeting audiences. Upload your identified visitor list as
                a Matched Audience and layer on job function targeting to reach decision-makers specifically.
              </p>
              <ul>
                <li><strong>Best ad format:</strong> Sponsored Content (single image or carousel) for awareness; Message Ads for high-intent segments</li>
                <li><strong>Typical CPM:</strong> $30-$80 (higher than other platforms but reaches actual decision-makers)</li>
                <li><strong>Pro tip:</strong> Use LinkedIn&apos;s Company Targeting to upload your visitor list as company names, then target specific job functions within those companies</li>
                <li><strong>Minimum audience size:</strong> 300 matched companies</li>
              </ul>

              <h3>Google Display Network</h3>
              <p>
                Google Display offers the broadest reach at the lowest CPMs. Use Customer Match to upload your
                visitor data and build similar audiences. Best for maintaining brand awareness throughout the long
                B2B buying cycle.
              </p>
              <ul>
                <li><strong>Best ad format:</strong> Responsive Display Ads for broad reach; custom intent audiences for precision</li>
                <li><strong>Typical CPM:</strong> $3-$12 (most cost-effective for awareness)</li>
                <li><strong>Pro tip:</strong> Create separate campaigns for high-intent segments (pricing visitors) vs. broad awareness (all visitors) with different bid strategies</li>
                <li><strong>Minimum audience size:</strong> 1,000 users for Customer Match</li>
              </ul>

              <h3>Meta (Facebook/Instagram)</h3>
              <p>
                Meta excels at nurturing B2B prospects during non-work hours. Decision-makers scroll through Facebook
                and Instagram in the evenings and weekends. Retargeting them here extends your reach beyond
                professional platforms.
              </p>
              <ul>
                <li><strong>Best ad format:</strong> Video ads for storytelling; carousel ads for multiple use cases or testimonials</li>
                <li><strong>Typical CPM:</strong> $5-$20 (good balance of reach and targeting)</li>
                <li><strong>Pro tip:</strong> Use Custom Audiences from your visitor data and exclude current customers to focus budget on prospects</li>
                <li><strong>Minimum audience size:</strong> 100 users for Custom Audiences</li>
              </ul>

              <h3>Email Retargeting</h3>
              <p>
                When visitor identification matches a company to specific contacts, email retargeting becomes
                possible without requiring a form fill. Send personalized sequences triggered by website behavior.
              </p>
              <ul>
                <li><strong>Best approach:</strong> Behavior-triggered sequences based on pages visited (pricing page = demo invite; blog = educational content)</li>
                <li><strong>Typical cost:</strong> $0.01-$0.05 per email (lowest cost channel)</li>
                <li><strong>Pro tip:</strong> Personalize email content to match the specific pages the prospect visited. &quot;I noticed [Company] was exploring our [feature]&quot;</li>
              </ul>

              <h3>Direct Mail Retargeting</h3>
              <p>
                For high-value accounts, physical <Link href="/blog/direct-mail">direct mail</Link> cuts through digital noise
                with response rates 30-40x higher than email. Reserve this for your highest-intent segments.
              </p>
              <ul>
                <li><strong>Best approach:</strong> Automated postcards triggered by pricing page visits or repeat visits from ICP-fit companies</li>
                <li><strong>Typical cost:</strong> $1-$3 per piece (highest per-unit cost but highest response rate)</li>
                <li><strong>Pro tip:</strong> Time direct mail to arrive 3-5 days after the website visit, when the prospect is still in evaluation mode</li>
              </ul>

              {/* Section 5 */}
              <h2 id="cross-platform">Cross-Platform Orchestration</h2>
              <p>
                The biggest mistake in B2B retargeting is running each platform in isolation. Cross-platform
                orchestration ensures prospects see coordinated messaging as they move through the buying cycle,
                with each channel playing a specific role.
              </p>

              <div className="not-prose bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 my-8 border border-blue-200">
                <h3 className="font-bold text-lg mb-4">Retargeting Orchestration Framework</h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-bold text-sm text-blue-700 mb-2">Layer 1: Awareness (All Visitors)</h4>
                    <p className="text-xs text-gray-600 mb-2">Channels: Google Display + Meta</p>
                    <p className="text-xs text-gray-700">Goal: Keep your brand visible. Show ads that establish credibility, share customer logos, and highlight key outcomes. Low CPMs mean you can sustain awareness affordably.</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-bold text-sm text-purple-700 mb-2">Layer 2: Engagement (Multi-Page Visitors + ICP Fit)</h4>
                    <p className="text-xs text-gray-600 mb-2">Channels: LinkedIn + Email</p>
                    <p className="text-xs text-gray-700">Goal: Deepen interest. Share case studies, product demos, and educational content targeted to their industry and use case. LinkedIn&apos;s targeting ensures you reach the right stakeholders.</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-bold text-sm text-green-700 mb-2">Layer 3: Conversion (High-Intent Visitors)</h4>
                    <p className="text-xs text-gray-600 mb-2">Channels: LinkedIn Message Ads + Email + Direct Mail</p>
                    <p className="text-xs text-gray-700">Goal: Drive action. Send direct offers, meeting invitations, and personalized outreach to pricing page visitors and return visitors from ICP accounts.</p>
                  </div>
                </div>
              </div>

              <h3>Frequency Management</h3>
              <p>
                Over-exposing prospects to your ads creates fatigue and negative brand associations. Implement these
                frequency rules:
              </p>
              <ul>
                <li><strong>Awareness layer:</strong> Cap at 3-5 impressions per company per week across all display platforms</li>
                <li><strong>Engagement layer:</strong> Cap at 2-3 LinkedIn ad impressions per person per week; 1 email per week</li>
                <li><strong>Conversion layer:</strong> No frequency cap for 7 days after a high-intent action, then drop to 2-3 per week</li>
                <li><strong>Exclusions:</strong> Always exclude current customers and companies that converted in the past 30 days</li>
              </ul>

              <h3>Budget Allocation by Layer</h3>
              <p>
                Allocate your retargeting budget based on the funnel stage and expected conversion rates:
              </p>

              <div className="not-prose overflow-x-auto my-8">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <th className="border border-gray-300 p-3 text-left font-bold">Layer</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Budget %</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Channels</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Expected CTR</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-gray-300 p-3 font-bold">Awareness</td>
                      <td className="border border-gray-300 p-3">20%</td>
                      <td className="border border-gray-300 p-3">Google Display, Meta</td>
                      <td className="border border-gray-300 p-3">0.5-1.0%</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-bold">Engagement</td>
                      <td className="border border-gray-300 p-3">35%</td>
                      <td className="border border-gray-300 p-3">LinkedIn, Email</td>
                      <td className="border border-gray-300 p-3">1.0-2.5%</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-bold">Conversion</td>
                      <td className="border border-gray-300 p-3">45%</td>
                      <td className="border border-gray-300 p-3">LinkedIn, Email, Direct Mail</td>
                      <td className="border border-gray-300 p-3">2.5-5.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 6 */}
              <h2 id="creative-best-practices">Creative and Messaging Best Practices</h2>
              <p>
                Retargeting creative should evolve based on where the prospect is in the buying journey.
                Someone who visited your homepage once needs different messaging than someone who returned
                to your pricing page three times this week.
              </p>

              <h3>Awareness Stage Creative</h3>
              <ul>
                <li><strong>Focus on:</strong> Brand credibility, social proof, industry authority</li>
                <li><strong>Examples:</strong> Customer logos, industry awards, &quot;Trusted by 500+ companies&quot;</li>
                <li><strong>Avoid:</strong> Hard sells, demo CTAs, pricing information</li>
              </ul>

              <h3>Engagement Stage Creative</h3>
              <ul>
                <li><strong>Focus on:</strong> Problem-solution fit, use cases, outcomes</li>
                <li><strong>Examples:</strong> Case studies (&quot;How [Company] increased pipeline by 47%&quot;), product walkthroughs, industry-specific content</li>
                <li><strong>Avoid:</strong> Generic messaging that doesn&apos;t reference their pain points</li>
              </ul>

              <h3>Conversion Stage Creative</h3>
              <ul>
                <li><strong>Focus on:</strong> Urgency, specific offers, friction reduction</li>
                <li><strong>Examples:</strong> &quot;Book a 15-minute demo&quot;, &quot;Free trial, no credit card&quot;, limited-time offers</li>
                <li><strong>Avoid:</strong> Long-form content; at this stage, they need a clear, easy path to convert</li>
              </ul>

              <div className="not-prose bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 my-8 border border-amber-200">
                <h3 className="font-bold text-lg mb-3">Creative Rotation Rules</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Rotate creative every 2-3 weeks to prevent ad fatigue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Test 3-4 variations per segment and let performance data guide rotation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Match ad messaging to the pages the prospect visited (pricing = pricing-focused ads)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Use video for LinkedIn (30-60 seconds) and static images for display networks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Never show the same ad more than 7 times to the same user without variation</span>
                  </li>
                </ul>
              </div>

              {/* Section 7 */}
              <h2 id="measurement">Measurement and Optimization</h2>
              <p>
                Retargeting measurement in B2B requires going beyond click-through rates and view-through
                conversions. The metrics that matter connect retargeting spend to pipeline and revenue.
              </p>

              <h3>Key Metrics to Track</h3>

              <div className="not-prose grid md:grid-cols-2 gap-4 my-8">
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold mb-2 text-sm">Return Visit Rate</h3>
                  <p className="text-xs text-gray-600">
                    What percentage of retargeted companies return to your website? This measures whether your
                    ads are driving re-engagement. Benchmark: 15-25% return within 14 days.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-bold mb-2 text-sm">Cost Per Pipeline Opportunity</h3>
                  <p className="text-xs text-gray-600">
                    Total retargeting spend divided by number of pipeline opportunities influenced. This connects
                    ad spend directly to revenue potential. Benchmark: $200-$500 per opportunity.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-bold mb-2 text-sm">Influenced Pipeline Value</h3>
                  <p className="text-xs text-gray-600">
                    Total pipeline value from deals where the account was retargeted. Use{" "}
                    <Link href="/blog/analytics" className="text-blue-600 hover:underline">multi-touch attribution</Link> to credit
                    retargeting touchpoints alongside other channels. Benchmark: 5-10x return on ad spend.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <Layers className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-bold mb-2 text-sm">Segment Conversion Lift</h3>
                  <p className="text-xs text-gray-600">
                    Compare conversion rates between retargeted segments and non-retargeted control groups.
                    This measures the true incremental impact. Benchmark: 50-200% lift for targeted segments.
                  </p>
                </div>
              </div>

              <h3>Optimization Framework</h3>
              <p>
                Review and optimize your retargeting campaigns weekly using this framework:
              </p>
              <ol>
                <li><strong>Check segment performance:</strong> Which segments are driving pipeline? Shift budget toward the highest-converting segments.</li>
                <li><strong>Review frequency data:</strong> Are any segments being over-served? Adjust caps to prevent fatigue.</li>
                <li><strong>Rotate underperforming creative:</strong> If CTR drops below 0.5%, replace the creative immediately.</li>
                <li><strong>Update audience lists:</strong> Refresh your visitor identification data and remove converted accounts.</li>
                <li><strong>Measure pipeline impact:</strong> Monthly, match retargeted companies against new pipeline to calculate influenced revenue.</li>
              </ol>

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
                B2B retargeting is evolving from a cookie-dependent tactic to a first-party data strategy.
                The companies that make this shift first will have a significant competitive advantage: more
                accurate targeting, cross-platform coordination, and measurement tied directly to pipeline
                and revenue instead of clicks and impressions.
              </p>

              <p>
                Start by identifying the companies visiting your website with a tool like Cursive. Build
                your highest-intent retargeting segments (pricing page visitors, return visitors, ICP-fit
                companies). Launch coordinated campaigns across LinkedIn, Google, and email. Then layer in
                direct mail for your highest-value accounts. The result is a retargeting engine that works
                across every channel, is resilient to privacy changes, and drives measurable pipeline growth.
              </p>

              <p>
                <Link href="/visitor-identification">Start identifying your website visitors</Link> to build
                your first-party retargeting foundation, or <Link href="/platform">explore the Cursive platform</Link> to
                see how visitor data flows automatically to your ad platforms, CRM, and outreach tools.
              </p>

              <h2>About the Author</h2>
              <p>
                <strong>Adam Wolfe</strong> is the founder of Cursive. After years of watching B2B retargeting
                campaigns struggle with inaccurate cookie data and siloed channel strategies, he built Cursive
                to provide the first-party visitor intelligence that makes cross-platform retargeting
                actually work&mdash;from identification to audience sync to pipeline attribution.
              </p>
            </article>
          </Container>
        </section>

        {/* CTA Section */}
        <DashboardCTA
          headline="Retarget With"
          subheadline="First-Party Data"
          description="Identify website visitors. Build precision audience segments. Sync to LinkedIn, Google, and Meta automatically. Retargeting powered by real company data, not dying cookies."
        />

        {/* Related Posts */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
          <Container>
            <div className="max-w-5xl mx-auto">
              <SimpleRelatedPosts posts={[
                {
                  title: "B2B Audience Targeting: Data-Driven Segmentation Guide",
                  description: "Build high-converting audience segments using firmographic, behavioral, and intent data.",
                  href: "/blog/audience-targeting",
                },
                {
                  title: "Direct Mail Automation: Digital + Physical Campaigns",
                  description: "Add physical mail to your retargeting mix for 3-5x higher conversion rates.",
                  href: "/blog/direct-mail",
                },
                {
                  title: "Marketing Analytics & Attribution Guide",
                  description: "Measure retargeting ROI with multi-touch attribution dashboards.",
                  href: "/blog/analytics",
                },
              ]} />
            </div>
          </Container>
        </section>
      </HumanView>

      <MachineView>
        <MachineContent>
          <MachineSection title="Key Takeaways">
            <MachineList items={[
              "98% of B2B visitors leave without converting; retargeting recovers lost opportunities",
              "First-party data retargeting (company-level identification) replaces dying third-party cookies with more accurate targeting",
              "Six audience segments ranked by conversion potential: pricing page visitors (5-8x), return visitors (4-6x), ICP-fit (3-4x), content engagers (2-3x), comparison visitors (2-3x), all visitors (1-2x baseline)",
              "Three-layer orchestration framework: Awareness (Google Display + Meta, 20% budget), Engagement (LinkedIn + Email, 35%), Conversion (LinkedIn + Email + Direct Mail, 45%)",
              "Retargeted visitors convert at 70% higher rates than cold traffic with 50-70% lower cost per conversion",
              "Key B2B retargeting metrics: return visit rate (15-25%), cost per pipeline opportunity ($200-$500), influenced pipeline value (5-10x ROAS)",
            ]} />
          </MachineSection>

          <MachineSection title="Cookie-Based vs. First-Party Retargeting">
            <MachineList items={[
              "Cookie-based: anonymous browser IDs, declining accuracy, limited cross-device, page-level segmentation only, display ads only",
              "First-party data: company-level with firmographics, high and improving accuracy, device-independent, behavior + firmographics + intent, multi-channel (ads + email + direct mail + sales)",
            ]} />
          </MachineSection>

          <MachineSection title="High-Converting Audience Segments">
            <MachineList items={[
              "Pricing Page Visitors (No Conversion): 5-8x higher conversion, allocate 30% budget",
              "High-Frequency Return Visitors (3+ visits/week): 4-6x higher conversion, allocate 25% budget",
              "ICP-Fit Companies (any behavior): 3-4x higher conversion, allocate 20% budget",
              "Content Engagers (3+ pages/session): 2-3x higher conversion, allocate 15% budget",
              "Comparison/Alternative Page Visitors: 2-3x higher conversion, allocate 5% budget",
              "All Identified Visitors (broad awareness): 1-2x baseline, allocate 5% budget",
            ]} />
          </MachineSection>

          <MachineSection title="Platform-by-Platform Strategy">
            <MachineList items={[
              "LinkedIn Ads: Best for B2B targeting by job title/company. CPM $30-$80. Min 300 companies. Use Sponsored Content + Message Ads.",
              "Google Display: Broadest reach, lowest CPMs ($3-$12). Min 1,000 users. Best for awareness layer.",
              "Meta (Facebook/Instagram): Reaches decision-makers during off-hours. CPM $5-$20. Min 100 users. Video + carousel ads.",
              "Email Retargeting: Lowest cost ($0.01-$0.05/email). Behavior-triggered sequences based on pages visited.",
              "Direct Mail: Highest response rates (30-40x email). $1-$3/piece. Reserve for highest-intent ICP segments.",
            ]} />
          </MachineSection>

          <MachineSection title="Cross-Platform Orchestration">
            <MachineList items={[
              "Layer 1 Awareness: Google Display + Meta, 20% budget, 0.5-1.0% CTR, brand credibility and social proof",
              "Layer 2 Engagement: LinkedIn + Email, 35% budget, 1.0-2.5% CTR, case studies and use cases",
              "Layer 3 Conversion: LinkedIn + Email + Direct Mail, 45% budget, 2.5-5.0% CTR, direct offers and meeting invitations",
              "Frequency management: Awareness 3-5/week, Engagement 2-3/week, Conversion uncapped for 7 days then 2-3/week",
            ]} />
          </MachineSection>

          <MachineSection title="Measurement Framework">
            <MachineList items={[
              "Return Visit Rate: % of retargeted companies that return within 14 days (benchmark: 15-25%)",
              "Cost Per Pipeline Opportunity: Total retargeting spend / pipeline opportunities influenced (benchmark: $200-$500)",
              "Influenced Pipeline Value: Total pipeline from retargeted accounts (benchmark: 5-10x ROAS)",
              "Segment Conversion Lift: Retargeted vs. control group conversion rates (benchmark: 50-200% lift)",
            ]} />
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "Visitor Identification", href: "/visitor-identification", description: "Identify anonymous B2B website visitors to power retargeting audiences" },
              { label: "Audience Targeting Guide", href: "/blog/audience-targeting", description: "Build data-driven audience segments for retargeting campaigns" },
              { label: "Direct Mail Automation", href: "/blog/direct-mail", description: "Add physical mail to your retargeting mix for 3-5x higher conversions" },
              { label: "Marketing Analytics", href: "/blog/analytics", description: "Multi-touch attribution for measuring retargeting ROI" },
              { label: "CRM Integration", href: "/blog/crm-integration", description: "Sync retargeting audiences with your CRM for pipeline tracking" },
              { label: "200+ Integrations", href: "/integrations", description: "Native integrations with LinkedIn, Google, Meta, and more" },
            ]} />
          </MachineSection>

          <MachineSection title="Get Started with Cursive">
            <p className="text-gray-700">
              Cursive identifies website visitors and syncs audience segments to LinkedIn, Google, Meta, email, and direct mail automatically. Build precision retargeting powered by first-party company data instead of dying cookies.
            </p>
            <p className="mt-2">
              <MachineLink href="/visitor-identification">Start identifying visitors</MachineLink> | <MachineLink href="/platform">See the platform</MachineLink>
            </p>
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
