/**
 * meetcursive.com/affiliates/terms — Partner Program Legal Agreement
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Partner Program Terms | Cursive',
  robots: { index: true, follow: true },
}

export default function AffiliateTermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/affiliates" className="text-sm text-gray-400 hover:text-primary transition-colors">
            &larr; Back to Partner Program
          </Link>
        </div>

        <h1 className="text-3xl font-light text-gray-900 mb-2">Cursive Partner Program Agreement</h1>
        <p className="text-sm text-gray-400 mb-10">Version 1.0 &mdash; Effective March 4, 2026</p>

        <div className="space-y-8 text-[15px] text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Program Overview</h2>
            <p>
              The Cursive Partner Program (the &ldquo;Program&rdquo;) allows approved individuals and organizations (&ldquo;Partners&rdquo;)
              to earn rewards by referring new customers to Cursive. Participation is subject to approval by Cursive
              and acceptance of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Commission Structure and Payment</h2>
            <p className="mb-3">Partners earn rewards based on their activation milestone tier:</p>
            <ul className="space-y-1 list-disc pl-5 mb-3">
              <li>Tiers 0&ndash;4 (0&ndash;49 activations): No recurring commission. Milestone cash bonuses only.</li>
              <li>Tier 5 (50&ndash;99 activations): 10% recurring commission on referred customers&rsquo; payments.</li>
              <li>Tier 6 (100+ activations): 20% recurring commission on referred customers&rsquo; payments, for life.</li>
            </ul>
            <p className="mb-3">Cash milestone bonuses:</p>
            <ul className="space-y-1 list-disc pl-5">
              <li>5 activations: $50</li>
              <li>10 activations: $150</li>
              <li>15 activations: $250</li>
              <li>30 activations: $500</li>
              <li>50 activations: $1,000</li>
              <li>100 activations: $2,500</li>
            </ul>
            <p className="mt-3">
              Payouts are processed on the 1st of each calendar month via Stripe. Partners must complete
              Stripe Connect onboarding to receive electronic transfers. A <strong>minimum payout threshold of $50</strong> applies &mdash;
              amounts below this threshold roll over to the following month.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Clawbacks and Refunds</h2>
            <p>
              Commissions are subject to clawback if a referred customer cancels their subscription or receives
              a refund within 30 days of the triggering payment. In such cases, the corresponding commission will
              be reversed. If the commission has already been paid, the clawback amount will be deducted from
              future earnings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. FTC Disclosure Requirements</h2>
            <p>
              Partners must clearly and conspicuously disclose their affiliate relationship with Cursive whenever
              promoting Cursive to their audience. This includes, but is not limited to: social media posts,
              newsletter mentions, podcast sponsorships, blog posts, and video content. A disclosure such as
              &ldquo;affiliate link,&rdquo; &ldquo;I&rsquo;m a Cursive partner,&rdquo; or &ldquo;I may earn a commission&rdquo; is required by Federal
              Trade Commission guidelines. Failure to disclose may result in immediate program termination.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Prohibited Conduct</h2>
            <p className="mb-3">Partners may not engage in the following:</p>
            <ul className="space-y-1 list-disc pl-5">
              <li><strong>Brand keyword bidding:</strong> Bidding on &ldquo;Cursive,&rdquo; &ldquo;meetcursive,&rdquo; or any Cursive trademark in paid search advertising.</li>
              <li><strong>Spam:</strong> Sending unsolicited emails or messages promoting your referral link.</li>
              <li><strong>False claims:</strong> Making any false, misleading, or unverified claims about Cursive&rsquo;s products or services.</li>
              <li><strong>Self-referral:</strong> Referring yourself, your own business entities, or immediate family members.</li>
              <li><strong>Cookie stuffing or forced clicks:</strong> Any technique that artificially creates attribution without genuine user intent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Termination</h2>
            <p>
              Cursive reserves the right to suspend or terminate a Partner&rsquo;s participation in the Program at any
              time, for any reason, with or without notice. If a Partner is terminated <strong>for cause</strong> (e.g.,
              violation of these terms, fraud, or misconduct), all pending and unpaid commissions and milestone
              bonuses are forfeited. If terminated without cause, any earned amounts above the $50 minimum
              threshold will be paid in the next regular payout cycle.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Tax Responsibility</h2>
            <p>
              Partners are independent contractors, not employees of Cursive. Cursive will issue a 1099-NEC to
              US-based Partners who earn $600 or more in a calendar year, as required by US tax law. International
              Partners may be required to complete a W-8BEN form. Stripe Connect Express automatically collects
              the required tax documentation during onboarding. <strong>Cursive never stores raw Social Security
              Numbers, EINs, or tax identification numbers in its own systems</strong> &mdash; this data is handled
              exclusively by Stripe. Partners are solely responsible for their own tax compliance, including
              reporting and paying any applicable taxes on earnings received through the Program.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Attribution</h2>
            <p>
              Referral attribution is first-touch only. When a visitor clicks your referral link, a 30-day
              cookie is set. If that visitor subsequently signs up for Cursive within 30 days, the referral
              is credited to you. If the visitor already had another affiliate&rsquo;s cookie, your attribution
              will not overwrite it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Modifications</h2>
            <p>
              Cursive reserves the right to modify the Program structure, commission rates, and these terms
              at any time. Material changes will be communicated by email at least 30 days in advance.
              Continued participation in the Program after the effective date of changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Governing Law</h2>
            <p>
              This Agreement is governed by the laws of the State of Delaware, without regard to conflict of
              law principles. Any disputes arising from this Agreement will be resolved through binding
              arbitration in accordance with the American Arbitration Association&rsquo;s Commercial Arbitration Rules.
            </p>
          </section>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-400">
              Version 1.0 &mdash; Effective March 4, 2026 &middot; Questions? Contact{' '}
              <a href="mailto:adam@meetcursive.com" className="text-primary hover:underline">
                adam@meetcursive.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
