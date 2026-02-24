'use client'
import { ComparisonTable } from './ComparisonTable'
import { CountUpNumber } from './CountUpNumber'
import { CredibilityBar } from './CredibilityBar'
import { LeadCaptureForm } from './LeadCaptureForm'
import { formatNumber } from '@/lib/superpixel-constants'
import type { calculateScenarios } from '@/lib/superpixel-constants'

const BOOK_ANCHOR = '#book-demo'

interface Props {
  results: ReturnType<typeof calculateScenarios>
  domain: string
  monthlyVisitors: number
  dealSize: number
  industry: string
  siteData?: { title?: string; image?: string; favicon?: string } | null
  onReset: () => void
  deck?: boolean
}

export function ResultsDashboard({ results, domain, monthlyVisitors, dealSize, industry, siteData, onReset, deck = false }: Props) {
  return (
    <div className={deck ? 'space-y-3' : 'space-y-8'}>
      <div className="flex items-center gap-4">
        {siteData?.favicon && (
          <img src={siteData.favicon} alt="" className={deck ? 'w-6 h-6 rounded' : 'w-8 h-8 rounded'} />
        )}
        <div>
          <h3 className={`text-gray-900 font-bold ${deck ? 'text-base' : 'text-lg'}`}>{domain}</h3>
          {siteData?.title && <p className="text-gray-500 text-xs">{siteData.title}</p>}
        </div>
        <button onClick={onReset} className="ml-auto text-gray-400 hover:text-gray-700 text-sm border border-gray-200 px-3 py-1 rounded transition-all">
          ← Recalculate
        </button>
      </div>

      <div className={`text-center bg-red-50 border border-red-200 rounded-2xl ${deck ? 'py-3' : 'py-8'}`}>
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">You&apos;re leaving on the table every year</p>
        <div className={`font-black text-red-600 ${deck ? 'text-4xl' : 'text-5xl md:text-6xl'}`}>
          <CountUpNumber value={results.revenueLeak} prefix="$" duration={deck ? 1500 : 2500} />
        </div>
        {!deck && (
          <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">
            {domain} gets an estimated {formatNumber(monthlyVisitors)} visitors/month. With the Super Pixel identifying 70% of them at a 0.05% bounce rate, that&apos;s {formatNumber(results.cursive.intentQualified)} verified, intent-scored leads your sales team isn&apos;t getting right now.
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <ComparisonTable results={results} monthlyVisitors={monthlyVisitors} />
      </div>

      {!deck && <CredibilityBar />}

      <div className={`${deck ? '' : 'space-y-4'} text-center`}>
        <a
          href={deck ? 'https://leads.meetcursive.com/sign-up' : BOOK_ANCHOR}
          className={`inline-block w-full sm:w-auto bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold rounded-lg transition-all shadow-lg shadow-[#007AFF]/25 ${deck ? 'px-8 py-3 text-base' : 'px-10 py-4 text-lg'}`}
        >
          {deck ? 'Install the Pixel on This Call →' : 'Book a Free Demo — See It Running on Your Site'}
        </a>
        {!deck && (
          <div className="pt-2">
            <p className="text-gray-500 text-sm mb-3">Or get your full revenue report emailed to you:</p>
            <LeadCaptureForm
              domain={domain}
              monthlyVisitors={monthlyVisitors}
              dealSize={dealSize}
              industry={industry}
              revenueLeak={results.revenueLeak}
              cursiveAdvantage={results.cursiveAdvantage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
