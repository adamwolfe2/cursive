'use client'
import { useState } from 'react'
import { ComparisonTable } from './ComparisonTable'
import { CountUpNumber } from './CountUpNumber'
import { CredibilityBar } from './CredibilityBar'
import { LeadCaptureForm } from './LeadCaptureForm'
import { formatNumber, formatDollar } from '@/lib/superpixel-constants'
import type { calculateScenarios } from '@/lib/superpixel-constants'

const BOOK_ANCHOR = '#book-demo'
const CURSIVE_ANNUAL_COST = 3588 // $299/mo × 12

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
  const [view, setView] = useState<'annual' | 'monthly'>('annual')

  const cursiveRoi = Math.round(results.cursive.annualRevenue / CURSIVE_ANNUAL_COST)
  const dollarPerDollar = Math.round(results.cursive.annualRevenue / CURSIVE_ANNUAL_COST)

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

      {/* Monthly/Annual toggle */}
      {!deck && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-gray-400">View:</span>
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView('annual')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Annual
            </button>
            <button
              onClick={() => setView('monthly')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Monthly
            </button>
          </div>
        </div>
      )}

      <div className={`text-center bg-red-50 border border-red-200 rounded-2xl ${deck ? 'py-3' : 'py-8'}`}>
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
          You&apos;re leaving on the table {view === 'annual' ? 'every year' : 'every month'}
        </p>
        <div className={`font-black text-red-600 ${deck ? 'text-4xl' : 'text-5xl md:text-6xl'}`}>
          <CountUpNumber
            value={view === 'annual' ? results.revenueLeak : Math.round(results.revenueLeak / 12)}
            prefix="$"
            duration={deck ? 1500 : 2500}
          />
        </div>
        {!deck && (
          <p className="text-gray-500 text-sm mt-3 max-w-lg mx-auto">
            {domain} gets an estimated {formatNumber(monthlyVisitors)} visitors/month. With the Super Pixel resolving 40&ndash;60% of them deterministically (vs 2&ndash;5% for cookies, 10&ndash;15% for IP databases), that&apos;s {formatNumber(results.cursive.intentQualified)} verified, intent-scored leads your sales team isn&apos;t getting right now.
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <ComparisonTable results={results} monthlyVisitors={monthlyVisitors} view={view} />
      </div>

      {!deck && <CredibilityBar />}

      {/* ROI Callout — only in non-deck mode */}
      {!deck && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-3">Your ROI with Cursive</p>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-light text-gray-500 mb-0.5">$299<span className="text-sm">/mo</span></div>
              <div className="text-xs text-gray-400">Cursive cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-0.5">{formatDollar(results.cursive.annualRevenue)}</div>
              <div className="text-xs text-gray-400">Pipeline recovered/yr</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-0.5">{cursiveRoi}×</div>
              <div className="text-xs text-gray-400">ROI</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-primary/20 px-4 py-3 text-center">
            <p className="text-gray-800 font-semibold text-sm">
              For every <span className="text-primary">$1</span> you spend on Cursive, you recover{' '}
              <span className="text-emerald-600 font-bold">${dollarPerDollar}</span> in pipeline.
            </p>
          </div>
        </div>
      )}

      <div className={`${deck ? '' : 'space-y-4'} text-center`}>
        <a
          href={deck ? 'https://leads.meetcursive.com/sign-up' : BOOK_ANCHOR}
          className={`inline-block w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-all shadow-lg shadow-primary/25 ${deck ? 'px-8 py-3 text-base' : 'px-10 py-4 text-lg'}`}
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
