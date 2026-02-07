"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Mail, MapPin, Zap, Target, TrendingUp, CheckCircle2,
  ArrowRight, Clock, DollarSign, Users, Shield, Sparkles,
  BarChart3, Package, MessageSquare, Globe
} from "lucide-react"
import { DashboardPreview } from "@/components/dashboard-preview"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { Breadcrumbs } from "@/components/Breadcrumbs"

export default function DirectMailPage() {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": "https://meetcursive.com/direct-mail#service",
        "name": "Cursive Direct Mail Automation",
        "description": "Turn website visitors into physical touchpoints. Automated direct mail campaigns starting at $1.50 per piece. Trigger postcards based on digital behavior.",
        "provider": {
          "@type": "Organization",
          "name": "Cursive"
        },
        "areaServed": "US",
        "category": "Direct Mail Marketing Automation"
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
            "name": "Direct Mail",
            "item": "https://meetcursive.com/direct-mail"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How much does direct mail cost?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Pricing starts at $1.50 per postcard (including design, printing, postage, and delivery). Letters start at $2.50. Custom packages are available for high-value accounts. No minimum orders or monthly commitments."
            }
          },
          {
            "@type": "Question",
            "name": "How quickly can mail be delivered?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Mail typically arrives within 48 hours of triggering. We handle printing, addressing, and delivery automatically. You can track delivery status in your dashboard."
            }
          },
          {
            "@type": "Question",
            "name": "Can I trigger direct mail based on website behavior?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Set up automated triggers based on page visits, email opens, cart abandonment, form submissions, or any custom event. Mail sends automatically when conditions are met."
            }
          },
          {
            "@type": "Question",
            "name": "Do I need to design my own mail pieces?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. Cursive provides professional templates you can customize with your branding, messaging, and imagery. You can also upload custom designs if you have them."
            }
          },
          {
            "@type": "Question",
            "name": "How do you match visitors to physical addresses?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We use our visitor identification system to match website visitors to verified physical addresses. We validate addresses before mailing to ensure deliverability."
            }
          },
          {
            "@type": "Question",
            "name": "Can I track direct mail performance?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Track delivery status, response rates, website visits after receiving mail, and conversions. Include QR codes, PURLs, or trackable phone numbers for detailed attribution."
            }
          },
          {
            "@type": "Question",
            "name": "Is there a minimum order quantity?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No minimums. Send one postcard or 10,000—whatever your campaign needs. Pay only for what you send."
            }
          },
          {
            "@type": "Question",
            "name": "Can I personalize each mail piece?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Absolutely. Use merge tags to personalize with names, company names, specific pages they viewed, or any custom data. Every piece can be unique."
            }
          },
          {
            "@type": "Question",
            "name": "What types of mail can I send?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Postcards (4x6 or 6x9), letters in envelopes, and custom packages. For high-value accounts, we can send dimensional mail, samples, or branded gifts."
            }
          },
          {
            "@type": "Question",
            "name": "How does direct mail integrate with digital campaigns?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Direct mail syncs with your email, ad, and SMS campaigns. Build multi-touch sequences that combine digital and physical channels for maximum impact."
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

      {/* Human View */}
      <HumanView>
        <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { name: "Home", href: "/" },
            { name: "Direct Mail", href: "/direct-mail" },
          ]} />
        </div>
        {/* Hero Section */}
        <section className="pt-24 pb-20 bg-white">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-5xl mx-auto"
            >
              <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">DIRECT MAIL AUTOMATION</span>
              <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
                Turn Website Clicks Into Mailbox Conversions
              </h1>
              <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
                Offline conversion rates are 3-5x higher than digital-only campaigns. Cursive automates direct mail so you can reach prospects where email can't—their physical mailbox.
              </p>
              <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
                Trigger personalized postcards when visitors view your pricing page. Re-engage no-shows with event invitations. Win back churned customers with targeted offers. All automated.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit">
                  Launch Your First Campaign
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" href="/pricing">
                  See Pricing
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>From $1.50 per piece</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>48-hour delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>No minimums</span>
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
                From Click to Mailbox in 48 Hours
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Automated direct mail that works while you sleep
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[
                {
                  step: "1",
                  title: "Visitor Identified",
                  description: "Our pixel identifies website visitors and matches them to verified physical addresses in real-time.",
                  icon: Target
                },
                {
                  step: "2",
                  title: "Trigger Activated",
                  description: "Set conditions like 'viewed pricing page' or 'abandoned cart.' Mail sends automatically when met.",
                  icon: Zap
                },
                {
                  step: "3",
                  title: "Mail Designed & Sent",
                  description: "Personalized postcards or letters are designed, printed, and mailed within hours. Address verification included.",
                  icon: Mail
                },
                {
                  step: "4",
                  title: "Track & Convert",
                  description: "Monitor delivery, track responses via QR codes or PURLs, and measure conversions in your dashboard.",
                  icon: BarChart3
                }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-[#F7F9FB] border border-gray-200 flex items-center justify-center mb-6">
                      <step.icon className="h-10 w-10 text-gray-700" />
                    </div>
                    <h3 className="text-xl text-gray-900 mb-3 font-medium">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
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
                Stand Out in a Crowded Inbox
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Physical mail gets opened. Digital ads get ignored. Break through the noise.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: TrendingUp,
                  title: "3-5x Higher Response Rates",
                  description: "Direct mail converts 3-5x better than digital-only campaigns. Stand out in physical mailboxes where competition is lower."
                },
                {
                  icon: DollarSign,
                  title: "Affordable at Scale",
                  description: "Starting at $1.50 per postcard with no minimums. Only pay for what you send. No hidden fees or monthly commitments."
                },
                {
                  icon: Zap,
                  title: "Fully Automated Triggers",
                  description: "Set it and forget it. Trigger mail based on website behavior, email opens, abandoned carts, or custom events."
                },
                {
                  icon: MapPin,
                  title: "Verified Address Matching",
                  description: "We match website visitors to verified physical addresses and validate deliverability before sending."
                },
                {
                  icon: Users,
                  title: "Personalized at Scale",
                  description: "Use merge tags to personalize every piece with names, company details, pages viewed, or custom data."
                },
                {
                  icon: Clock,
                  title: "48-Hour Delivery",
                  description: "Mail is printed, addressed, and delivered within 48 hours. Fast enough to catch hot leads while they're interested."
                },
                {
                  icon: BarChart3,
                  title: "Track Every Response",
                  description: "Monitor delivery status, scan rates, website visits after receiving mail, and conversions. Full attribution included."
                },
                {
                  icon: Package,
                  title: "Multi-Format Options",
                  description: "Send postcards, letters, or dimensional mail packages. Templates provided or upload custom designs."
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
                Real Direct Mail Campaigns That Convert
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                How B2B companies use Cursive to stand out in the mailbox
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[
                {
                  audience: "SaaS Sales Teams",
                  scenario: "Enterprise prospects visit your pricing page but don't book demos. You have no way to follow up except generic emails that get ignored.",
                  solution: "Trigger personalized postcards to decision-makers within 24 hours of viewing high-intent pages. Include a QR code linking to a custom demo booking page. Mail arrives while they're still evaluating—before competitors reach out."
                },
                {
                  audience: "Event Marketers",
                  scenario: "Webinar registrants who don't show up never re-engage with follow-up emails. You're losing 40-50% of registered attendees.",
                  solution: "Send postcards to no-shows with a personalized message and link to the recording. Physical mail gets opened when emails don't. Recover 20-30% of no-shows with targeted mail."
                },
                {
                  audience: "E-Commerce Brands",
                  scenario: "Cart abandoners get retargeting ads but tune them out. Email open rates for abandoned cart sequences are declining.",
                  solution: "Trigger postcards with exclusive discount codes for high-value abandoned carts. Include product images and personalized messaging. Convert 5-10% of abandoned carts with offline touchpoints."
                },
                {
                  audience: "Customer Success",
                  scenario: "Churned customers stop responding to win-back emails. You need a way to re-engage them before they're lost forever.",
                  solution: "Send handwritten-style letters to churned accounts with a personal note and special offer. Physical mail feels more genuine than automated emails. Win back 15-20% of churned customers."
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
                Everything You Need for Direct Mail Success
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Professional direct mail without the complexity
              </p>
            </div>
            <div className="space-y-16 max-w-5xl mx-auto">
              {[
                {
                  title: "Automated Trigger Campaigns",
                  description: "Set up behavior-based triggers that send mail automatically when conditions are met. No manual work required.",
                  features: [
                    "Page visit triggers (pricing, features, case studies)",
                    "Email engagement triggers (opens, clicks, bounces)",
                    "Cart abandonment and checkout triggers",
                    "Event triggers (webinar no-shows, downloads)",
                    "CRM triggers (deal stage changes, lost opportunities)",
                    "Time-based delays (send 24 hours after first visit)"
                  ]
                },
                {
                  title: "Design Templates & Customization",
                  description: "Professional templates designed to convert, or upload your own custom designs. No design skills needed.",
                  features: [
                    "Pre-built templates for common use cases",
                    "Drag-and-drop editor for customization",
                    "Upload custom designs (PDF, PNG, JPG)",
                    "Personalization with merge tags",
                    "QR code and PURL generation",
                    "Brand color and logo integration"
                  ]
                },
                {
                  title: "Advanced Targeting & Filtering",
                  description: "Don't waste money sending mail to the wrong people. Filter audiences to reach only high-value prospects.",
                  features: [
                    "Filter by company size, industry, revenue",
                    "Exclude existing customers automatically",
                    "Target by job title and seniority",
                    "Geographic targeting (city, state, zip)",
                    "Intent-based filtering (active researchers only)",
                    "Custom scoring to prioritize high-value leads"
                  ]
                },
                {
                  title: "Multi-Channel Integration",
                  description: "Direct mail works best as part of a multi-touch sequence. Coordinate with email, ads, and SMS.",
                  features: [
                    "Sync with email sequences for coordinated outreach",
                    "Combine with retargeting ads for reinforcement",
                    "Trigger SMS follow-ups after mail delivery",
                    "CRM integration for sales team alerts",
                    "Unified analytics across all channels",
                    "A/B test mail vs. digital-only campaigns"
                  ]
                },
                {
                  title: "Tracking & Attribution",
                  description: "Measure every aspect of your direct mail campaigns. Prove ROI with detailed analytics.",
                  features: [
                    "Delivery confirmation and tracking",
                    "QR code scan tracking",
                    "PURL visit tracking",
                    "Conversion attribution to mail pieces",
                    "Response rate and ROI reporting",
                    "Integrate with Google Analytics and CRMs"
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

        {/* Pricing Section */}
        <section className="py-20 bg-[#F7F9FB]">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Pay only for what you send. No minimums, no commitments.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  type: "Postcard",
                  price: "$1.50",
                  description: "4x6 or 6x9 postcards with full-color printing, postage, and delivery included.",
                  features: ["Full-color printing", "Address verification", "48-hour delivery", "QR code tracking"]
                },
                {
                  type: "Letter",
                  price: "$2.50",
                  description: "Personalized letters in envelopes with custom inserts and premium feel.",
                  features: ["Envelope + letter", "Up to 2 inserts", "Handwritten-style fonts", "PURL tracking"]
                },
                {
                  type: "Package",
                  price: "Custom",
                  description: "Dimensional mail, branded gifts, or custom packages for high-value accounts.",
                  features: ["Custom packaging", "Branded items", "Premium fulfillment", "White-glove service"]
                }
              ].map((tier, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-8 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all"
                >
                  <h3 className="text-2xl text-gray-900 mb-2 font-medium">{tier.type}</h3>
                  <div className="text-4xl text-[#007AFF] mb-4 font-light">{tier.price}</div>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">{tier.description}</p>
                  <ul className="space-y-3">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Integrations */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Works With Your Marketing Stack
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Integrate with CRMs, email platforms, and marketing automation tools
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-4xl mx-auto mb-8">
              {[
                { name: "Salesforce", logo: "/integrations/salesforce.svg" },
                { name: "HubSpot", logo: "/integrations/hubspot-svgrepo-com.svg" },
                { name: "Klaviyo", logo: "/integrations/klaviyo.svg" },
                { name: "Shopify", logo: "/integrations/shopify.svg" },
                { name: "Stripe", logo: "/integrations/stripe.svg" },
                { name: "Zapier", logo: "/integrations/zapier.svg" }
              ].map((integration, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                  className="bg-white rounded-lg p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all duration-150 cursor-pointer flex items-center justify-center aspect-square"
                >
                  <img
                    src={integration.logo}
                    alt={`${integration.name} integration`}
                    className="w-12 h-12 object-contain"
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-4">And 200+ more integrations</p>
              <Button variant="outline" href="/integrations">
                View All Integrations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Container>
        </section>


        {/* FAQ */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="max-w-4xl mx-auto space-y-6">
              {[
                {
                  question: "How much does direct mail cost?",
                  answer: "Pricing starts at $1.50 per postcard (including design, printing, postage, and delivery). Letters start at $2.50. Custom packages are available for high-value accounts. No minimum orders or monthly commitments."
                },
                {
                  question: "How quickly can mail be delivered?",
                  answer: "Mail typically arrives within 48 hours of triggering. We handle printing, addressing, and delivery automatically. You can track delivery status in your dashboard."
                },
                {
                  question: "Can I trigger direct mail based on website behavior?",
                  answer: "Yes. Set up automated triggers based on page visits, email opens, cart abandonment, form submissions, or any custom event. Mail sends automatically when conditions are met."
                },
                {
                  question: "Do I need to design my own mail pieces?",
                  answer: "No. Cursive provides professional templates you can customize with your branding, messaging, and imagery. You can also upload custom designs if you have them."
                },
                {
                  question: "How do you match visitors to physical addresses?",
                  answer: "We use our visitor identification system to match website visitors to verified physical addresses. We validate addresses before mailing to ensure deliverability."
                },
                {
                  question: "Can I track direct mail performance?",
                  answer: "Yes. Track delivery status, response rates, website visits after receiving mail, and conversions. Include QR codes, PURLs, or trackable phone numbers for detailed attribution."
                },
                {
                  question: "Is there a minimum order quantity?",
                  answer: "No minimums. Send one postcard or 10,000—whatever your campaign needs. Pay only for what you send."
                },
                {
                  question: "Can I personalize each mail piece?",
                  answer: "Absolutely. Use merge tags to personalize with names, company names, specific pages they viewed, or any custom data. Every piece can be unique."
                },
                {
                  question: "What types of mail can I send?",
                  answer: "Postcards (4x6 or 6x9), letters in envelopes, and custom packages. For high-value accounts, we can send dimensional mail, samples, or branded gifts."
                },
                {
                  question: "How does direct mail integrate with digital campaigns?",
                  answer: "Direct mail syncs with your email, ad, and SMS campaigns. Build multi-touch sequences that combine digital and physical channels for maximum impact."
                }
              ].map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200"
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
                Learn More About Direct Mail Automation
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Strategies and best practices for successful direct mail campaigns
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "Guide to Direct Mail Marketing Automation for Agencies",
                  description: "How agencies use automated direct mail to drive better client results.",
                  href: "/blog/10-guide-to-direct-mail-marketing-automation-for-agencies"
                },
                {
                  title: "Retargeting Tactics to Boost Offline Conversions",
                  description: "Combine direct mail with digital retargeting for maximum impact.",
                  href: "/blog/37-retargeting-tactics-to-boost-offline-conversions"
                },
                {
                  title: "Direct Mail Audience Data for Smarter Winter Outreach",
                  description: "Use seasonal direct mail campaigns to drive Q4 results.",
                  href: "/blog/45-direct-mail-audience-data-for-smarter-winter-outreach"
                },
                {
                  title: "How Omni-Channel Orchestration Aligns Marketing Efforts",
                  description: "Coordinate direct mail with email, ads, and SMS for unified campaigns.",
                  href: "/blog/35-how-omni-channel-orchestration-aligns-marketing-efforts"
                },
                {
                  title: "Cross-Platform Retargeting Strategies to Explore",
                  description: "Reach prospects across multiple channels including direct mail.",
                  href: "/blog/17-cross-platform-retargeting-strategies-to-explore"
                },
                {
                  title: "Why Scalable Workflows Benefit Agencies",
                  description: "Build automated direct mail workflows that scale with your agency.",
                  href: "/blog/28-why-scalable-workflows-benefit-agencies"
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
                Ready to Stand Out in
              </h2>
              <p className="font-cursive text-6xl lg:text-8xl text-gray-900 mb-6">
                Physical Mailboxes?
              </p>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Turn anonymous website traffic into physical touchpoints. Starting at just $1.50 per piece with 48-hour delivery.
              </p>

              <Button
                size="lg"
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
                className="bg-[#007AFF] text-white hover:bg-[#0066DD] text-lg px-10 py-5 mb-4"
              >
                Launch Your First Campaign Now
              </Button>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mt-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No minimums</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>48-hour delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Full tracking included</span>
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
    </HumanView>

    {/* Machine View - AEO-Optimized */}
    <MachineView>
      <MachineContent>
        {/* Header */}
        <div className="mb-12 pb-6 border-b border-gray-200">
          <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE DIRECT MAIL AUTOMATION</h1>
          <p className="text-gray-700 leading-relaxed">
            Turn website visitors into physical touchpoints. Automated direct mail campaigns starting at $1.50 per piece. Trigger postcards based on digital behavior with 48-hour delivery.
          </p>
        </div>

        {/* Overview */}
        <MachineSection title="Service Overview">
          <p className="text-gray-700 mb-4">
            Direct mail conversion rates are 3-5x higher than digital-only campaigns. Cursive automates direct mail so you can reach prospects in their physical mailbox. Trigger personalized postcards when visitors view pricing pages, re-engage no-shows with event invitations, or win back churned customers with targeted offers—all automated.
          </p>
          <MachineList items={[
            "Starting at $1.50 per postcard (including printing, postage, delivery)",
            "48-hour delivery from trigger to mailbox",
            "No minimums - send one piece or 10,000",
            "Automated triggers based on website behavior",
            "Full tracking and attribution included"
          ]} />
        </MachineSection>

        {/* How It Works */}
        <MachineSection title="How It Works">
          <MachineList items={[
            "Visitor Identified - Our pixel identifies website visitors and matches them to verified physical addresses in real-time",
            "Trigger Activated - Set conditions like 'viewed pricing page' or 'abandoned cart.' Mail sends automatically when met",
            "Mail Designed & Sent - Personalized postcards or letters are designed, printed, and mailed within hours. Address verification included",
            "Track & Convert - Monitor delivery, track responses via QR codes or PURLs, and measure conversions in your dashboard"
          ]} />
        </MachineSection>

        {/* Key Benefits */}
        <MachineSection title="Key Benefits">
          <MachineList items={[
            "3-5x Higher Response Rates - Direct mail converts better than digital-only campaigns",
            "Affordable at Scale - Starting at $1.50 per postcard with no minimums or monthly commitments",
            "Fully Automated Triggers - Set it and forget it. Trigger mail based on website behavior, email opens, abandoned carts",
            "Verified Address Matching - Match website visitors to verified physical addresses with deliverability validation",
            "Personalized at Scale - Use merge tags to personalize every piece with names, company details, pages viewed",
            "48-Hour Delivery - Fast enough to catch hot leads while they're interested",
            "Track Every Response - Monitor delivery status, scan rates, website visits after receiving mail, conversions",
            "Multi-Format Options - Send postcards, letters, or dimensional mail packages"
          ]} />
        </MachineSection>

        {/* Features */}
        <MachineSection title="Features">
          <div className="space-y-6">
            <div>
              <p className="text-white mb-2">Automated Trigger Campaigns:</p>
              <MachineList items={[
                "Page visit triggers (pricing, features, case studies)",
                "Email engagement triggers (opens, clicks, bounces)",
                "Cart abandonment and checkout triggers",
                "Event triggers (webinar no-shows, downloads)",
                "CRM triggers (deal stage changes, lost opportunities)",
                "Time-based delays (send 24 hours after first visit)"
              ]} />
            </div>
            <div>
              <p className="text-white mb-2">Design & Customization:</p>
              <MachineList items={[
                "Pre-built templates for common use cases",
                "Drag-and-drop editor for customization",
                "Upload custom designs (PDF, PNG, JPG)",
                "Personalization with merge tags",
                "QR code and PURL generation",
                "Brand color and logo integration"
              ]} />
            </div>
            <div>
              <p className="text-white mb-2">Targeting & Filtering:</p>
              <MachineList items={[
                "Filter by company size, industry, revenue",
                "Exclude existing customers automatically",
                "Target by job title and seniority",
                "Geographic targeting (city, state, zip)",
                "Intent-based filtering (active researchers only)",
                "Custom scoring to prioritize high-value leads"
              ]} />
            </div>
            <div>
              <p className="text-white mb-2">Tracking & Attribution:</p>
              <MachineList items={[
                "Delivery confirmation and tracking",
                "QR code scan tracking",
                "PURL visit tracking",
                "Conversion attribution to mail pieces",
                "Response rate and ROI reporting",
                "Integrate with Google Analytics and CRMs"
              ]} />
            </div>
          </div>
        </MachineSection>

        {/* Use Cases */}
        <MachineSection title="Use Cases">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">SaaS Sales Teams:</p>
              <p className="text-gray-400">Trigger personalized postcards to decision-makers within 24 hours of viewing high-intent pages. Mail arrives while they're still evaluating—before competitors reach out.</p>
            </div>
            <div>
              <p className="text-white mb-2">Event Marketers:</p>
              <p className="text-gray-400">Send postcards to webinar no-shows with link to recording. Recover 20-30% of no-shows with targeted mail.</p>
            </div>
            <div>
              <p className="text-white mb-2">E-Commerce Brands:</p>
              <p className="text-gray-400">Trigger postcards with exclusive discount codes for high-value abandoned carts. Convert 5-10% of abandoned carts with offline touchpoints.</p>
            </div>
            <div>
              <p className="text-white mb-2">Customer Success:</p>
              <p className="text-gray-400">Send handwritten-style letters to churned accounts with personal note and special offer. Win back 15-20% of churned customers.</p>
            </div>
          </div>
        </MachineSection>

        {/* Pricing */}
        <MachineSection title="Pricing">
          <div className="space-y-4">
            <div>
              <p className="text-white mb-2">Postcard: $1.50 per piece</p>
              <p className="text-gray-400">4x6 or 6x9 postcards with full-color printing, postage, delivery, address verification, 48-hour delivery, and QR code tracking included.</p>
            </div>
            <div>
              <p className="text-white mb-2">Letter: $2.50 per piece</p>
              <p className="text-gray-400">Personalized letters in envelopes with up to 2 inserts, handwritten-style fonts, and PURL tracking included.</p>
            </div>
            <div>
              <p className="text-white mb-2">Package: Custom pricing</p>
              <p className="text-gray-400">Dimensional mail, branded gifts, or custom packages for high-value accounts with white-glove service.</p>
            </div>
          </div>
        </MachineSection>

        {/* Integrations */}
        <MachineSection title="Integrations">
          <p className="text-gray-700 mb-4">
            Works with your marketing stack including:
          </p>
          <MachineList items={[
            "CRM: Salesforce, HubSpot, Klaviyo, Pipedrive",
            "E-commerce: Shopify, Stripe",
            "Automation: Zapier and 200+ platforms"
          ]} />
        </MachineSection>

        {/* Getting Started */}
        <MachineSection title="Getting Started">
          <MachineList items={[
            {
              label: "Launch First Campaign",
              href: "https://cal.com/adamwolfe/cursive-ai-audit",
              description: "Schedule a demo to see direct mail automation in action"
            },
            {
              label: "See Pricing",
              href: "https://meetcursive.com/pricing",
              description: "View detailed pricing"
            },
            {
              label: "Website",
              href: "https://meetcursive.com"
            }
          ]} />
        </MachineSection>

      </MachineContent>
    </MachineView>
  </>
  )
}
