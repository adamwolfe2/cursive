"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  ArrowRight, Phone, Eye, Settings, Building2, Users, FileText,
  TrendingUp, Zap, CheckCircle2, ArrowRightLeft, BarChart3, Clock
} from "lucide-react"
import { useState } from "react"
import { DashboardCTA } from "@/components/dashboard-cta"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"

export default function PixelPage() {
  const [monthlyVisitors, setMonthlyVisitors] = useState(5000)

  // Calculate ROI
  const identificationRate = 0.7
  const identifiedContacts = Math.round(monthlyVisitors * identificationRate)
  const perVisitorCost = 0.5
  const baseCost = 750
  const totalCost = baseCost + (identifiedContacts * perVisitorCost)

  // Product Schema for SEO
  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": "https://meetcursive.com/pixel#product",
        "name": "Cursive Pixel - Website Visitor Identification",
        "description": "Done-for-you website visitor tracking pixel. Identify anonymous visitors, get company names, decision-maker contacts, pages viewed, and intent scores. Setup in 48 hours.",
        "brand": {
          "@type": "Brand",
          "name": "Cursive"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "750",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "750",
            "priceCurrency": "USD",
            "unitText": "MONTH"
          },
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does the Cursive Pixel work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Cursive Pixel is a lightweight JavaScript tag installed on your website. When visitors browse your site, it identifies them using IP intelligence, device fingerprinting, and behavioral analysis, then enriches their profiles with company data, job titles, and contact information in real-time."
            }
          },
          {
            "@type": "Question",
            "name": "How much does the Cursive Pixel cost?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Cursive Pixel costs $750/month base fee plus $0.50 per identified visitor. For example, if you get 5,000 monthly visitors and we identify 70% (3,500 contacts), your total cost would be $750 + $1,750 = $2,500/month."
            }
          },
          {
            "@type": "Question",
            "name": "How long does pixel setup take?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We handle everything for you. Book a setup call, and our team will install and configure the pixel on your website within 48 hours. No technical work required on your end."
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
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">CURSIVE PIXEL</span>
                <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
                  See Who's Visiting
                  <span className="block font-cursive text-6xl lg:text-8xl text-gray-900 mt-2">
                    Your Website
                  </span>
                </h1>
                <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
                  Done-for-you pixel setup that identifies anonymous visitors and turns them into qualified leads. We handle everything -- you just start getting leads.
                </p>
                <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
                  $750/mo base + $0.50 per identified visitor. Setup done in 48 hours.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                    Book Pixel Setup Call
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button size="lg" variant="outline" href="#roi-calculator">
                    Calculate Your ROI
                  </Button>
                </div>
                <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Done in 48 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>70% identification rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>CRM sync included</span>
                  </div>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Pricing Clear */}
          <section className="py-24 bg-[#F7F9FB]">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Simple, Transparent Pricing
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  One plan. No hidden fees. No long-term contracts.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-2xl mx-auto bg-white rounded-2xl p-10 border border-gray-200 shadow-lg"
              >
                <div className="text-center mb-8">
                  <div className="text-sm text-[#007AFF] font-medium mb-3">CURSIVE PIXEL</div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-light text-[#007AFF]">$750</span>
                    <span className="text-xl text-gray-500">/mo base</span>
                  </div>
                  <div className="text-lg text-gray-600 mt-2">
                    + $0.50 per identified visitor
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Everything included:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pixelFeatures.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <Button size="lg" className="w-full" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                    Book Pixel Setup Call
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <p className="text-xs text-gray-500 mt-3">No setup fees. Cancel anytime.</p>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* What You Get */}
          <section className="py-24 bg-white">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  What You Get
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Rich visitor data delivered straight to your inbox and CRM
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[
                  {
                    icon: Building2,
                    title: "Company Names",
                    description: "See which companies are visiting your website in real-time. Know their industry, size, revenue, and location."
                  },
                  {
                    icon: Users,
                    title: "Decision-Maker Contacts",
                    description: "Get names, job titles, verified emails, and direct phone numbers for key decision-makers at visiting companies."
                  },
                  {
                    icon: FileText,
                    title: "Pages Viewed",
                    description: "Track exactly which pages each visitor browsed -- pricing, features, case studies. Know their interests before reaching out."
                  },
                  {
                    icon: TrendingUp,
                    title: "Intent Scores",
                    description: "AI-powered scoring based on browsing behavior, return visits, and page engagement. Prioritize the hottest leads first."
                  },
                  {
                    icon: ArrowRightLeft,
                    title: "CRM Sync",
                    description: "Automatic two-way sync with Salesforce, HubSpot, and Pipedrive. New leads appear in your pipeline instantly."
                  },
                  {
                    icon: BarChart3,
                    title: "Weekly Reports",
                    description: "Receive a weekly digest of your top visitors, trending companies, and high-intent leads directly in your inbox."
                  }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all"
                  >
                    <feature.icon className="h-8 w-8 text-[#007AFF] mb-4" />
                    <h3 className="text-xl text-gray-900 mb-3 font-medium">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* How It Works */}
          <section className="py-24 bg-[#F7F9FB]">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  We Handle Everything
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Done in 48 hours. No technical work on your end.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                {[
                  {
                    step: "1",
                    title: "Book Setup Call",
                    description: "15-minute call to understand your website, goals, and CRM setup. We'll scope the installation and answer any questions.",
                    icon: Phone
                  },
                  {
                    step: "2",
                    title: "We Install & Configure",
                    description: "Our team installs the pixel on your website, configures CRM sync, sets up filters to exclude internal traffic and bots, and tests everything.",
                    icon: Settings
                  },
                  {
                    step: "3",
                    title: "Start Getting Leads",
                    description: "Within 48 hours, you'll start seeing identified visitors in your dashboard and CRM. We monitor performance and optimize continuously.",
                    icon: Eye
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

          {/* ROI Calculator */}
          <section id="roi-calculator" className="py-24 bg-white">
            <Container>
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                    Calculate Your
                    <span className="block font-cursive text-5xl lg:text-6xl text-gray-900 mt-2">
                      Monthly Cost
                    </span>
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    See exactly what the pixel will cost based on your website traffic.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200"
                >
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      How many monthly website visitors do you get?
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="50000"
                      step="500"
                      value={monthlyVisitors}
                      onChange={(e) => setMonthlyVisitors(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#007AFF]"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-gray-500">1,000</span>
                      <span className="text-xl font-light text-[#007AFF]">{monthlyVisitors.toLocaleString()} visitors/mo</span>
                      <span className="text-sm text-gray-500">50,000</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="p-6 bg-[#F7F9FB] rounded-xl text-center">
                      <div className="text-sm text-gray-600 mb-2">Identified Contacts</div>
                      <div className="text-3xl font-light text-gray-900 mb-1">
                        {identifiedContacts.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">at 70% identification rate</div>
                    </div>

                    <div className="p-6 bg-[#F7F9FB] rounded-xl text-center">
                      <div className="text-sm text-gray-600 mb-2">Per-Contact Cost</div>
                      <div className="text-3xl font-light text-gray-900 mb-1">
                        $0.50
                      </div>
                      <div className="text-xs text-gray-500">per identified visitor</div>
                    </div>

                    <div className="p-6 bg-[#007AFF]/5 rounded-xl text-center border-2 border-[#007AFF]">
                      <div className="text-sm text-[#007AFF] font-medium mb-2">Total Monthly Cost</div>
                      <div className="text-3xl font-light text-gray-900 mb-1">
                        ${totalCost.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">$750 base + ${(identifiedContacts * perVisitorCost).toLocaleString()} usage</div>
                    </div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="text-sm text-blue-700 font-medium mb-1">Cost Per Lead</div>
                    <div className="text-4xl font-light text-blue-900 mb-2">
                      ${(totalCost / identifiedContacts).toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-700">
                      vs. $50-$100+ per lead with traditional lead gen
                    </div>
                  </div>
                </motion.div>
              </div>
            </Container>
          </section>

          {/* Pixel vs Marketplace Comparison */}
          <section className="py-24 bg-[#F7F9FB]">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Pixel vs. Marketplace
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Two ways to get leads. Use one or both depending on your strategy.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-8 border-2 border-[#007AFF] shadow-lg"
                >
                  <div className="text-sm text-[#007AFF] font-medium mb-3">CURSIVE PIXEL</div>
                  <h3 className="text-2xl font-light text-gray-900 mb-4">
                    Website Visitors Who Already Know You
                  </h3>
                  <p className="text-gray-600 mb-6">
                    These people already visited your website. They know your brand, browsed your content, and showed buying intent. The pixel captures them before they leave.
                  </p>
                  <div className="space-y-3 mb-6">
                    {[
                      "Warm leads -- already interested in you",
                      "Page-level intent data (what they viewed)",
                      "Return visitor detection",
                      "Done-for-you setup and management",
                      "$750/mo + $0.50 per identified visitor",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                    Book Pixel Setup
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-8 border border-gray-200"
                >
                  <div className="text-sm text-gray-500 font-medium mb-3">LEAD MARKETPLACE</div>
                  <h3 className="text-2xl font-light text-gray-900 mb-4">
                    Cold Outreach to New Prospects
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Browse and buy leads from our database of 50,000+ verified B2B contacts. Perfect for proactive outbound when you need to reach people who haven't found you yet.
                  </p>
                  <div className="space-y-3 mb-6">
                    {[
                      "Cold leads -- expand beyond your current reach",
                      "Filter by industry, seniority, intent",
                      "Self-serve, buy at your own pace",
                      "Credits never expire",
                      "Starting at $99 for 100 credits",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" variant="outline" href="/marketplace">
                    Browse the Marketplace
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>

              <div className="text-center mt-12">
                <p className="text-gray-600 mb-4">
                  Most teams use both: the pixel for warm inbound leads, and the marketplace for cold outbound.
                </p>
                <Button variant="outline" href="/services">
                  Or see our done-for-you services
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Container>
          </section>

          {/* CTA Section */}
          <section className="py-24 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto"
              >
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
                  Ready to See Who's
                  <span className="block font-cursive text-5xl lg:text-6xl text-gray-900 mt-2">
                    On Your Site?
                  </span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Book a 15-minute setup call. We'll install the pixel on your website within 48 hours and you'll start getting leads immediately.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                  <Button size="lg" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                    Book Pixel Setup Call
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button size="lg" variant="outline" href="/marketplace">
                    Or Browse the Marketplace
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#007AFF]" />
                    <span>48-hour setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#007AFF]" />
                    <span>No technical work required</span>
                  </div>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Dashboard CTA */}
          <DashboardCTA
            headline="Stop Losing"
            subheadline="Website Visitors"
            description="Book a setup call and we'll install the Cursive Pixel on your website within 48 hours. Start identifying anonymous visitors and converting them into leads."
            ctaText="Book Pixel Setup Call"
            ctaUrl="https://cal.com/adamwolfe/cursive-ai-audit"
          />
        </main>
      </HumanView>

      {/* Machine View - AEO-Optimized */}
      <MachineView>
        <MachineContent>
          {/* Header */}
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE PIXEL - WEBSITE VISITOR IDENTIFICATION</h1>
            <p className="text-gray-700 leading-relaxed">
              Done-for-you website visitor tracking pixel. Identifies anonymous visitors and provides company names, decision-maker contacts, pages viewed, and intent scores. $750/month base fee plus $0.50 per identified visitor. Setup completed in 48 hours.
            </p>
          </div>

          {/* Pricing */}
          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Simple, transparent pricing with no hidden fees:
            </p>
            <MachineList items={[
              "Base fee: $750/month",
              "Per-visitor cost: $0.50 per identified visitor",
              "Example: 5,000 monthly visitors, 70% identification rate = 3,500 contacts",
              "Example total: $750 + ($0.50 x 3,500) = $2,500/month",
              "No setup fees. No long-term contracts. Cancel anytime."
            ]} />
          </MachineSection>

          {/* What You Get */}
          <MachineSection title="What the Pixel Provides">
            <MachineList items={[
              "Company names, industry, size, revenue, and location for visiting businesses",
              "Decision-maker contacts: names, job titles, verified emails, direct phone numbers",
              "Page-level tracking: see exactly which pages each visitor browsed",
              "Intent scores: AI-powered scoring based on browsing behavior and engagement",
              "Return visitor detection: know when prospects come back",
              "CRM sync: automatic two-way sync with Salesforce, HubSpot, Pipedrive",
              "Weekly reports: digest of top visitors, trending companies, and high-intent leads"
            ]} />
          </MachineSection>

          {/* How It Works */}
          <MachineSection title="Setup Process (Done-For-You)">
            <MachineList items={[
              "Step 1: Book a 15-minute setup call to discuss your website and goals",
              "Step 2: Cursive team installs and configures the pixel on your website (within 48 hours)",
              "Step 3: CRM sync configured, filters set up (exclude internal traffic, bots, existing customers)",
              "Step 4: Start receiving identified visitor data in your dashboard and CRM",
              "No technical work required on your end"
            ]} />
          </MachineSection>

          {/* ROI Example */}
          <MachineSection title="ROI Example">
            <p className="text-gray-700 mb-4">
              For a website with 5,000 monthly visitors:
            </p>
            <MachineList items={[
              "Identified contacts: 3,500 (at 70% identification rate)",
              "Monthly cost: $2,500 ($750 base + $1,750 usage)",
              "Cost per lead: $0.71",
              "Compared to traditional lead gen: $50-$100+ per lead",
              "Potential savings: 95%+ reduction in cost per lead"
            ]} />
          </MachineSection>

          {/* Pixel vs Marketplace */}
          <MachineSection title="Pixel vs. Marketplace Comparison">
            <div className="space-y-4">
              <div>
                <p className="text-gray-900 font-medium mb-2">Cursive Pixel (Inbound/Warm Leads):</p>
                <p className="text-gray-700">
                  Identifies visitors who are already browsing your website. These are warm leads with demonstrated interest in your product. Includes page-level intent data, return visitor tracking, and done-for-you setup. Best for: capturing demand that already exists.
                </p>
              </div>
              <div>
                <p className="text-gray-900 font-medium mb-2">Lead Marketplace (Outbound/Cold Leads):</p>
                <p className="text-gray-700">
                  Self-serve access to 50,000+ verified B2B contacts. Browse and buy leads filtered by industry, seniority, and intent. Best for: proactive outreach to new prospects who haven't found you yet.
                </p>
              </div>
              <p className="text-gray-700">
                Most teams use both: the pixel for warm inbound leads and the marketplace for cold outbound prospecting.
              </p>
            </div>
          </MachineSection>

          {/* Getting Started */}
          <MachineSection title="Get Started">
            <MachineList items={[
              {
                label: "Book Pixel Setup Call",
                href: "https://cal.com/adamwolfe/cursive-ai-audit",
                description: "15-minute call to scope installation. Pixel installed within 48 hours."
              },
              {
                label: "Browse Lead Marketplace",
                href: "https://meetcursive.com/marketplace",
                description: "Self-serve access to 50,000+ verified B2B leads"
              },
              {
                label: "View All Services",
                href: "https://meetcursive.com/services",
                description: "Done-for-you lead generation, outbound campaigns, and AI SDR automation"
              }
            ]} />
          </MachineSection>

        </MachineContent>
      </MachineView>
    </>
  )
}

// Pixel Features List
const pixelFeatures = [
  "Done-for-you installation (48 hours)",
  "Company identification (name, size, industry)",
  "Decision-maker contacts (email, phone)",
  "Page-level visitor tracking",
  "AI-powered intent scoring",
  "Return visitor detection",
  "CRM sync (Salesforce, HubSpot, Pipedrive)",
  "Bot and internal traffic filtering",
  "Weekly performance reports",
  "Dedicated account manager",
  "GDPR and CCPA compliant",
  "Cancel anytime, no contracts",
]
