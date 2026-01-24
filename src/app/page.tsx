import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b border-zinc-200">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <span className="text-xl font-medium text-zinc-900">Cursive</span>
          </div>
          <div className="flex gap-x-3">
            <Link
              href="/login"
              className="text-[13px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="h-9 px-4 inline-flex items-center rounded-lg bg-zinc-900 text-[13px] font-medium text-white hover:bg-zinc-800 transition-all duration-150"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="flex-1 bg-white">
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
            <div className="text-center">
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
                Identify companies researching your topics
              </h1>
              <p className="mt-6 text-lg leading-8 text-zinc-600">
                Cursive tracks B2B intent signals to help you discover companies
                actively researching specific topics. Get enriched lead data
                delivered automatically.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-4">
                <Link
                  href="/signup"
                  className="h-10 px-5 inline-flex items-center rounded-lg bg-zinc-900 text-[13px] font-medium text-white hover:bg-zinc-800 transition-all duration-150"
                >
                  Get started for free
                </Link>
                <Link
                  href="/login"
                  className="text-[13px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Learn more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-[13px] font-medium text-zinc-600 uppercase tracking-wide">
                B2B Lead Intelligence
              </h2>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Everything you need to find your next customers
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                <div className="relative pl-16">
                  <dt className="text-[15px] font-medium text-zinc-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                        />
                      </svg>
                    </div>
                    Topic Tracking
                  </dt>
                  <dd className="mt-2 text-[13px] leading-6 text-zinc-600">
                    Track companies researching specific topics relevant to your
                    business. Get notified when new leads appear.
                  </dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-[15px] font-medium text-zinc-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                        />
                      </svg>
                    </div>
                    Contact Enrichment
                  </dt>
                  <dd className="mt-2 text-[13px] leading-6 text-zinc-600">
                    Automatically enrich leads with verified contact information.
                    Get decision-maker emails and phone numbers.
                  </dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-[15px] font-medium text-zinc-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                        />
                      </svg>
                    </div>
                    Trending Topics
                  </dt>
                  <dd className="mt-2 text-[13px] leading-6 text-zinc-600">
                    Discover trending topics in your industry. See what companies
                    are researching before your competitors.
                  </dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-[15px] font-medium text-zinc-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z"
                        />
                      </svg>
                    </div>
                    Integrations
                  </dt>
                  <dd className="mt-2 text-[13px] leading-6 text-zinc-600">
                    Connect with Slack, Zapier, or your CRM. Get leads delivered
                    where you work.
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mx-auto max-w-7xl px-6 pb-32 sm:pb-40 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Start finding leads today
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-600">
                Join companies using Cursive to identify their next customers.
                Free plan includes 3 leads per day.
              </p>
              <div className="mt-10 flex items-center gap-x-4">
                <Link
                  href="/signup"
                  className="h-10 px-5 inline-flex items-center rounded-lg bg-zinc-900 text-[13px] font-medium text-white hover:bg-zinc-800 transition-all duration-150"
                >
                  Get started for free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-[12px] text-zinc-500">
              &copy; 2026 Cursive. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
