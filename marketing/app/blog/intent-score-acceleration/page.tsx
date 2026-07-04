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
    question: "What is intent score acceleration?",
    answer: "Intent score acceleration refers to the rate at which a company's intent score is increasing over a defined time period — typically 7 days. An account accelerating from a score of 30 to 70 in one week is experiencing score acceleration. This rapid rise signals that the account has entered an active research phase right now, making it a higher-priority outreach target than an account that has maintained a static score of 80 for months. Cursive's Score Trend metric quantifies this acceleration daily so sales teams can sort their call lists by velocity rather than absolute score."
  },
  {
    question: "Why is Score Trend more useful than absolute intent score for sales outreach?",
    answer: "Absolute intent score tells you how interested a company is in a category overall. Score Trend tells you whether that interest is growing right now. A company with an absolute score of 85 may have been in that territory for 6 months — their research phase is potentially over. A company that moved from 30 to 70 in the past 7 days just entered an active evaluation phase and is far more responsive to outreach in that window. Reaching out during the acceleration window — typically 48 to 72 hours after the WaveState trigger fires — consistently produces 3 to 5 times higher conversion rates compared to reaching out to high static-score accounts."
  },
  {
    question: "What are the three intent score acceleration call triggers?",
    answer: "The three acceleration call triggers are: (1) WaveState — the account's score trend crosses +30 in 7 days, indicating fresh entry into active research. Outreach window is 48-72 hours. (2) ABM Workshop — an identified visitor from a target account has returned for their third visit in 7 days, indicating the account is actively evaluating vendors. Immediate outreach is recommended. (3) Diagnosis — the score accelerates AND URL-level signals include comparison or pricing pages, indicating the buyer is in final evaluation. This is the highest-urgency trigger."
  },
  {
    question: "How do I structure a morning routine around intent score trends?",
    answer: "Open your Cursive report each morning and sort by Score Trend descending. The top 10 accounts are your acceleration list — these require same-day outreach while the research window is open. Accounts ranked 11-30 should receive warm outreach during the current week. Accounts below rank 30 should enter a nurture sequence only — interrupting them with direct sales outreach typically suppresses future conversion. The entire routine takes under 15 minutes and produces a pre-prioritized, intent-qualified call list without manual research."
  },
  {
    question: "What should I say when I call an intent-accelerating account?",
    answer: "Reference the specific URL-level signal rather than revealing that you tracked them. A strong opener: 'I noticed you were looking at [relevant content area on your site] — we've helped similar companies in [their industry] accomplish [specific outcome]. I wanted to reach out while it was timely.' This works because the outreach feels personalized and timed appropriately rather than random. Avoid generic openers that don't acknowledge why now is the right time to call. The URL-level signal tells you what pain point they're researching — lead with a solution to that specific pain."
  },
  {
    question: "How often does Cursive update Score Trend data?",
    answer: "Cursive updates Score Trend daily, compared to weekly updates on legacy intent platforms. Daily updates matter because a WaveState trigger — a score trend crossing +30 in 7 days — has a 48-72 hour outreach window before research activity peaks and the account may have already selected a shortlist. Weekly scoring means you may receive the signal 6 days after the window opened. Daily scoring means you receive it within 24 hours and can act within the optimal window."
  },
  {
    question: "How does URL-level scoring improve the accuracy of acceleration signals?",
    answer: "URL-level scoring assigns buyer stage classifications to individual pages visited rather than just counting visits or keyword matches. A visit to a vendor comparison page scores differently than a visit to a blog post or a homepage visit. When score acceleration coincides with comparison-page or pricing-page visits — the Diagnosis trigger — you know the accelerating account isn't just beginning research. They are actively evaluating vendors and building a shortlist. This combination of velocity plus page intent dramatically reduces false positives in acceleration-based prospecting."
  },
  {
    question: "What results can I expect from building my call list around Score Trend?",
    answer: "B2B ABM teams that restructure their morning outreach routine around Score Trend consistently report 3 times or more demo bookings from intent-qualified accounts compared to their previous approach of sorting by absolute score or using cold prospecting lists. The primary driver is timing: reaching accounts during their active research window means they are already in problem-solving mode and more receptive to relevant outreach. Cursive's Super Pixel identifies 70% of anonymous visitors with accuracy and updates Score Trend daily, giving sales teams the signal quality and freshness needed to act in the optimal window."
  },
]

