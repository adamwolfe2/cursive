import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft, ArrowRight } from "lucide-react"
import { Metadata } from "next"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import Link from "next/link"

export const metadata: Metadata = {
  title: "AI SDR vs Human BDR: When to Use Each for B2B Sales | Cursive",
  description: "Compare AI SDRs and human BDRs for outbound sales. Learn when to use automation vs human touch, cost analysis, and hybrid strategies for maximum ROI.",
  keywords: "AI SDR, human BDR, sales automation, AI sales agents, outbound sales, SDR vs BDR, sales technology",

  openGraph: {
    title: "AI SDR vs Human BDR: When to Use Each for B2B Sales | Cursive",
    description: "Compare AI SDRs and human BDRs for outbound sales. Learn when to use automation vs human touch, cost analysis, and hybrid strategies for maximum ROI.",
    type: "article",
    url: "https://meetcursive.com/blog/ai-sdr-vs-human-bdr",
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
    title: "AI SDR vs Human BDR: When to Use Each for B2B Sales | Cursive",
    description: "Compare AI SDRs and human BDRs for outbound sales. Learn when to use automation vs human touch, cost analysis, and hybrid strategies for maximum ROI.",
    images: ["https://meetcursive.com/og-image.png"],
    creator: "@meetcursive",
  },

  alternates: {
    canonical: "https://meetcursive.com/blog/ai-sdr-vs-human-bdr",
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateBlogPostSchema({ title: "AI SDR vs Human BDR: When to Use Each for B2B Sales", description: "Compare AI SDRs and human BDRs for outbound sales. Learn when to use automation vs human touch, cost analysis, and hybrid strategies for maximum ROI.", author: "Cursive Team", publishDate: "2026-02-01", image: "https://meetcursive.com/cursive-logo.png" })} />

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
                <span>8 min read</span>
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
              So we designed a controlled experiment. Same ICP. Same messaging. Same time period. The only variable: human vs. AI.
            </p>

            <h3>Team Human (3 BDRs)</h3>
            <ul>
              <li>3 experienced BDRs ($60k salary each)</li>
              <li>Standard 8-hour workday (M-F)</li>
              <li>Manual prospecting and email writing</li>
              <li>Using Salesforce + Apollo + Gmail</li>
              <li>Target: VP of Sales at $1M-$10M SaaS companies</li>
            </ul>

            <h3>Team AI (Cursive Pipeline)</h3>
            <ul>
              <li>AI SDR agents (no salary, $10k/month subscription)</li>
              <li>24/7 operation (no breaks, no weekends)</li>
              <li>Automated prospecting, research, and personalization</li>
              <li>Built-in CRM, data enrichment, and email infrastructure</li>
              <li>Same target: VP of Sales at $1M-$10M SaaS companies</li>
            </ul>

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
              never gets tired, and can manage multiple sequences simultaneously.
            </p>

            <h3>2. Quality: Surprisingly, AI</h3>
            <p>
              We expected human BDRs to have higher quality personalization. We were wrong.
              The AI's reply rate was <strong>14% vs. 9% for humans</strong>.
            </p>
            <p>
              Why? The AI analyzes thousands of data points per prospect (LinkedIn activity, company news,
              tech stack, funding) and crafts hyper-personalized messages. Humans can't process that much data.
            </p>

            <h3>3. Cost Efficiency: AI (By a Lot)</h3>
            <p>
              Cost per meeting: <strong>$83 (AI) vs. $1,875 (Human)</strong>
            </p>
            <p>
              That's a <strong>22x difference</strong>. Even factoring in the human team's potential to improve
              over time, the economics strongly favor AI.
            </p>

            <h3>4. Speed to Value: AI</h3>
            <p>
              The AI SDR was fully operational in 2 weeks. Hiring and ramping 3 BDRs took 8 weeks.
            </p>

            <h2>What Humans Still Do Better</h2>

            <p>To be fair, there are areas where humans still excel:</p>

            <ul>
              <li><strong>Complex conversations:</strong> Handling objections and navigating multi-threaded deals</li>
              <li><strong>Relationship building:</strong> Long-term nurturing and trust-building</li>
              <li><strong>Creativity:</strong> Coming up with novel approaches for difficult accounts</li>
              <li><strong>Emotional intelligence:</strong> Reading subtle cues and adapting tone</li>
            </ul>

            <h2>The Hybrid Model</h2>

            <p>
              After this experiment, we're not recommending companies fire all their BDRs. Instead, we're
              seeing the best results from a <strong>hybrid model</strong>:
            </p>

            <ul>
              <li><strong>AI handles:</strong> High-volume prospecting, initial outreach, follow-ups, meeting booking</li>
              <li><strong>Humans handle:</strong> Discovery calls, deal progression, complex accounts, relationship management</li>
            </ul>

            <p>
              This lets BDRs focus on what they do best (talking to people) while the AI handles the
              repetitive, data-heavy work.
            </p>

            <h2>The Bottom Line</h2>

            <p>
              For pure prospecting efficiency, AI wins decisively. It's faster, cheaper, and (surprisingly)
              more effective at initial outreach.
            </p>

            <p>
              But the future isn't "AI vs. Human"—it's <strong>"AI + Human"</strong>. Companies that figure
              out how to combine both will dominate their markets.
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
    </main>
  )
}
