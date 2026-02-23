'use client'
import { CountUpNumber } from './CountUpNumber'
import { formatNumber } from '@/lib/superpixel-constants'
import type { calculateScenarios } from '@/lib/superpixel-constants'

interface Props {
  results: ReturnType<typeof calculateScenarios>
  monthlyVisitors: number
}

export function ComparisonTable({ results, monthlyVisitors: _monthlyVisitors }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-3 px-4 text-white/50 font-medium w-1/4">Metric</th>
            <th className="text-center py-3 px-4 text-white/40 font-medium">No Pixel</th>
            <th className="text-center py-3 px-4 text-white/40 font-medium">Standard Pixel</th>
            <th className="text-center py-3 px-4 text-emerald-300 font-bold">Cursive Super Pixel</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          <tr>
            <td className="py-3 px-4 text-white/60">Visitor ID Rate</td>
            <td className="py-3 px-4 text-center text-white/40">~2%</td>
            <td className="py-3 px-4 text-center text-white/40">~15%</td>
            <td className="py-3 px-4 text-center text-emerald-400 font-bold">70%</td>
          </tr>
          <tr>
            <td className="py-3 px-4 text-white/60">Email Bounce Rate</td>
            <td className="py-3 px-4 text-center text-white/40">N/A</td>
            <td className="py-3 px-4 text-center text-white/40">~20%</td>
            <td className="py-3 px-4 text-center text-emerald-400 font-bold">0.05%</td>
          </tr>
          <tr>
            <td className="py-3 px-4 text-white/60">Intent Scoring</td>
            <td className="py-3 px-4 text-center text-white/40">None</td>
            <td className="py-3 px-4 text-center text-white/40">None</td>
            <td className="py-3 px-4 text-center text-emerald-400 font-bold">High / Med / Low</td>
          </tr>
          <tr>
            <td className="py-3 px-4 text-white/60">Data Freshness</td>
            <td className="py-3 px-4 text-center text-white/40">N/A</td>
            <td className="py-3 px-4 text-center text-white/40">Quarterly</td>
            <td className="py-3 px-4 text-center text-emerald-400 font-bold">30-Day NCOA</td>
          </tr>
          <tr className="border-t border-white/10">
            <td className="py-3 px-4 text-white/60">Identified / mo</td>
            <td className="py-3 px-4 text-center text-white/50">{formatNumber(results.noPixel.leads)}</td>
            <td className="py-3 px-4 text-center text-white/50">{formatNumber(results.competitor.identified)}</td>
            <td className="py-3 px-4 text-center text-emerald-300 font-semibold">{formatNumber(results.cursive.identified)}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 text-white/60">Intent-Qualified / mo</td>
            <td className="py-3 px-4 text-center text-white/50">{formatNumber(results.noPixel.leads)}</td>
            <td className="py-3 px-4 text-center text-white/50">{formatNumber(results.competitor.contactable)}</td>
            <td className="py-3 px-4 text-center text-emerald-300 font-semibold">{formatNumber(results.cursive.intentQualified)}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 text-white/60">Est. Monthly Revenue</td>
            <td className="py-3 px-4 text-center text-white/50">${results.noPixel.monthlyRevenue.toLocaleString()}</td>
            <td className="py-3 px-4 text-center text-white/50">${results.competitor.monthlyRevenue.toLocaleString()}</td>
            <td className="py-3 px-4 text-center text-emerald-300 font-semibold">${results.cursive.monthlyRevenue.toLocaleString()}</td>
          </tr>
          <tr className="bg-emerald-400/5 border-t-2 border-emerald-400/20">
            <td className="py-4 px-4 text-white font-semibold">Est. Annual Revenue</td>
            <td className="py-4 px-4 text-center text-white/60 font-semibold">${results.noPixel.annualRevenue.toLocaleString()}</td>
            <td className="py-4 px-4 text-center text-white/60 font-semibold">${results.competitor.annualRevenue.toLocaleString()}</td>
            <td className="py-4 px-4 text-center font-bold text-lg">
              <CountUpNumber value={results.cursive.annualRevenue} prefix="$" className="text-emerald-300" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
