/**
 * Marketing Homepage
 * OpenInfo Platform
 *
 * Simple landing page that works with static generation.
 */

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 mb-6">
            B2B Lead Intelligence Platform
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold text-zinc-900 mb-6 tracking-tight">
            Find companies actively researching{' '}
            <span className="text-emerald-600">your solution</span>
          </h1>
          <p className="text-xl text-zinc-600 mb-10 max-w-2xl mx-auto">
            Identify high-intent leads based on what they&apos;re researching.
            Get enriched contact data delivered to your inbox daily.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 border-2 border-zinc-300 text-zinc-900 font-semibold rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
          <p className="text-sm text-zinc-500 mt-6">
            No credit card required · 3 leads/day free · Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-4">
            How it works
          </h2>
          <p className="text-zinc-600 text-center mb-16 max-w-2xl mx-auto">
            Get high-intent B2B leads in three simple steps
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                Create a Query
              </h3>
              <p className="text-zinc-600">
                Use our wizard to define your ideal customer by topic, location, company size, and industry.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                We Find Leads Daily
              </h3>
              <p className="text-zinc-600">
                Our AI scans millions of data points to find companies actively researching topics relevant to you.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                Get Enriched Contacts
              </h3>
              <p className="text-zinc-600">
                Receive verified decision-maker contacts with emails, delivered to your inbox or Slack.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-4">
            Simple pricing
          </h2>
          <p className="text-zinc-600 text-center mb-12">
            Start free, upgrade when you need more
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-zinc-200 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-zinc-900 mb-4">$0<span className="text-lg font-normal text-zinc-500">/mo</span></div>
              <ul className="space-y-3 text-zinc-600 mb-8">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  3 leads per day
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  1 active query
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Email delivery
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 text-center border-2 border-zinc-900 text-zinc-900 font-semibold rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            <div className="bg-zinc-900 text-white rounded-2xl p-8 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-sm font-medium rounded-full">
                Most Popular
              </span>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-4">$50<span className="text-lg font-normal text-zinc-400">/mo</span></div>
              <ul className="space-y-3 text-zinc-300 mb-8">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  1,000 leads per day
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  5 active queries
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Email + Slack delivery
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Webhooks & CSV exports
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
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-8 bg-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to find your next customers?
          </h2>
          <p className="text-zinc-400 mb-8">
            Join businesses using intent data to reach the right people at the right time.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  )
}
