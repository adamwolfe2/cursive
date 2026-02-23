'use client'
import { useState } from 'react'
import { TRAFFIC_RANGES } from '@/lib/superpixel-constants'

const INDUSTRIES = [
  'B2B SaaS', 'Home Services', 'Financial Services', 'Agencies',
  'Ecommerce', 'Education', 'Real Estate', 'Healthcare', 'Other',
]

const DEAL_SIZE_CHIPS = [500, 1000, 2500, 5000, 10000]

interface Props {
  onSubmit: (data: { domain: string; monthlyVisitors: number; dealSize: number; industry: string }) => void
}

export function CalculatorForm({ onSubmit }: Props) {
  const [domain, setDomain] = useState('')
  const [trafficRange, setTrafficRange] = useState<string>('')
  const [dealSize, setDealSize] = useState<number | ''>('')
  const [customDeal, setCustomDeal] = useState('')
  const [industry, setIndustry] = useState('')
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
      {/* Domain */}
      <div>
        <label className="block text-sm font-semibold text-white/70 mb-2 uppercase tracking-wider">Your Website</label>
        <input
          type="text"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="yourcompany.com"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 transition-all"
        />
        {errors.domain && <p className="mt-1 text-red-400 text-sm">{errors.domain}</p>}
      </div>

      {/* Traffic */}
      <div>
        <label className="block text-sm font-semibold text-white/70 mb-2 uppercase tracking-wider">Monthly Website Visitors</label>
        <select
          value={trafficRange}
          onChange={e => setTrafficRange(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 transition-all appearance-none"
        >
          <option value="" className="bg-gray-900">Select traffic range...</option>
          {Object.keys(TRAFFIC_RANGES).map(r => (
            <option key={r} value={r} className="bg-gray-900">{r}</option>
          ))}
        </select>
        {errors.traffic && <p className="mt-1 text-red-400 text-sm">{errors.traffic}</p>}
      </div>

      {/* Deal Size */}
      <div>
        <label className="block text-sm font-semibold text-white/70 mb-2 uppercase tracking-wider">Average Deal Size</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {DEAL_SIZE_CHIPS.map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => { setDealSize(chip); setCustomDeal('') }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${
                dealSize === chip
                  ? 'bg-emerald-400/20 border-emerald-400/60 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
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
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 transition-all"
        />
        {errors.deal && <p className="mt-1 text-red-400 text-sm">{errors.deal}</p>}
      </div>

      {/* Industry */}
      <div>
        <label className="block text-sm font-semibold text-white/70 mb-2 uppercase tracking-wider">Industry</label>
        <select
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 transition-all appearance-none"
        >
          <option value="" className="bg-gray-900">Select your industry...</option>
          {INDUSTRIES.map(i => (
            <option key={i} value={i} className="bg-gray-900">{i}</option>
          ))}
        </select>
        {errors.industry && <p className="mt-1 text-red-400 text-sm">{errors.industry}</p>}
      </div>

      <button
        type="submit"
        className="w-full py-4 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40"
      >
        See My Revenue Leak &rarr;
      </button>
    </form>
  )
}
