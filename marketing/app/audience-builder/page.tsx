"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Users, Target, Zap, Shield, Filter, Database,
  TrendingUp, CheckCircle2, ArrowRight, Sparkles,
  Globe, Lock, Layers, RefreshCw, Mail, MessageSquare
} from "lucide-react"
import { DashboardPreview } from "@/components/dashboard-preview"

export default function AudienceBuilderPage() {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://meetcursive.com/audience-builder#product",
        "name": "Cursive Audience Builder",
        "description": "Build unlimited B2B and B2C audiences with 220M+ consumer profiles and 140M+ business profiles. Filter by demographics, firmographics, and 450B+ monthly intent signals.",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "brand": {
          "@type": "Brand",
          "name": "Cursive"
        },
        "offers": {
          "@type": "Offer",
          "url": "https://meetcursive.com/audience-builder",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://meetcursive.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Audience Builder",
            "item": "https://meetcursive.com/audience-builder"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How large is your B2B and B2C database?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Cursive provides access to 220M+ consumer profiles and 140M+ business profiles across the United States. Our database is updated in real-time with fresh intent signals and verified contact information."
            }
          },
          {
            "@type": "Question",
            "name": "Are there limits on audience size?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. Unlike other data providers, Cursive has no caps on audience size, exports, or activations. Build audiences as large or as targeted as you need for your campaigns."
            }
          },
          {
            "@type": "Question",
            "name": "How fresh is your intent data?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Our intent signals are updated in real-time. We track 450B+ monthly signals across 30,000+ categories, so you're always reaching prospects at the right moment."
            }
          },
          {
            "@type": "Question",
            "name": "Can I filter audiences by intent signals?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Cursive lets you filter audiences by specific topics, keywords, and behaviors. Build segments of people actively researching solutions like yours."
            }
          },
          {
            "@type": "Question",
            "name": "How do I activate audiences once I build them?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "One-click activation to 200+ platforms including Facebook Ads, Google Ads, LinkedIn Ads, email platforms, and CRMs. Audiences sync automatically to your connected tools."
            }
          },
          {
            "@type": "Question",
            "name": "Is the data GDPR and CCPA compliant?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. All data honors opt-outs and complies with GDPR, CCPA, and regional privacy regulations. We use consent-aware activation and hashed identifiers."
            }
          },
          {
            "@type": "Question",
            "name": "Can I build lookalike audiences?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Absolutely. Upload your customer list and Cursive will find similar prospects based on firmographics, demographics, technographics, and behavioral patterns."
            }
          },
          {
            "@type": "Question",
            "name": "What types of filters are available?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Filter by company size, industry, revenue, location, job title, seniority, technologies used, intent signals, and dozens of other attributes. Combine filters for precise targeting."
            }
          },
          {
            "@type": "Question",
            "name": "Can I share audiences with partners?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Cursive includes a data clean room for secure audience sharing with partners while maintaining privacy compliance."
            }
          },
          {
            "@type": "Question",
            "name": "How quickly can I build an audience?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Most audiences are built in minutes. Apply your filters, preview the results, and activate immediately. No waiting for batch processing or manual approvals."
            }
          }
        ]
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-20 bg-white">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-5xl mx-auto"
            >
              <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">AUDIENCE BUILDER</span>
              <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
                Build Unlimited Audiences. No Caps. No Limits.
              </h1>
              <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
                Access 220M+ consumer profiles and 140M+ business profiles. Filter by firmographics, demographics, and intent signals. Activate across every channel—instantly.
              </p>
              <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
                Stop paying per contact or hitting export limits. Build audiences of any size and launch campaigns in minutes, not weeks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">
                  Build Your First Audience
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" href="/pricing">
                  View Pricing
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>220M+ consumer profiles</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>140M+ business profiles</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>No size limits</span>
                </div>
              </div>
            </motion.div>
          </Container>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                From Filter to Campaign in 3 Steps
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Building targeted audiences has never been easier
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              {[
                {
                  step: "1",
                  title: "Define Your Filters",
                  description: "Choose from firmographic, demographic, technographic, and intent-based filters. Stack criteria to build hyper-targeted segments.",
                  icon: Filter
                },
                {
                  step: "2",
                  title: "Preview & Refine",
                  description: "See audience size in real-time as you adjust filters. Export sample profiles to verify quality before activating.",
                  icon: Target
                },
                {
                  step: "3",
                  title: "Activate Everywhere",
                  description: "One-click sync to Facebook, Google, LinkedIn, email platforms, and CRMs. Audiences update automatically as new data arrives.",
                  icon: Zap
                }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-[#F7F9FB] border border-gray-200 flex items-center justify-center mb-6">
                      <step.icon className="h-10 w-10 text-gray-700" />
                    </div>
                    <h3 className="text-2xl text-gray-900 mb-3 font-medium">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Benefits Grid */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                The Most Powerful Audience Builder for B2B
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to find, segment, and activate your ideal customers
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Database,
                  title: "360M+ Verified Profiles",
                  description: "Access 220M consumer and 140M business profiles. The largest combined B2B + B2C database—all in one platform."
                },
                {
                  icon: Sparkles,
                  title: "450B+ Monthly Intent Signals",
                  description: "Know when prospects are actively researching. Filter audiences by topics, keywords, and behaviors across 30,000+ categories."
                },
                {
                  icon: Layers,
                  title: "No Size Limits or Caps",
                  description: "Build audiences of 100 or 100 million. No restrictive licensing, no per-contact fees, no hidden export limits."
                },
                {
                  icon: RefreshCw,
                  title: "Real-Time Data Updates",
                  description: "Our database refreshes continuously. Audiences stay fresh with the latest contact info, job changes, and intent signals."
                },
                {
                  icon: Shield,
                  title: "Consent-Aware Activation",
                  description: "All data honors opt-outs and complies with GDPR, CCPA, and regional privacy laws. Stay compliant automatically."
                },
                {
                  icon: Globe,
                  title: "Multi-Channel Activation",
                  description: "Activate to ads, email, direct mail, CRM, and SMS—all from one dashboard. No juggling multiple tools."
                },
                {
                  icon: TrendingUp,
                  title: "Lookalike Modeling",
                  description: "Upload your best customers and find similar prospects. Our AI identifies patterns and scales your best segments."
                },
                {
                  icon: Users,
                  title: "Account-Based Segments",
                  description: "Build lists with multiple decision-makers per account. Perfect for ABM campaigns targeting buying committees."
                }
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all"
                >
                  <benefit.icon className="h-8 w-8 text-[#007AFF] mb-4" />
                  <h3 className="text-xl text-gray-900 mb-3 font-medium">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Use Cases */}
        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Built for Every Marketing Channel
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Real use cases from B2B marketers using Cursive Audience Builder
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[
                {
                  audience: "Paid Media Teams",
                  scenario: "You're spending thousands on LinkedIn ads but targeting is limited to job titles and company size. You need richer filters to reach high-intent prospects.",
                  solution: "Build custom audiences filtered by tech stack, funding stage, intent signals, and specific topics. Upload to LinkedIn, Facebook, and Google for laser-focused campaigns that convert."
                },
                {
                  audience: "Sales Development Reps",
                  scenario: "Your SDRs waste hours manually researching prospects on LinkedIn and Clearbit. They need ready-to-call lists with verified contact info.",
                  solution: "Create segmented lists of decision-makers matching your ICP. Export with verified emails and phone numbers. Your SDRs spend time selling, not researching."
                },
                {
                  audience: "Account-Based Marketing",
                  scenario: "You're targeting 500 enterprise accounts but don't have contacts for every buying committee member. Manual research takes weeks.",
                  solution: "Upload your target account list. Cursive finds all relevant decision-makers at each company—VPs, directors, and managers across buying teams. Build multi-threaded ABM campaigns instantly."
                },
                {
                  audience: "Lifecycle Marketers",
                  scenario: "You want to re-engage churned customers with a win-back campaign, but your email list is outdated and missing new contacts.",
                  solution: "Build a lookalike audience based on churned accounts. Find similar companies showing intent signals. Run targeted win-back campaigns to former customers and new prospects."
                }
              ].map((useCase, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-8 border border-gray-200"
                >
                  <div className="text-sm text-[#007AFF] font-medium mb-2">FOR {useCase.audience.toUpperCase()}</div>
                  <h3 className="text-2xl text-gray-900 mb-4 font-medium">
                    {useCase.scenario}
                  </h3>
                  <div className="border-l-4 border-gray-200 pl-4 mt-4">
                    <p className="text-gray-600 leading-relaxed">
                      <strong className="text-gray-900">How Cursive helps:</strong> {useCase.solution}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Features Deep Dive */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Advanced Filtering & Segmentation
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Build hyper-targeted audiences with the most comprehensive filters in the industry
              </p>
            </div>
            <div className="space-y-16 max-w-5xl mx-auto">
              {[
                {
                  title: "Firmographic Filters (B2B)",
                  description: "Target businesses based on company characteristics. Perfect for enterprise sales and ABM campaigns.",
                  features: [
                    "Industry (NAICS codes, custom verticals)",
                    "Company size (employees, revenue)",
                    "Funding stage and total raised",
                    "Geographic location (country, state, city, zip)",
                    "Growth signals (hiring trends, news mentions)"
                  ]
                },
                {
                  title: "Demographic Filters (B2C)",
                  description: "Segment consumers based on personal attributes and household data.",
                  features: [
                    "Age, gender, income, education level",
                    "Homeownership status and property value",
                    "Household composition and family size",
                    "Interests and purchase behaviors",
                    "Location and mobility patterns"
                  ]
                },
                {
                  title: "Technographic Filters",
                  description: "Find companies using specific technologies—ideal for software vendors and service providers.",
                  features: [
                    "CRM, marketing automation, analytics tools",
                    "Cloud infrastructure and hosting",
                    "E-commerce platforms and payment processors",
                    "HR and productivity software",
                    "Security and compliance tools"
                  ]
                },
                {
                  title: "Intent-Based Filters",
                  description: "Reach prospects actively researching solutions like yours. The most powerful filter for conversion.",
                  features: [
                    "Topics and keywords searched",
                    "Content consumed (whitepapers, reviews, comparisons)",
                    "Recency (7-day, 14-day, 30-day windows)",
                    "30,000+ intent categories",
                    "450B+ monthly signals tracked"
                  ]
                },
                {
                  title: "Job Title & Seniority",
                  description: "Target decision-makers and influencers across departments and levels.",
                  features: [
                    "Standardized job titles and functions",
                    "Seniority levels (C-suite, VP, Director, Manager, IC)",
                    "Department (Sales, Marketing, Engineering, Finance, etc.)",
                    "Decision-making authority indicators",
                    "Recent job changes and promotions"
                  ]
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200"
                >
                  <h3 className="text-2xl text-gray-900 mb-4 font-medium">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.features.map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Integrations */}
        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                One-Click Activation to 200+ Platforms
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Sync audiences to every marketing tool in your stack
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-5xl mx-auto mb-8">
              {[
                "Facebook Ads", "Google Ads", "LinkedIn Ads", "Twitter Ads", "TikTok Ads", "Snapchat Ads",
                "Salesforce", "HubSpot", "Marketo", "Pardot", "Pipedrive", "Zoho CRM",
                "Mailchimp", "SendGrid", "ActiveCampaign", "Klaviyo", "Braze", "Customer.io",
                "Slack", "Zapier"
              ].map((integration, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-center text-center h-20"
                >
                  <span className="text-sm font-medium text-gray-700">{integration}</span>
                </motion.div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-4">And 180+ more marketing platforms</p>
              <Button variant="outline" href="/integrations">
                View All Integrations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Container>
        </section>

        {/* Social Proof */}
        <section className="py-20 bg-white">
          <Container>
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-12 border border-blue-100"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <blockquote className="text-2xl text-gray-900 mb-6 leading-relaxed">
                  "We switched from ZoomInfo to Cursive and cut our data costs by 60%. The unlimited audience builder means we can test new segments without worrying about hitting export caps. Game changer for our ABM strategy."
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                    SM
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Sarah Mitchell</div>
                    <div className="text-sm text-gray-600">Head of Demand Gen, Enterprise SaaS</div>
                  </div>
                </div>
              </motion.div>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                {[
                  { metric: "360M+", label: "Total profiles available" },
                  { metric: "30K+", label: "Intent categories tracked" },
                  { metric: "∞", label: "Audience size limits" }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-4xl text-[#007AFF] font-light mb-2">{stat.metric}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="max-w-4xl mx-auto space-y-6">
              {[
                {
                  question: "How large is your B2B and B2C database?",
                  answer: "Cursive provides access to 220M+ consumer profiles and 140M+ business profiles across the United States. Our database is updated in real-time with fresh intent signals and verified contact information."
                },
                {
                  question: "Are there limits on audience size?",
                  answer: "No. Unlike other data providers, Cursive has no caps on audience size, exports, or activations. Build audiences as large or as targeted as you need for your campaigns."
                },
                {
                  question: "How fresh is your intent data?",
                  answer: "Our intent signals are updated in real-time. We track 450B+ monthly signals across 30,000+ categories, so you're always reaching prospects at the right moment."
                },
                {
                  question: "Can I filter audiences by intent signals?",
                  answer: "Yes. Cursive lets you filter audiences by specific topics, keywords, and behaviors. Build segments of people actively researching solutions like yours."
                },
                {
                  question: "How do I activate audiences once I build them?",
                  answer: "One-click activation to 200+ platforms including Facebook Ads, Google Ads, LinkedIn Ads, email platforms, and CRMs. Audiences sync automatically to your connected tools."
                },
                {
                  question: "Is the data GDPR and CCPA compliant?",
                  answer: "Yes. All data honors opt-outs and complies with GDPR, CCPA, and regional privacy regulations. We use consent-aware activation and hashed identifiers."
                },
                {
                  question: "Can I build lookalike audiences?",
                  answer: "Absolutely. Upload your customer list and Cursive will find similar prospects based on firmographics, demographics, technographics, and behavioral patterns."
                },
                {
                  question: "What types of filters are available?",
                  answer: "Filter by company size, industry, revenue, location, job title, seniority, technologies used, intent signals, and dozens of other attributes. Combine filters for precise targeting."
                },
                {
                  question: "Can I share audiences with partners?",
                  answer: "Yes. Cursive includes a data clean room for secure audience sharing with partners while maintaining privacy compliance."
                },
                {
                  question: "How quickly can I build an audience?",
                  answer: "Most audiences are built in minutes. Apply your filters, preview the results, and activate immediately. No waiting for batch processing or manual approvals."
                }
              ].map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl p-6 border border-gray-200"
                >
                  <h3 className="text-lg text-gray-900 mb-3 font-medium">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Related Resources */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Learn More About Audience Building
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Expert guides for building and activating high-performing audience segments
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "Steps to Build an Effective Audience Building Platform",
                  description: "A complete guide to building audience segments that actually convert.",
                  href: "/blog/02-steps-to-build-an-effective-audience-building-platform-UPDATED"
                },
                {
                  title: "Guide to Building an Effective Audience Targeting Platform",
                  description: "Learn how to target the right prospects with precision and scale.",
                  href: "/blog/16-guide-to-building-an-effective-audience-targeting-platform-UPDATED"
                },
                {
                  title: "Why Audience Segmentation Platforms Are Key to Marketing",
                  description: "Discover how segmentation transforms campaign performance.",
                  href: "/blog/11-why-audience-segmentation-platforms-are-key-to-marketing-UPDATED"
                },
                {
                  title: "Creating Behavioral Audience Segments Easily",
                  description: "Segment audiences based on actions, not just demographics.",
                  href: "/blog/32-creating-behavioral-audience-segments-easily"
                },
                {
                  title: "Buyer Intent-Based Audience Segmentation Techniques",
                  description: "Target ready-to-buy prospects using intent signals.",
                  href: "/blog/38-buyer-intent-based-audience-segmentation-techniques-UPDATED"
                },
                {
                  title: "Multifactor Audience Segmentation for Campaign Success",
                  description: "Combine multiple signals for hyper-targeted audience builds.",
                  href: "/blog/34-multifactor-audience-segmentation-for-campaign-success"
                },
                {
                  title: "B2B Audience Targeting Explained for Everyday Brands",
                  description: "Make B2B targeting simple and effective for your team.",
                  href: "/blog/48-b2b-audience-targeting-explained-for-everyday-brands-UPDATED"
                },
                {
                  title: "Audience Targeting Software Anyone Can Understand",
                  description: "Demystify audience targeting tools and get started faster.",
                  href: "/blog/52-audience-targeting-software-anyone-can-understand-UPDATED"
                }
              ].map((resource, i) => (
                <motion.a
                  key={i}
                  href={resource.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="block bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all group"
                >
                  <h3 className="text-lg text-gray-900 mb-2 font-medium group-hover:text-[#007AFF] transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {resource.description}
                  </p>
                  <div className="mt-4 text-[#007AFF] text-sm font-medium flex items-center gap-2">
                    Read article <ArrowRight className="h-4 w-4" />
                  </div>
                </motion.a>
              ))}
            </div>
          </Container>
        </section>

        {/* Final CTA */}
        <section className="relative py-32 bg-white overflow-hidden">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center relative z-10 mb-16"
            >
              <h2 className="text-5xl lg:text-7xl font-light text-gray-900 mb-4 leading-tight">
                Ready to Build Unlimited
              </h2>
              <p className="font-cursive text-6xl lg:text-8xl text-gray-900 mb-6">
                Audiences?
              </p>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Access 360M+ profiles with unlimited audience building. No caps, no limits, no per-contact fees—just pure targeting power.
              </p>

              <Button
                size="lg"
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
                className="bg-[#007AFF] text-white hover:bg-[#0066DD] text-lg px-10 py-5 mb-4"
              >
                Build Your First Audience Now
              </Button>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mt-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Unlimited audiences</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>200+ integrations</span>
                </div>
              </div>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-6xl mx-auto"
            >
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <DashboardPreview />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          </Container>
        </section>
      </main>
    </>
  )
}
