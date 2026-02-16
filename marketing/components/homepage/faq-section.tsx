"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Container } from "@/components/ui/container"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { cn } from "@/lib/utils"
import { trackDemoBooked } from "@/lib/analytics"

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: "How does visitor identification work?",
    answer: "Cursive uses advanced IP intelligence, device fingerprinting, and behavioral analysis to identify up to 70% of your anonymous website visitors in real-time. When someone visits your site, we instantly match their digital footprint against our database of 220M+ consumer and 140M+ business profiles to reveal who they are, which company they work for, and what pages they're viewing. Unlike batch processing tools, Cursive identifies visitors the moment they land on your site, so your sales team can reach out while they're still engaged."
  },
  {
    question: "How accurate is the data?",
    answer: "Cursive maintains a 70% identification rate for B2B traffic with 95%+ accuracy on matched records. Our data is verified and updated in real-time from multiple authoritative sources including business registries, public records, and verified professional networks. Each visitor record includes confidence scores, and we only surface leads that meet our quality thresholds. We track 450B+ monthly intent signals to ensure you're reaching prospects with current, verified information."
  },
  {
    question: "What pricing plans are available?",
    answer: "Cursive pricing typically ranges from $2,000-5,000/month for most B2B SaaS companies, depending on your website traffic volume and feature requirements. All plans include visitor identification, AI-powered outreach, and CRM integrations. Enterprise plans add custom intent audiences, dedicated onboarding, and priority support. We offer transparent pricing with no hidden fees, and you can book a free AI audit to see exactly which features you need and get a custom quote tailored to your use case."
  },
  {
    question: "What integrations does Cursive support?",
    answer: "Cursive natively integrates with 200+ tools including all major CRMs (Salesforce, HubSpot, Pipedrive), marketing automation platforms (Marketo, Pardot, ActiveCampaign), and ad platforms (Google Ads, Facebook, LinkedIn). Our two-way sync updates records in real-time, so identified visitors automatically flow into your existing workflows. Setup takes 10-15 minutes per integration, and our team provides hands-on support to ensure seamless data flow between Cursive and your tech stack."
  },
  {
    question: "Is Cursive compliant with privacy regulations?",
    answer: "Yes, Cursive is fully compliant with GDPR, CCPA, and other major privacy regulations. We only collect and process data in accordance with legal frameworks, provide opt-out mechanisms, respect Do Not Track signals, and maintain strict data handling policies. Our infrastructure is SOC 2 Type II certified, and we conduct regular security audits. All data is encrypted in transit and at rest, and we never sell or share your data with third parties."
  },
  {
    question: "How long does implementation take?",
    answer: "Most teams are live within 24 hours. Implementation consists of three quick steps: 1) Install our tracking pixel (5 minutes), 2) Connect your CRM and other tools (10-15 minutes per integration), and 3) Configure your AI outreach campaigns (15-20 minutes). Our team provides hands-on setup support, and you'll start seeing identified visitors immediately after installing the pixel. Full onboarding with AI training and custom audiences typically completes within 1-2 weeks."
  },
  {
    question: "What data sources does Cursive use?",
    answer: "Cursive aggregates data from multiple authoritative sources including business registries, public records, verified professional networks, and real-time intent signals. Our database includes 220M+ consumer profiles, 140M+ business profiles, and 450B+ monthly intent signals tracked across 30,000+ commercial categories. We continuously refresh data to maintain accuracy, with weekly updates to intent audiences and real-time enrichment for visitor identification. All data sources are vetted for compliance and quality."
  },
  {
    question: "What support and onboarding is included?",
    answer: "Every Cursive customer receives hands-on onboarding with a dedicated success manager who helps with technical setup, integration configuration, and campaign strategy. We provide ongoing support via email, chat, and scheduled strategy calls to optimize your campaigns and maximize ROI. Our team also offers training on AI voice configuration, audience building, and advanced features. Documentation, video tutorials, and best practices are available 24/7 in our knowledge base."
  },
  {
    question: "What kind of ROI can I expect?",
    answer: "Most customers see 3-5x ROI within the first 90 days. Typical results include converting 20-30% of previously anonymous traffic into qualified leads, reducing customer acquisition costs by 40-60%, and booking 10-20 qualified meetings per month on autopilot. B2B SaaS companies report going from 3 leads per week to 50+ qualified conversations per month. ROI comes from converting existing traffic without additional ad spend, automating manual outreach work, and reaching in-market buyers at the right time."
  },
  {
    question: "How is Cursive different from competitors?",
    answer: "Unlike traditional visitor ID tools that just deliver data, Cursive combines identification with AI-powered activation—we don't just tell you who's visiting, we automatically reach out and book meetings. Compared to data providers like Clearbit or ZoomInfo, Cursive includes 450B+ intent signals, real-time identification, and multi-channel campaigns out of the box. Unlike marketing automation tools, Cursive works on anonymous traffic and uses AI agents instead of manual workflows. You get visitor identification, intent data, AI outreach, and CRM integration in one unified platform."
  }
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  // Generate FAQ schema markup
  const faqSchema = generateFAQSchema({
    faqs,
    pageUrl: "https://www.meetcursive.com"
  })

  return (
    <>
      <StructuredData data={faqSchema} />

      <section id="faq" className="py-20 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to know about visitor identification and AI-powered outreach
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-lg transition-shadow"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <h3 className="text-lg font-medium text-gray-900 flex-1">
                      {faq.question}
                    </h3>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="h-5 w-5 text-gray-500" aria-hidden="true" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.3,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-2 bg-gray-50">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>

          {/* CTA after FAQs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <a
              href="https://cal.com/cursive/30min"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackDemoBooked("faq_section")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#007AFF] text-white rounded-lg font-medium hover:bg-[#0066DD] transition-colors"
            >
              Book a Free AI Audit
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>
        </Container>
      </section>
    </>
  )
}
