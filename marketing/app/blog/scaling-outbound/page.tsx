import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react"
import { Metadata } from "next"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import Link from "next/link"

export const metadata: Metadata = {
  title: "How to Scale Outbound Sales Without Hiring More SDRs | Cursive",
  description: "Scale B2B outbound sales with automation, data, and technology. Proven strategies to 3x pipeline without increasing headcount or budget.",
  keywords: "scale outbound sales, sales automation, SDR productivity, outbound scaling, sales operations, pipeline growth",

  openGraph: {
    title: "How to Scale Outbound Sales Without Hiring More SDRs | Cursive",
    description: "Scale B2B outbound sales with automation, data, and technology. Proven strategies to 3x pipeline without increasing headcount or budget.",
    type: "article",
    url: "https://meetcursive.com/blog/scaling-outbound",
    siteName: "Cursive",
    images: [{
      url: "https://meetcursive.com/og-image.png",
      width: 1200,
      height: 630,
    }],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "How to Scale Outbound Sales Without Hiring More SDRs | Cursive",
    description: "Scale B2B outbound sales with automation, data, and technology. Proven strategies to 3x pipeline without increasing headcount or budget.",
    images: ["https://meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://meetcursive.com/blog/scaling-outbound",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateBlogPostSchema({ title: "How to Scale Outbound Sales Without Hiring More SDRs", description: "Scale B2B outbound sales with automation, data, and technology. Proven strategies to 3x pipeline without increasing headcount or budget.", author: "Cursive Team", publishDate: "2026-02-01", image: "https://meetcursive.com/cursive-logo.png" })} />

      {/* Header */}
      <section className="py-12 bg-white">
        <Container>
          <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <div className="max-w-4xl">
            <div className="inline-block px-3 py-1 bg-primary text-white rounded-full text-sm font-medium mb-4">
              Scaling
            </div>
            <h1 className="text-5xl font-bold mb-6">
              How to Scale Outbound Without Killing Quality
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Go from 10 emails/day to 200+ without sacrificing personalization or deliverability.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>January 14, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>7 min read</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Article Content */}
      <section className="py-16 bg-white">
        <Container>
          <article className="max-w-3xl mx-auto prose prose-lg prose-blue">
            <p className="lead">
              You've cracked cold email. You're getting 10-15% reply rates sending 10 emails/day. Life is good.
            </p>

            <p>
              Then your CEO asks: "Can we 10x this?"
            </p>

            <p>
              Sure. But here's what happens when most companies try to scale:
            </p>

            <ul>
              <li>They hire more BDRs who write generic emails</li>
              <li>Reply rates drop from 12% to 3%</li>
              <li>Deliverability tanks</li>
              <li>Domains get blacklisted</li>
              <li>The whole program falls apart</li>
            </ul>

            <p>
              Scaling outbound isn't just "do more of what works." It requires a different approach.
            </p>

            <p>
              Here's how to do it right.
            </p>

            <h2>The Scaling Trap</h2>

            <p>
              Most companies scale by adding volume:
            </p>

            <ul>
              <li>Hire more BDRs</li>
              <li>Buy bigger lead lists</li>
              <li>Send more emails per day</li>
            </ul>

            <p>
              This works—until it doesn't.
            </p>

            <p>
              Here's what breaks:
            </p>

            <h3>1. Quality Drops</h3>

            <p>
              BDRs can't personalize 100 emails/day. They resort to templates. Templates get ignored.
            </p>

            <h3>2. Deliverability Suffers</h3>

            <p>
              Send 500 emails/day from one domain? You're getting flagged as spam. Bounce rate above 2%?
              Say goodbye to inbox placement.
            </p>

            <h3>3. Lead Quality Degrades</h3>

            <p>
              You run out of high-fit leads. So you broaden your ICP. Now you're targeting C-tier prospects
              who will never close.
            </p>

            <h3>4. Operations Break</h3>

            <p>
              Meetings get double-booked. Follow-ups get missed. Data gets messy. CRM is a disaster.
            </p>

            <p>
              The solution isn't more people. It's better systems.
            </p>

            <h2>The Right Way to Scale</h2>

            <p>
              Scaling outbound successfully requires 4 things:
            </p>

            <div className="not-prose my-8">
              {[
                { number: 1, title: 'Infrastructure', subtitle: 'Build the foundation first' },
                { number: 2, title: 'Automation', subtitle: 'Remove manual bottlenecks' },
                { number: 3, title: 'Process', subtitle: 'Standardize what works' },
                { number: 4, title: 'Quality Control', subtitle: 'Monitor and optimize' }
              ].map((item) => (
                <div key={item.number} className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 mb-3 border border-gray-200">
                  <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                    {item.number}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{item.title}</div>
                    <div className="text-sm text-gray-600">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>

            <h2>1. Infrastructure: Build the Foundation</h2>

            <p>
              Before you scale, you need the right infrastructure.
            </p>

            <h3>Email Domains</h3>

            <p>
              You can't send 1,000 emails/day from one domain. Here's the math:
            </p>

            <ul>
              <li><strong>Max safe volume per domain:</strong> 150-200 emails/day</li>
              <li><strong>Ramp-up period:</strong> 4-6 weeks per new domain</li>
              <li><strong>Domains needed for 1,000 emails/day:</strong> 5-7</li>
            </ul>

            <div className="not-prose bg-blue-50 rounded-xl p-6 my-8 border border-blue-200">
              <div className="flex gap-3">
                <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold mb-2">Pro Tip</h4>
                  <p className="text-sm text-gray-700">
                    Use subdomains of your main domain (e.g., mail1.yourcompany.com, mail2.yourcompany.com).
                    This protects your primary domain's reputation.
                  </p>
                </div>
              </div>
            </div>

            <h3>Email Infrastructure</h3>

            <p>
              Set up properly:
            </p>

            <ul>
              <li><strong>SPF, DKIM, DMARC:</strong> All configured correctly</li>
              <li><strong>Dedicated IP addresses:</strong> For high-volume sending</li>
              <li><strong>Email warm-up service:</strong> Automate domain reputation building</li>
              <li><strong>Bounce handling:</strong> Automatically remove bad emails</li>
              <li><strong>Reply tracking:</strong> Route replies to the right person</li>
            </ul>

            <h3>Data Quality</h3>

            <p>
              Bad data will kill your deliverability. You need:
            </p>

            <ul>
              <li><strong>Email verification:</strong> 95%+ deliverability guaranteed</li>
              <li><strong>Duplicate removal:</strong> Don't email the same person twice</li>
              <li><strong>Suppression lists:</strong> Honor unsubscribes and bounces</li>
              <li><strong>Data enrichment:</strong> Job titles, company info, intent signals</li>
            </ul>

            <h2>2. Automation: Remove Manual Bottlenecks</h2>

            <p>
              Humans don't scale. Systems do.
            </p>

            <h3>What to Automate</h3>

            <ul>
              <li><strong>Lead sourcing:</strong> Auto-pull leads matching your ICP</li>
              <li><strong>Email personalization:</strong> AI-generated, context-aware</li>
              <li><strong>Sending schedules:</strong> Optimal timing per timezone</li>
              <li><strong>Follow-up sequences:</strong> Trigger-based, multi-touch</li>
              <li><strong>Meeting booking:</strong> Calendar links, auto-scheduling</li>
              <li><strong>CRM updates:</strong> Log all activity automatically</li>
            </ul>

            <h3>What NOT to Automate</h3>

            <ul>
              <li><strong>Reply handling:</strong> Humans should respond to interested prospects</li>
              <li><strong>Discovery calls:</strong> High-value conversations need people</li>
              <li><strong>Deal progression:</strong> Complex sales need human judgment</li>
            </ul>

            <p>
              The goal: Automate the repetitive work so humans can focus on conversations.
            </p>

            <h2>3. Process: Standardize What Works</h2>

            <p>
              You can't scale chaos. You need repeatable processes.
            </p>

            <h3>Campaign Structure</h3>

            <p>
              Every campaign should follow the same structure:
            </p>

            <div className="not-prose bg-gray-50 rounded-xl p-6 my-8">
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-primary">1.</span>
                  <div>
                    <strong>Define ICP:</strong> Who are we targeting?
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">2.</span>
                  <div>
                    <strong>Build list:</strong> Source 500-1,000 contacts
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">3.</span>
                  <div>
                    <strong>Create messaging:</strong> Value prop + personalization
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">4.</span>
                  <div>
                    <strong>Set up sequence:</strong> 5-touch, multi-channel
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">5.</span>
                  <div>
                    <strong>Launch:</strong> Stagger sending over 2-4 weeks
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">6.</span>
                  <div>
                    <strong>Monitor:</strong> Track metrics daily
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">7.</span>
                  <div>
                    <strong>Optimize:</strong> Adjust based on data
                  </div>
                </li>
              </ol>
            </div>

            <h3>Messaging Framework</h3>

            <p>
              Don't let every BDR write their own emails. Create a messaging framework:
            </p>

            <ul>
              <li><strong>Value props:</strong> 3-5 core value statements</li>
              <li><strong>Use cases:</strong> 10-15 specific problem statements</li>
              <li><strong>Social proof:</strong> Customer stories and metrics</li>
              <li><strong>Personalization tokens:</strong> Where to insert custom details</li>
            </ul>

            <p>
              Then let AI or humans assemble these building blocks into custom emails.
            </p>

            <h3>Response Handling</h3>

            <p>
              Create playbooks for common responses:
            </p>

            <ul>
              <li><strong>"Interested":</strong> Book meeting → Send calendar link</li>
              <li><strong>"Not now":</strong> Add to nurture sequence (6-month follow-up)</li>
              <li><strong>"Not the right person":</strong> Ask for referral</li>
              <li><strong>"Unsubscribe":</strong> Immediate suppression</li>
            </ul>

            <h2>4. Quality Control: Monitor and Optimize</h2>

            <p>
              As you scale, you need rigorous monitoring.
            </p>

            <h3>Daily Metrics Dashboard</h3>

            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Target</th>
                  <th>Action if Below</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deliverability</td>
                  <td>&gt;95%</td>
                  <td>Pause domain, audit list quality</td>
                </tr>
                <tr>
                  <td>Open Rate</td>
                  <td>40-60%</td>
                  <td>Test subject lines, check spam score</td>
                </tr>
                <tr>
                  <td>Reply Rate</td>
                  <td>8-15%</td>
                  <td>Review messaging, improve personalization</td>
                </tr>
                <tr>
                  <td>Positive Reply Rate</td>
                  <td>3-6%</td>
                  <td>Revisit ICP, sharpen value prop</td>
                </tr>
                <tr>
                  <td>Meeting Booked Rate</td>
                  <td>1-3%</td>
                  <td>Improve call-to-action, simplify booking</td>
                </tr>
              </tbody>
            </table>

            <h3>Weekly Reviews</h3>

            <p>
              Every week, review:
            </p>

            <ul>
              <li><strong>Campaign performance:</strong> Which campaigns are winning?</li>
              <li><strong>Message variations:</strong> Which copy is resonating?</li>
              <li><strong>ICP segments:</strong> Which industries/company sizes are best?</li>
              <li><strong>Rep performance:</strong> Who needs coaching?</li>
            </ul>

            <h3>Monthly Deep Dives</h3>

            <p>
              Once a month, analyze:
            </p>

            <ul>
              <li><strong>Conversion funnel:</strong> Where are leads dropping off?</li>
              <li><strong>Sales cycle:</strong> How long from first touch to close?</li>
              <li><strong>Win/loss analysis:</strong> Why did deals close (or not)?</li>
              <li><strong>ICP refinement:</strong> Should we adjust targeting?</li>
            </ul>

            <h2>The Scaling Roadmap</h2>

            <p>
              Here's how to scale from 10 to 200+ emails/day safely:
            </p>

            <div className="not-prose my-8">
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="font-bold text-lg mb-2">Month 1-2: Foundation</div>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Set up 3-5 sending domains</li>
                    <li>• Configure email infrastructure</li>
                    <li>• Build data pipeline</li>
                    <li>• Create messaging framework</li>
                    <li>• Volume: 10-30 emails/day</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="font-bold text-lg mb-2">Month 3-4: Ramp</div>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Launch first automated campaigns</li>
                    <li>• Test messaging variations</li>
                    <li>• Refine ICP based on data</li>
                    <li>• Build reply handling process</li>
                    <li>• Volume: 50-100 emails/day</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="font-bold text-lg mb-2">Month 5-6: Scale</div>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Add more domains as needed</li>
                    <li>• Launch multi-channel sequences</li>
                    <li>• Hire/train additional BDRs</li>
                    <li>• Implement quality monitoring</li>
                    <li>• Volume: 150-200+ emails/day</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2>The Role of AI</h2>

            <p>
              AI is the unlock for scaling personalization.
            </p>

            <p>
              What AI does well:
            </p>

            <ul>
              <li><strong>Research:</strong> Analyze LinkedIn, company news, tech stack</li>
              <li><strong>Personalization:</strong> Write custom intros at scale</li>
              <li><strong>Optimization:</strong> Test variations, learn what works</li>
              <li><strong>Follow-ups:</strong> Contextual follow-up based on behavior</li>
            </ul>

            <p>
              What humans still do better:
            </p>

            <ul>
              <li><strong>Strategy:</strong> Define ICP, value props, positioning</li>
              <li><strong>Conversations:</strong> Handle replies, objections, questions</li>
              <li><strong>Judgment:</strong> Prioritize accounts, escalate hot leads</li>
            </ul>

            <p>
              The best teams combine both: AI handles scale, humans handle conversations.
            </p>

            <h2>Common Scaling Mistakes</h2>

            <h3>1. Scaling Too Fast</h3>

            <p>
              Going from 50 to 500 emails/day overnight will destroy deliverability. Ramp gradually.
            </p>

            <h3>2. Ignoring Deliverability</h3>

            <p>
              If your emails aren't landing in the inbox, volume doesn't matter. Monitor bounce rates religiously.
            </p>

            <h3>3. Losing Personalization</h3>

            <p>
              "Hi [First Name]" isn't personalization. Reference specific details about their company or role.
            </p>

            <h3>4. Forgetting Quality Control</h3>

            <p>
              Set it and forget it doesn't work. Review metrics daily. Optimize weekly.
            </p>

            <h2>The Bottom Line</h2>

            <p>
              Scaling outbound is hard. But it's not impossible.
            </p>

            <p>
              The companies that succeed:
            </p>

            <ul>
              <li>Build infrastructure before scaling volume</li>
              <li>Automate repetitive work, not conversations</li>
              <li>Standardize processes and messaging</li>
              <li>Monitor quality religiously</li>
              <li>Use AI to personalize at scale</li>
            </ul>

            <p>
              Do it right, and you can 10x your outbound without sacrificing quality.
            </p>


            <h2>About the Author</h2>
            <p>
              <strong>Adam Wolfe</strong> is the founder of Cursive. He's scaled outbound programs from
              zero to 10,000+ emails/day for B2B companies.
            </p>
          </article>
        </Container>
      </section>

      {/* CTA Section */}
      <DashboardCTA
        headline="Ready to Scale"
        subheadline="Without Sacrificing Quality?"
        description="Let Cursive handle your entire outbound operation—infrastructure, automation, and execution. Go from 10 to 200+ emails/day without killing quality."
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
            <Link href="/blog/ai-sdr-vs-human-bdr" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">AI SDR vs. Human BDR</h3>
              <p className="text-sm text-gray-600">90-day head-to-head comparison</p>
            </Link>
          </div>
        </Container>
      </section>
    </main>
  )
}
