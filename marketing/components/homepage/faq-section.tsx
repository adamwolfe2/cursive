"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Container } from "@/components/ui/container"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { trackDemoBooked } from "@/lib/analytics"
import { BOOKING_URL } from "@/lib/cta"

interface FAQ {
  question: string
  answer: string
}

// Short, sourced answers only. Claims here must match the pricing cards and the homepage FAQ schema in app/page.tsx.
const faqs: FAQ[] = [
  {
    question: "Where do the 25 people come from?",
    answer: "We read your website, work out who buys from you, and match that profile against 400M+ business contacts, multi-sourced and enriched across several databases. You get 25 decision makers who fit, each with a work email and a reason they fit.",
  },
  {
    question: "How accurate are the emails?",
    answer: "Every email is checked before it reaches you. If we cannot verify a work email, that person is left out of your list.",
  },
  {
    question: "What happens after the free 25?",
    answer: "Nothing, unless you want more. Buy credits (100 leads for $49), take 100 leads a month on Starter for $197, or have us run LinkedIn and email outreach to your list from $1,497 a month. All month-to-month.",
  },
  {
    question: "How is Cursive different from ZoomInfo or Apollo?",
    answer: "Databases sell you contacts and leave the rest to you. Cursive starts from who actually buys from you, learns from the leads you like and your past customers, and can run the outreach for you.",
  },
  {
    question: "Is Cursive compliant?",
    answer: "We follow GDPR and CCPA, honor opt-outs, and never sell your data to third parties.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-[#0f172a] sm:text-[2.5rem] mb-4">
              Questions, answered
            </h2>
            <p className="text-[17px] text-[#475569] max-w-2xl mx-auto">
              Short answers. Book a call for the rest.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index

              return (
                <motion.div
                  key={index}
                  initial={false}
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
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackDemoBooked("faq_section")}
              className="inline-flex min-h-11 items-center gap-2 font-medium text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 transition-colors hover:decoration-[#007AFF]"
            >
              Book a call with our team
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>
        </Container>
      </section>
    </>
  )
}
