'use client'

import { useState } from 'react'
import { ArrowRight, Loader2, TrendingDown, Check, Users, Mail, Sparkles } from 'lucide-react'
import {
  calculateScenarios,
  TRAFFIC_RANGES,
  formatDollar,
} from '@/lib/superpixel-constants'
import { formatNumber } from '@/lib/utils'
import { safeError } from '@/lib/utils/log-sanitizer'

const INDUSTRIES = [
  'B2B SaaS', 'Home Services', 'Financial Services', 'Agencies',
  'Ecommerce', 'Education', 'Real Estate', 'Healthcare', 'Other',
]
const DEAL_CHIPS = [500, 1000, 2500, 5000, 10000]

type Step = 'form' | 'loading' | 'results'

interface FormData {
  domain: string
  monthlyVisitors: number
  dealSize: number
  industry: string
}

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition'
const labelClass = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500'

export function VisitorEstimateCalculator() {
  const [step, setStep] = useState<Step>('form')
  const [data, setData] = useState<FormData | null>(null)
  const [results, setResults] = useState<ReturnType<typeof calculateScenarios> | null>(null)

  // form fields
  const [domain, setDomain] = useState('')
  const [trafficRange, setTrafficRange] = useState('')
  const [dealSize, setDealSize] = useState<number | ''>('')
  const [customDeal, setCustomDeal] = useState('')
  const [industry, setIndustry] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!domain) next.domain = 'Enter your website URL'
    if (!trafficRange) next.traffic = 'Select your traffic range'
    if (!dealSize && !customDeal) next.deal = 'Enter your average deal size'
    if (!industry) next.industry = 'Select your industry'
    if (Object.keys(next).length) { setErrors(next); return }

    const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0]
    const visitors = TRAFFIC_RANGES[trafficRange] ?? 10000
    const finalDeal = (dealSize as number) || parseInt(customDeal.replace(/[^0-9]/g, '')) || 2500
    const payload: FormData = { domain: cleanDomain, monthlyVisitors: visitors, dealSize: finalDeal, industry }

    setData(payload)
    setStep('loading')
    const calc = calculateScenarios(payload.monthlyVisitors, payload.dealSize, payload.industry)
    await new Promise((r) => setTimeout(r, 1800))
    setResults(calc)
    setStep('results')
  }

  const reset = () => {
    setStep('form')
    setResults(null)
  }

  if (step === 'loading' && data) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <div>
          <p className="font-semibold text-gray-900">Modeling revenue scenarios for {data.domain}…</p>
          <p className="mt-1 text-sm text-gray-500">This takes just a moment.</p>
        </div>
      </div>
    )
  }

  if (step === 'results' && results && data) {
    return <Results results={results} data={data} onReset={reset} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>Your website</label>
        <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourcompany.com" className={inputClass} />
        {errors.domain && <p className="mt-1 text-sm text-red-600">{errors.domain}</p>}
      </div>

      <div>
        <label className={labelClass}>Monthly website visitors</label>
        <select value={trafficRange} onChange={(e) => setTrafficRange(e.target.value)} className={inputClass}>
          <option value="">Select traffic range…</option>
          {Object.keys(TRAFFIC_RANGES).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {errors.traffic && <p className="mt-1 text-sm text-red-600">{errors.traffic}</p>}
      </div>

      <div>
        <label className={labelClass}>Average deal size</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {DEAL_CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setDealSize(c); setCustomDeal('') }}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                dealSize === c
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              ${c.toLocaleString()}
            </button>
          ))}
        </div>
        <input
          value={customDeal}
          onChange={(e) => { setCustomDeal(e.target.value); setDealSize('') }}
          placeholder="Custom amount…"
          className={inputClass}
        />
        {errors.deal && <p className="mt-1 text-sm text-red-600">{errors.deal}</p>}
      </div>

      <div>
        <label className={labelClass}>Industry</label>
        <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass}>
          <option value="">Select your industry…</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        {errors.industry && <p className="mt-1 text-sm text-red-600">{errors.industry}</p>}
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        See my revenue leak <ArrowRight className="h-5 w-5" />
      </button>
    </form>
  )
}

