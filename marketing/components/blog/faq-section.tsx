'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQ {
  question: string
  answer: string
}

interface FAQSectionProps {
  faqs: FAQ[]
  pageUrl?: string
}

export function FAQSection({ faqs, pageUrl }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  if (faqs.length === 0) return null

  // Generate FAQ schema markup
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section className="my-12 print:my-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index

            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left px-6 py-4 bg-white hover:bg-gray-50 transition-colors flex items-start justify-between gap-4 print:bg-gray-50"
                  aria-expanded={isOpen}
                >
                  <h3 className="text-lg font-medium text-gray-900 flex-1">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-gray-500 flex-shrink-0 transition-transform print:hidden',
                      isOpen && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </button>
                <div
                  className={cn(
                    'px-6 bg-gray-50 overflow-hidden transition-all duration-300',
                    isOpen ? 'py-4 max-h-96' : 'max-h-0 py-0',
                    'print:max-h-full print:py-4'
                  )}
                >
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
