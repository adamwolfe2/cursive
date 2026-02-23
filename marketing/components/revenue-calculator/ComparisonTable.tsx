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
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-gray-500 font-medium w-1/4">Metric</th>
            <th className="text-center py-3 px-4 text-gray-500 font-medium">No Pixel</th>
            <th className="text-center py-3 px-4 text-gray-500 font-medium">Standard Pixel</th>
            <th className="text-center py-3 px-4 text-[#007AFF] font-bold">Cursive Super Pixel</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="py-3 px-4 text-gray-600">Visitor ID Rate</td>
            <td className="py-3 px-4 text-center text-gray-400">~2%</td>
            <td className="py-3 px-4 text-center text-gray-400">~15%</td>
            <td className="py-3 px-4 text-center text-[#007AFF] font-bold">70%</td>
          </tr>
          <tr>
            <td className="py-3 px-4 text-gray-600">Email Bounce Rate</td>
            <td className="py-3 px-4 text-center text-gray-400">N/A</td>
            <td className="py-3 px-4 text-center text-gray-400">~20%</td>
            <td className="py-3 px-4 text-center text-[#007AFF] font-bold">0.05%</td>
          </tr>
          <tr>
            <td className="py-3 px-4 text-gray-600">Intent Scoring</td>
            <td className="py-3 px-4 text-center text-gray-400">None</td>
            <td className="py-3 px-4 text-center text-gray-400">None</td>
            <td className="py-3 px-4 text-center text-[#007AFF] font-bold">High / Med / Low</td>
          </tr>
          <tr>
            <td className="py-3 px-4 text-gray-600">Data Freshness</td>
            <td className="py-3 px-4 text-center text-gray-400">N/A</td>
            <td className="py-3 px-4 text-center text-gray-400">Quarterly</td>
            <td className="py-3 px-4 text-center text-[#007AFF] font-bold">30-Day NCOA</td>
          </tr>
          <tr className="border-t border-gray-200">
            <td className="py-3 px-4 text-gray-600">Identified / mo</td>
            <td className="py-3 px-4 text-center text-gray-500">{formatNumber(results.noPixel.leads)}</td>
            <td className="py-3 px-4 text-center text-gray-500">{formatNumber(results.competitor.identified)}</td>
            <td className="py-3 px-4 text-center text-[#007AFF] font-semibold">{formatNumber(results.cursive.identified)}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 text-gray-600">Intent-Qualified / mo</td>
            <td className="py-3 px-4 text-center text-gray-500">{formatNumber(results.noPixel.leads)}</td>
            <td className="py-3 px-4 text-center text-gray-500">{formatNumber(results.competitor.contactable)}</td>
            <td className="py-3 px-4 text-center text-[#007AFF] font-semibold">{formatNumber(results.cursive.intentQualified)}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 text-gray-600">Est. Monthly Revenue</td>
            <td className="py-3 px-4 text-center text-gray-500">${results.noPixel.monthlyRevenue.toLocaleString()}</td>
            <td className="py-3 px-4 text-center text-gray-500">${results.competitor.monthlyRevenue.toLocaleString()}</td>
            <td className="py-3 px-4 text-center text-[#007AFF] font-semibold">${results.cursive.monthlyRevenue.toLocaleString()}</td>
          </tr>
          <tr className="bg-[#007AFF]/5 border-t-2 border-[#007AFF]/20">
            <td className="py-4 px-4 text-gray-900 font-semibold">Est. Annual Revenue</td>
            <td className="py-4 px-4 text-center text-gray-500 font-semibold">${results.noPixel.annualRevenue.toLocaleString()}</td>
            <td className="py-4 px-4 text-center text-gray-500 font-semibold">${results.competitor.annualRevenue.toLocaleString()}</td>
            <td className="py-4 px-4 text-center font-bold text-lg">
              <CountUpNumber value={results.cursive.annualRevenue} prefix="$" className="text-[#007AFF]" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
