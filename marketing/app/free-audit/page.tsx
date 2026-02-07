import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Target, Mail, Calendar, TrendingUp } from "lucide-react"
import { FreeAuditForm } from "@/components/free-audit-form"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import Link from "next/link"

const benefits = [
  {
    icon: Target,
    title: "Last 100 Identified Visitors",
    description: "Complete profiles with names, job titles, and verified work emails of companies visiting your site",
  },
  {
    icon: TrendingUp,
    title: "Pages Viewed & Time Spent",
    description: "See exactly which pages they visited and how long they engaged with your content",
  },
  {
    icon: CheckCircle,
    title: "Intent Scores",
    description: "AI-powered intent scoring shows you who's ready to buy right now",
  },
  {
    icon: Mail,
    title: "Personalized Outreach Templates",
    description: "Get customized email templates based on their actual browsing behavior",
  },
  {
    icon: Calendar,
    title: "30-Minute Strategy Call",
    description: "Free consultation to walk through your results and discuss how to convert these visitors",
  },
  {
    icon: Clock,
    title: "Results in 24 Hours",
    description: "No waiting around. Get your complete visitor audit delivered within one business day",
  },
]

export default function FreeAuditPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[
          { name: "Home", href: "/" },
          { name: "Free Audit", href: "/free-audit" },
        ]} />
      </div>
      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-32 md:pb-24">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-tight">
              See Who's Visiting Your Site{" "}
              <span className="text-[#007AFF]">Right Now</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4 font-light">
              Get a Free Audit of Your Last 100 Website Visitors
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Most of your website visitors leave without converting. We'll show you exactly who they are, what they viewed, and how to reach them.
            </p>
          </div>
        </Container>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 bg-white">
        <Container>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-12">
              What You'll Get in Your Free Audit
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {benefits.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <div key={benefit.title} className="flex gap-4 p-6 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-[#007AFF]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* Form Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-light text-gray-900 mb-4">
                  Get Your Free Visitor Audit
                </h2>
                <p className="text-gray-600">
                  Enter your website URL and work email to receive your complete visitor analysis
                </p>
              </div>

              <FreeAuditForm />

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                  <span className="text-gray-300">•</span>
                  <span>Results in 24 hours</span>
                  <span className="text-gray-300">•</span>
                  <span>100% free</span>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-500 mb-4">
                Trusted by leading B2B companies to identify and convert website visitors
              </p>
              <div className="flex justify-center items-center gap-8 opacity-40">
                <div className="text-2xl font-light text-gray-400">Stripe</div>
                <div className="text-2xl font-light text-gray-400">Shopify</div>
                <div className="text-2xl font-light text-gray-400">HubSpot</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-12">
              What Happens Next?
            </h2>
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-[#007AFF] text-white rounded-full flex items-center justify-center text-xl font-medium">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    We Analyze Your Visitors
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our AI scans your website traffic and identifies companies and contacts who have visited in the last 30 days
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-[#007AFF] text-white rounded-full flex items-center justify-center text-xl font-medium">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Get Your Audit Report
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Within 24 hours, receive a detailed report with visitor profiles, intent scores, and personalized outreach templates
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-[#007AFF] text-white rounded-full flex items-center justify-center text-xl font-medium">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Strategy Call (Optional)
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Schedule a free 30-minute call to review your results and learn how to convert these visitors into customers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Detailed Audit Breakdown */}
      <section className="py-16 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4">
              What Your Audit Report Includes
            </h2>
            <p className="text-gray-600 text-center max-w-3xl mx-auto mb-12">
              Your free audit is not a generic overview. It is a detailed, actionable analysis built from your actual website traffic data. Here is everything you will receive.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-medium text-gray-900 mb-4">Visitor Identification</h3>
                <p className="text-gray-600 mb-4">
                  We identify up to 100 of your most recent website visitors by name, company, and role. Each profile includes the individual's full name, job title, company name, verified work email address, LinkedIn profile, and phone number when available. This is not just company-level identification. We resolve down to the specific person who visited your site.
                </p>
                <p className="text-gray-500 text-sm">
                  Powered by the same <Link href="/pixel" className="text-[#007AFF] hover:underline">visitor identification technology</Link> used by over 1,000 B2B companies.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-medium text-gray-900 mb-4">Company Intelligence</h3>
                <p className="text-gray-600 mb-4">
                  For every identified visitor, we include full company data: industry, employee count, annual revenue, funding stage, technology stack, and headquarters location. This firmographic data helps you instantly determine whether each visitor fits your ideal customer profile and is worth pursuing.
                </p>
                <p className="text-gray-500 text-sm">
                  Data sourced from our <Link href="/data-access" className="text-[#007AFF] hover:underline">220M+ consumer and 140M+ business profiles</Link>.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-medium text-gray-900 mb-4">Behavioral Analytics</h3>
                <p className="text-gray-600 mb-4">
                  See exactly which pages each visitor viewed, how long they spent on each page, their navigation path through your site, and whether they returned multiple times. This behavioral data reveals what content resonated, which products or features they researched, and where they dropped off. It turns anonymous traffic into a readable story of buyer intent.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-medium text-gray-900 mb-4">AI Intent Scores</h3>
                <p className="text-gray-600 mb-4">
                  Our AI analyzes each visitor's behavior against patterns from thousands of successful B2B deals to assign an intent score from 0 to 100. High-intent visitors, those who viewed pricing pages, spent extended time on product pages, or returned multiple times, are flagged as priority outreach targets. The intent score helps you focus your time on the visitors most likely to convert.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-medium text-gray-900 mb-4">Personalized Outreach Templates</h3>
                <p className="text-gray-600 mb-4">
                  We do not just tell you who visited. We give you ready-to-send outreach templates for your highest-intent visitors. Each template references the specific pages they viewed, the problems they were researching, and a relevant value proposition from your site. These are not generic cold emails. They are personalized messages built from real behavior data.
                </p>
                <p className="text-gray-500 text-sm">
                  See how our AI personalization compares to <Link href="/blog/ai-sdr-vs-human-bdr" className="text-[#007AFF] hover:underline">traditional BDR outreach</Link>.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-medium text-gray-900 mb-4">30-Minute Strategy Call</h3>
                <p className="text-gray-600 mb-4">
                  After you review your report, schedule an optional 30-minute strategy call with a Cursive growth specialist. We will walk through your top visitors together, discuss which ones to prioritize, review the outreach templates, and recommend next steps. We will also explain how Cursive can automate this entire process on an ongoing basis with our <Link href="/pricing" className="text-[#007AFF] hover:underline">managed service plans</Link>.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Metrics Section */}
      <section className="py-16 bg-white">
        <Container>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4">
              Why Companies Request the Free Audit
            </h2>
            <p className="text-gray-600 text-center max-w-3xl mx-auto mb-12">
              The data speaks for itself. Here is what our audit recipients typically discover about their website traffic.
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                <div className="text-4xl text-[#007AFF] mb-2">97%</div>
                <p className="text-gray-600 text-sm">Of website visitors leave without converting or filling out a form</p>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                <div className="text-4xl text-[#007AFF] mb-2">70%</div>
                <p className="text-gray-600 text-sm">Of anonymous visitors can be identified by our pixel technology</p>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                <div className="text-4xl text-[#007AFF] mb-2">3-5x</div>
                <p className="text-gray-600 text-sm">Higher response rates when outreach references actual browsing behavior</p>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                <div className="text-4xl text-[#007AFF] mb-2">24hr</div>
                <p className="text-gray-600 text-sm">Average turnaround time from form submission to completed audit report</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-12">
              Free Audit FAQ
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-gray-900 font-medium mb-2">Is the audit really free? What is the catch?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  The audit is 100% free with no obligation to purchase anything. There is no credit card required and no automatic enrollment in any plan. We offer the audit because it demonstrates the value of our visitor identification technology better than any sales deck could. If you like what you see, we will discuss how Cursive can automate the process. If not, you keep the report and the insights at no cost.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-gray-900 font-medium mb-2">How long does it take to receive my audit?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Most audits are delivered within 24 hours of form submission. For websites with very high traffic volumes or complex multi-domain setups, it may take up to 48 hours. You will receive an email notification as soon as your report is ready to view.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-gray-900 font-medium mb-2">Do I need to install anything on my website?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  No installation is required for the initial free audit. We use our existing data network to identify visitors based on your website URL. If you decide to continue with Cursive after the audit, we will help you install our lightweight <Link href="/pixel" className="text-[#007AFF] hover:underline">visitor identification pixel</Link> for real-time, ongoing identification.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-gray-900 font-medium mb-2">What types of websites work best with the audit?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  The audit works best for B2B websites that receive at least a few hundred visitors per month. This includes SaaS product sites, professional services firms, agencies, consulting practices, and B2B eCommerce stores. If your site gets primarily B2C consumer traffic, we can still run the audit but the results may be less actionable for sales outreach. We serve companies across <Link href="/industries/b2b-software" className="text-[#007AFF] hover:underline">B2B software</Link>, <Link href="/industries/agencies" className="text-[#007AFF] hover:underline">agencies</Link>, <Link href="/industries/financial-services" className="text-[#007AFF] hover:underline">financial services</Link>, and more.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-gray-900 font-medium mb-2">Is the strategy call mandatory?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  No, the strategy call is completely optional. You will receive the full audit report regardless of whether you schedule a call. However, most recipients find the call valuable because our growth specialists can help interpret the data, prioritize outreach targets, and suggest specific messaging strategies based on the visitor behavior patterns we see.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-gray-900 font-medium mb-2">How is this different from Google Analytics?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Google Analytics shows you aggregate traffic data, things like page views, bounce rates, and geographic regions. It does not tell you who specifically visited your site. The Cursive audit identifies the actual people behind your traffic: their names, email addresses, companies, and job titles. It turns anonymous analytics data into actionable sales leads. Read our <Link href="/blog/visitor-tracking" className="text-[#007AFF] hover:underline">complete guide to website visitor tracking</Link> for a deeper comparison.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
              Stop Letting Qualified Visitors Slip Away
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              97% of website visitors leave without converting. See who they are and win them back.
            </p>
            <Button size="lg" href="#form" className="text-lg px-10">
              Get My Free Audit Now
            </Button>
          </div>
        </Container>
      </section>
    </div>
  )
}
