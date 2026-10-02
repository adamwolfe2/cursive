"use client"

import { useState } from "react"
import { ArrowRight, Plus } from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { trackDemoBooked } from "@/lib/analytics"
import { BOOKING_URL } from "@/lib/cta"
import { H2 } from "./type"
import { faqs as homeFaqs, type FAQ } from "./faq-data"

export function FAQSection({
  items = homeFaqs,
  pageUrl = "https://www.meetcursive.com",
  title = "Questions, answered",
  intro = "Short answers here. For anything else, talk to the team that builds your list.",
}: {
  items?: FAQ[]
  pageUrl?: string
  title?: string
  intro?: string
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  // Generate FAQ schema markup
  const faqSchema = generateFAQSchema({ faqs: items, pageUrl })

  return (
    <>
      <StructuredData data={faqSchema} />

      <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-20 bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 id="faq-heading" className={H2}>
              {title}
            </h2>
            <p className="mt-4 max-w-[34ch] text-[17px] leading-relaxed text-[#475569]">
              {intro}
            </p>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackDemoBooked("faq_section")}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md text-[15px] font-semibold text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 transition-colors hover:decoration-[#007AFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
            >
              Book a call
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <ul className="border-t border-[#e2e8f0]">
            {items.map((faq, index) => {
              const isOpen = openIndex === index
              return (
                <li key={faq.question} className="border-b border-[#e2e8f0]">
                  <h3>
                    <button
                      type="button"
                      onClick={() => toggleFAQ(index)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      id={`faq-question-${index}`}
                      className="group flex w-full items-center justify-between gap-6 py-6 text-left text-[17px] font-semibold text-[#0f172a] transition-colors hover:text-[#0066DD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] sm:text-[19px]"
                    >
                      {faq.question}
                      <Plus
                        className={`h-5 w-5 shrink-0 text-[#94a3b8] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-[#007AFF] ${isOpen ? "rotate-45" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>
                  {/* Opens by animating grid rows, not height, so nothing measures layout. */}
                  <div
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden" inert={!isOpen}>
                      <p className="max-w-[62ch] pb-6 text-[16px] leading-relaxed text-[#475569]">{faq.answer}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
