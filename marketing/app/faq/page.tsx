"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { ArrowRight, HelpCircle, Search } from "lucide-react"
import { useState } from "react"
import { DashboardCTA } from "@/components/dashboard-cta"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <>
      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-6">
              Frequently Asked
              <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                Questions
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Everything you need to know about <span className="font-cursive text-2xl text-gray-500">Cursive</span>. Can't find what you're looking for?{" "}
              <a href="/contact" className="text-[#007AFF] hover:underline">Contact us</a>.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-transparent text-lg"
              />
            </div>
          </motion.div>
        </Container>
      </section>

      {/* FAQ Content */}
      <section className="py-24 bg-white">
        <Container>
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setActiveCategory(category.value)}
                className={`px-6 py-3 rounded-lg transition-all ${
                  activeCategory === category.value
                    ? "bg-[#007AFF] text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="max-w-4xl mx-auto space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No results found for "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[#007AFF] hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full flex-shrink-0 mt-3" />
                      <span className="text-lg text-gray-900">{faq.question}</span>
                    </div>
                    <div className="text-gray-400 ml-4 text-2xl">
                      {openFaq === index ? "−" : "+"}
                    </div>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-5 pl-12">
                      <p className="text-gray-600 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </Container>
      </section>

      {/* Dashboard CTA */}
      <DashboardCTA
        headline="Still Have"
        subheadline="Questions?"
        description="We're here to help. Book a call or send us a message and we'll answer everything."
      />
    </main>
  </HumanView>

  {/* Machine View - AEO-Optimized */}
  <MachineView>
    <MachineContent>
      {/* Header */}
      <div className="mb-12 pb-6 border-b border-gray-200">
        <h1 className="text-2xl text-gray-900 font-bold mb-4">FREQUENTLY ASKED QUESTIONS</h1>
        <p className="text-gray-700 leading-relaxed">
          Common questions about Cursive lead generation platform, pricing, data quality, integrations, and support.
        </p>
      </div>

      {/* Getting Started FAQs */}
      <MachineSection title="Getting Started">
        <div className="space-y-6">
          <div>
            <p className="text-white mb-2">How do I get started with Cursive?</p>
            <p className="text-gray-400">
              Three ways: (1) Book a 15-minute strategy call to discuss your needs, (2) Purchase directly and we'll reach out within 24 hours to start onboarding, (3) Sign up for free to explore People Search before committing.
            </p>
          </div>
          <div>
            <p className="text-white mb-2">Which plan is right for me?</p>
            <p className="text-gray-400">
              Cursive Data: You have an outbound process and need better lead lists. Cursive Outbound: You want done-for-you campaigns. Cursive Pipeline: You need full-stack AI SDR automation. Not sure? Book a call for recommendations.
            </p>
          </div>
          <div>
            <p className="text-white mb-2">How fast can we get started?</p>
            <p className="text-gray-400">
              Cursive Data: Instant access, first list in 5-7 days. Cursive Outbound: 1-2 weeks for full setup. Cursive Pipeline: 2-3 weeks for onboarding and AI training.
            </p>
          </div>
        </div>
      </MachineSection>

      {/* Pricing FAQs */}
      <MachineSection title="Pricing & Billing">
        <div className="space-y-6">
          <div>
            <p className="text-white mb-2">Can I cancel anytime?</p>
            <p className="text-gray-400">
              Yes. All plans are month-to-month with no long-term contracts. Give 30 days notice to cancel. Setup fees are non-refundable, but monthly fees are prorated if you cancel mid-month.
            </p>
          </div>
          <div>
            <p className="text-white mb-2">What's included in the setup fee?</p>
            <p className="text-gray-400">
              Outbound ($2,500): Email domain setup, inbox warmup, deliverability optimization, campaign strategy, brand voice AI training. Pipeline ($5,000): Everything in Outbound plus API integration, AI SDR configuration, multi-channel setup, white-glove onboarding.
            </p>
          </div>
          <div>
            <p className="text-white mb-2">Do you offer volume discounts?</p>
            <p className="text-gray-400">
              Yes. 6-month commitment: 10% discount. Annual commitment: 20% discount. Multiple services: Custom bundled pricing. Enterprise needs: Contact us for custom quotes.
            </p>
          </div>
        </div>
      </MachineSection>

      {/* Features FAQs */}
      <MachineSection title="Features">
        <div className="space-y-6">
          <div>
            <p className="text-white mb-2">How do you ensure data quality?</p>
            <p className="text-gray-400">
              We guarantee 95%+ email deliverability through multi-source verification, real-time validation, bounce protection, and continuous enrichment. We replace any bounced emails at no charge.
            </p>
          </div>
          <div>
            <p className="text-white mb-2">Can I use my own lead lists?</p>
            <p className="text-gray-400">
              Yes. With Outbound and Pipeline tiers, you can upload existing lists or combine them with ours. We'll enrich and verify them before sending.
            </p>
          </div>
          <div>
            <p className="text-white mb-2">What integrations do you support?</p>
            <p className="text-gray-400">
              CRMs: Salesforce, HubSpot, Pipedrive, Close, Copper. Email: Gmail, Outlook, Office 365. Calendar: Google Calendar, Outlook Calendar. Communication: Slack, Microsoft Teams. API access (Pipeline tier) allows custom integrations.
            </p>
          </div>
        </div>
      </MachineSection>

      {/* Technical FAQs */}
      <MachineSection title="Technical">
        <div className="space-y-6">
          <div>
            <p className="text-white mb-2">How does website visitor tracking work?</p>
            <p className="text-gray-400">
              We install a JavaScript pixel that identifies companies visiting your site via IP address, matches them to our database, extracts decision-maker contact info, tracks pages visited, and scores intent. Pricing: $750/mo + $0.50 per identified visitor.
            </p>
          </div>
          <div>
            <p className="text-white mb-2">Is my data secure?</p>
            <p className="text-gray-400">
              Yes. SOC 2 Type II compliant, end-to-end encryption, regular security audits, GDPR and CCPA compliant, role-based access controls, SSO available for enterprise. Your data is never shared or used to train AI models.
            </p>
          </div>
          <div>
            <p className="text-white mb-2">Can I export my data?</p>
            <p className="text-gray-400">
              Yes. Lead lists via CSV export, campaign analytics via CSV or PDF reports, contact data via bulk API export, historical data available upon request. No lock-in - your data is yours.
            </p>
          </div>
        </div>
      </MachineSection>

      {/* Support FAQs */}
      <MachineSection title="Support">
        <div className="space-y-6">
          <div>
            <p className="text-white mb-2">What support do you offer?</p>
            <p className="text-gray-400">
              All tiers: Dedicated account manager, email support (24-hour response), live chat (M-F 9am-6pm EST), help center. Pipeline tier: Dedicated success manager, weekly strategy calls, priority support (4-hour response), direct Slack channel.
            </p>
          </div>
          <div>
            <p className="text-white mb-2">Do you offer refunds?</p>
            <p className="text-gray-400">
              Setup fees are non-refundable. Monthly subscriptions: Prorated refunds if you cancel mid-month. First month guarantee: If you're not satisfied in first 30 days, we'll work with you to make it right or provide prorated refund.
            </p>
          </div>
        </div>
      </MachineSection>

      {/* Getting Started */}
      <MachineSection title="Get Help">
        <MachineList items={[
          {
            label: "Book a Call",
            href: "https://cal.com/adamwolfe/cursive-ai-audit",
            description: "Schedule 15-minute call to ask questions"
          },
          {
            label: "Contact Support",
            href: "https://meetcursive.com/contact",
            description: "Send us a message and we'll respond within 24 hours"
          }
        ]} />
      </MachineSection>

    </MachineContent>
  </MachineView>
</>
  )
}

// Categories
const categories = [
  { value: "all", label: "All Questions" },
  { value: "getting-started", label: "Getting Started" },
  { value: "pricing", label: "Pricing & Billing" },
  { value: "features", label: "Features" },
  { value: "technical", label: "Technical" },
  { value: "support", label: "Support" },
]

// FAQ Data
const faqs = [
  // Getting Started
  {
    category: "getting-started",
    question: "How do I get started with Cursive?",
    answer: `There are three ways to start:

1. Book a call: Schedule a 15-minute intro where we'll understand your needs and recommend the right tier.

2. Purchase directly: Choose Cursive Data, Outbound, or Pipeline and complete checkout. We'll reach out within 24 hours to start onboarding.

3. Try the platform: Sign up for free to explore People Search and the Marketplace before committing to a subscription.`,
  },
  {
    category: "getting-started",
    question: "Which plan is right for me?",
    answer: `It depends on your current setup:

Cursive Data: You have an outbound process and just need better lead lists.

Cursive Outbound: You want us to run campaigns for you (done-for-you).

Cursive Pipeline: You need a full-stack solution with AI SDR agents handling everything.

Not sure? Book a call and we'll walk you through it.`,
  },
  {
    category: "getting-started",
    question: "How fast can we get started?",
    answer: `Cursive Data: Instant access. First list delivered within 5-7 business days.

Cursive Outbound: 1-2 weeks for full setup (email domains, infrastructure, campaign launch).

Cursive Pipeline: 2-3 weeks for onboarding, AI training, and workflow configuration.`,
  },
  {
    category: "getting-started",
    question: "Do you offer a free trial?",
    answer: `We don't offer free trials for managed services (Data, Outbound, Pipeline) because they require significant setup and customization.

However, you can:
- Use our free platform tools (People Search with daily limits)
- Purchase credits in the Marketplace to test lead quality
- Book a demo to see the platform in action

We're confident you'll see ROI within the first month.`,
  },

  // Pricing & Billing
  {
    category: "pricing",
    question: "Can I cancel anytime?",
    answer: `Yes. All plans are month-to-month with no long-term contracts. Simply give us 30 days notice and we'll cancel your subscription.

Setup fees are non-refundable (we invest significant time in onboarding), but monthly fees are prorated if you cancel mid-month.`,
  },
  {
    category: "pricing",
    question: "What's included in the setup fee?",
    answer: `For Cursive Outbound ($2,500 setup):
- Email domain setup and configuration
- Inbox warmup and deliverability optimization
- Campaign strategy session
- Brand voice AI training
- Copy generation and approval process

For Cursive Pipeline ($5,000 setup):
- Everything in Outbound, plus:
- API integration with your CRM
- AI SDR agent configuration
- Custom workflow design
- Multi-channel setup (email + LinkedIn)
- White-glove onboarding (2-3 week process)`,
  },
  {
    category: "pricing",
    question: "Do you offer volume discounts?",
    answer: `Yes. For larger commitments or multiple services, we offer custom pricing:

- 6-month commitment: 10% discount
- Annual commitment: 20% discount
- Multiple services: Custom bundled pricing
- Enterprise needs: Contact us for custom quotes

Book a call to discuss your specific requirements.`,
  },
  {
    category: "pricing",
    question: "What payment methods do you accept?",
    answer: `We accept all major credit cards (Visa, Mastercard, Amex, Discover) via Stripe.

For annual commitments or enterprise plans over $50k, we can accommodate:
- ACH/wire transfer
- Net-30 invoicing
- Purchase orders

Contact us to arrange alternative payment methods.`,
  },
  {
    category: "pricing",
    question: "Are there any hidden fees?",
    answer: `No hidden fees. What you see is what you pay.

The only additional costs are:
- Add-ons (Website Visitor Tracking, Retargeting, White Label) if you choose them
- Extra lead volume beyond your plan limits (charged per-lead)

We believe in transparent pricing.`,
  },

  // Features
  {
    category: "features",
    question: "How do you ensure data quality?",
    answer: `We guarantee 95%+ email deliverability through:

1. Multi-source verification: Every contact is verified through 3+ data sources
2. Real-time validation: Emails are validated before export
3. Bounce protection: We replace any bounced emails
4. Continuous enrichment: Data is refreshed monthly

We stand behind our data quality with a replacement guarantee.`,
  },
  {
    category: "features",
    question: "Can I use my own lead lists?",
    answer: `Yes! With Cursive Outbound and Pipeline tiers, you can:
- Upload your existing lists
- Combine our lists with yours
- We'll enrich and verify them before sending

We recommend using our verified data, but you're welcome to bring your own.`,
  },
  {
    category: "features",
    question: "What's AI Studio?",
    answer: `AI Studio trains AI on your brand voice, tone, and messaging to generate on-brand content.

You upload:
- Brand guidelines
- Example copy
- Voice & tone preferences
- Target audience info

The AI then generates:
- Email sequences
- Landing page copy
- Campaign messaging
- Social content

All sounding like you wrote it.`,
  },
  {
    category: "features",
    question: "How does the AI SDR work?",
    answer: `Our AI SDR (available in Pipeline tier) handles the entire outbound process:

1. Research: Identifies and qualifies prospects based on your ICP
2. Personalization: Writes custom emails for each prospect
3. Outreach: Sends emails and LinkedIn messages
4. Follow-ups: Manages multi-touch sequences automatically
5. Meeting booking: Books meetings directly on your calendar

It works 24/7 and learns from every interaction to improve performance.`,
  },
  {
    category: "features",
    question: "What integrations do you support?",
    answer: `We integrate with most major tools:

CRMs: Salesforce, HubSpot, Pipedrive, Close, Copper
Email: Gmail, Outlook, Office 365
Calendar: Google Calendar, Outlook Calendar
Communication: Slack, Microsoft Teams
Analytics: Google Analytics, Mixpanel

API access (Pipeline tier) allows custom integrations with any tool.`,
  },
  {
    category: "features",
    question: "Do you offer white labeling?",
    answer: `Yes. Our White Label Platform add-on ($2,000/mo) includes:
- Custom domain (leads.yourbrand.com)
- Your logo, colors, and branding
- Full platform access for your team or clients
- Up to 10 user seats

Perfect for agencies reselling lead gen services or enterprises wanting branded solutions.`,
  },

  // Technical
  {
    category: "technical",
    question: "How does website visitor tracking work?",
    answer: `We install a lightweight JavaScript pixel on your website that:

1. Identifies companies visiting your site (via IP address)
2. Matches companies to our database
3. Extracts decision-maker contact info
4. Tracks pages visited and time on site
5. Scores intent based on behavior

You get a list of identified visitors with contact info, ready for outreach.

Pricing: $750/mo + $0.50 per identified visitor`,
  },
  {
    category: "technical",
    question: "Is my data secure?",
    answer: `Yes. We take security seriously:

- SOC 2 Type II compliant
- End-to-end encryption for all data
- Regular security audits
- GDPR and CCPA compliant
- Role-based access controls
- SSO available for enterprise

Your data is never shared with third parties or used to train AI models.`,
  },
  {
    category: "technical",
    question: "What's your uptime guarantee?",
    answer: `We maintain 99.9% uptime with:
- Redundant infrastructure across multiple regions
- Automatic failover
- Real-time monitoring
- 24/7 engineering support

In the rare event of downtime, we provide prorated credits.`,
  },
  {
    category: "technical",
    question: "Can I export my data?",
    answer: `Yes. You own your data and can export anytime:

- Lead lists: CSV export
- Campaign analytics: CSV or PDF reports
- Contact data: Bulk export via API
- Historical data: Available upon request

No lock-in. Your data is yours.`,
  },

  // Support
  {
    category: "support",
    question: "What support do you offer?",
    answer: `All tiers include:
- Dedicated account manager
- Email support (24-hour response time)
- Live chat (Monday-Friday, 9am-6pm EST)
- Help center with guides and tutorials

Pipeline tier includes:
- Dedicated success manager
- Weekly strategy calls
- Priority support (4-hour response time)
- Direct Slack channel`,
  },
  {
    category: "support",
    question: "Do you offer training?",
    answer: `Yes. All tiers include:
- Onboarding training (platform walkthrough)
- Documentation and video tutorials
- Monthly webinars on best practices

Pipeline tier includes:
- Custom training sessions
- Quarterly business reviews
- Dedicated success manager

We ensure your team knows how to get the most out of Cursive.`,
  },
  {
    category: "support",
    question: "What if I need custom features?",
    answer: `We build custom solutions for enterprise clients:

- Custom integrations
- Dedicated infrastructure
- White-glove service
- Volume pricing

Contact us to discuss your specific requirements and we'll create a custom plan.`,
  },
  {
    category: "support",
    question: "Do you offer refunds?",
    answer: `Setup fees are non-refundable (we invest significant time in onboarding).

Monthly subscriptions:
- Prorated refunds if you cancel mid-month
- First month guarantee: If you're not satisfied in the first 30 days, we'll work with you to make it right or provide a prorated refund

We stand behind our work.`,
  },
]