const relatedPosts = [
  {
    title: "The R4 Signal Model Explained",
    description: "How Cursive's four-layer signal processing separates real buyer intent from noise.",
    href: "/blog/r4-signal-model-explained",
  },
  {
    title: "Why Intent Data Fails (And How to Fix It)",
    description: "The four most common reasons intent data programs produce no pipeline, and what to do instead.",
    href: "/blog/why-intent-data-fails",
  },
  {
    title: "Intent Data Providers Comparison",
    description: "Cursive vs. Bombora, 6sense, Demandbase, and Warmly compared across signal quality, pricing, and use cases.",
    href: "/blog/intent-data-providers-comparison",
  },
]

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateFAQSchema({ faqs })} />
      <StructuredData data={generateBlogPostSchema({
        title: "Score Acceleration: How to Use Daily Intent Score Trends to Build Your Sales Call List",
        description: "Stop sorting by absolute intent score. Sort by Score Trend to find accounts that just entered an active research phase. Here's the morning routine that triples demo bookings.",
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
                Sales Playbook
              </div>
              <h1 className="text-5xl font-bold mb-6">
                Score Acceleration: How to Use Daily Intent Score Trends to Build Your Sales Call List
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Sorting your intent report by absolute score is the wrong move. The accounts converting at
                3 to 5 times the rate of cold outbound are the ones accelerating right now. Here is the
                morning routine, the three triggers, and the call framework built around Score Trend.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>June 12, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>9 min read</span>
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
                Most sales teams using intent data are misreading the signal. They pull their weekly report,
                sort by absolute intent score from highest to lowest, and start dialing the top 20 accounts.
                That&apos;s logical. It&apos;s also why most intent data programs produce underwhelming results.
              </p>

              <p>
                The problem is that absolute score is a snapshot of cumulative interest. An account with a score
                of 85 may have been in that range for the last six months. Their research phase may be over. They
                may have already selected a vendor, signed a contract, and moved on. Reaching out to that account
                today is not timely outreach — it&apos;s random outbound dressed up in intent clothing.
              </p>

              <p>
                Score Trend is different. It measures how fast an account&apos;s score is rising over the past
                7 days. An account that moved from 30 to 70 in one week just entered an active evaluation phase.
                That movement is the signal. That&apos;s the company you want to call today — not the company
                that has been at 80 for months.
              </p>

              <div className="not-prose bg-primary/5 rounded-xl p-6 my-8 border border-primary/15">
                <h3 className="font-bold text-lg mb-3">What This Playbook Covers</h3>
                <ol className="space-y-1 text-sm text-primary">
                  <li>1. Why Score Trend beats absolute score for sales prioritization</li>
                  <li>2. The three acceleration call triggers (WaveState, ABM Workshop, Diagnosis)</li>
                  <li>3. The 15-minute morning routine that pre-builds your call list</li>
                  <li>4. The call script for acceleration accounts</li>
                  <li>5. The case study: 3x demo bookings from intent-qualified outreach</li>
                  <li>6. How URL-level scoring amplifies acceleration signals</li>
                </ol>
              </div>

              <h2>Why Most Reps Misuse Intent Data</h2>

              <p>
                The intuition behind sorting by absolute score makes sense in theory. High score equals high
                interest equals higher likelihood to buy. But intent scoring does not work like a thermometer
                frozen at a moment in time. It works more like a weather pattern — what matters is whether
                the temperature is rising, not whether it&apos;s currently warm.
              </p>

              <p>
                Consider two accounts:
              </p>

              <div className="not-prose overflow-x-auto my-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-primary to-primary-dark text-white">
                      <th className="border border-gray-300 p-3 text-left font-bold">Account</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Absolute Score</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Score Trend (7d)</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Research Stage</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Outreach Priority</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Acme Corp</td>
                      <td className="border border-gray-300 p-3">85</td>
                      <td className="border border-gray-300 p-3">+2</td>
                      <td className="border border-gray-300 p-3">Stable — research phase likely over</td>
                      <td className="border border-gray-300 p-3 text-gray-500">Low</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-3 font-medium">Beta Inc</td>
                      <td className="border border-gray-300 p-3">55</td>
                      <td className="border border-gray-300 p-3">+40</td>
                      <td className="border border-gray-300 p-3">Accelerating — just entered active research</td>
                      <td className="border border-gray-300 p-3 font-semibold text-primary">High — call today</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                If you sort by absolute score, Acme Corp appears at the top and Beta Inc sits in the middle
                of the list. If you sort by Score Trend, Beta Inc is at the top — exactly where it should be.
                This is the single most important shift you can make in how you use intent data.
              </p>

              <p>
                Cursive updates Score Trend daily. Legacy intent platforms typically update weekly. That
                difference matters: a WaveState acceleration event has a 48-72 hour outreach window before
                the account&apos;s research activity peaks. A weekly update means you may receive the signal
                six days after the window opened, which is effectively no signal at all.
              </p>

              <h2>The Three Score Acceleration Call Triggers</h2>

              <p>
                Not all acceleration is equal. Cursive&apos;s Super Pixel tracks URL-level behavior alongside
                score velocity, which means you can distinguish between accounts that are accelerating in general
                interest and accounts that are accelerating toward a purchase decision. Three triggers matter most.
              </p>

              <h3>Trigger 1: WaveState</h3>

              <p>
                <strong>Definition:</strong> A company&apos;s score trend crosses +30 in the past 7 days.
              </p>

              <p>
                WaveState is the entry signal. It means an account has shifted from passive category awareness
                to active research. They are reading more, visiting more pages, and consuming more content in
                your space than they were a week ago. Something has changed internally at that company — a budget
                opened, a pain point became acute, a champion started building a business case.
              </p>

              <p>
                The outreach window for WaveState accounts is 48 to 72 hours. After that window, the account
                either continues to accelerate into deeper evaluation (where ABM Workshop or Diagnosis triggers
                will catch them) or their score plateaus as they complete initial research. Reaching out in the
                first 48 to 72 hours means you are the first vendor in the conversation — a meaningful advantage
                in categories where the first vendor to establish credibility often sets the evaluation criteria.
              </p>

              <div className="not-prose bg-gray-50 rounded-xl p-6 my-6 border border-gray-200">
                <p className="font-semibold text-sm text-gray-700 mb-2">WaveState Action Protocol</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Same-day outreach: reach out within 24 hours of trigger</li>
                  <li>Lead with category relevance, not product pitch</li>
                  <li>Goal of first touchpoint: confirm the pain, not close the deal</li>
                  <li>If no response in 48 hours: one follow-up, then move to nurture sequence</li>
                </ul>
              </div>

              <h3>Trigger 2: ABM Workshop</h3>

              <p>
                <strong>Definition:</strong> An identified visitor from a target account has returned for their
                third visit within a 7-day window.
              </p>

              <p>
                ABM Workshop fires when a named individual from a company on your target account list comes back
                repeatedly. A single visit could be curiosity or a misclick. Two visits suggests interest. Three
                visits in seven days means they are doing structured research — likely building a vendor shortlist
                or writing an internal brief.
              </p>

              <p>
                Cursive&apos;s Super Pixel identifies the individual, not just the company. That means you know
                who is doing the research at the account — their name, job title, and email — not just that
                the company is showing interest. The difference in outreach precision is significant. Instead of
                sending a message to a generic sales@ or info@ contact, you can reach the actual person who has
                been evaluating your site.
              </p>

              <h3>Trigger 3: Diagnosis</h3>

              <p>
                <strong>Definition:</strong> Score accelerates AND URL-level signals include comparison or pricing pages.
              </p>

              <p>
                Diagnosis is the highest-urgency trigger. It fires when velocity meets page-level intent: the
                account is accelerating in score AND they are visiting the specific pages that indicate late-stage
                evaluation — vendor comparison pages, pricing pages, ROI calculators, or case study archives.
              </p>

              <p>
                An account in WaveState is researching. An account in Diagnosis is deciding. The appropriate
                outreach is fundamentally different. For Diagnosis accounts, you should lead with concrete proof —
                case studies from similar companies, a specific ROI claim your pricing page supports, or a direct
                offer to compare your product against an alternative they are likely evaluating.
              </p>

              <div className="not-prose overflow-x-auto my-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-primary to-primary-dark text-white">
                      <th className="border border-gray-300 p-3 text-left font-bold">Trigger</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Score Trend Signal</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">URL Signal</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Outreach Window</th>
                      <th className="border border-gray-300 p-3 text-left font-bold">Lead Approach</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">WaveState</td>
                      <td className="border border-gray-300 p-3">+30 in 7 days</td>
                      <td className="border border-gray-300 p-3">General content</td>
                      <td className="border border-gray-300 p-3">48-72 hours</td>
                      <td className="border border-gray-300 p-3">Confirm pain, establish relevance</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-3 font-medium">ABM Workshop</td>
                      <td className="border border-gray-300 p-3">3+ visits in 7 days</td>
                      <td className="border border-gray-300 p-3">Named individual identified</td>
                      <td className="border border-gray-300 p-3">Immediate</td>
                      <td className="border border-gray-300 p-3">Personalized to the individual</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">Diagnosis</td>
                      <td className="border border-gray-300 p-3">+30 in 7 days</td>
                      <td className="border border-gray-300 p-3">Pricing / comparison pages</td>
                      <td className="border border-gray-300 p-3">Same day</td>
                      <td className="border border-gray-300 p-3">Proof, ROI, competitive positioning</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2>The 15-Minute Morning Routine</h2>

              <p>
                The mechanics of this system are simple. What makes it work is consistency — doing it every
                morning before your first call so your outreach always reflects the freshest signal available.
              </p>

              <div className="not-prose bg-primary/5 rounded-xl p-6 my-8 border border-primary/15">
                <h3 className="font-bold text-lg mb-4">Morning Intent Routine (15 minutes)</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-16 text-sm font-bold text-primary">7:30 AM</div>
                    <div className="text-sm text-gray-700">
                      <strong>Open Cursive report.</strong> Sort by Score Trend descending. Do not look at absolute score column yet.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-16 text-sm font-bold text-primary">7:35 AM</div>
                    <div className="text-sm text-gray-700">
                      <strong>Top 10 accounts:</strong> These are your acceleration accounts. Check each for WaveState, ABM Workshop, or Diagnosis trigger. Tag trigger type. These get same-day outreach — today, not tomorrow.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-16 text-sm font-bold text-primary">7:40 AM</div>
                    <div className="text-sm text-gray-700">
                      <strong>Positions 11-30:</strong> Warm accounts. Schedule outreach for this week. Note the specific content areas they&apos;ve been researching for personalization.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-16 text-sm font-bold text-primary">7:43 AM</div>
                    <div className="text-sm text-gray-700">
                      <strong>Below position 30:</strong> Add to nurture sequence. No direct sales outreach. Interrupting these accounts before they reach acceleration typically suppresses future conversion.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-16 text-sm font-bold text-primary">7:45 AM</div>
                    <div className="text-sm text-gray-700">
                      <strong>First call of the day.</strong> Top Score Trend account with Diagnosis trigger goes first — they are actively deciding right now.
                    </div>
                  </div>
                </div>
              </div>

              <h2>The Call Script for Acceleration Accounts</h2>

              <p>
                The goal of the first touchpoint with an acceleration account is not to close. It is to confirm
                the pain that caused the score to rise, establish that you solve it better than the alternatives,
                and earn the right to a discovery call. The script below works for WaveState and ABM Workshop
                accounts. Adjust the final positioning paragraph for Diagnosis accounts to add competitive evidence.
              </p>

              <div className="not-prose bg-gray-50 rounded-xl p-6 my-6 border border-gray-200">
                <p className="font-semibold text-sm text-gray-700 mb-3">Acceleration Outreach Template</p>
                <div className="text-sm text-gray-600 space-y-3">
                  <p>
                    <strong>Subject:</strong> [Company Name] + [Your Company] — timing question
                  </p>
                  <p>
                    Hi [First Name],
                  </p>
                  <p>
                    I noticed you&apos;ve been looking at [relevant content area — visitor identification, intent
                    data, anonymous traffic conversion] recently. We&apos;ve helped similar companies in
                    [their industry] [specific outcome: identify 70% of anonymous visitors, 3x demo conversion
                    from intent lists].
                  </p>
                  <p>
                    Given the timing, worth a 15-minute call to see if there&apos;s a fit?
                  </p>
                  <p>
                    [Your Name]
                  </p>
                </div>
              </div>

              <p>
                Three principles make this script effective. First, it references the specific research area
                rather than being generic — the recipient can tell this is not a mass blast. Second, it offers
                a relevant outcome rather than a product description. Third, it respects their time by asking
                for 15 minutes, not a 30-minute demo.
              </p>

              <p>
                What you do not do: reveal that you know they visited your site. The signal informs the timing
                and topic of your outreach. It is not something you should reference directly unless you have an
                explicit permission framework in place. The value of URL-level scoring is that it allows you to
                personalize the message to the pain point, not to explain how you tracked them.
              </p>

              <h2>Case Study: B2B SaaS ABM Team — 3x Demo Bookings</h2>

              <p>
                A B2B SaaS company running an account-based marketing program restructured their morning outreach
                routine around Score Trend after realizing their existing intent data process was producing
                inconsistent results. Previously, the team sorted by absolute score and used the top 50 accounts
                as their weekly call list, regardless of whether those scores had moved.
              </p>

              <p>
                After switching to Score Trend as the primary sort and implementing the three-trigger framework,
                the team&apos;s results shifted significantly. In the first month, they booked three times as
                many demos from intent-qualified accounts as they had in the prior month using the same contact
                volume. The improvement came almost entirely from timing: they were reaching accounts at the
                beginning of their research phase rather than mid-cycle or after the decision had been made.
              </p>

              <div className="not-prose bg-primary/5 rounded-xl p-6 my-8 border border-primary/15">
                <h3 className="font-bold text-base mb-4">Before vs. After: Score Trend Prioritization</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-2">Before (Absolute Score Sort)</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>50 accounts worked per week</li>
                      <li>8 meaningful conversations</li>
                      <li>4 demos booked</li>
                      <li>No timing intelligence</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary mb-2">After (Score Trend Sort)</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>30 accounts worked per week</li>
                      <li>18 meaningful conversations</li>
                      <li>12 demos booked</li>
                      <li>Trigger-based outreach timing</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p>
                The team also reported a qualitative improvement: conversations with acceleration accounts felt
                different. The accounts were already thinking about the problem, already researching the category,
                already building the case internally. The outreach met them in the middle of a thought they were
                already having rather than interrupting them with a problem they had not considered.
              </p>

              <h2>How URL-Level Scoring Amplifies Acceleration Signals</h2>

              <p>
                Score acceleration alone tells you an account is moving. URL-level scoring tells you where they
                are going. The combination eliminates the two most common problems in intent-based outreach:
                false positives and misaligned messaging.
              </p>

              <p>
                A false positive occurs when score acceleration is driven by low-intent behavior — a single
                employee doing a competitor comparison for a presentation, an intern researching the category for
                a brief, or a journalist writing about the space. URL-level scoring surfaces these false positives
                by showing that the page visits driving the score are top-of-funnel content, not evaluation-stage
                pages. You can deprioritize those accounts and focus acceleration outreach on accounts where
                score rise and page-level intent align.
              </p>

              <p>
                Misaligned messaging occurs when you know an account is interested but not what they care about.
                URL-level scoring resolves this by showing which specific content areas drove the acceleration.
                An account that accelerated primarily through visits to your integration documentation is
                interested in technical fit. An account that accelerated through pricing page visits is in
                final evaluation. These two accounts need completely different outreach messages despite having
                identical Score Trend numbers.
              </p>

              <p>
                Cursive&apos;s Super Pixel captures URL-level behavior alongside person-level identity. The
                result is not just a list of accelerating companies but a list of accelerating companies with
                a clear picture of what each one is thinking about — which makes every outreach conversation
                materially better.
              </p>

              <h2>The Automotive Use Case: Reclassifying Buyers with URL-Stage Scoring</h2>

              <p>
                The value of URL-stage scoring extends beyond B2B SaaS. A regional automotive dealership group
                using Cursive found that 22% of their site audience could be reclassified as active buyers —
                not because they expressed general interest in automotive content, but because their URL-level
                behavior showed visits to vehicle comparison pages, financing calculators, and trade-in value
                tools. These are the specific pages that indicate near-term purchase intent, not general browsing.
              </p>

              <p>
                Prior to URL-stage scoring, the dealership&apos;s intent data told them which visitors were
                &quot;interested in automotive.&quot; So was every other visitor to any automotive site. The
                URL-stage layer separated the browsers from the buyers and surfaced the 22% who were within
                a purchase window — the precise cohort that WaveState triggers should surface to the sales floor
                for immediate follow-up.
              </p>

              <p>
                The same logic applies in any category with distinct page types that correspond to distinct
                purchase stages. Whether it is a SaaS pricing calculator, a legal intake form, a product
                configuration tool, or a vendor comparison grid — Cursive&apos;s R4 signal model classifies
                each URL type and incorporates that classification into score acceleration signals so that
                &quot;accelerating&quot; means something specific and actionable, not just &quot;visited more
                pages than last week.&quot;
              </p>

              <h2>The Numbers Behind the Signal</h2>

              <p>
                Cursive processes 60 billion or more intent signals weekly across the Super Pixel network.
                Score Trend is updated daily across all tracked accounts so that your morning call list reflects
                what happened yesterday, not what happened six days ago. Visitor identification accuracy is
                approximately 70% of anonymous traffic — meaning that for most B2B sites, the majority of
                the nameless visitors driving your score acceleration signals can be identified by name and
                email for direct outreach.
              </p>

              <div className="not-prose grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
                <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/15">
                  <div className="text-2xl font-bold text-primary">70%</div>
                  <div className="text-sm text-gray-600 mt-1">Anonymous visitor identification rate</div>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/15">
                  <div className="text-2xl font-bold text-primary">60B+</div>
                  <div className="text-sm text-gray-600 mt-1">Intent signals processed weekly</div>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/15">
                  <div className="text-2xl font-bold text-primary">Daily</div>
                  <div className="text-sm text-gray-600 mt-1">Score Trend update frequency</div>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/15">
                  <div className="text-2xl font-bold text-primary">3-5x</div>
                  <div className="text-sm text-gray-600 mt-1">Conversion rate vs. cold outbound</div>
                </div>
              </div>

              <p>
                The top 10 score-trend accounts on any given morning convert at three to five times the rate
                of cold outbound contacts. That performance gap comes from timing — catching accounts at the
                start of their research phase — and from the personalization that URL-level data enables. It
                is not magic. It is the natural result of reaching the right company at the right moment with
                a message about the right pain point.
              </p>

              <h2>Getting Started</h2>

              <p>
                If you are already using intent data but sorting by absolute score, the change is simple:
                re-sort your report by Score Trend descending and run the 15-minute morning routine for two
                weeks. Track demo bookings from that cohort separately from your other outreach. The
                difference will be visible in the first week.
              </p>

              <p>
                If you are not yet using intent data or visitor identification, Cursive&apos;s Super Pixel
                installs in under 10 minutes and begins building your Score Trend data immediately. Plans
                start at $97 per month for the visitor identification layer and $197 per month for weekly
                custom audience lists built from in-market signals. The{" "}
                <Link href="/visitor-estimate" className="text-primary hover:underline">
                  free traffic estimate
                </Link>{" "}
                shows how many named leads your site is currently losing before you commit to anything.
              </p>

              <p>
                The accounts are already on your site. Score Trend shows you which ones are accelerating.
                The only question is whether you reach them during their research window or after they&apos;ve
                already signed with someone else.
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
                Get a free estimate of how many named leads your site is losing — and which ones are
                accelerating in Score Trend right now.
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
          <MachineSection title="Score Acceleration: How to Use Daily Intent Score Trends to Build Your Sales Call List">
            Most sales teams sort their intent report by absolute score and call the top accounts. This is the wrong approach. Absolute score reflects cumulative interest over time — an account at 85 may have been there for months, with their evaluation phase already complete. Score Trend measures how fast a score is rising over the past 7 days. An account moving from 30 to 70 in one week has just entered active research and is far more responsive to outreach. Cursive updates Score Trend daily. The top 10 Score Trend accounts on any morning convert at 3 to 5 times the rate of cold outbound. Three triggers define when to act: WaveState fires when score trend crosses +30 in 7 days — reach out in 48-72 hours; ABM Workshop fires when an identified visitor from a target account returns for a third visit in 7 days — reach out immediately; Diagnosis fires when acceleration coincides with comparison or pricing page visits — highest urgency, same-day outreach with competitive positioning. The morning routine: open Cursive, sort by Score Trend descending, top 10 get same-day outreach, positions 11-30 get warm outreach this week, below 30 goes to nurture only. URL-level scoring amplifies acceleration signals by distinguishing false positives (blog visits) from true evaluation signals (pricing, comparison, ROI calculator visits). A B2B SaaS ABM team switching to Score Trend prioritization booked 3x more demos from intent-qualified accounts in their first month. Cursive processes 60B+ intent signals weekly, identifies 70% of anonymous visitors, and updates Score Trend daily. Plans start at $97/month.
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
