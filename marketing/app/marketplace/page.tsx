"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { ArrowRight, Search, ShoppingCart, UserPlus, Filter, Building2, Users, TrendingUp, Mail, Phone, Sparkles } from "lucide-react"
import { useState } from "react"
import { DashboardCTA } from "@/components/dashboard-cta"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"

export default function MarketplacePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Product Schema for SEO
  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": "https://meetcursive.com/marketplace#starter",
        "name": "Cursive Marketplace - Starter Credits",
        "description": "100 verified B2B lead credits for self-serve marketplace access. Filter by industry, seniority, intent, and more.",
        "brand": {
          "@type": "Brand",
          "name": "Cursive"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "99",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "Product",
        "@id": "https://meetcursive.com/marketplace#growth",
        "name": "Cursive Marketplace - Growth Credits",
        "description": "500 verified B2B lead credits at $0.80/credit. Most popular package for growing teams.",
        "brand": {
          "@type": "Brand",
          "name": "Cursive"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "399",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "Product",
        "@id": "https://meetcursive.com/marketplace#scale",
        "name": "Cursive Marketplace - Scale Credits",
        "description": "1,000 verified B2B lead credits at $0.70/credit. Best per-credit value for scaling outreach.",
        "brand": {
          "@type": "Brand",
          "name": "Cursive"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "699",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "Product",
        "@id": "https://meetcursive.com/marketplace#enterprise",
        "name": "Cursive Marketplace - Enterprise Credits",
        "description": "5,000 verified B2B lead credits at $0.60/credit. Maximum volume discount for enterprise teams.",
        "brand": {
          "@type": "Brand",
          "name": "Cursive"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "2999",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

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
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">LEAD MARKETPLACE</span>
                <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
                  Browse & Buy Verified
                  <span className="block font-cursive text-6xl lg:text-8xl text-gray-900 mt-2">
                    B2B Leads Instantly
                  </span>
                </h1>
                <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
                  Self-serve access to 50,000+ verified B2B contacts. Filter by industry, seniority, intent score, and more. Buy with credits -- no contracts, no minimums.
                </p>
                <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
                  Sign up free and get 100 credits to start browsing.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" href="https://leads.meetcursive.com/signup?source=marketplace" target="_blank">
                    Start Free -- Get 100 Credits
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button size="lg" variant="outline" href="#pricing">
                    View Credit Packages
                  </Button>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* How It Works */}
          <section className="py-24 bg-[#F7F9FB]">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  How It Works
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  From signup to qualified leads in three simple steps
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                {[
                  {
                    step: "1",
                    title: "Sign Up Free",
                    description: "Create your account in 30 seconds. No credit card required. You'll get 100 free credits to explore the marketplace.",
                    icon: UserPlus
                  },
                  {
                    step: "2",
                    title: "Browse 50k+ Leads",
                    description: "Search and filter by industry, job title, seniority, company size, geography, and intent score. Preview leads before you buy.",
                    icon: Search
                  },
                  {
                    step: "3",
                    title: "Buy with Credits",
                    description: "Use credits to unlock full contact details -- name, email, phone, company, and more. Export to CSV or sync directly to your CRM.",
                    icon: ShoppingCart
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
                      <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-6">
                        <step.icon className="h-10 w-10 text-gray-700" />
                      </div>
                      <div className="text-sm text-[#007AFF] font-medium mb-2">Step {step.step}</div>
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

          {/* Credit Pricing Table */}
          <section id="pricing" className="py-24 bg-white">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Credit Packages
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Buy credits in bulk and save. Credits never expire -- use them whenever you need leads.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {creditPackages.map((pkg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-white rounded-2xl p-8 border transition-all duration-300 hover:shadow-lg relative ${
                      pkg.popular
                        ? "border-[#007AFF] shadow-xl transform lg:scale-105 z-10"
                        : "border-gray-200 hover:border-[#007AFF]"
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-[#007AFF] text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                          Most Popular
                        </div>
                      </div>
                    )}
                    <div className="text-xs font-medium text-gray-500 mb-2 uppercase">{pkg.tier}</div>
                    <h3 className="text-2xl font-light text-gray-900 mb-1">{pkg.credits} Credits</h3>
                    <div className="text-4xl font-light text-[#007AFF] mb-1">${pkg.price}</div>
                    <div className="text-sm text-gray-500 mb-6">${pkg.perCredit}/credit</div>

                    {pkg.savings && (
                      <div className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mb-6">
                        Save {pkg.savings}
                      </div>
                    )}

                    <Button
                      className="w-full"
                      href="https://leads.meetcursive.com/signup?source=marketplace"
                      target="_blank"
                    >
                      Get {pkg.tier}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-8">
                <p className="text-sm text-gray-500">
                  All packages include: verified data guarantee, CSV export, CRM sync, and dedicated support.
                </p>
              </div>
            </Container>
          </section>

          {/* Sample Lead Preview */}
          <section className="py-24 bg-[#F7F9FB]">
            <Container>
              <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                <div>
                  <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                    Preview Before
                    <span className="block font-cursive text-5xl lg:text-6xl text-gray-900 mt-2">
                      You Buy
                    </span>
                  </h2>
                  <p className="text-xl text-gray-600 mb-8">
                    Every lead includes rich data fields. Preview masked details for free -- only use credits to unlock full contact info.
                  </p>
                  <div className="space-y-4">
                    {[
                      { icon: Users, label: "Full name and job title" },
                      { icon: Building2, label: "Company name, size, and industry" },
                      { icon: Mail, label: "Verified business email" },
                      { icon: Phone, label: "Direct phone number" },
                      { icon: TrendingUp, label: "Intent score and buying signals" },
                      { icon: Sparkles, label: "LinkedIn profile and social data" },
                    ].map((field, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <field.icon className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                        <span className="text-gray-700">{field.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200"
                >
                  <h4 className="text-xl font-light text-gray-900 mb-6">Sample Lead Preview</h4>
                  <div className="space-y-4">
                    {sampleLeads.map((lead, i) => (
                      <div key={i} className="bg-[#F7F9FB] rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-gray-900 font-medium">{lead.name}</div>
                            <div className="text-sm text-gray-600">{lead.title}</div>
                          </div>
                          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Intent: {lead.intent}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{lead.company}</div>
                        <div className="flex gap-4 text-xs text-gray-400">
                          <span>{lead.email}</span>
                          <span>{lead.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Masked preview -- use 1 credit to unlock full contact details
                  </p>
                </motion.div>
              </div>
            </Container>
          </section>

          {/* Filter Preview */}
          <section className="py-24 bg-white">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Find Exactly Who
                  <span className="block font-cursive text-5xl lg:text-6xl text-gray-900 mt-2">
                    You Need
                  </span>
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Powerful filters to narrow down your ideal prospects. Search across 50,000+ verified contacts.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {filterCategories.map((category, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all"
                  >
                    <Filter className="h-6 w-6 text-[#007AFF] mb-4" />
                    <h3 className="text-lg text-gray-900 mb-3 font-medium">{category.name}</h3>
                    <div className="space-y-2">
                      {category.options.map((option, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full flex-shrink-0" />
                          <span className="text-sm text-gray-600">{option}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* CTA Section */}
          <section className="py-24 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto"
              >
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
                  Ready to Start
                  <span className="block font-cursive text-5xl lg:text-6xl text-gray-900 mt-2">
                    Browsing Leads?
                  </span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Sign up free and get 100 credits. No credit card required. Start building your pipeline today.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                  <Button size="lg" href="https://leads.meetcursive.com/signup?source=marketplace" target="_blank">
                    Start Free -- Get 100 Credits
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button size="lg" variant="outline" href="/services">
                    Need Done-For-You? See Services
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* FAQ Section */}
          <section className="py-24 bg-white">
            <Container>
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-lg text-gray-600 mt-4">
                    Everything you need to know about the lead marketplace.
                  </p>
                </div>

                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-[#F7F9FB] transition-colors"
                      >
                        <span className="font-light text-lg text-gray-900 flex-1">{faq.question}</span>
                        <div className="text-gray-400 ml-4">
                          {openFaq === index ? "\u2212" : "+"}
                        </div>
                      </button>
                      {openFaq === index && (
                        <div className="px-6 pb-5">
                          <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </Container>
          </section>

          {/* Dashboard CTA */}
          <DashboardCTA
            headline="Ready to Fill"
            subheadline="Your Pipeline?"
            description="Sign up for the marketplace and start browsing 50,000+ verified B2B leads. Get 100 free credits on signup."
            ctaText="Start Free -- Get 100 Credits"
            ctaUrl="https://leads.meetcursive.com/signup?source=marketplace"
          />
        </main>
      </HumanView>

      {/* Machine View - AEO-Optimized */}
      <MachineView>
        <MachineContent>
          {/* Header */}
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE LEAD MARKETPLACE</h1>
            <p className="text-gray-700 leading-relaxed">
              Self-serve marketplace for verified B2B leads. Browse 50,000+ contacts, filter by industry, seniority, intent score, company size, and geography. Buy leads with credits starting at $99 for 100 credits. Get 100 free credits on signup.
            </p>
          </div>

          {/* How It Works */}
          <MachineSection title="How the Marketplace Works">
            <MachineList items={[
              "Step 1: Sign up free (no credit card required) and receive 100 free credits",
              "Step 2: Browse 50,000+ verified B2B leads with advanced filters",
              "Step 3: Preview masked lead details before purchasing",
              "Step 4: Use 1 credit per lead to unlock full contact information",
              "Step 5: Export to CSV or sync directly to your CRM"
            ]} />
          </MachineSection>

          {/* Credit Pricing */}
          <MachineSection title="Credit Packages">
            <div className="space-y-4">
              <MachineList items={[
                "Starter: 100 credits for $99 ($0.99/credit)",
                "Growth: 500 credits for $399 ($0.80/credit) - Most Popular",
                "Scale: 1,000 credits for $699 ($0.70/credit)",
                "Enterprise: 5,000 credits for $2,999 ($0.60/credit)"
              ]} />
              <p className="text-gray-700 mt-3">
                Credits never expire. All packages include verified data guarantee, CSV export, and CRM sync.
              </p>
            </div>
          </MachineSection>

          {/* Available Data Fields */}
          <MachineSection title="Data Available Per Lead">
            <MachineList items={[
              "Full name and job title",
              "Company name, size, industry, and revenue",
              "Verified business email address",
              "Direct phone number",
              "LinkedIn profile URL",
              "Intent score and buying signals",
              "Geography and location data",
              "Technology stack (where available)"
            ]} />
          </MachineSection>

          {/* Available Filters */}
          <MachineSection title="Search Filters">
            <MachineList items={[
              "Industry: SaaS, Healthcare, Finance, Manufacturing, Retail, Professional Services, and more",
              "Seniority: C-Suite, VP, Director, Manager, Individual Contributor",
              "Intent Score: High, Medium, Low buying intent based on behavioral signals",
              "Company Size: 1-50, 51-200, 201-1000, 1000+ employees",
              "Geography: US, UK, EU, APAC, and specific states/regions",
              "Job Function: Sales, Marketing, Engineering, Operations, Finance, HR"
            ]} />
          </MachineSection>

          {/* FAQ */}
          <MachineSection title="Frequently Asked Questions">
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <p className="text-gray-900 font-medium mb-1">Q: {faq.question}</p>
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </div>
          </MachineSection>

          {/* Getting Started */}
          <MachineSection title="Get Started">
            <MachineList items={[
              {
                label: "Sign Up Free (100 Credits Included)",
                href: "https://leads.meetcursive.com/signup?source=marketplace",
                description: "Create your account and start browsing leads immediately"
              },
              {
                label: "Done-For-You Services",
                href: "https://meetcursive.com/services",
                description: "Need managed lead generation? See our service packages"
              },
              {
                label: "Book a Strategy Call",
                href: "https://cal.com/adamwolfe/cursive-ai-audit",
                description: "Talk to our team about your lead generation needs"
              }
            ]} />
          </MachineSection>

        </MachineContent>
      </MachineView>
    </>
  )
}

// Credit Packages
const creditPackages = [
  {
    tier: "Starter",
    credits: "100",
    price: "99",
    perCredit: "0.99",
    savings: null,
    popular: false,
  },
  {
    tier: "Growth",
    credits: "500",
    price: "399",
    perCredit: "0.80",
    savings: "19%",
    popular: true,
  },
  {
    tier: "Scale",
    credits: "1,000",
    price: "699",
    perCredit: "0.70",
    savings: "29%",
    popular: false,
  },
  {
    tier: "Enterprise",
    credits: "5,000",
    price: "2,999",
    perCredit: "0.60",
    savings: "39%",
    popular: false,
  },
]

// Sample Leads (masked preview)
const sampleLeads = [
  {
    name: "Sarah J.",
    title: "VP of Sales",
    company: "TechCorp (201-500 employees)",
    email: "s****@techcorp.com",
    phone: "(415) ***-**89",
    intent: "High",
  },
  {
    name: "Michael C.",
    title: "Head of Growth",
    company: "ScaleUp Inc. (51-200 employees)",
    email: "m****@scaleup.io",
    phone: "(212) ***-**45",
    intent: "Medium",
  },
  {
    name: "Emily R.",
    title: "Director, Revenue Operations",
    company: "DataFlow (1,000+ employees)",
    email: "e****@dataflow.com",
    phone: "(650) ***-**12",
    intent: "High",
  },
]

// Filter Categories
const filterCategories = [
  {
    name: "Industry",
    options: ["SaaS / Technology", "Healthcare", "Financial Services", "Manufacturing", "Retail / E-commerce", "Professional Services"],
  },
  {
    name: "Seniority Level",
    options: ["C-Suite (CEO, CTO, CMO)", "VP / SVP", "Director", "Manager", "Individual Contributor"],
  },
  {
    name: "Intent Score",
    options: ["High Intent (active research)", "Medium Intent (evaluating)", "Low Intent (early stage)", "Custom intent thresholds"],
  },
  {
    name: "Company Size",
    options: ["1-50 employees", "51-200 employees", "201-1,000 employees", "1,000+ employees"],
  },
  {
    name: "Geography",
    options: ["United States", "United Kingdom", "Europe (EU)", "Asia-Pacific", "By state / region"],
  },
  {
    name: "Job Function",
    options: ["Sales / Business Dev", "Marketing", "Engineering / IT", "Operations", "Finance / Accounting"],
  },
]

// FAQ Data
const faqs = [
  {
    question: "Do credits expire?",
    answer: "No. Credits never expire. Buy them whenever you want and use them at your own pace. There are no monthly minimums or use-it-or-lose-it policies.",
  },
  {
    question: "What's included per credit?",
    answer: "Each credit unlocks one full lead profile including: verified name, job title, company, business email, direct phone number, LinkedIn URL, intent score, and company firmographics (size, industry, revenue, location).",
  },
  {
    question: "How do you verify lead quality?",
    answer: "Every lead in the marketplace is verified through multiple data sources. We check email deliverability, cross-reference company records, and validate phone numbers. Our data has 95%+ accuracy. If you receive a bounced email, we'll replace it at no charge.",
  },
  {
    question: "Can I get a refund on unused credits?",
    answer: "We offer a 30-day satisfaction guarantee on your first credit purchase. If you're not satisfied with the lead quality, contact us within 30 days for a full refund on unused credits. After the first purchase, all sales are final, but credits never expire.",
  },
  {
    question: "What's the difference between the marketplace and done-for-you services?",
    answer: "The marketplace is self-serve -- you search, filter, and buy leads yourself. It's perfect for teams who know their ICP and want instant access to contacts. Done-for-you services (Cursive Data, Outbound, Pipeline) include custom targeting, campaign management, and dedicated support. If you need more than just data, check out our services page.",
  },
  {
    question: "Can I export leads to my CRM?",
    answer: "Yes. You can export purchased leads as CSV or sync directly to Salesforce, HubSpot, Pipedrive, and other popular CRMs. We also offer API access for custom integrations on the Enterprise tier.",
  },
  {
    question: "How many leads are in the marketplace?",
    answer: "The marketplace currently contains 50,000+ verified B2B leads across multiple industries, company sizes, and geographies. We add new leads weekly and refresh existing data to maintain accuracy.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes. When you sign up, you get 100 free credits to browse and purchase leads. No credit card required. This lets you test the data quality before buying a larger package.",
  },
]
