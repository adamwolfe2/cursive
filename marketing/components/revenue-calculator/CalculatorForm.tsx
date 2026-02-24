'use client'
import { useState } from 'react'
import { TRAFFIC_RANGES } from '@/lib/superpixel-constants'

const INDUSTRIES = [
  'B2B SaaS', 'Home Services', 'Financial Services', 'Agencies',
  'Ecommerce', 'Education', 'Real Estate', 'Healthcare', 'Other',
]

const DEAL_SIZE_CHIPS = [1000, 2500, 5000, 25000, 50000]

interface Props {
  onSubmit: (data: { domain: string; monthlyVisitors: number; dealSize: number; industry: string }) => void
}

export function CalculatorForm({ onSubmit }: Props) {
  const [domain, setDomain] = useState('')
  const [trafficRange, setTrafficRange] = useState<string>('')
  const [dealSize, setDealSize] = useState<number | ''>('')
  const [customDeal, setCustomDeal] = useState('')
  const [industry, setIndustry] = useState('B2B SaaS')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!domain) newErrors.domain = 'Please enter your website URL'
    if (!trafficRange) newErrors.traffic = 'Please select your traffic range'
    if (!dealSize && !customDeal) newErrors.deal = 'Please enter your average deal size'
    if (!industry) newErrors.industry = 'Please select your industry'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }

    const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0]
    const visitors = TRAFFIC_RANGES[trafficRange] ?? 10000
    const finalDeal = dealSize || parseInt(customDeal.replace(/[^0-9]/g, '')) || 2500

    onSubmit({ domain: cleanDomain, monthlyVisitors: visitors, dealSize: finalDeal, industry })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Website</label>
        <input
          type="text"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="yourcompany.com"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#007AFF]/60 focus:ring-1 focus:ring-[#007AFF]/30 transition-all"
        />
        {errors.domain && <p className="mt-1 text-red-600 text-sm">{errors.domain}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Website Visitors</label>
        <select
          value={trafficRange}
          onChange={e => setTrafficRange(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-[#007AFF]/60 focus:ring-1 focus:ring-[#007AFF]/30 transition-all appearance-none"
        >
          <option value="">Select traffic range...</option>
          {Object.keys(TRAFFIC_RANGES).map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {errors.traffic && <p className="mt-1 text-red-600 text-sm">{errors.traffic}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Average Deal Size</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {DEAL_SIZE_CHIPS.map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => { setDealSize(chip); setCustomDeal('') }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${
                dealSize === chip
                  ? 'bg-[#007AFF]/10 border-[#007AFF]/60 text-[#007AFF]'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              ${chip.toLocaleString()}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={customDeal}
          onChange={e => { setCustomDeal(e.target.value); setDealSize('') }}
          placeholder="Custom amount..."
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#007AFF]/60 focus:ring-1 focus:ring-[#007AFF]/30 transition-all"
        />
        {errors.deal && <p className="mt-1 text-red-600 text-sm">{errors.deal}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
        <select
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-[#007AFF]/60 focus:ring-1 focus:ring-[#007AFF]/30 transition-all appearance-none"
        >
          <option value="">Select your industry...</option>
          {INDUSTRIES.map(i => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        {errors.industry && <p className="mt-1 text-red-600 text-sm">{errors.industry}</p>}
      </div>

      <button
        type="submit"
        className="w-full py-4 px-8 bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold text-lg rounded-lg transition-all duration-200 shadow-lg shadow-[#007AFF]/25 hover:shadow-[#007AFF]/40"
      >
        Calculate My Revenue Leak →
      </button>
    </form>
  )
}
