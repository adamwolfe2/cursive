'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const FAQS = [
  {
    q: 'How does the Super Pixel identify 70% of visitors when competitors only get 15%?',
    a: 'Most pixel vendors rely on third-party cookie matching with stale databases. Cursive uses a proprietary first-party identity graph built on 420M+ verified US consumer records, refreshed via 30-day NCOA updates. We match on multiple signals simultaneously — device fingerprint, email hash, IP intelligence, and behavioral patterns — giving us dramatically higher match rates on real, reachable people.',
  },
  {
    q: 'What makes the 0.05% bounce rate possible?',
    a: 'Every email address in our database is validated in real-time against live mailbox checks, not just format validation. We remove role addresses, catch-alls, and known spam traps before they ever reach you. Our 30-day NCOA cycle ensures we flag addresses the moment someone moves or changes providers.',
  },
  {
    q: 'How is this different from Clearbit, 6sense, or RB2B?',
    a: "B2B intent tools like 6sense identify company-level traffic — you get the organization, not the person. RB2B focuses on LinkedIn identification only. Clearbit enriches data you already have. Cursive's Super Pixel uniquely provides person-level identification with full contact data (email, phone, LinkedIn), intent scoring at the individual level, and CAN-SPAM/CCPA-compliant outreach data — all in one.",
  },
  {
    q: 'Is this CAN-SPAM and CCPA compliant?',
    a: 'Yes. All data originates from consumer-consented sources. Our identity graph is built on opt-in data partnerships. Every contact includes suppression flags for do-not-contact registries. We provide DNC list management and unsubscribe handling as part of the platform.',
  },
  {
    q: 'What does the pixel actually collect?',
    a: "The Super Pixel is a lightweight JavaScript snippet (~3KB) that fires on page load. It collects anonymized first-party signals: page URL, referrer, session ID, and a hashed device fingerprint. No PII leaves your domain — the identity resolution happens server-side against our identity graph.",
  },
  {
    q: 'How quickly do identified leads appear?',
    a: 'Real-time. Most matches resolve within 30 seconds of a visitor landing on your page. High-intent visitors (multiple pages, pricing views, return visits) are flagged immediately and can trigger Slack notifications or CRM webhooks.',
  },
  {
    q: 'Do I need a developer to install it?',
    a: 'No. The pixel is a single line of HTML you paste into your website head tag — identical to installing Google Analytics or the Meta Pixel. Average install time is under 5 minutes.',
  },
  {
    q: "What happens to the 30% of visitors you can't identify?",
    a: "No technology identifies 100% — anonymous browsers, VPNs, and privacy tools will always create a floor. The 70% we do identify are real, verified, reachable people. Compare this to your current form conversion rate of 1–3%: even 70% partial identification is 23x more pipeline than the status quo.",
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
