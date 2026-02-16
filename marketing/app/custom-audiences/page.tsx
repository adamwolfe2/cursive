"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { useState } from "react"
import {
  ArrowRight, CheckCircle2, ClipboardList, Send,
  ThumbsUp, Package, ShoppingCart, Users
} from "lucide-react"
import { DashboardCTA } from "@/components/dashboard-cta"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"

const industries = [
  "SaaS",
  "Financial Services",
  "Healthcare",
  "eCommerce",
  "Manufacturing",
  "Real Estate",
  "Education",
  "Other",
]

const companySizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"]

const seniorityOptions = [
  "C-Suite",
  "VP",
  "Director",
  "Manager",
  "Individual Contributor",
]

const desiredVolumes = ["100", "500", "1,000", "5,000", "10,000+"]

const budgetRanges = ["<$500", "$500-$2k", "$2k-$5k", "$5k+"]

export default function CustomAudiencesPage() {
  const [formData, setFormData] = useState({
    industry: "",
    geography: "",
    companySize: "",
    seniorityLevels: [] as string[],
    intentSignals: "",
    desiredVolume: "",
    budgetRange: "",
    email: "",
    companyName: "",
  })
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSeniorityToggle = (level: string) => {
    setFormData((prev) => ({
      ...prev,
      seniorityLevels: prev.seniorityLevels.includes(level)
        ? prev.seniorityLevels.filter((l) => l !== level)
        : [...prev.seniorityLevels, level],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "custom-audience",
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus("error")
        setErrorMessage(data.error || "Failed to submit. Please try again.")
        return
      }

      setStatus("success")
      setFormData({
        industry: "",
        geography: "",
        companySize: "",
        seniorityLevels: [],
        intentSignals: "",
        desiredVolume: "",
        budgetRange: "",
        email: "",
        companyName: "",
      })
    } catch {
      setStatus("error")
      setErrorMessage("An unexpected error occurred. Please try again later.")
    }
  }

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": "https://www.meetcursive.com/custom-audiences#service",
        "name": "Cursive Custom Audiences",
        "description": "Bespoke B2B lead lists built to your exact specifications. Free 25-lead sample in 48 hours. Starts at $0.50/lead.",
        "provider": {
          "@type": "Organization",
          "name": "Cursive"
        },
        "serviceType": "Custom Lead Generation",
        "areaServed": "Worldwide",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "0.50",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "0.50",
            "priceCurrency": "USD",
            "unitText": "per lead"
          },
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
            "item": "https://www.meetcursive.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Custom Audiences",
            "item": "https://www.meetcursive.com/custom-audiences"
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
        <main className="overflow-hidden">
          {/* Hero Section */}
          <section className="pt-24 pb-20 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-5xl mx-auto"
              >
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">CUSTOM AUDIENCES</span>
                <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6">
                  Need a Specific Audience?{" "}
                  <span className="block font-cursive text-5xl lg:text-7xl mt-2">We'll Build It.</span>
                </h1>
                <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
                  Tell us exactly who you need to reach. We'll deliver a verified, custom-built list -- starting with a free 25-lead sample.
                </p>
                <div className="flex items-center justify-center gap-8 text-sm text-gray-600 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Free 25-lead sample</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>48-hour turnaround</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Starts at $0.50/lead</span>
                  </div>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Form Section */}
          <section className="py-20 bg-[#F7F9FB]">
            <Container>
              <div className="max-w-3xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-2 text-center">
                    Describe Your Ideal Audience
                  </h2>
                  <p className="text-gray-600 text-center mb-10">
                    The more detail you provide, the better we can match your needs.
                  </p>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-6 bg-white rounded-2xl p-8 border border-gray-200"
                    toolname="requestCustomAudience"
                    tooldescription="Request a custom B2B audience list built to exact specifications. Free 25-lead sample delivered in 48 hours. Starts at $0.50/lead with volume discounts."
                  >
                    {/* Industry */}
                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                        Industry *
                      </label>
                      <select
                        id="industry"
                        name="industry"
                        required
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent bg-white"
                        toolparamdescription="Target industry for the custom audience"
                      >
                        <option value="">Select an industry</option>
                        {industries.map((ind) => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>

                    {/* Geography */}
                    <div>
                      <label htmlFor="geography" className="block text-sm font-medium text-gray-700 mb-2">
                        Geography *
                      </label>
                      <input
                        type="text"
                        id="geography"
                        name="geography"
                        required
                        value={formData.geography}
                        onChange={(e) => setFormData({ ...formData, geography: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
                        placeholder="e.g., US, UK, DACH region"
                        toolparamdescription="Geographic region to target (e.g., US, UK, DACH, APAC)"
                      />
                    </div>

                    {/* Company Size */}
                    <div>
                      <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-2">
                        Company Size *
                      </label>
                      <select
                        id="companySize"
                        name="companySize"
                        required
                        value={formData.companySize}
                        onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent bg-white"
                        toolparamdescription="Target company size by employee count"
                      >
                        <option value="">Select company size</option>
                        {companySizes.map((size) => (
                          <option key={size} value={size}>{size} employees</option>
                        ))}
                      </select>
                    </div>

                    {/* Seniority Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Seniority Level *
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {seniorityOptions.map((level) => (
                          <label
                            key={level}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                              formData.seniorityLevels.includes(level)
                                ? "bg-[#007AFF] text-white border-[#007AFF]"
                                : "bg-white text-gray-700 border-gray-300 hover:border-[#007AFF]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              name="seniorityLevels"
                              value={level}
                              checked={formData.seniorityLevels.includes(level)}
                              onChange={() => handleSeniorityToggle(level)}
                              className="sr-only"
                              toolparamdescription="Target seniority levels (C-Suite, VP, Director, Manager, Individual Contributor)"
                            />
                            <span className="text-sm">{level}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Intent Signals */}
                    <div>
                      <label htmlFor="intentSignals" className="block text-sm font-medium text-gray-700 mb-2">
                        Intent Signals
                      </label>
                      <textarea
                        id="intentSignals"
                        name="intentSignals"
                        value={formData.intentSignals}
                        onChange={(e) => setFormData({ ...formData, intentSignals: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent resize-none"
                        placeholder="e.g., Actively researching CRM solutions, evaluating marketing automation tools"
                        toolparamdescription="Specific purchase intent signals to target (e.g., researching CRM solutions)"
                      />
                    </div>

                    {/* Desired Volume & Budget - Side by Side */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="desiredVolume" className="block text-sm font-medium text-gray-700 mb-2">
                          Desired Volume *
                        </label>
                        <select
                          id="desiredVolume"
                          name="desiredVolume"
                          required
                          value={formData.desiredVolume}
                          onChange={(e) => setFormData({ ...formData, desiredVolume: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent bg-white"
                          toolparamdescription="Number of leads desired"
                        >
                          <option value="">Select volume</option>
                          {desiredVolumes.map((vol) => (
                            <option key={vol} value={vol}>{vol} leads</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="budgetRange" className="block text-sm font-medium text-gray-700 mb-2">
                          Budget Range *
                        </label>
                        <select
                          id="budgetRange"
                          name="budgetRange"
                          required
                          value={formData.budgetRange}
                          onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent bg-white"
                          toolparamdescription="Monthly budget range for lead generation"
                        >
                          <option value="">Select budget</option>
                          {budgetRanges.map((budget) => (
                            <option key={budget} value={budget}>{budget}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Email & Company Name */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
                          placeholder="you@company.com"
                          toolparamdescription="Work email to receive the custom audience sample"
                        />
                      </div>
                      <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name
                        </label>
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
                          placeholder="Your company name (optional)"
                        />
                      </div>
                    </div>

                    {/* Status Messages */}
                    {status === "success" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                        <p className="font-medium">Request Submitted!</p>
                        <p className="text-sm mt-1">We'll deliver your free 25-lead sample within 48 hours. Check your email.</p>
                      </div>
                    )}

                    {status === "error" && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                        <p className="font-medium">Error</p>
                        <p className="text-sm mt-1">{errorMessage}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={status === "submitting"}
                    >
                      {status === "submitting" ? "Submitting..." : "Get My Free 25-Lead Sample"}
                      {status !== "submitting" && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                </motion.div>
              </div>
            </Container>
          </section>

          {/* How It Works */}
          <section className="py-20 bg-white">
            <Container>
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  How It Works
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  From request to delivery in 4 simple steps
                </p>
              </div>
              <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                {[
                  {
                    step: "1",
                    title: "Submit Your Criteria",
                    description: "Tell us your ideal customer profile -- industry, geography, seniority, company size, and any intent signals.",
                    icon: ClipboardList,
                  },
                  {
                    step: "2",
                    title: "Free Sample in 48 Hours",
                    description: "We deliver a verified 25-lead sample so you can evaluate quality before committing.",
                    icon: Send,
                  },
                  {
                    step: "3",
                    title: "Approve the Sample",
                    description: "Review the sample, request adjustments, and confirm the full list specifications.",
                    icon: ThumbsUp,
                  },
                  {
                    step: "4",
                    title: "Full Delivery",
                    description: "Receive your complete custom audience list, verified and ready to activate.",
                    icon: Package,
                  },
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
                      <div className="w-16 h-16 rounded-2xl bg-[#F7F9FB] border border-gray-200 flex items-center justify-center mb-5">
                        <step.icon className="h-8 w-8 text-gray-700" />
                      </div>
                      <div className="text-sm text-[#007AFF] font-medium mb-2">STEP {step.step}</div>
                      <h3 className="text-xl text-gray-900 mb-3 font-medium">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Pricing */}
          <section className="py-20 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto"
              >
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Simple, Transparent Pricing
                </h2>
                <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-8">
                  <div className="text-5xl font-light text-[#007AFF] mb-2">$0.50</div>
                  <div className="text-xl text-gray-600 mb-6">per lead, volume discounts available</div>
                  <div className="grid md:grid-cols-3 gap-6 text-left">
                    {[
                      { volume: "100-500 leads", price: "$0.50/lead" },
                      { volume: "500-5,000 leads", price: "$0.35/lead" },
                      { volume: "10,000+ leads", price: "Custom pricing" },
                    ].map((tier, i) => (
                      <div key={i} className="bg-[#F7F9FB] rounded-xl p-4">
                        <div className="text-gray-900 font-medium mb-1">{tier.volume}</div>
                        <div className="text-[#007AFF]">{tier.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  Every list includes verified emails, phone numbers, LinkedIn profiles, and company data.
                </p>
              </motion.div>
            </Container>
          </section>

          {/* Secondary CTA - Browse Marketplace */}
          <section className="py-20 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto"
              >
                <div className="bg-[#F7F9FB] rounded-2xl p-10 border border-gray-200">
                  <ShoppingCart className="h-10 w-10 text-[#007AFF] mx-auto mb-4" />
                  <h3 className="text-2xl lg:text-3xl font-light text-gray-900 mb-3">
                    Need Leads Right Now?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                    Browse the marketplace for pre-built, ready-to-download audience lists across popular industries and roles. Instant access, no waiting.
                  </p>
                  <Button size="lg" variant="outline" href="/marketplace">
                    Browse the Marketplace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Dashboard CTA */}
          <DashboardCTA
            headline="Ready for a Custom"
            subheadline="Audience?"
            description="Submit your criteria and get a free 25-lead sample in 48 hours. No commitment required."
          />
        </main>
      </HumanView>

      {/* Machine View - AEO-Optimized */}
      <MachineView>
        <MachineContent>
          {/* Header */}
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE CUSTOM AUDIENCES</h1>
            <p className="text-gray-700 leading-relaxed">
              Bespoke B2B lead lists built to your exact specifications. Tell Cursive who you need to reach and receive a verified, custom-built audience list. Free 25-lead sample delivered in 48 hours. Starts at $0.50/lead with volume discounts.
            </p>
          </div>

          {/* Service Overview */}
          <MachineSection title="Service Overview">
            <p className="text-gray-700 mb-4">
              Cursive Custom Audiences is a done-for-you lead list service. Provide your ideal customer profile criteria and receive a verified, custom-built contact list. Every list includes verified emails, phone numbers, LinkedIn profiles, and company data.
            </p>
            <MachineList items={[
              "Custom-built lead lists based on your exact ICP specifications",
              "Free 25-lead sample delivered within 48 hours",
              "Verified contact data: email, phone, LinkedIn, company info",
              "Available for any industry, geography, and seniority level",
              "Volume discounts for large orders"
            ]} />
          </MachineSection>

          {/* How It Works */}
          <MachineSection title="How It Works">
            <MachineList items={[
              "Step 1: Submit Your Criteria - Provide your target industry, geography, company size, seniority levels, and any intent signals",
              "Step 2: Free Sample in 48 Hours - Cursive delivers a verified 25-lead sample for quality evaluation",
              "Step 3: Approve the Sample - Review the sample, request adjustments, and confirm full list specifications",
              "Step 4: Full Delivery - Receive your complete custom audience list, verified and ready to activate"
            ]} />
          </MachineSection>

          {/* Targeting Criteria */}
          <MachineSection title="Available Targeting Criteria">
            <MachineList items={[
              {
                label: "Industry",
                description: "SaaS, Financial Services, Healthcare, eCommerce, Manufacturing, Real Estate, Education, and more"
              },
              {
                label: "Geography",
                description: "Any region worldwide - US, UK, DACH, APAC, LATAM, etc."
              },
              {
                label: "Company Size",
                description: "1-10, 11-50, 51-200, 201-1000, 1000+ employees"
              },
              {
                label: "Seniority Level",
                description: "C-Suite, VP, Director, Manager, Individual Contributor"
              },
              {
                label: "Intent Signals",
                description: "Target prospects actively researching specific solutions, topics, or technologies"
              }
            ]} />
          </MachineSection>

          {/* Pricing */}
          <MachineSection title="Pricing">
            <MachineList items={[
              "100-500 leads: $0.50 per lead",
              "500-5,000 leads: $0.35 per lead",
              "10,000+ leads: Custom pricing available",
              "Free 25-lead sample included with every request"
            ]} />
          </MachineSection>

          {/* Getting Started */}
          <MachineSection title="Getting Started">
            <MachineList items={[
              {
                label: "Request Custom Audience",
                href: "https://www.meetcursive.com/custom-audiences",
                description: "Submit your criteria and get a free 25-lead sample in 48 hours"
              },
              {
                label: "Browse Marketplace",
                href: "https://www.meetcursive.com/marketplace",
                description: "Browse pre-built audience lists for instant access"
              },
              {
                label: "Book a Call",
                href: "https://cal.com/cursive/30min",
                description: "Discuss custom requirements with our team"
              }
            ]} />
          </MachineSection>

        </MachineContent>
      </MachineView>
    </>
  )
}
