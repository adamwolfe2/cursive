"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection } from "@/components/view-wrapper"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"

const faqs = [
  {
    question: "What is identity resolution and how does it work?",
    answer: "Identity resolution is the process of matching anonymous website visitors to known individuals using a combination of first-party data signals, device fingerprinting, IP intelligence, and probabilistic matching against large identity graphs. When a visitor lands on your site, Cursive's Super Pixel fires and cross-references the visitor's digital signals against a network of 60 billion weekly intent signals to identify the individual — returning their name, email, job title, and company. Accuracy on B2B traffic runs approximately 70%, meaning the majority of anonymous visitors to most B2B sites can be identified and contacted directly."
  },
  {
    question: "What kind of ROI can I expect from identity resolution?",
    answer: "ROI from identity resolution ranges from 3 to 10 times ad spend efficiency depending on use case and how the identified data is activated. The five case studies in this article show specific outcomes: B2B SaaS audience accuracy improvement from 12% to 94%; a 34% increase in ad spend efficiency through suppression of 187,000 existing-user visits; a 3x improvement in outreach conversion rate from qualifying behavior filtering; a 5.8x audience growth through competitor displacement signals; and a 22% audience reclassification as active buyers through URL-stage scoring. Results depend on signal quality, activation speed, and whether suppression is used alongside targeting."
  },
  {
    question: "How does URL-level scoring improve identity resolution accuracy?",
    answer: "Standard identity resolution tells you who visited your site. URL-level scoring tells you what stage of the buying process they are in based on which pages they visited. A visitor who lands on your pricing page is in a different stage than a visitor who reads a blog post. Cursive's R4 signal model classifies each URL type and incorporates that classification into the identity resolution output, so that identified visitors are returned with both their identity and their buyer stage. This allows teams to route high-intent identified visitors to immediate sales outreach while placing early-stage visitors into nurture sequences."
  },
  {
    question: "What is suppression intelligence and why does it matter?",
    answer: "Suppression intelligence is the practice of using identity resolution to identify who NOT to target in advertising campaigns. Without suppression, ad spend consistently wastes impressions on existing customers, recently churned accounts, and internal employees who are clicking ads. Cursive's identity resolution identifies these visitors, allowing you to build suppression lists for paid campaigns. The event management SaaS in this article removed 187,000 existing-user visits in the first week of their suppression campaign, resulting in a 34% increase in ad spend efficiency. Suppression is typically worth as much or more than targeting on the efficiency side of the equation."
  },
  {
    question: "How does identity resolution help with competitor displacement?",
    answer: "Competitor displacement uses identity resolution to identify visitors who are actively researching competitor alternatives — typically visitors who arrive via branded competitor search terms or who visit competitor comparison pages. Cursive surfaces these visitors with their identity and the specific competitor context, allowing sales teams to reach out with targeted competitive messaging to accounts that are already in an evaluation mindset. The EdTech case study in this article used competitor displacement signals to surface 2,400 accounts actively evaluating alternatives, contributing to 5.8x audience growth over six months."
  },
  {
    question: "What is the difference between Cursive's approach and legacy intent data platforms?",
    answer: "Legacy intent data platforms (Bombora, 6sense, Demandbase) primarily offer keyword-based co-op intent data — signals from third-party publisher networks showing which companies are consuming content around your category keywords. This produces broad signals with significant noise. Cursive adds three layers legacy platforms lack: R3 industry cohort training that builds category-specific intent models; R4 noise suppression that removes irrelevant signals (202,000+ in the B2B SaaS case study); and URL-level buyer-stage scoring that classifies page visits rather than just counting keyword matches. The result is the accuracy difference shown in the case study: 12% relevant signals from legacy data versus 94% from Cursive's layered approach."
  },
  {
    question: "How quickly can I get results from identity resolution?",
    answer: "Cursive's Super Pixel begins returning identified visitor data within 24 hours of installation. Suppression campaigns can be activated within the first week — as the event management SaaS discovered, removing 187,000 existing-user visits in week one of their suppression deployment. Audience accuracy improvements from R4 noise suppression take effect as soon as the first filtered report is generated. The compounding benefits — improved feedback loops, refined cohort models, and accumulated suppression intelligence — develop over weeks and months, but the core value of knowing who is on your site starts on day one."
  },
  {
    question: "Is identity resolution compliant with privacy regulations?",
    answer: "Cursive's identity resolution operates within applicable privacy frameworks including CCPA and CAN-SPAM. The Super Pixel collects behavioral signals for identification purposes consistent with standard digital advertising practices. B2B identity resolution targeting business email addresses and professional identities is generally treated differently from consumer tracking under most regulatory frameworks. Cursive provides documentation on their data practices and recommends reviewing your specific jurisdiction's requirements with legal counsel before deploying any identity resolution program, particularly for regulated industries."
  },
]

