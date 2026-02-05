"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Eye, Target, Zap, Shield, Filter, BarChart3,
  Users, Clock, TrendingUp, CheckCircle2,
  ArrowRight, Sparkles, Database, Lock
} from "lucide-react"
import { DashboardPreview } from "@/components/dashboard-preview"

export default function VisitorIdentificationPage() {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": "https://meetcursive.com/visitor-identification#product",
        "name": "Cursive Visitor Identification",
        "description": "Identify up to 70% of anonymous website visitors in real-time. Turn unknown traffic into qualified leads with company and individual-level data.",
        "brand": {
          "@type": "Brand",
          "name": "Cursive"
        },
        "offers": {
          "@type": "Offer",
          "url": "https://meetcursive.com/visitor-identification",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        },
        "category": "Visitor Identification Software"
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
            "name": "Visitor Identification",
            "item": "https://meetcursive.com/visitor-identification"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How accurate is visitor identification?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Cursive identifies up to 70% of B2B website traffic—significantly higher than the industry average of 20-30%. We use multiple data sources and real-time enrichment to maximize accuracy."
            }
          },
          {
            "@type": "Question",
            "name": "How quickly can you identify visitors?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Visitors are identified in real-time within seconds of landing on your site. Unlike batch processing tools, Cursive enriches data instantly so you can act on hot leads immediately."
            }
          },
          {
            "@type": "Question",
            "name": "Is visitor identification GDPR compliant?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Cursive is built with privacy compliance at its core. We honor all opt-outs, use hashed identifiers, and comply with GDPR, CCPA, and regional privacy regulations."
            }
          },
          {
            "@type": "Question",
            "name": "What data do you provide for each visitor?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "For B2B traffic, we provide company name, industry, size, location, revenue, technologies used, and contact information. For individuals, we include job title, seniority, department, and verified email addresses."
            }
          },
          {
            "@type": "Question",
            "name": "How does visitor identification integrate with my CRM?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Cursive offers native integrations with 200+ platforms including Salesforce, HubSpot, Marketo, and major ad platforms. Identified visitors sync automatically to your existing tools with one-click setup."
            }
          },
          {
            "@type": "Question",
            "name": "Can I filter out existing customers?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Cursive includes intelligent filtering to exclude existing customers, internal traffic, bots, and other non-prospects. This ensures your sales team focuses only on new opportunities."
            }
          },
          {
            "@type": "Question",
            "name": "How long does setup take?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Installation takes about 5 minutes. Simply add our JavaScript pixel to your website, and you'll start identifying visitors immediately. No complex configuration required."
            }
          },
          {
            "@type": "Question",
            "name": "What's the difference between company-level and individual-level identification?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Company-level identification reveals which businesses visited your site. Individual-level identification goes deeper to show specific people, their roles, and contact information. Cursive provides both."
            }
          },
          {
            "@type": "Question",
            "name": "Can I see which pages visitors viewed?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Absolutely. Cursive tracks page-level behavior so you can see exactly which content each visitor engaged with—pricing pages, feature pages, blog posts, and more. This helps prioritize your outreach."
            }
          },
          {
            "@type": "Question",
            "name": "How much does visitor identification cost?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Pricing varies based on your website traffic volume and activation needs. Book a demo to get a custom quote for your specific use case."
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
              <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">VISITOR IDENTIFICATION</span>
              <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
                Stop Losing 98% of Your Website Visitors
              </h1>
              <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
                Most B2B companies never know who visits their site. Cursive identifies up to 70% of your anonymous traffic and turns them into qualified leads—automatically.
              </p>
              <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
                See which companies viewed your pricing page this week. Reach out while they're still interested. Convert anonymous clicks into closed deals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">
                  See Who's Visiting Your Site
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" href="/pricing">
                  View Pricing
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>5-minute setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>70% identification rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>200+ integrations</span>
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
                How It Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From anonymous visitor to qualified lead in three simple steps
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              {[
                {
                  step: "1",
                  title: "Install the Pixel",
                  description: "Add our lightweight JavaScript tag to your website. Takes 5 minutes. Works on any platform—WordPress, Webflow, custom builds.",
                  icon: Zap
                },
                {
                  step: "2",
                  title: "Real-Time Identification",
                  description: "Our system identifies visitors the moment they land. We enrich profiles with company data, job titles, contact info, and intent signals.",
                  icon: Eye
                },
                {
                  step: "3",
                  title: "Activate Everywhere",
                  description: "Sync identified visitors to your CRM, ad platforms, and email tools. Trigger automated outreach or sales alerts instantly.",
                  icon: Target
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
                Turn Anonymous Traffic Into Revenue
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Stop guessing who's interested. Start converting while leads are hot.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: TrendingUp,
                  title: "3x More Qualified Leads",
                  description: "Identify prospects before they fill out forms. Reach out while they're actively researching—not days later when they've already chosen a competitor."
                },
                {
                  icon: Clock,
                  title: "Instant Identification",
                  description: "Real-time enrichment, not batch processing. Know who's on your site right now so sales can strike while the iron is hot."
                },
                {
                  icon: Database,
                  title: "70% Identification Rate",
                  description: "Industry-leading accuracy. Most tools identify 20-30% of traffic. Cursive reveals up to 70% of your B2B visitors."
                },
                {
                  icon: Users,
                  title: "Company + Individual Data",
                  description: "See which companies visited—and the specific people browsing. Get job titles, seniority, verified emails, and LinkedIn profiles."
                },
                {
                  icon: Filter,
                  title: "Smart Filtering",
                  description: "Automatically exclude existing customers, bots, and internal traffic. Your sales team only sees new opportunities worth pursuing."
                },
                {
                  icon: Shield,
                  title: "Privacy-Compliant",
                  description: "GDPR and CCPA compliant out of the box. We honor opt-outs, use hashed IDs, and follow regional privacy regulations."
                },
                {
                  icon: BarChart3,
                  title: "Page-Level Tracking",
                  description: "See exactly which pages each visitor viewed. Prioritize leads who checked your pricing page or high-intent product pages."
                },
                {
                  icon: Sparkles,
                  title: "Return Visitor Detection",
                  description: "Track visitors across multiple sessions. Know when hot prospects come back—that's your signal to reach out."
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
                Built for Your Workflow
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Real scenarios from real B2B companies using Cursive
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[
                {
                  audience: "B2B SaaS Sales Teams",
                  scenario: "Your sales team wastes hours researching companies manually. You have tons of traffic but no idea who they are.",
                  solution: "Cursive automatically identifies which companies visited your site and what they viewed. Your SDRs get hot leads delivered to Salesforce with context—no more blind prospecting."
                },
                {
                  audience: "Marketing Teams",
                  scenario: "You spend thousands on ads but 98% of visitors leave without converting. You can't retarget anonymous traffic effectively.",
                  solution: "See exactly which companies clicked your ads but didn't convert. Build custom audiences of identified visitors and retarget them on LinkedIn, Facebook, and Google with personalized messaging."
                },
                {
                  audience: "Customer Success",
                  scenario: "Churning customers often revisit your pricing page before canceling. You have no way to spot this early warning signal.",
                  solution: "Get alerts when at-risk accounts visit competitor comparison pages or pricing. Proactively reach out to save the account before it's too late."
                },
                {
                  audience: "Digital Agencies",
                  scenario: "Clients expect you to prove ROI on campaigns, but you can't track anonymous traffic back to outcomes.",
                  solution: "Show clients exactly which companies visited after seeing their campaigns. Prove attribution and win renewals by connecting website visits to closed deals."
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
                Technical Features for Data Teams
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Enterprise-grade visitor identification built for scale
              </p>
            </div>
            <div className="space-y-16 max-w-5xl mx-auto">
              {[
                {
                  title: "Multi-Source Data Enrichment",
                  description: "We don't rely on a single data provider. Cursive cross-references multiple sources including IP intelligence, device fingerprinting, email graphs, and third-party B2B databases to maximize identification accuracy.",
                  features: [
                    "IP address resolution with company matching",
                    "Reverse email lookup from hashed identifiers",
                    "Device fingerprinting for return visitor tracking",
                    "Integration with Clearbit, ZoomInfo, Apollo data layers"
                  ]
                },
                {
                  title: "Advanced Filtering & Segmentation",
                  description: "Not all traffic is equal. Cursive includes intelligent filters to focus your team on high-value prospects and exclude noise.",
                  features: [
                    "Exclude existing customers by CRM sync",
                    "Filter out internal teams by IP range or domain",
                    "Bot detection and removal",
                    "Custom scoring based on firmographics and behavior",
                    "Segment by company size, industry, tech stack"
                  ]
                },
                {
                  title: "Real-Time vs. Batch Processing",
                  description: "Most visitor ID tools process data in batches (daily or weekly). Cursive identifies and enriches visitors in real-time so you can act immediately.",
                  features: [
                    "Sub-second identification latency",
                    "Instant CRM sync via webhooks",
                    "Live dashboards showing current visitors",
                    "Trigger sales alerts in Slack or email instantly"
                  ]
                },
                {
                  title: "Privacy & Compliance",
                  description: "Built for a privacy-first world. Cursive handles GDPR, CCPA, and regional regulations automatically so you stay compliant without manual work.",
                  features: [
                    "Honor all industry opt-out lists",
                    "Hashed identifier storage (no plain-text PII)",
                    "Right-to-forget automation",
                    "Consent management integration",
                    "Regional data residency options"
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
                Works With Your Existing Stack
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Native integrations with 200+ CRMs, ad platforms, and marketing tools
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-5xl mx-auto mb-8">
              {[
                "Salesforce", "HubSpot", "Marketo", "Pardot", "Pipedrive", "Close",
                "Google Ads", "Facebook Ads", "LinkedIn Ads", "Twitter Ads", "TikTok Ads", "Snapchat Ads",
                "Mailchimp", "SendGrid", "ActiveCampaign", "Klaviyo", "Braze", "Iterable",
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
              <p className="text-gray-600 mb-4">And 180+ more integrations</p>
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
                  "We were losing 95% of our website traffic to anonymity. Cursive helped us identify the companies visiting our site and turned those insights into qualified pipeline. Our sales team now has context before every call."
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                    JD
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">John Davis</div>
                    <div className="text-sm text-gray-600">VP of Sales, B2B SaaS Company</div>
                  </div>
                </div>
              </motion.div>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                {[
                  { metric: "70%", label: "Average identification rate" },
                  { metric: "3x", label: "Increase in qualified leads" },
                  { metric: "48hrs", label: "Average time to first outreach" }
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
                  question: "How accurate is visitor identification?",
                  answer: "Cursive identifies up to 70% of B2B website traffic—significantly higher than the industry average of 20-30%. We use multiple data sources and real-time enrichment to maximize accuracy."
                },
                {
                  question: "How quickly can you identify visitors?",
                  answer: "Visitors are identified in real-time within seconds of landing on your site. Unlike batch processing tools, Cursive enriches data instantly so you can act on hot leads immediately."
                },
                {
                  question: "Is visitor identification GDPR compliant?",
                  answer: "Yes. Cursive is built with privacy compliance at its core. We honor all opt-outs, use hashed identifiers, and comply with GDPR, CCPA, and regional privacy regulations."
                },
                {
                  question: "What data do you provide for each visitor?",
                  answer: "For B2B traffic, we provide company name, industry, size, location, revenue, technologies used, and contact information. For individuals, we include job title, seniority, department, and verified email addresses."
                },
                {
                  question: "How does visitor identification integrate with my CRM?",
                  answer: "Cursive offers native integrations with 200+ platforms including Salesforce, HubSpot, Marketo, and major ad platforms. Identified visitors sync automatically to your existing tools with one-click setup."
                },
                {
                  question: "Can I filter out existing customers?",
                  answer: "Yes. Cursive includes intelligent filtering to exclude existing customers, internal traffic, bots, and other non-prospects. This ensures your sales team focuses only on new opportunities."
                },
                {
                  question: "How long does setup take?",
                  answer: "Installation takes about 5 minutes. Simply add our JavaScript pixel to your website, and you'll start identifying visitors immediately. No complex configuration required."
                },
                {
                  question: "What's the difference between company-level and individual-level identification?",
                  answer: "Company-level identification reveals which businesses visited your site. Individual-level identification goes deeper to show specific people, their roles, and contact information. Cursive provides both."
                },
                {
                  question: "Can I see which pages visitors viewed?",
                  answer: "Absolutely. Cursive tracks page-level behavior so you can see exactly which content each visitor engaged with—pricing pages, feature pages, blog posts, and more. This helps prioritize your outreach."
                },
                {
                  question: "How much does visitor identification cost?",
                  answer: "Pricing varies based on your website traffic volume and activation needs. Book a demo to get a custom quote for your specific use case."
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
                Learn More About Visitor Identification
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Deep-dive guides and strategies for maximizing your visitor identification results
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "How to Use Website Visitor Tracking to Generate More B2B Leads",
                  description: "Learn how visitor tracking turns anonymous traffic into qualified leads you can actually convert.",
                  href: "/blog/22-using-website-visitor-tracking-for-lead-generation-UPDATED"
                },
                {
                  title: "How to Convert Anonymous Website Visitors Into Sales-Ready Leads",
                  description: "Stop losing qualified leads to anonymity and start converting traffic into paying customers.",
                  href: "/blog/25-boosting-sales-through-anonymous-visitor-conversion-UPDATED"
                },
                {
                  title: "Understanding Data-Driven Decision Making in Marketing",
                  description: "Turn visitor data into actionable insights that drive better campaign performance.",
                  href: "/blog/18-understanding-data-driven-decision-making-in-marketing"
                },
                {
                  title: "Real-Time Analytics Strategies for Better ROI Decisions",
                  description: "Use real-time visitor data to make faster, smarter marketing decisions.",
                  href: "/blog/21-real-time-analytics-strategies-for-better-roi-decisions"
                },
                {
                  title: "Leveraging Real-Time Data for Efficient Campaigns",
                  description: "Respond to visitor behavior in real-time to maximize conversion rates.",
                  href: "/blog/26-leveraging-real-time-data-for-efficient-campaigns-UPDATED"
                },
                {
                  title: "How to Use Marketing Audience Data to Drive Real Results",
                  description: "Organize your visitor data to send the right message at the right time.",
                  href: "/blog/01-tips-for-using-marketing-audience-data-efficiently-UPDATED"
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
                Ready to See Who's
              </h2>
              <p className="font-cursive text-6xl lg:text-8xl text-gray-900 mb-6">
                Visiting Your Site?
              </p>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Book a free AI audit. We'll show you exactly which companies are researching your product right now—and how to convert them.
              </p>

              <Button
                size="lg"
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
                className="bg-[#007AFF] text-white hover:bg-[#0066DD] text-lg px-10 py-5 mb-4"
              >
                Book Your Free AI Audit Now
              </Button>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mt-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No commitment required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Setup in 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>See results in 24 hours</span>
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
