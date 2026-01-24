/**
 * Marketing Homepage
 * Cursive Platform
 *
 * Landing page for service industry lead generation.
 */

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-800 mb-6">
            Buyer-Intent Lead Generation
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold text-zinc-900 mb-6 tracking-tight">
            Get buyer-intent leads{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">delivered daily</span>
          </h1>
          <p className="text-xl text-zinc-600 mb-10 max-w-2xl mx-auto">
            We deliver high-intent leads from enrichment platforms directly to your dashboard.
            Auto-routed by location and industry for service businesses.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
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

      {/* Industries Section */}
      <section className="py-16 px-6 lg:px-8 bg-white border-y border-zinc-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm font-medium text-zinc-500 mb-8">
            TRUSTED BY SERVICE BUSINESSES IN
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-zinc-400">
            {['HVAC', 'Roofing', 'Plumbing', 'Real Estate', 'Solar', 'Electrical'].map((industry) => (
              <span key={industry} className="text-lg font-semibold">{industry}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-4">
            How it works
          </h2>
          <p className="text-zinc-600 text-center mb-16 max-w-2xl mx-auto">
            Get high-intent leads for your service business in three simple steps
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                Set Your Service Area
              </h3>
              <p className="text-zinc-600">
                Tell us your industry and the states where you serve customers. We&apos;ll match you with relevant leads.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                We Route Leads to You
              </h3>
              <p className="text-zinc-600">
                Our platform receives buyer-intent data from Audience Labs, DataShopper, and other enrichment sources.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                Close More Deals
              </h3>
              <p className="text-zinc-600">
                Get leads with name, contact info, and what they&apos;re actively searching for. Reach out while intent is hot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Sources Section */}
      <section className="py-20 px-6 lg:px-8 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-4">
            Premium data sources
          </h2>
          <p className="text-zinc-600 text-center mb-12 max-w-2xl mx-auto">
            We aggregate buyer-intent signals from the best enrichment platforms
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Audience Labs', desc: 'Intent data from browsing behavior and content consumption' },
              { name: 'DataShopper', desc: 'Purchase intent signals from shopping research patterns' },
              { name: 'Clay Enrichment', desc: 'Contact data enrichment with verified emails and phone numbers' },
            ].map((source) => (
              <div key={source.name} className="bg-white rounded-xl p-6 border border-zinc-200">
                <h3 className="font-semibold text-zinc-900 mb-2">{source.name}</h3>
                <p className="text-sm text-zinc-600">{source.desc}</p>
              </div>
            ))}
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
            Start free, upgrade when you need more leads
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-zinc-200 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-zinc-900 mb-4">$0<span className="text-lg font-normal text-zinc-500">/mo</span></div>
              <ul className="space-y-3 text-zinc-600 mb-8">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  3 leads per day
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Basic lead info
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Email notifications
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 text-center border-2 border-zinc-900 text-zinc-900 font-semibold rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl p-8 relative shadow-xl shadow-violet-500/25">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-400 text-amber-900 text-sm font-medium rounded-full">
                Most Popular
              </span>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-4">$50<span className="text-lg font-normal text-violet-200">/mo</span></div>
              <ul className="space-y-3 text-violet-100 mb-8">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  1,000 leads per day
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Full lead data + enrichment
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Real-time dashboard updates
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  API access & webhooks
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 text-center bg-white text-violet-600 font-semibold rounded-lg hover:bg-violet-50 transition-colors"
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
            Ready to grow your service business?
          </h2>
          <p className="text-zinc-400 mb-8">
            Join hundreds of HVAC, roofing, plumbing, and real estate businesses getting high-intent leads daily.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  )
}