const relatedPosts = [
  {
    title: "The R4 Signal Model Explained",
    description: "How Cursive's four-layer signal processing separates real buyer intent from noise at scale.",
    href: "/blog/r4-signal-model-explained",
  },
  {
    title: "The Attribution Moat: Why First-Party Identity Data Compounds",
    description: "How identity resolution data improves over time and creates compounding competitive advantage.",
    href: "/blog/attribution-moat",
  },
  {
    title: "Intent Data Providers Comparison",
    description: "Cursive vs. Bombora, 6sense, Demandbase, and Warmly across signal quality, pricing, and use cases.",
    href: "/blog/intent-data-providers-comparison",
  },
]

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateFAQSchema({ faqs })} />
      <StructuredData data={generateBlogPostSchema({
        title: "5 Identity Resolution Case Studies: Real Results From Real Campaigns",
        description: "Five real identity resolution campaigns: B2B SaaS accuracy from 12% to 94%, 3x outreach conversion for mass tort, 34% ad spend efficiency gain via suppression, and more.",
        author: "Cursive Team",
        publishDate: "2026-06-12",
        image: "https://www.meetcursive.com/cursive-logo.png"
      })} />

      <HumanView>
        {/* Header */}
        <section className="py-12 bg-white">
          <Container>
            <div className="max-w-3xl mx-auto">
              <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="inline-block px-3 py-1 bg-primary text-white rounded-full text-sm font-medium mb-4">
                Case Studies
              </div>
              <h1 className="text-5xl font-bold mb-6">
                5 Identity Resolution Case Studies: Real Results From Real Campaigns
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Audience accuracy from 12% to 94%. Ad spend efficiency up 34%. Outreach conversion tripled.
                These are the concrete outcomes from five identity resolution deployments across B2B SaaS,
                automotive, edtech, event management, and mass tort — what changed, how, and why.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>June 12, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>11 min read</span>
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
                Identity resolution produces dramatically different outcomes depending on how it is implemented.
                The technology itself — matching anonymous visitors to known individuals — is the table stake.
                What separates a program that returns 3 to 10 times on ad spend from one that produces a list
                of semi-relevant company names is how the identified data is layered, filtered, and activated.
              </p>

              <p>
                The five case studies below come from Cursive campaigns across different industries and use cases.
                Each one shows a specific problem, the specific configuration that solved it, and the specific
                outcome. The through-line across all five: identity resolution alone is not the answer. Identity
                resolution combined with URL-stage scoring, noise suppression, and accurate buyer-stage
                classification is what moves the needle.
              </p>

              <div className="not-prose bg-primary/5 rounded-xl p-6 my-8 border border-primary/15">
                <h3 className="font-bold text-lg mb-3">Five Case Studies at a Glance</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span><strong>B2B SaaS:</strong> Audience accuracy from 12% to 94% using R3 cohorts + R4 suppression + R2 URL scoring</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span><strong>Automotive:</strong> 22% of audience reclassified as active buyers via URL-stage scoring</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span><strong>EdTech:</strong> 5.8x audience growth in 6 months via competitor displacement signals</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <span><strong>Event Management:</strong> 34% ad spend efficiency gain by suppressing 187,000 existing-user visits</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                    <span><strong>Mass Tort:</strong> 3x outreach conversion rate via qualifying behavior filtering</span>
                  </div>
                </div>
              </div>

              <h2>Case Study 1: B2B SaaS — Audience Accuracy from 12% to 94%</h2>

              <div className="not-prose bg-gray-50 rounded-xl p-5 my-4 border border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-400">12%</div>
                    <div className="text-xs text-gray-500 mt-1">Before: Audience accuracy</div>
                  </div>
                  <div className="flex items-center justify-center text-gray-400 text-2xl font-light">→</div>
                  <div>
                    <div className="text-xl font-bold text-primary">94%</div>
                    <div className="text-xs text-gray-500 mt-1">After: Audience accuracy</div>
                  </div>
                </div>
              </div>

              <p>
                <strong>The problem:</strong> A B2B SaaS company running an account-based marketing program
                was sourcing intent data from a legacy co-op intent platform. The signals were keyword-based —
                aggregated from third-party publisher networks showing which companies were consuming content
                around their category terms. When sales reached out to the top-scored accounts, 12% showed
                genuine purchase behavior. The other 88% were noise — accounts that had appeared in the
                intent co-op data for reasons unrelated to an active evaluation.
              </p>

              <p>
                <strong>The solution:</strong> Cursive deployed three layers in combination. First, the R3
                industry cohort model was trained on the client&apos;s specific ICP — a SaaS-specific cohort
                that distinguished between companies researching the client&apos;s category and companies that
                merely showed up in broadly-defined keyword matches. Second, R4 noise suppression was applied,
                which removed 202,000 individual visit signals that did not meet the cohort&apos;s behavioral
                criteria. Third, R2 URL-level buyer-stage scoring was layered on top of the remaining signals
                to classify accounts by their specific stage in the evaluation process.
              </p>

              <p>
                <strong>The result:</strong> Audience accuracy rose from 12% to 94%. Nearly every account
                the sales team contacted was in active evaluation — not in passive category awareness, not
                in competitive research for an unrelated project, and not a noise signal from the co-op data.
              </p>

              <p>
                The URL-level breakdown tells the fuller story. Before the Cursive deployment, 8% of intent
                signals were at comparison or pricing pages — the pages that indicate an account is building
                a vendor shortlist. After R3 and R4 filtering, 73% of the remaining signals were at those
                same pages. The suppression did not just reduce volume. It concentrated the remaining signal
                into the accounts most likely to convert.
              </p>

              <div className="not-prose overflow-x-auto my-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-primary to-primary-dark text-white">
                      <th className="border border-gray-300 p-3 text-left font-bold">Metric</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Legacy Intent Platform</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Cursive (R3+R4+R2)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Audience accuracy</td>
                      <td className="border border-gray-300 p-3">12%</td>
                      <td className="border border-gray-300 p-3 font-semibold text-primary">94%</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-3 font-medium">Signals at comparison/pricing pages</td>
                      <td className="border border-gray-300 p-3">8%</td>
                      <td className="border border-gray-300 p-3 font-semibold text-primary">73%</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Irrelevant signals suppressed</td>
                      <td className="border border-gray-300 p-3">None</td>
                      <td className="border border-gray-300 p-3 font-semibold text-primary">202,000+</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                The underlying mechanism here is important for any team evaluating intent data quality. Co-op
                keyword data measures category consumption, not purchase intent. An account reading ten articles
                about a software category over six months scores high on keyword co-op data but may have zero
                purchase intent — they might be a journalist, a researcher, a student, or a company in a
                completely different vertical that uses the same terminology. The R3 cohort model learns to
                distinguish these patterns. R4 suppression removes the noise at scale. The result is a smaller
                but dramatically more accurate audience.
              </p>

              <h2>Case Study 2: Automotive Dealership — 22% Audience Reclassified as Active Buyers</h2>

              <div className="not-prose bg-gray-50 rounded-xl p-5 my-4 border border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-400">"Interested in automotive"</div>
                    <div className="text-xs text-gray-500 mt-1">Before: Generic category signal</div>
                  </div>
                  <div className="flex items-center justify-center text-gray-400 text-2xl font-light">→</div>
                  <div>
                    <div className="text-xl font-bold text-primary">22%</div>
                    <div className="text-xs text-gray-500 mt-1">After: Reclassified as active buyers</div>
                  </div>
                </div>
              </div>

              <p>
                <strong>The problem:</strong> A regional automotive dealership group was receiving intent signals
                on visitors &quot;interested in automotive.&quot; So was every other automotive business
                in their market. Generic category interest is the lowest-value form of intent data — it tells
                you nothing that you could not infer from the fact that someone visited an automotive website.
                The dealership needed to distinguish browsers from buyers, and browsers in general from buyers
                in the next 30 to 90 days.
              </p>

              <p>
                <strong>The solution:</strong> Cursive deployed URL-stage scoring calibrated to the
                dealership&apos;s specific site architecture. Individual pages were classified by purchase stage:
                vehicle landing pages (awareness), vehicle comparison pages (consideration), financing
                calculator pages (evaluation), and trade-in value pages (high intent / near-term purchase).
                Visits to evaluation and high-intent pages triggered immediate WaveState classification.
                Visitors were then identified by name where possible and routed to the sales floor.
              </p>

              <p>
                <strong>The result:</strong> 22% of the dealership&apos;s site audience was reclassified as
                active buyers — visitors who had reached evaluation or high-intent pages during their session.
                This cohort was recommended for immediate outreach within 48 hours of identification, consistent
                with the WaveState trigger&apos;s optimal outreach window.
              </p>

              <p>
                The significance of this result is not just the 22% figure. It is the precision it enables.
                Before URL-stage scoring, every visitor to the dealership&apos;s site was treated as roughly
                equivalent — someone who showed up got a generic follow-up ad. After URL-stage scoring, 22%
                of visitors could be identified as near-term purchase candidates and routed to direct,
                personalized outreach while the remaining 78% received appropriately lighter-touch nurture.
                The same total visitor pool produced radically different activation strategies for different
                segments based on page-level behavior.
              </p>

              <h2>Case Study 3: EdTech — 5.8x Audience Growth via Competitor Displacement</h2>

              <div className="not-prose bg-gray-50 rounded-xl p-5 my-4 border border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-400">Slow organic growth</div>
                    <div className="text-xs text-gray-500 mt-1">Before: 3-year competitor head start</div>
                  </div>
                  <div className="flex items-center justify-center text-gray-400 text-2xl font-light">→</div>
                  <div>
                    <div className="text-xl font-bold text-primary">5.8x</div>
                    <div className="text-xs text-gray-500 mt-1">After: Audience growth in 6 months</div>
                  </div>
                </div>
              </div>

              <p>
                <strong>The problem:</strong> An online learning platform targeting enterprise L&D (learning
                and development) buyers faced a significant market disadvantage: a primary competitor had
                a three-year head start in audience development and brand recognition. Building an owned
                audience organically from scratch would take years. The client needed a faster path to a
                competitive audience that was already in-market.
              </p>

              <p>
                <strong>The solution:</strong> Cursive deployed competitor displacement signals — identity
                resolution combined with behavioral signals indicating that a visitor was actively researching
                the client&apos;s primary competitors. This included visitors arriving via branded competitor
                search terms, visitors who had recently engaged with competitor content in the intent network,
                and visitors who showed comparison-page behavior suggesting they were building a vendor shortlist
                that included the competitor.
              </p>

              <p>
                These competitor displacement signals surfaced 2,400 accounts actively evaluating alternatives
                to the incumbent platform. These accounts were flagged for specific campaign sequencing: a
                competitive differentiation message designed for buyers who were already familiar with the
                category and already in evaluation mode, not a top-of-funnel awareness message for someone
                who had never heard of the space.
              </p>

              <p>
                <strong>The result:</strong> 5.8 times audience growth over six months, driven primarily by
                the competitor displacement cohort converting into engaged prospects. The key insight here is
                that audience building does not have to start from zero if you can identify accounts that are
                already evaluating your category and specifically looking at whether there is a better option
                than the incumbent. Those accounts represent the highest-velocity segment in any market —
                they are already sold on the category, already have budget considerations underway, and are
                actively looking for a reason to switch.
              </p>

              <p>
                The right message for this cohort is never the same as your standard acquisition message.
                It needs to directly address why you are better than the specific alternative they are
                evaluating — not in a generic &quot;we&apos;re better because&quot; format, but with specific
                points of differentiation calibrated to the known complaints about the competitor and the
                specific outcomes the buyer cares about.
              </p>

              <h2>Case Study 4: Event Management SaaS — 34% Ad Spend Efficiency Gain via Suppression</h2>

              <div className="not-prose bg-gray-50 rounded-xl p-5 my-4 border border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-400">Wasted impressions</div>
                    <div className="text-xs text-gray-500 mt-1">Before: Existing users in ad audience</div>
                  </div>
                  <div className="flex items-center justify-center text-gray-400 text-2xl font-light">→</div>
                  <div>
                    <div className="text-xl font-bold text-primary">+34%</div>
                    <div className="text-xs text-gray-500 mt-1">After: Ad spend efficiency</div>
                  </div>
                </div>
              </div>

              <p>
                <strong>The problem:</strong> An event management SaaS company was running paid acquisition
                campaigns across Google and LinkedIn. Performance was declining. Upon auditing the campaign
                audiences, they identified a structural problem: a significant portion of their ad impressions
                were being served to their own existing customers — users who were logged into the platform,
                clicking ads, and inflating engagement metrics without any possibility of converting to a
                new customer. Budget was being consumed by remarketing to people who had already converted.
              </p>

              <p>
                <strong>The solution:</strong> Cursive&apos;s identity resolution was applied to the
                client&apos;s site traffic to build a real-time suppression list. As existing users visited
                the site — logged in or not, from any device — they were identified and flagged for
                suppression in active advertising audiences. The suppression list was updated continuously
                and synced to paid campaign audiences weekly.
              </p>

              <p>
                <strong>The result:</strong> In week one of the suppression deployment, 187,000 existing-user
                visits were identified and removed from the active ad audience. Ad spend efficiency increased
                by 34% — the same budget was now reaching only net-new prospects rather than a mix of
                prospects and existing users.
              </p>

              <div className="not-prose bg-primary/5 rounded-xl p-6 my-6 border border-primary/15">
                <p className="font-semibold text-base mb-3">Why Suppression Is as Valuable as Targeting</p>
                <p className="text-sm text-gray-600 mb-3">
                  Most identity resolution conversations focus on the targeting side: who should we reach?
                  The suppression side is equally important and often more immediately impactful because
                  it addresses active waste rather than speculative opportunity.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li><strong>Existing customers:</strong> Already paying. Showing them acquisition ads wastes spend and may confuse the relationship.</li>
                  <li><strong>Recently churned accounts:</strong> May require a different message — or no message at all during a cooling period.</li>
                  <li><strong>Internal employees:</strong> Clicking your own ads inflates engagement metrics and reduces budget efficiency.</li>
                  <li><strong>Known disqualified accounts:</strong> Companies too small, too large, or in excluded industries.</li>
                </ul>
              </div>

              <p>
                The suppression use case is often the fastest path to demonstrable ROI from identity
                resolution because it addresses an active, measurable problem — wasted ad spend on
                audiences that cannot convert — rather than speculative opportunity. A team that deploys
                suppression first can fund the rest of their identity resolution program from the recovered
                efficiency within weeks.
              </p>

              <p>
                The event management client found an additional benefit: their conversion rate metrics
                became significantly more accurate once existing users were removed from the audience.
                Conversion metrics that had appeared inflated by user re-engagement corrected to reflect
                true acquisition performance, which allowed the marketing team to make better channel
                allocation decisions going forward.
              </p>

              <h2>Case Study 5: Mass Tort Law Firm — 3x Outreach Conversion via Qualifying Behavior Filtering</h2>

              <div className="not-prose bg-gray-50 rounded-xl p-5 my-4 border border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-400">Broad keyword targeting</div>
                    <div className="text-xs text-gray-500 mt-1">Before: Too many lookers, few plaintiffs</div>
                  </div>
                  <div className="flex items-center justify-center text-gray-400 text-2xl font-light">→</div>
                  <div>
                    <div className="text-xl font-bold text-primary">3x</div>
                    <div className="text-xs text-gray-500 mt-1">After: Outreach conversion rate</div>
                  </div>
                </div>
              </div>

              <p>
                <strong>The problem:</strong> A mass tort plaintiff recruitment firm was using broad keyword
                intent data to identify potential claimants for active litigation campaigns. The category
                keywords — product names, medical terms, symptoms — returned enormous volumes of signals,
                but the overwhelming majority were researchers, journalists, concerned family members, and
                people with tangential connections to the topic rather than actual potential plaintiffs.
                Outreach to the full keyword-matched audience produced low conversion and high cost per
                enrolled plaintiff.
              </p>

              <p>
                <strong>The solution:</strong> Cursive deployed URL-level qualifying behavior filtering
                calibrated to the firm&apos;s specific case criteria. Pages were classified by the specificity
                of the qualifying behavior they represented: general educational content about the product
                or condition (low qualifier), symptom-matching pages (medium qualifier), diagnosis and
                treatment history pages (high qualifier), and plaintiff intake or legal rights pages (maximum
                qualifier). Only visitors reaching high and maximum qualifier pages were surfaced to the
                outreach team.
              </p>

              <p>
                <strong>The result:</strong> 31% of the identified audience was classified as active
                researchers exhibiting qualifying behavior at the high or maximum level. Outreach to
                this filtered cohort produced a conversion rate three times higher than outreach to the
                unfiltered keyword-matched audience — because every person the team contacted had already
                demonstrated the specific research behavior that predicted plaintiff qualification, not
                general curiosity about the topic.
              </p>

              <p>
                The mass tort case study illustrates a principle that generalizes across many industries:
                the most valuable signals are not the most common ones. A keyword match is common. A visit
                to a symptom-matching page is less common but more specific. A visit to a plaintiff intake
                page is rare but highly predictive of the exact outcome the firm is recruiting for. URL-level
                filtering concentrates outreach on the narrow band of behavior that actually predicts
                the desired outcome rather than the broad band that correlates loosely with the category.
              </p>

              <h2>Four Themes Across All Five Case Studies</h2>

              <p>
                These five campaigns are in different industries with different goals. But four principles
                appear in each one.
              </p>

              <h3>1. Identity Resolution Returns 3 to 10 Times on Ad Spend</h3>

              <p>
                The B2B SaaS accuracy improvement, the automotive buyer reclassification, the competitor
                displacement audience growth, the suppression efficiency gain, and the mass tort conversion
                improvement all represent significant positive ROI relative to the cost of the identity
                resolution deployment. The range is wide because use case and activation strategy matter
                enormously — suppression produces faster and more measurable returns than targeting because
                it addresses active waste rather than opportunity.
              </p>

              <h3>2. URL-Level Scoring Matters More Than Keyword Scoring</h3>

              <p>
                Every case study here benefited from URL-level page classification over simple keyword
                intent matching. Keywords tell you what topic someone is interested in. URLs tell you what
                stage of the evaluation process they are in. Stage information is more predictive of purchase
                behavior than topic information because the same topic can be researched by people at every
                stage of awareness — from curious first-time readers to buyers in final contract negotiation.
              </p>

              <h3>3. Suppression Is as Important as Targeting</h3>

              <p>
                The event management case study is the most direct illustration, but suppression logic
                appears in the B2B SaaS case too — the 202,000 suppressed signals were the mechanism that
                raised audience accuracy from 12% to 94%. Knowing who not to target is frequently as
                valuable as knowing who to target. Any identity resolution program that focuses only on
                the targeting side and ignores suppression is leaving significant efficiency on the table.
              </p>

              <h3>4. Feedback Loops Compound Over Time</h3>

              <p>
                Each of these programs improves over time as the identity resolution system accumulates
                more behavioral data about what actual converters look like on your specific site. The
                R3 cohort model trains on your traffic. The suppression list grows. URL classifications
                are refined based on which page types actually predict conversion versus which ones attract
                browsers. The first month of an identity resolution program will underperform the sixth
                month — not because the technology changed, but because the model learned. This compounding
                dynamic is why the{" "}
                <Link href="/blog/attribution-moat" className="text-primary hover:underline">
                  attribution moat
                </Link>{" "}
                widens over time for teams that start early.
              </p>

              <h2>What These Case Studies Do Not Tell You</h2>

              <p>
                Every case study shows the outcome. What is harder to show is the work that precedes the
                outcome. The B2B SaaS accuracy improvement required careful ICP definition so that the R3
                cohort model had the right training criteria. The automotive buyer reclassification required
                a thoughtful page taxonomy — someone had to define which pages indicated which stage. The
                competitor displacement campaign required messaging that was genuinely better than the generic
                outreach the competitor&apos;s churning customers typically received.
              </p>

              <p>
                Identity resolution is not a magic layer you apply on top of existing programs to improve
                results automatically. It is a data layer that allows better decisions — about who to
                target, who to suppress, what to say, and when to say it. The quality of those decisions
                determines the quality of the outcome.
              </p>

              <p>
                The teams that extract the most from identity resolution treat identified data as the
                beginning of a workflow, not the end of one. The identified visitor&apos;s name and email
                are inputs to a campaign that has been thoughtfully designed around what that person is
                researching, what stage they are in, and what they need to hear next. That design work
                is what turns a 70% identification rate into a 94% audience accuracy rate, a 3x conversion
                improvement, or a 34% efficiency gain.
              </p>

              <div className="not-prose grid grid-cols-2 md:grid-cols-3 gap-4 my-8">
                <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/15">
                  <div className="text-2xl font-bold text-primary">94%</div>
                  <div className="text-sm text-gray-600 mt-1">Audience accuracy after R3+R4+R2</div>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/15">
                  <div className="text-2xl font-bold text-primary">34%</div>
                  <div className="text-sm text-gray-600 mt-1">Ad spend efficiency gain via suppression</div>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/15">
                  <div className="text-2xl font-bold text-primary">5.8x</div>
                  <div className="text-sm text-gray-600 mt-1">Audience growth in 6 months (EdTech)</div>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/15">
                  <div className="text-2xl font-bold text-primary">3x</div>
                  <div className="text-sm text-gray-600 mt-1">Outreach conversion improvement</div>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/15">
                  <div className="text-2xl font-bold text-primary">22%</div>
                  <div className="text-sm text-gray-600 mt-1">Automotive audience reclassified as buyers</div>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/15">
                  <div className="text-2xl font-bold text-primary">202K+</div>
                  <div className="text-sm text-gray-600 mt-1">Noise signals suppressed (B2B SaaS)</div>
                </div>
              </div>

              <p>
                Cursive&apos;s{" "}
                <Link href="/visitor-estimate" className="text-primary hover:underline">
                  free traffic estimate
                </Link>{" "}
                shows how many named leads your site is currently losing before you commit to anything.
                The Super Pixel installs in under 10 minutes and begins building your identification
                data immediately. The results above represent the range of outcomes available once that
                data is layered, filtered, and activated with the right configuration for your specific use case.
              </p>

            </article>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/5">
          <Container>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">See Cursive in action on your traffic</h2>
              <p className="text-gray-600 mb-8">
                Get a free estimate of how many named leads your site is losing — and what your
                identity resolution program could produce.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button asChild size="lg">
                  <Link href="/get-leads">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/visitor-estimate">Run Free Estimate</Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>

        <SimpleRelatedPosts posts={relatedPosts} />
      </HumanView>

      <MachineView>
        <MachineContent>
          <MachineSection title="5 Identity Resolution Case Studies: Real Results From Real Campaigns">
            Five identity resolution case studies from Cursive campaigns across different industries. Case Study 1 — B2B SaaS: Audience accuracy improved from 12% to 94% by combining R3 industry cohort training, R4 noise suppression (202,000+ signals removed), and R2 URL-level buyer-stage scoring. Signals at comparison/pricing pages increased from 8% to 73%. Case Study 2 — Automotive: URL-stage scoring classified individual pages by purchase stage (awareness, consideration, evaluation, high-intent). 22% of the site audience was reclassified as active buyers based on visits to financing calculators, trade-in value pages, and vehicle comparison pages. WaveState trigger recommended immediate outreach within 48 hours. Case Study 3 — EdTech: Competitor displacement signals surfaced 2,400 accounts actively evaluating alternatives to an incumbent platform. 5.8x audience growth over 6 months. Outreach used competitive differentiation messaging specific to the competitor being evaluated. Case Study 4 — Event Management SaaS: Identity resolution used to build real-time suppression lists of existing customers visiting the site. 187,000 existing-user visits removed in week one. Ad spend efficiency increased 34% by eliminating wasted impressions on existing customers. Case Study 5 — Mass Tort: URL-level qualifying behavior filtering classified pages by specificity of qualifying behavior. 31% of identified audience reached high or maximum qualifier pages. Outreach conversion rate tripled (3x) because qualifying behavior signals predicted enrollment likelihood. Four themes across all five: identity resolution returns 3-10x on ad spend; URL-level scoring predicts stage better than keyword scoring; suppression is as important as targeting; feedback loops compound over time. Cursive processes 60B+ intent signals weekly and identifies 70% of anonymous visitors.
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
