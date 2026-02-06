"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { ArrowRight, Check, Calculator, Shield, TrendingUp, Users, Zap } from "lucide-react"
import { useState } from "react"
import { DashboardPreview } from "@/components/dashboard-preview"

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const [calculatorLeads, setCalculatorLeads] = useState(1000)

  // Product Schema for SEO
  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": "https://meetcursive.com/pricing#cursive-data",
        "name": "Cursive Data",
        "description": "Verified B2B contacts delivered monthly. Custom targeting based on your ICP with 95%+ email deliverability.",
        "brand": {
          "@type": "Brand",
          "name": "Cursive"
        },
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "USD",
          "lowPrice": "800",
          "highPrice": "1000",
          "offerCount": "3",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "Product",
        "@id": "https://meetcursive.com/pricing#cursive-outbound",
        "name": "Cursive Outbound",
        "description": "Done-for-you email campaigns with AI-powered personalization, email infrastructure setup, and campaign optimization.",
        "brand": {
          "@type": "Brand",
          "name": "Cursive"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "2400",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "2400",
            "priceCurrency": "USD",
            "unitText": "MONTH"
          },
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "Product",
        "@id": "https://meetcursive.com/pricing#cursive-pipeline",
        "name": "Cursive Pipeline",
        "description": "Full-stack AI SDR solution with multi-channel campaigns, unlimited lead enrichment, and dedicated success manager.",
        "brand": {
          "@type": "Brand",
          "name": "Cursive"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "4000",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "4000",
            "priceCurrency": "USD",
            "unitText": "MONTH"
          },
          "availability": "https://schema.org/InStock"
        }
      }
    ]
  }

  // ROI Calculator logic
  const costPerLead = 50 // Traditional cost per qualified lead
  const cursiveCostPerLead = 2 // Cursive cost per lead
  const traditionalCost = calculatorLeads * costPerLead
  const cursiveCost = calculatorLeads * cursiveCostPerLead
  const monthlySavings = traditionalCost - cursiveCost

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
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
            {/* Social Proof */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Users className="w-5 h-5 text-[#007AFF]" />
              <p className="text-sm text-gray-600">
                Trusted by 1,000+ B2B companies to generate qualified leads
              </p>
            </div>

            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
              Pricing That Scales With Your Growth
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Turn anonymous visitors into qualified leads for 96% less than traditional methods.
            </p>
            <p className="text-lg text-gray-500">
              No hidden fees. No restrictive contracts. Cancel anytime.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-16 bg-gradient-to-br from-[#007AFF]/5 to-blue-50">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-4">
                <Calculator className="w-5 h-5 text-[#007AFF]" />
                <span className="text-sm font-medium text-gray-900">ROI Calculator</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-3">
                See Your Potential Monthly Savings
              </h2>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How many qualified leads do you need per month?
                </label>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={calculatorLeads}
                  onChange={(e) => setCalculatorLeads(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#007AFF]"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-500">100 leads</span>
                  <span className="text-xl font-light text-[#007AFF]">{calculatorLeads} leads</span>
                  <span className="text-sm text-gray-500">5,000 leads</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-gray-50 rounded-xl">
                  <div className="text-sm text-gray-600 mb-2">Traditional Lead Gen</div>
                  <div className="text-3xl font-light text-gray-900 mb-1">
                    ${traditionalCost.toLocaleString()}
                    <span className="text-base text-gray-500">/mo</span>
                  </div>
                  <div className="text-xs text-gray-500">at $50 per lead</div>
                </div>

                <div className="p-6 bg-[#007AFF]/5 rounded-xl border-2 border-[#007AFF]">
                  <div className="text-sm text-[#007AFF] font-medium mb-2">With Cursive</div>
                  <div className="text-3xl font-light text-gray-900 mb-1">
                    ${cursiveCost.toLocaleString()}
                    <span className="text-base text-gray-500">/mo</span>
                  </div>
                  <div className="text-xs text-gray-500">at $2 per lead</div>
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="text-sm text-blue-700 font-medium mb-1">Your Monthly Savings</div>
                <div className="text-4xl font-light text-blue-900 mb-2">
                  ${monthlySavings.toLocaleString()}
                </div>
                <div className="text-sm text-blue-700">
                  That's ${(monthlySavings * 12).toLocaleString()} saved per year
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Billing Toggle */}
      <section className="py-16 bg-white">
        <Container>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-12">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-lg transition-all relative ${
                  billingCycle === 'annual'
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing Cards - Anchoring with Pipeline first */}
      <section className="py-16 bg-[#F7F9FB]">
        <Container>
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Cursive Pipeline - Anchor (shown first for price anchoring) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-[#007AFF] transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-6">
                <div className="text-xs font-medium text-gray-500 mb-2">ENTERPRISE</div>
                <h3 className="text-2xl font-light text-gray-900 mb-2">
                  Cursive Pipeline
                </h3>
                <p className="text-gray-600">Full-stack AI SDR solution</p>
              </div>

              <div className="mb-8">
                {billingCycle === 'annual' ? (
                  <>
                    <div className="text-4xl font-light text-[#007AFF] mb-1">
                      $4,000<span className="text-lg text-gray-600">/mo</span>
                    </div>
                    <div className="text-sm text-gray-500 line-through mb-1">$5,000/mo</div>
                    <div className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                      Save $12,000/year
                    </div>
                  </>
                ) : (
                  <div className="text-4xl font-light text-[#007AFF] mb-2">
                    $5,000<span className="text-lg text-gray-600">/mo</span>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">$5,000 one-time setup</p>
              </div>

              <div className="mb-6">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Perfect For
                </div>
                <p className="text-sm text-gray-600">
                  Enterprise sales teams needing multi-channel automation and unlimited scale
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                  <span className="text-gray-700">Everything in Outbound</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                  <span className="text-gray-700">AI SDR agents (24/7 automated)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                  <span className="text-gray-700">Multi-channel campaigns (email, LinkedIn, SMS)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                  <span className="text-gray-700">Unlimited lead enrichment</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                  <span className="text-gray-700">API access + CRM integrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                  <span className="text-gray-700">Dedicated success manager</span>
                </li>
              </ul>

              <Button className="w-full" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                Book a Demo
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="mt-4 text-center">
                <div className="text-xs text-gray-500">2-3 week onboarding</div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600">Cancel anytime</span>
                </div>
              </div>
            </motion.div>

            {/* Cursive Outbound - Most Popular (Decoy Effect) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#007AFF] rounded-2xl p-8 border-2 border-[#007AFF] shadow-xl relative transform lg:scale-105 z-10"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-[#007AFF] text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  Most Popular
                </div>
              </div>

              <div className="mb-6 text-white">
                <div className="text-xs font-medium mb-2 opacity-90">RECOMMENDED</div>
                <h3 className="text-2xl font-light mb-2">
                  Cursive Outbound
                </h3>
                <p className="opacity-90">Done-for-you email campaigns</p>
              </div>

              <div className="mb-8 text-white">
                {billingCycle === 'annual' ? (
                  <>
                    <div className="text-4xl font-light mb-1">
                      $2,400<span className="text-lg opacity-90">/mo</span>
                    </div>
                    <div className="text-sm opacity-75 line-through mb-1">$3,000/mo</div>
                    <div className="inline-block bg-white/20 text-white text-xs px-2 py-1 rounded">
                      Save $7,200/year
                    </div>
                  </>
                ) : (
                  <div className="text-4xl font-light mb-2">
                    $3,000<span className="text-lg opacity-90">/mo</span>
                  </div>
                )}
                <p className="text-sm opacity-90 mt-2">$2,500 one-time setup</p>
              </div>

              <div className="mb-6 text-white">
                <div className="text-xs font-medium opacity-75 uppercase tracking-wide mb-3">
                  Perfect For
                </div>
                <p className="text-sm opacity-90">
                  B2B SaaS and agencies ready to scale outbound without hiring more SDRs
                </p>
              </div>

              <ul className="space-y-3 mb-8 text-white">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>Everything in Data plan</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>AI-powered email personalization</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>Email infrastructure setup + warmup</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>500 verified leads included monthly</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>A/B testing + continuous optimization</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>Weekly strategy calls</span>
                </li>
              </ul>

              <Button className="w-full bg-white text-[#007AFF] hover:bg-gray-100" href="https://buy.stripe.com/8x27sLaTPcNL7p38Hp8g002" target="_blank">
                Start Outbound
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="mt-4 text-center text-white">
                <div className="text-xs opacity-75">2-week setup</div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">30-day money-back guarantee</span>
                </div>
              </div>
            </motion.div>

            {/* Cursive Data - Entry tier */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-[#007AFF] transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-6">
                <div className="text-xs font-medium text-gray-500 mb-2">STARTER</div>
                <h3 className="text-2xl font-light text-gray-900 mb-2">
                  Cursive Data
                </h3>
                <p className="text-gray-600">Verified leads for your team</p>
              </div>

              <div className="mb-8">
                {billingCycle === 'annual' ? (
                  <>
                    <div className="text-4xl font-light text-[#007AFF] mb-1">
                      $800<span className="text-lg text-gray-600">/mo</span>
                    </div>
                    <div className="text-sm text-gray-500 line-through mb-1">$1,000/mo</div>
                    <div className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                      Save $2,400/year
                    </div>
                  </>
                ) : (
                  <div className="text-4xl font-light text-[#007AFF] mb-2">
                    $1,000<span className="text-lg text-gray-600">/mo</span>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">500-2,000 leads/month</p>
              </div>

              <div className="mb-6">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Perfect For
                </div>
                <p className="text-sm text-gray-600">
                  Teams with existing outbound processes who need high-quality verified leads
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                  <span className="text-gray-700">Verified & enriched contacts (95%+ accuracy)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                  <span className="text-gray-700">Custom ICP targeting</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                  <span className="text-gray-700">Monthly list refresh</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                  <span className="text-gray-700">CSV export + CRM integration</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                  <span className="text-gray-700">Email support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#007AFF] flex-shrink-0" />
                  <span className="text-gray-700">Dedicated account manager</span>
                </li>
              </ul>

              <Button className="w-full" href="https://buy.stripe.com/6oU9AT3rnfZX6kZg9R8g003" target="_blank">
                Get Data Access
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="mt-4 text-center">
                <div className="text-xs text-gray-500">Instant access</div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600">No setup fee • Cancel anytime</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Upgrade Path Clarity */}
          <div className="mt-16 max-w-4xl mx-auto text-center">
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
              <TrendingUp className="w-12 h-12 text-[#007AFF] mx-auto mb-4" />
              <h3 className="text-2xl font-light text-gray-900 mb-3">
                Easy Upgrade Path
              </h3>
              <p className="text-gray-600 mb-6">
                Start with Data, upgrade to Outbound when ready, or go all-in with Pipeline.
                Switch between plans anytime with no penalties.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  Pro-rated billing
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  Keep your data
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  No downgrade fees
                </span>
              </div>
            </div>
          </div>

          {/* Add-Ons Row */}
          <div className="mt-16 max-w-6xl mx-auto">
            <h3 className="text-2xl font-light text-gray-900 text-center mb-3">
              Power-Ups & Add-Ons
            </h3>
            <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
              Enhance any plan with these premium features. Available on Outbound and Pipeline tiers.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200 hover:border-[#007AFF] transition-all">
                <Zap className="w-10 h-10 text-[#007AFF] mx-auto mb-3" />
                <div className="text-2xl font-light text-[#007AFF] mb-2">$750/mo</div>
                <div className="text-sm font-medium text-gray-900 mb-2">Website Visitor Tracking</div>
                <div className="text-xs text-gray-600 mb-4">+ $0.50 per identified visitor</div>
                <p className="text-xs text-gray-500">
                  Identify 70% of anonymous website visitors in real-time
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200 hover:border-[#007AFF] transition-all">
                <TrendingUp className="w-10 h-10 text-[#007AFF] mx-auto mb-3" />
                <div className="text-2xl font-light text-[#007AFF] mb-2">$1,500/mo</div>
                <div className="text-sm font-medium text-gray-900 mb-2">Visitor Retargeting</div>
                <div className="text-xs text-gray-600 mb-4">Requires Visitor Tracking</div>
                <p className="text-xs text-gray-500">
                  Auto-engage visitors with email and ad campaigns
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center border border-gray-200 hover:border-[#007AFF] transition-all">
                <Users className="w-10 h-10 text-[#007AFF] mx-auto mb-3" />
                <div className="text-2xl font-light text-[#007AFF] mb-2">$2,000/mo</div>
                <div className="text-sm font-medium text-gray-900 mb-2">White Label Platform</div>
                <div className="text-xs text-gray-600 mb-4">Includes 10 user seats</div>
                <p className="text-xs text-gray-500">
                  Rebrand Cursive for your agency clients
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-24 bg-white">
        <Container>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Compare Plans Feature by Feature
              </h2>
              <p className="text-xl text-gray-600">
                Every plan includes our core data quality guarantee and dedicated support.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 font-light text-gray-900">Features</th>
                    <th className="text-center py-4 px-6 font-light text-gray-900">Data</th>
                    <th className="text-center py-4 px-6 font-light text-gray-900 bg-blue-50">
                      Outbound
                      <div className="text-xs text-[#007AFF] font-medium mt-1">Most Popular</div>
                    </th>
                    <th className="text-center py-4 px-6 font-light text-gray-900">Pipeline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Verified Leads/Month</td>
                    <td className="py-4 px-6 text-center text-gray-600">500-2,000</td>
                    <td className="py-4 px-6 text-center text-gray-600 bg-blue-50">500+</td>
                    <td className="py-4 px-6 text-center text-gray-600">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Lead Enrichment</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                    <td className="py-4 px-6 text-center bg-blue-50"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Custom ICP Targeting</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                    <td className="py-4 px-6 text-center bg-blue-50"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">AI Email Personalization</td>
                    <td className="py-4 px-6 text-center text-gray-300">—</td>
                    <td className="py-4 px-6 text-center bg-blue-50"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Email Infrastructure Setup</td>
                    <td className="py-4 px-6 text-center text-gray-300">—</td>
                    <td className="py-4 px-6 text-center bg-blue-50"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Campaign Management</td>
                    <td className="py-4 px-6 text-center text-gray-300">—</td>
                    <td className="py-4 px-6 text-center bg-blue-50"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">AI SDR Agents (24/7)</td>
                    <td className="py-4 px-6 text-center text-gray-300">—</td>
                    <td className="py-4 px-6 text-center bg-blue-50 text-gray-300">—</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Multi-Channel (Email + LinkedIn + SMS)</td>
                    <td className="py-4 px-6 text-center text-gray-300">—</td>
                    <td className="py-4 px-6 text-center bg-blue-50 text-gray-300">—</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">API Access</td>
                    <td className="py-4 px-6 text-center text-gray-300">—</td>
                    <td className="py-4 px-6 text-center bg-blue-50 text-gray-300">—</td>
                    <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-blue-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Support Level</td>
                    <td className="py-4 px-6 text-center text-gray-600 text-sm">Email</td>
                    <td className="py-4 px-6 text-center text-gray-600 text-sm bg-blue-50">Weekly calls</td>
                    <td className="py-4 px-6 text-center text-gray-600 text-sm">Dedicated manager</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                All plans include: 95%+ data accuracy, CRM integrations, monthly reporting, and no long-term contracts.
              </p>
            </div>
          </div>
        </Container>
      </section>


      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Common Questions Answered
              </h2>
              <p className="text-lg text-gray-600 mt-4">
                Everything you need to know about pricing, plans, and guarantees.
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
                      {openFaq === index ? "−" : "+"}
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

      {/* Enterprise / Custom Plans Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-10 shadow-lg border border-gray-200">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#007AFF]/10 rounded-full mb-4">
                  <Users className="w-8 h-8 text-[#007AFF]" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-3">
                  Need Something Custom?
                </h2>
                <p className="text-lg text-gray-600">
                  Enterprise volume, white-label solutions, or unique requirements.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4">
                  <div className="text-[#007AFF] font-light text-2xl mb-2">10,000+</div>
                  <div className="text-sm text-gray-600">Leads per month</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-[#007AFF] font-light text-2xl mb-2">White Label</div>
                  <div className="text-sm text-gray-600">For agencies</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-[#007AFF] font-light text-2xl mb-2">Custom</div>
                  <div className="text-sm text-gray-600">Integrations</div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  href="https://cal.com/adamwolfe/cursive-ai-audit"
                  target="_blank"
                >
                  Contact Sales
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  Talk to our team about volume pricing and custom solutions
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing Transparency Section */}
      <section className="py-16 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Pricing Transparency</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                What's Included In Every Plan
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-medium text-gray-900 mb-1">No Hidden Fees</div>
                  <div className="text-sm text-gray-600">
                    What you see is what you pay. No surprise charges, no per-seat fees for your team.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-medium text-gray-900 mb-1">Cancel Anytime</div>
                  <div className="text-sm text-gray-600">
                    Month-to-month billing. No long-term contracts or cancellation penalties.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-medium text-gray-900 mb-1">95%+ Data Accuracy</div>
                  <div className="text-sm text-gray-600">
                    Verified contacts with deliverability guarantee. Bounced emails are replaced free.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-medium text-gray-900 mb-1">Dedicated Support</div>
                  <div className="text-sm text-gray-600">
                    Real humans, not chatbots. Every plan includes dedicated account management.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-medium text-gray-900 mb-1">CRM Integrations</div>
                  <div className="text-sm text-gray-600">
                    Native integrations with Salesforce, HubSpot, and 200+ other tools.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-medium text-gray-900 mb-1">Flexible Scaling</div>
                  <div className="text-sm text-gray-600">
                    Upgrade or downgrade anytime. Pro-rated billing with no downgrade fees.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA with Risk Reversal */}
      <section className="relative pt-32 pb-0 bg-white overflow-hidden">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center relative z-10 mb-16"
          >
            <h2 className="text-5xl lg:text-7xl font-light text-gray-900 mb-4 leading-tight">
              Ready to 3x Your Pipeline
            </h2>
            <p className="font-cursive text-6xl lg:text-8xl text-gray-900 mb-6">
              With Cursive?
            </p>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Book a free audit. We'll review your current lead gen process and show you exactly how Cursive can help—no pressure, no sales pitch.
            </p>

            <Button
              size="lg"
              href="https://cal.com/adamwolfe/cursive-ai-audit"
              target="_blank"
              className="bg-[#007AFF] text-white hover:bg-[#0066DD] text-lg px-10 py-5 mb-4"
            >
              Book Your Free Audit Now
            </Button>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mt-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Setup in 2 weeks</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cancel anytime</span>
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

// FAQ Data - Objection Handling
const faqs = [
  {
    question: "How is this different from ZoomInfo or Apollo?",
    answer: "Traditional data providers just sell you lists. Cursive combines data + activation. We don't just give you leads—we help you engage them with AI-powered campaigns. Plus, our data is verified in real-time (not batch-processed monthly) and our pricing is transparent with no hidden seat fees.",
  },
  {
    question: "What's your data accuracy guarantee?",
    answer: "We guarantee 95%+ email deliverability. Every contact is verified through multiple data sources and real-time validation before delivery. If emails bounce, we replace them at no charge. Most data providers won't guarantee accuracy—we do.",
  },
  {
    question: "Can I cancel anytime? Are there contracts?",
    answer: "Zero long-term contracts. All plans are month-to-month. Cancel anytime with 30 days notice. No cancellation fees, no penalties. We earn your business every single month.",
  },
  {
    question: "What if I don't know which plan to choose?",
    answer: "Book a free 15-minute strategy call. We'll ask about your revenue goals, current lead gen process, and team size—then recommend the right fit. No pressure, just honest advice. Most B2B SaaS companies start with Outbound.",
  },
  {
    question: "How fast can we get started and see results?",
    answer: "Cursive Data: Instant access, first leads within 5-7 days. Cursive Outbound: 2 weeks for setup, first meetings typically within 3-4 weeks. Cursive Pipeline: 2-3 weeks for onboarding, then continuous lead flow. We handle the heavy lifting—you focus on closing deals.",
  },
  {
    question: "Do you integrate with our CRM and tools?",
    answer: "Yes. We have native integrations with Salesforce, HubSpot, Pipedrive, and 200+ other tools. We can also push data via API or CSV export. During onboarding, we'll connect directly to your existing stack.",
  },
  {
    question: "What's included in the setup fee?",
    answer: "For Outbound ($2,500): email domain setup, inbox configuration, deliverability optimization, campaign strategy, copy review, and AI training on your brand voice. For Pipeline ($5,000): everything in Outbound plus API integration, AI SDR agent configuration, multi-channel workflow design, and dedicated onboarding. Setup fees are one-time—never recurring.",
  },
  {
    question: "What kind of companies use Cursive?",
    answer: "B2B SaaS companies ($500K-$50M ARR), digital agencies, consultancies, and service businesses. Our sweet spot is companies doing $2M-$20M ARR who need consistent qualified pipeline but don't want to hire more SDRs. If you sell to businesses, we can help.",
  },
  {
    question: "Can I bring my own lead lists?",
    answer: "Absolutely. With Cursive Outbound and Pipeline, you can upload your existing lists or combine them with ours. We'll enrich, verify, and de-duplicate them before launching campaigns. Many customers use a hybrid approach: our fresh leads + their existing database.",
  },
  {
    question: "What's your money-back guarantee?",
    answer: "Outbound plan includes a 30-day money-back guarantee. If you're not satisfied with the quality of leads or campaign performance in the first 30 days, we'll refund your monthly fee (setup fees are non-refundable due to the work invested). We stand behind our results.",
  },
  {
    question: "How do you handle pricing for annual plans?",
    answer: "Annual plans save you 20% compared to monthly billing. You pay upfront for 12 months and lock in your rate (no surprise price increases). If you need to cancel mid-year, we'll prorate and refund unused months—no questions asked.",
  },
  {
    question: "Do you offer discounts or custom pricing?",
    answer: "We offer 20% off for annual billing. For enterprise volume (10,000+ leads/month), multi-year commitments, or agency white-label partnerships, we can create custom pricing. Contact us for a tailored quote based on your specific needs.",
  },
]
