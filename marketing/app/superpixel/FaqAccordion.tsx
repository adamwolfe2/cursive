'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const FAQS = [
  {
    q: 'What does the Super Pixel actually do?',
    a: "It identifies the people visiting your website who don't fill out a form. You get their name, email, phone number, company, and a score that tells you how ready they are to buy — all delivered to your CRM automatically.",
  },
  {
    q: 'How is this different from other tools?',
    a: "Most pixel tools claim high match rates but deliver contacts that bounce or are outdated. Our data comes directly from primary sources and is verified monthly. That's why our email bounce rate is 0.05% while the industry average is 20%+. RB2B only identifies LinkedIn users. 6sense identifies companies, not people. We identify the actual person.",
  },
  {
    q: 'How fast will I see results?',
    a: 'We install the pixel and configure your CRM in under 48 hours. Most clients see their first verified leads the same day the pixel goes live.',
  },
  {
    q: 'Is this legal / privacy compliant?',
    a: 'Yes. All data collection complies with applicable US privacy regulations. We do not collect or store sensitive financial or health information. Every identified contact includes DNC suppression flags so you stay fully compliant.',
  },
  {
    q: "What if my leads don't convert right away?",
    a: "Not every lead is ready to buy today. That's why we include intent scoring. High-intent leads get direct outreach. Medium-intent leads get nurtured. The pixel keeps identifying new visitors every day so your pipeline never dries up.",
  },
  {
    q: 'Can I run this alongside my existing pixel?',
    a: 'Yes. The Super Pixel runs independently with no conflicts. Many clients run it alongside their existing analytics and see an immediate lift in identified visitors.',
  },
  {
    q: 'What does it cost?',
    a: 'Plans start at $299/month for up to 3,000 identified visitors. No setup fees, no contracts, cancel anytime. Most clients see ROI within the first week.',
  },
  {
    q: "What about the visitors you can't identify?",
    a: "No technology identifies 100% — anonymous browsers, VPNs, and privacy tools will always create a floor. We deliberately publish our pixel match rate as 40\u201360% (deterministic, not modeled). Cookie sync sits at 2\u20135%, IP-only databases at 10\u201315%. The matches we do deliver are real, verified, reachable people. Compared to your current form conversion rate of 1\u20133%, even our floor is 15\u201320\u00d7 more pipeline than the status quo.",
  },
]

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-6 py-5 text-left"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
            {open === i
              ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
              : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
            }
          </button>
          {open === i && (
            <div className="px-6 pb-5">
              <p className="text-gray-600 leading-relaxed text-sm">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
