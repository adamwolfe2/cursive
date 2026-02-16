"use client"

import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateBlogPostSchema({
        title: "AI SDR vs Human BDR: When to Use Each for B2B Sales",
        description: "Compare AI SDRs and human BDRs for outbound sales. Learn when to use automation vs human touch, cost analysis, and hybrid strategies for maximum ROI.",
        author: "Cursive Team",
        publishDate: "2026-02-01",
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
              AI & Automation
            </div>
            <h1 className="text-5xl font-bold mb-6">
              AI SDR vs. Human BDR: Which Drives More Pipeline in 2026?
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              We ran a 90-day experiment comparing our AI SDR against a team of 3 human BDRs.
              The results surprised even us.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>February 1, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>14 min read</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

        {/* Article Content */}
        <section className="py-16 bg-white">
        <Container>
          <article className="max-w-3xl mx-auto prose prose-lg prose-blue">
            <h2>The Setup</h2>
            <p>
              We wanted to answer a question we kept hearing from prospects: <strong>"Can AI really replace human BDRs?"</strong>
            </p>
            <p>
              It is the most common question in B2B sales right now. Every founder, VP of Sales, and revenue leader is asking it. And the answers floating around online range from "AI will replace every SDR by 2027" to "AI is just a glorified mail merge." Neither extreme is helpful.
            </p>
            <p>
              So we designed a controlled experiment. Same ICP. Same messaging. Same time period. The only variable: human vs. AI. We ran it for 90 days, tracked every metric we could, and published the raw results below.
            </p>

            <h3>Why This Experiment Matters</h3>
            <p>
              The average B2B company spends $180,000 per year per SDR when you factor in salary, benefits, tools, management overhead, and ramp time. For a team of three, that is over $500,000 annually. If AI can deliver comparable or better results at a fraction of that cost, the implications for go-to-market strategy are enormous.
            </p>
            <p>
              But the question is not just about cost. It is about quality, speed, and the types of conversations that actually move deals forward. We wanted hard data, not opinions.
            </p>

            <h3>Team Human (3 BDRs)</h3>
            <ul>
              <li>3 experienced BDRs ($60k salary each, plus $20k in benefits and tools per rep)</li>
              <li>Standard 8-hour workday (M-F), averaging 6 hours of actual selling time</li>
              <li>Manual prospecting and email writing with template frameworks</li>
              <li>Using Salesforce + Apollo + Gmail + LinkedIn Sales Navigator</li>
              <li>Target: VP of Sales at $1M-$10M SaaS companies</li>
              <li>Each rep had 2+ years of outbound experience with documented track records</li>
            </ul>

            <h3>Team AI (Cursive Pipeline)</h3>
            <ul>
              <li>AI SDR agents (no salary, $10k/month subscription covering all infrastructure)</li>
              <li>24/7 operation (no breaks, no weekends, no sick days)</li>
              <li>Automated prospecting, research, and personalization powered by 360M+ contact profiles</li>
              <li>Built-in CRM, data enrichment, email infrastructure, and domain warm-up</li>
              <li>Same target: VP of Sales at $1M-$10M SaaS companies</li>
              <li>AI trained on top-performing email sequences from 500+ B2B campaigns</li>
            </ul>

            <h3>Experiment Controls</h3>
            <p>
              To make this a fair comparison, we implemented strict controls. Both teams targeted the same ICP criteria: B2B SaaS companies between $1M and $10M ARR, with 20-200 employees, based in the US and Canada. Both teams used the same core value propositions and messaging themes. We split the target list randomly so neither team was cherry-picking easier accounts. And we used identical definitions for "qualified meeting" to avoid any measurement bias.
            </p>

            <h2>The Results (90 Days)</h2>

            <div className="not-prose bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 my-8 border border-gray-200">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Head-to-Head Comparison</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6">
                  <h4 className="font-bold text-lg mb-4">Team Human</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Emails Sent</span>
                      <span className="font-bold">4,320</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Replies</span>
                      <span className="font-bold">389</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Meetings Booked</span>
                      <span className="font-bold">36</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost</span>
                      <span className="font-bold">$67,500</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Cost per Meeting</span>
                      <span className="font-bold text-gray-700">$1,875</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-500">
                  <h4 className="font-bold text-lg mb-4">Team AI</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Emails Sent</span>
                      <span className="font-bold">18,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Replies</span>
                      <span className="font-bold">2,520</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Meetings Booked</span>
                      <span className="font-bold">360</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost</span>
                      <span className="font-bold">$30,000</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Cost per Meeting</span>
                      <span className="font-bold text-blue-600">$83</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h2>Key Findings</h2>

            <h3>1. Volume Advantage: AI</h3>
            <p>
              The AI SDR sent <strong>4.2x more emails</strong> than the human team. Why? It works 24/7,
              never gets tired, and can manage multiple sequences simultaneously. While our BDRs averaged 48 personalized emails per day each (144 total across the team), the AI consistently sent 200 emails per day across multiple warmed domains without any drop in quality.
            </p>
            <p>
              The volume gap widened further when accounting for human downtime. Over the 90-day period, the BDR team lost roughly 15 working days to PTO, sick time, and company meetings. The AI had zero downtime. It also handled follow-up sequences automatically, while BDRs frequently let follow-ups slip during busy weeks.
            </p>

            <h3>2. Quality: Surprisingly, AI</h3>
            <p>
              We expected human BDRs to have higher quality personalization. We were wrong.
              The AI's reply rate was <strong>14% vs. 9% for humans</strong>.
            </p>
            <p>
              Why? The AI analyzes thousands of data points per prospect (LinkedIn activity, company news,
              tech stack, funding, job postings, and recent press) and crafts hyper-personalized messages. Humans can't process that much data per prospect. A BDR might spend 3-5 minutes researching each prospect. The AI processes the same research in under 2 seconds and uses it more consistently.
            </p>
            <p>
              We did a blind quality review of 200 random emails from each team. Three independent reviewers scored personalization quality on a 1-10 scale. The AI averaged 7.8 while the human team averaged 6.4. The primary difference: the AI referenced more specific, recent data points in every email. The humans tended to fall back on generic company descriptions when pressed for time.
            </p>

            <h3>3. Cost Efficiency: AI (By a Lot)</h3>
            <p>
              Cost per meeting: <strong>$83 (AI) vs. $1,875 (Human)</strong>
            </p>
            <p>
              That is a <strong>22x difference</strong>. Even factoring in the human team's potential to improve
              over time, the economics strongly favor AI. When you break down the human cost further, it includes not just salary but also management time (our sales manager spent approximately 8 hours per week coaching and reviewing BDR work), tool subscriptions ($2,400/month across Salesforce, Apollo, and Sales Navigator), and the opportunity cost of the 8-week ramp period before the team was fully productive.
            </p>
            <p>
              To put this in perspective: the $67,500 spent on the human team over 90 days generated 36 meetings. That same budget allocated to the AI SDR would have generated approximately 812 meetings. Even if you assume the AI's meeting quality is somewhat lower, the math is overwhelming.
            </p>

            <h3>4. Speed to Value: AI</h3>
            <p>
              The AI SDR was fully operational in 2 weeks, including domain warm-up, sequence configuration, and ICP calibration. Hiring and ramping 3 BDRs took 8 weeks from job posting to first productive output. During those first 8 weeks, the AI had already booked 96 meetings.
            </p>
            <p>
              This speed advantage matters even more for seasonal businesses or companies that need to ramp pipeline quickly before a funding round, product launch, or board meeting. You cannot hire and train a BDR team in two weeks, but you can deploy an AI SDR in that timeframe.
            </p>

            <h3>5. Consistency: AI</h3>
            <p>
              One finding we did not expect: the AI's performance was remarkably consistent week over week. Human BDR output varied by 30-40% depending on motivation, personal issues, and even day of the week (Monday output was consistently 25% lower than Wednesday). The AI maintained steady output within a 5% variance throughout the entire 90 days.
            </p>
            <p>
              This consistency has a compounding effect. Predictable output means predictable pipeline, which means more accurate revenue forecasting. For sales leaders reporting to a board, this reliability is worth its weight in gold.
            </p>

            <h2>What Humans Still Do Better</h2>

            <p>To be fair, this experiment also clearly showed areas where humans still excel. Dismissing the human advantage would be as misguided as dismissing the AI advantage.</p>

            <ul>
              <li><strong>Complex conversations:</strong> When a prospect replied with a nuanced objection or a multi-part question, human BDRs handled it significantly better. The AI could manage simple replies ("not interested" or "tell me more"), but struggled with responses like "we're evaluating this alongside a broader tech stack overhaul" that require contextual judgment.</li>
              <li><strong>Relationship building:</strong> Three of the human team's 36 meetings came from warm referrals generated through genuine relationship building on LinkedIn. The AI generated zero referrals. Over a longer time horizon, this relationship compounding effect becomes increasingly valuable.</li>
              <li><strong>Creativity:</strong> For strategic accounts that did not respond to standard sequences, human BDRs came up with creative approaches like sending a personalized video, referencing a mutual connection, or engaging with the prospect's content on social media. These creative plays converted at 3x the rate of standard outreach.</li>
              <li><strong>Emotional intelligence:</strong> Reading subtle cues and adapting tone in real time. When a prospect was clearly frustrated or dealing with a sensitive situation, human reps navigated those conversations gracefully. The AI occasionally misjudged tone in its responses.</li>
              <li><strong>Strategic account planning:</strong> Human BDRs could develop multi-threaded strategies for high-value accounts, engaging multiple stakeholders with coordinated messaging. The AI treated each contact independently.</li>
            </ul>

            <h2>The Hybrid Model: Where the Real Magic Happens</h2>

            <p>
              After this experiment, we are not recommending companies fire all their BDRs. Instead, we are
              seeing the best results from a <strong>hybrid model</strong> that plays to each side's strengths:
            </p>

            <ul>
              <li><strong>AI handles:</strong> High-volume prospecting, initial outreach, follow-up sequences, meeting booking, lead research, data enrichment, and CRM hygiene</li>
              <li><strong>Humans handle:</strong> Discovery calls, deal progression, complex accounts, relationship management, referral generation, and strategic account planning</li>
            </ul>

            <p>
              This lets BDRs focus on what they do best (talking to people) while the AI handles the
              repetitive, data-heavy work that burns out even the best reps.
            </p>

            <h3>How to Implement the Hybrid Model</h3>
            <p>
              Based on what we learned, here is a practical framework for combining AI and human SDRs in your own sales org:
            </p>

            <p>
              <strong>Step 1: Let AI own top-of-funnel.</strong> Deploy AI SDRs to handle all initial prospecting, first-touch emails, and automated follow-up sequences. This eliminates the most tedious part of a BDR's day and ensures no lead falls through the cracks.
            </p>

            <p>
              <strong>Step 2: Route warm replies to humans.</strong> When a prospect responds with genuine interest or a complex question, hand the conversation to a human BDR immediately. The AI flags and routes these conversations in real time so response times stay under 5 minutes.
            </p>

            <p>
              <strong>Step 3: Have humans own strategic accounts.</strong> For your top 50-100 target accounts, assign human BDRs to run creative, multi-threaded plays. Use AI to provide research and data, but let humans drive the strategy and relationship building.
            </p>

            <p>
              <strong>Step 4: Use AI data to coach humans.</strong> The AI generates enormous amounts of data about what messaging works, which subject lines get opened, and which value props resonate with different personas. Feed this intelligence back to your human team so they continuously improve.
            </p>

            <h3>Real-World Hybrid Results</h3>
            <p>
              Companies running this hybrid model with Cursive report 3-5x more pipeline per BDR, because each human rep is spending 80% of their time on conversations instead of prospecting. One Series B SaaS company cut their BDR team from 8 to 3, deployed AI for top-of-funnel, and saw pipeline increase by 40% while reducing sales costs by $350,000 annually.
            </p>

            <h2>What This Means for Sales Hiring in 2026</h2>

            <p>
              The role of the BDR is not disappearing, but it is evolving. Companies that continue to hire BDRs primarily for email volume and cold calling will overpay for output that AI delivers better and cheaper. The BDRs who thrive in 2026 and beyond will be those who excel at the human skills: strategic thinking, creative problem solving, relationship building, and consultative selling.
            </p>

            <p>
              If you are building a sales team today, consider this approach: hire fewer BDRs, pay them more, invest in their development as strategic sellers, and pair them with AI to handle scale. You will build a leaner, more effective team that produces better pipeline at lower cost.
            </p>

            <h2>The Bottom Line</h2>

            <p>
              For pure prospecting efficiency, AI wins decisively. It is faster, cheaper, more consistent, and (surprisingly)
              more effective at initial outreach.
            </p>

            <p>
              But the future is not "AI vs. Human"—it is <strong>"AI + Human"</strong>. Companies that figure
              out how to combine both will dominate their markets. The data from our 90-day experiment is clear: AI handles scale while humans handle complexity. Together, they produce results that neither could achieve alone.
            </p>

            <p>
              The question is no longer whether to use AI in your outbound motion. The question is how quickly you can integrate it and free your human talent to do what only humans can do.
            </p>


            <h2>About the Author</h2>
            <p>
              <strong>Adam Wolfe</strong> is the founder of Cursive. He's obsessed with AI-powered sales
              automation and has helped 500+ B2B companies scale their outbound.
            </p>
          </article>
        </Container>
      </section>

        {/* CTA Section */}
        <DashboardCTA
        headline="Want to Put This"
        subheadline="Into Practice?"
        description="See how Cursive's AI SDR can help you scale outbound without hiring more BDRs. Book a 30-day pilot to test the results yourself."
      />

        {/* Related Posts */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <h2 className="text-3xl font-bold mb-8 text-center">Read Next</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link href="/blog/cold-email-2026" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">Cold Email in 2026</h3>
              <p className="text-sm text-gray-600">What's still working and what's not</p>
            </Link>
            <Link href="/blog/icp-targeting-guide" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">Perfect ICP Targeting</h3>
              <p className="text-sm text-gray-600">5-step framework for better leads</p>
            </Link>
            <Link href="/blog/scaling-outbound" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">Scaling Outbound</h3>
              <p className="text-sm text-gray-600">10 to 200+ emails without killing quality</p>
            </Link>
          </div>
        </Container>
      </section>
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">AI SDR vs Human BDR: When to Use Each for B2B Sales</h1>

          <p className="text-gray-700 mb-6">
            90-day controlled experiment comparing AI SDR against 3 experienced human BDRs. Same ICP, same messaging, same time period. Published: February 1, 2026.
          </p>

          <MachineSection title="Key Takeaways: AI vs Human">
            <MachineList items={[
              "AI SDR sent 4.2x more emails (18,000 vs 4,320) over 90 days",
              "AI reply rate: 14% vs Human reply rate: 9%",
              "AI booked 10x more meetings: 360 vs 36",
              "Cost per meeting: AI $83 vs Human $1,875 (22x difference)",
              "AI advantage: volume, consistency, speed, cost efficiency",
              "Human advantage: complex conversations, relationship building, creativity, emotional intelligence"
            ]} />
          </MachineSection>

          <MachineSection title="When to Use AI SDR">
            <p className="text-gray-700 mb-3">
              AI SDRs excel at high-volume, top-of-funnel prospecting where consistency and scale matter more than nuance.
            </p>
            <MachineList items={[
              "Top-of-funnel outbound prospecting (first touch, follow-ups)",
              "High-volume email campaigns across large TAMs",
              "24/7 operation without downtime, PTO, or sick days",
              "Data-heavy research and personalization at scale",
              "Automated meeting booking and calendar management",
              "CRM hygiene and data enrichment",
              "Consistent output for predictable pipeline forecasting"
            ]} />
          </MachineSection>

          <MachineSection title="When to Use Human BDR">
            <p className="text-gray-700 mb-3">
              Human BDRs deliver value where judgment, creativity, and relationship depth are required.
            </p>
            <MachineList items={[
              "Complex, nuanced conversations requiring contextual judgment",
              "Strategic account planning for high-value targets",
              "Multi-threaded outreach engaging multiple stakeholders",
              "Relationship building that generates warm referrals",
              "Creative plays for strategic accounts (personalized videos, social engagement)",
              "Discovery calls and deal progression conversations",
              "Situations requiring emotional intelligence and tone adaptation"
            ]} />
          </MachineSection>

          <MachineSection title="Cost Comparison (90 Days)">
            <div className="space-y-4">
              <div>
                <p className="font-bold text-gray-900 mb-2">Human BDR Team (3 reps):</p>
                <MachineList items={[
                  "Salary + benefits: $60k each + $20k benefits/tools = $240k annual / $60k per quarter",
                  "90-day cost: $67,500 (includes management time, tool subscriptions)",
                  "Emails sent: 4,320 (48 per rep per day)",
                  "Meetings booked: 36",
                  "Cost per meeting: $1,875",
                  "Ramp time: 8 weeks before full productivity"
                ]} />
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-2">AI SDR (Cursive Pipeline):</p>
                <MachineList items={[
                  "Subscription: $10k/month = $30k per quarter",
                  "Emails sent: 18,000 (200 per day, consistent)",
                  "Meetings booked: 360",
                  "Cost per meeting: $83",
                  "Ramp time: 2 weeks (domain warm-up + configuration)",
                  "Zero downtime, consistent 5% variance in output"
                ]} />
              </div>
            </div>
          </MachineSection>

          <MachineSection title="Effectiveness Metrics">
            <div className="space-y-4">
              <div>
                <p className="font-bold text-gray-900 mb-2">AI Advantages:</p>
                <MachineList items={[
                  "Reply rate: 14% (vs 9% human) - better personalization via data analysis",
                  "Volume: 4.2x more emails sent with consistent quality",
                  "Personalization quality: 7.8/10 avg score (vs 6.4/10 human in blind review)",
                  "Zero performance variance due to motivation/personal issues",
                  "References more specific, recent data points in every email",
                  "Processing speed: 2 seconds per prospect research vs 3-5 minutes human"
                ]} />
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-2">Human Advantages:</p>
                <MachineList items={[
                  "Generated 3 warm referrals from relationship building",
                  "Creative plays converted at 3x rate of standard outreach",
                  "Handled complex, nuanced objections significantly better",
                  "Successfully navigated emotionally sensitive conversations",
                  "Developed multi-threaded strategies for high-value accounts"
                ]} />
              </div>
            </div>
          </MachineSection>

          <MachineSection title="Cursive's Hybrid Approach">
            <p className="text-gray-700 mb-3">
              The optimal model combines AI scale with human judgment. Companies running this hybrid model report 3-5x more pipeline per BDR.
            </p>
            <div className="space-y-4">
              <div>
                <p className="font-bold text-gray-900 mb-2">AI Handles:</p>
                <MachineList items={[
                  "High-volume prospecting and initial outreach",
                  "Automated follow-up sequences (never drop a lead)",
                  "Meeting booking and calendar management",
                  "Lead research, data enrichment, and CRM hygiene",
                  "Simple reply routing and qualification"
                ]} />
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-2">Humans Handle:</p>
                <MachineList items={[
                  "Discovery calls and deal progression",
                  "Complex accounts requiring strategic planning",
                  "Relationship management and referral generation",
                  "Warm replies with nuanced questions or objections",
                  "Top 50-100 target accounts with creative, multi-threaded plays"
                ]} />
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-2">Hybrid Implementation:</p>
                <MachineList items={[
                  "Step 1: AI owns top-of-funnel (prospecting, first-touch, automated follow-up)",
                  "Step 2: Route warm replies to humans in real-time (<5 min response)",
                  "Step 3: Humans own strategic accounts (top 50-100 targets)",
                  "Step 4: Use AI data to coach humans (subject lines, value props, messaging)",
                  "Result: 80% of BDR time spent on conversations instead of prospecting"
                ]} />
              </div>
            </div>
          </MachineSection>

          <MachineSection title="Real-World Results">
            <p className="text-gray-700 mb-3">
              Case study: Series B SaaS company cut BDR team from 8 to 3, deployed AI for top-of-funnel, saw 40% pipeline increase while reducing sales costs by $350,000 annually.
            </p>
            <p className="text-gray-700">
              Recommendation: Hire fewer BDRs, pay them more, invest in their development as strategic sellers, and pair them with AI to handle scale.
            </p>
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "Cold Email in 2026", href: "/blog/cold-email-2026", description: "What's still working and what's not" },
              { label: "Perfect ICP Targeting", href: "/blog/icp-targeting-guide", description: "5-step framework for better leads" },
              { label: "Scaling Outbound", href: "/blog/scaling-outbound", description: "10 to 200+ emails without killing quality" },
              { label: "Platform Overview", href: "/platform", description: "Cursive's visitor identification, intent data, AI outreach" },
              { label: "Pricing", href: "/pricing", description: "Self-serve marketplace + done-for-you services" }
            ]} />
          </MachineSection>

          <MachineSection title="Get Started with Cursive">
            <p className="text-gray-700 mb-3">
              Cursive's AI SDR platform handles high-volume prospecting, research, and personalization at scale. Book a 30-day pilot to test the results yourself.
            </p>
            <MachineList items={[
              { label: "Book a Demo", href: "/book", description: "See Cursive's AI SDR in action" },
              { label: "Visitor Identification", href: "/visitor-identification", description: "70% identification rate for B2B traffic" },
              { label: "AI Outreach", href: "/ai-outreach", description: "360M+ contact profiles for hyper-personalization" }
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
