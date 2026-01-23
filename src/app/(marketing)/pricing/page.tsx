/**
 * Pricing Page
 * LeadMe Platform
 */

import Link from 'next/link'

export const metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for B2B lead intelligence.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 py-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            Start free and upgrade when you need more leads. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Free</h2>
            <p className="text-zinc-600 mb-6">For getting started</p>
            <div className="text-5xl font-bold text-zinc-900 mb-6">
              $0<span className="text-lg font-normal text-zinc-500">/mo</span>
            </div>

            <ul className="space-y-4 text-zinc-600 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                3 leads per day
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                1 active query
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email delivery
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic intent scoring
              </li>
            </ul>

            <Link
              href="/signup"
              className="block w-full py-3 text-center border-2 border-zinc-900 text-zinc-900 font-semibold rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-zinc-900 text-white rounded-2xl p-8 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-sm font-medium rounded-full">
              Most Popular
            </span>
            <h2 className="text-2xl font-bold mb-2">Pro</h2>
            <p className="text-zinc-400 mb-6">For growing teams</p>
            <div className="text-5xl font-bold mb-6">
              $50<span className="text-lg font-normal text-zinc-400">/mo</span>
            </div>

            <ul className="space-y-4 text-zinc-300 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                1,000 leads per day
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                5 active queries
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email + Slack delivery
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Webhooks & CSV exports
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced intent scoring
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Contact enrichment
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority support
              </li>
            </ul>

            <Link
              href="/signup"
              className="block w-full py-3 text-center bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Start 14-Day Trial
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
              <h3 className="font-semibold text-zinc-900 mb-2">What counts as a lead?</h3>
              <p className="text-zinc-600">A lead is a company we identify that matches your query criteria and shows intent signals for your topic. Each enriched contact at that company also counts as one lead.</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
              <h3 className="font-semibold text-zinc-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-zinc-600">Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
              <h3 className="font-semibold text-zinc-900 mb-2">Do unused leads roll over?</h3>
              <p className="text-zinc-600">Daily lead limits reset each day and do not roll over. This ensures you&apos;re always getting fresh, relevant leads.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
