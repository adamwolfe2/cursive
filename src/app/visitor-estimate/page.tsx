import type { Metadata } from 'next'
import { RevenueCalculator } from '@/components/revenue-calculator/RevenueCalculator'

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
  { stat: '70%', label: 'of visitors identifiable' },
  { stat: '420M+', label: 'US consumer profiles' },
  { stat: '60B+', label: 'daily intent signals' },
  { stat: '0.05%', label: 'email bounce rate' },
]

export default function VisitorEstimatePage() {
  return (
    <div className="min-h-screen bg-[#070b09] text-white">
      {/* ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(60rem 40rem at 50% -10%, rgba(16,185,129,0.10), transparent 70%)',
        }}
      />

      <main className="relative mx-auto w-full max-w-3xl px-5 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Free · 30 seconds · No pixel required
          </span>

          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            How many leads is your website
            <span className="text-emerald-400"> quietly losing?</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/60">
            97% of your visitors leave without ever telling you who they are. Plug in your
            numbers and see exactly how much pipeline is walking out the door —{' '}
            <span className="text-white/80">on your own traffic, instantly.</span>
          </p>
        </div>

        {/* Calculator card */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 sm:p-8">
          <RevenueCalculator captureEndpoint="/api/visitor-estimate/submit" />
        </div>

        {/* Proof strip */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PROOF.map((p) => (
            <div
              key={p.label}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-5 text-center"
            >
              <div className="text-2xl font-black text-emerald-400">{p.stat}</div>
              <div className="mt-1 text-xs leading-snug text-white/50">{p.label}</div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-lg text-center text-sm leading-relaxed text-white/40">
          This is an estimate based on your inputs and Cursive&apos;s identification benchmarks —
          no tracking pixel is installed and your site is never touched. Want the real numbers?
          We&apos;ll show you live.
        </p>
      </main>
    </div>
  )
}
