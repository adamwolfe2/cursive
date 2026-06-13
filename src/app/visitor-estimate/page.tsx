import type { Metadata } from 'next'
import { VisitorEstimateCalculator } from './VisitorEstimateCalculator'

export const metadata: Metadata = {
  title: 'How many leads is your website losing? | Cursive',
  description:
    "97% of your visitors leave without identifying themselves. Run a free 30-second estimate to see how many named leads — and how much revenue — your site is leaving on the table.",
  openGraph: {
    title: 'See how many leads your website is losing',
    description:
      'Run a free 30-second estimate on your own traffic. No pixel, no install — just the numbers.',
    url: 'https://leads.meetcursive.com/visitor-estimate',
    siteName: 'Cursive',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'See how many leads your website is losing',
    description: 'Run a free 30-second estimate on your own traffic.',
  },
}

const PROOF = [
  { stat: '60–70%', label: 'of visitors identifiable' },
  { stat: '420M+', label: 'US consumer profiles' },
  { stat: '60B+', label: 'daily intent signals' },
  { stat: '0.05%', label: 'email bounce rate' },
]

export default function VisitorEstimatePage() {
  return (
    <div className="min-h-screen bg-[#F7F9FB]">
      <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Free · 30 seconds · No pixel required
          </span>

          <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            How many leads is your website{' '}
            <span className="text-blue-600">quietly losing?</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-600">
            97% of your visitors leave without ever telling you who they are. Plug in your numbers
            and see exactly how much pipeline is walking out the door —{' '}
            <span className="font-medium text-gray-900">on your own traffic, instantly.</span>
          </p>
        </div>

        {/* Calculator card */}
        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <VisitorEstimateCalculator />
        </div>

        {/* Proof strip */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PROOF.map((p) => (
            <div key={p.label} className="rounded-xl border border-gray-200 bg-white px-4 py-5 text-center">
              <div className="text-2xl font-bold text-blue-600">{p.stat}</div>
              <div className="mt-1 text-xs leading-snug text-gray-500">{p.label}</div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-lg text-center text-sm leading-relaxed text-gray-400">
          This is an estimate based on your inputs and Cursive&apos;s identification benchmarks —
          no tracking pixel is installed and your site is never touched. Want the real numbers? We&apos;ll show you live.
        </p>
      </main>
    </div>
  )
}
