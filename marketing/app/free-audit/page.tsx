import { Metadata } from "next"
import { generateMetadata } from "@/lib/seo/metadata"
import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Target, Mail, Calendar, TrendingUp } from "lucide-react"
import { FreeAuditForm } from "@/components/free-audit-form"

export const metadata: Metadata = {
  ...generateMetadata({
    title: "Free Website Visitor Audit - See Who's Visiting Your Site",
    description: "Get a free audit showing the last 100 identified visitors to your website with names, titles, emails, intent scores, and personalized outreach templates. Results in 24 hours.",
    keywords: [
      'free website visitor audit',
      'website visitor identification',
      'visitor tracking',
      'lead identification',
      'website analytics',
      'visitor intelligence',
      'B2B lead generation',
      'website visitor tracking',
    ],
    canonical: 'https://meetcursive.com/free-audit',
  }),
}

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
