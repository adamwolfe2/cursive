'use client'
import { ComparisonTable } from './ComparisonTable'
import { CountUpNumber } from './CountUpNumber'
import { CredibilityBar } from './CredibilityBar'
import { LeadCaptureForm } from './LeadCaptureForm'
import { formatNumber } from '@/lib/superpixel-constants'
import type { calculateScenarios } from '@/lib/superpixel-constants'

const CAL_LINK = 'https://cal.com/cursive/30min'

interface Props {
  results: ReturnType<typeof calculateScenarios>
  domain: string
  monthlyVisitors: number
  dealSize: number
  industry: string
  siteData?: { title?: string; image?: string; favicon?: string } | null
  onReset: () => void
}

export function ResultsDashboard({ results, domain, monthlyVisitors, dealSize, industry, siteData, onReset }: Props) {
  return (
    <div className="space-y-8">
      {/* Site info header */}
      <div className="flex items-center gap-4">
        {siteData?.favicon && (
          <img src={siteData.favicon} alt="" className="w-8 h-8 rounded" />
        )}
        <div>
          <h3 className="text-white font-bold text-lg">{domain}</h3>
          {siteData?.title && <p className="text-white/50 text-sm">{siteData.title}</p>}
        </div>
        <button onClick={onReset} className="ml-auto text-white/40 hover:text-white/70 text-sm border border-white/10 px-3 py-1 rounded transition-all">
          &larr; Recalculate
        </button>
      </div>

      {/* Revenue leak hero */}
      <div className="text-center py-8 bg-red-500/5 border border-red-500/20 rounded-2xl">
        <p className="text-white/60 text-sm uppercase tracking-wider mb-2">You&apos;re leaving on the table every year</p>
        <div className="text-5xl md:text-6xl font-black text-red-400">
          <CountUpNumber value={results.revenueLeak} prefix="$" duration={2500} />
        </div>
        <p className="text-white/50 text-sm mt-3 max-w-lg mx-auto">
          {domain} gets an estimated {formatNumber(monthlyVisitors)} visitors/month. With the Super Pixel identifying 70% of them at a 0.05% bounce rate, that&apos;s {formatNumber(results.cursive.intentQualified)} verified, intent-scored leads your sales team isn&apos;t getting right now.
        </p>
      </div>

      {/* Comparison table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <ComparisonTable results={results} monthlyVisitors={monthlyVisitors} />
      </div>

      {/* Credibility bar */}
      <CredibilityBar />

      {/* CTA section */}
      <div className="space-y-4 text-center">
        <a
          href={CAL_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full sm:w-auto px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg rounded-lg transition-all shadow-lg shadow-emerald-500/25"
        >
          Book a Free Demo — See It Running on Your Site
        </a>
        <div className="pt-2">
          <p className="text-white/40 text-sm mb-3">Or get your full revenue report emailed to you:</p>
          <LeadCaptureForm
            domain={domain}
            monthlyVisitors={monthlyVisitors}
            dealSize={dealSize}
            industry={industry}
            revenueLeak={results.revenueLeak}
            cursiveAdvantage={results.cursiveAdvantage}
          />
        </div>
      </div>
    </div>
  )
}