function Results({
  results,
  data,
  onReset,
}: {
  results: ReturnType<typeof calculateScenarios>
  data: FormData
  onReset: () => void
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">{data.domain}</h3>
        <button onClick={onReset} className="rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-500 transition hover:text-gray-900">
          ← Recalculate
        </button>
      </div>

      {/* Leak hero */}
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-500">
          <TrendingDown className="h-4 w-4" /> Leaving on the table every year
        </div>
        <div className="text-4xl font-black text-red-600 sm:text-6xl">{formatDollar(results.revenueLeak)}</div>
        <p className="mx-auto mt-3 max-w-lg text-sm text-gray-600">
          {data.domain} gets ~{formatNumber(data.monthlyVisitors)} visitors/month. Cursive identifies 60–70% of them —
          that&apos;s {formatNumber(results.cursive.intentQualified)} verified, intent-scored leads your team isn&apos;t getting today.
        </p>
      </div>

      {/* Comparison */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ScenarioCard
          icon={<Users className="h-5 w-5 text-gray-400" />}
          title="No pixel"
          subtitle="Today"
          leads={results.noPixel.leads}
          revenue={results.noPixel.annualRevenue}
        />
        <ScenarioCard
          icon={<Users className="h-5 w-5 text-gray-400" />}
          title="Typical pixel"
          subtitle="Competitor"
          leads={results.competitor.contactable}
          revenue={results.competitor.annualRevenue}
        />
        <ScenarioCard
          highlight
          icon={<Sparkles className="h-5 w-5 text-blue-600" />}
          title="Cursive Super Pixel"
          subtitle="Recommended"
          leads={results.cursive.intentQualified}
          revenue={results.cursive.annualRevenue}
        />
      </div>

      {/* CTA */}
      <div className="space-y-4 text-center">
        <a
          href="/get-leads"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
        >
          See how it works <ArrowRight className="h-5 w-5" />
        </a>
        <EmailReport data={data} results={results} />
      </div>
    </div>
  )
}

function ScenarioCard({
  icon, title, subtitle, leads, revenue, highlight,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  leads: number
  revenue: number
  highlight?: boolean
}) {
  return (
    <div
      className={`relative rounded-xl border p-5 ${
        highlight ? 'border-blue-600 bg-blue-50/60 shadow-sm' : 'border-gray-200 bg-white'
      }`}
    >
      {highlight && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Recommended
        </span>
      )}
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="text-[11px] text-gray-400">{subtitle}</div>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{formatNumber(leads)}</div>
      <div className="text-xs text-gray-500">leads / month</div>
      <div className={`mt-3 text-sm font-semibold ${highlight ? 'text-blue-700' : 'text-gray-700'}`}>
        {formatDollar(revenue)}<span className="font-normal text-gray-400">/yr</span>
      </div>
    </div>
  )
}

function EmailReport({
  data,
  results,
}: {
  data: FormData
  results: ReturnType<typeof calculateScenarios>
}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setStatus('error'); return }
    setStatus('loading')
    try {
      const res = await fetch('/api/visitor-estimate/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          domain: data.domain,
          monthly_visitors: data.monthlyVisitors,
          deal_size: data.dealSize,
          industry: data.industry,
          revenue_leak_annual: results.revenueLeak,
          cursive_advantage_annual: results.cursiveAdvantage,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('success')
    } catch (err) {
      safeError('[VisitorEstimate] capture failed:', err)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-green-600">
        <Check className="h-4 w-4" /> Report on its way — check your inbox.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-3 flex items-center justify-center gap-1.5 text-sm text-gray-500">
        <Mail className="h-4 w-4" /> Or get the full report emailed to you:
      </p>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
          placeholder="you@company.com"
          required
          className={`flex-1 rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
            status === 'error' ? 'border-red-400' : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="whitespace-nowrap rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:border-gray-400 disabled:opacity-60"
        >
          {status === 'loading' ? 'Sending…' : 'Email me the report'}
        </button>
      </form>
      {status === 'error' && (
        <p className="mt-1 text-left text-sm text-red-600">
          {!email ? 'Enter your email to receive the report.' : 'Something went wrong — please try again.'}
        </p>
      )}
    </div>
  )
}
