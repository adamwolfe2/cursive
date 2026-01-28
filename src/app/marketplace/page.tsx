'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'

// Types for marketplace leads
interface MarketplaceLeadPreview {
  id: string
  first_name: string | null
  last_name: string | null
  job_title: string | null
  company_name: string
  company_industry: string | null
  company_size: string | null
  city: string | null
  state: string | null
  seniority_level: string | null
  intent_score: number
  freshness_score: number
  verification_status: string
  has_phone: boolean
  has_email: boolean
  price: number
  email_preview: string | null
  phone_preview: string | null
}

interface Filters {
  industries: string[]
  states: string[]
  companySizes: string[]
  seniorityLevels: string[]
  intentScoreMin?: number
  freshnessMin?: number
  hasPhone?: boolean
  hasVerifiedEmail?: boolean
}

// Constants
const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Professional Services',
  'Construction',
  'Education',
  'Transportation',
]

const STATES = [
  'CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI',
  'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI',
]

const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
]

const SENIORITY_LEVELS = [
  { value: 'c_suite', label: 'C-Suite' },
  { value: 'vp', label: 'VP' },
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'ic', label: 'Individual Contributor' },
]

function getIntentBadge(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Hot', color: 'bg-red-100 text-red-700' }
  if (score >= 40) return { label: 'Warm', color: 'bg-amber-100 text-amber-700' }
  return { label: 'Cold', color: 'bg-blue-100 text-blue-700' }
}

function getFreshnessBadge(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Fresh', color: 'bg-emerald-100 text-emerald-700' }
  if (score >= 40) return { label: 'Recent', color: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Aged', color: 'bg-zinc-100 text-zinc-600' }
}

export default function MarketplacePage() {
  const [leads, setLeads] = useState<MarketplaceLeadPreview[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [credits, setCredits] = useState(0)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [purchasedLeadCount, setPurchasedLeadCount] = useState(0)

  // Filters
  const [filters, setFilters] = useState<Filters>({
    industries: [],
    states: [],
    companySizes: [],
    seniorityLevels: [],
  })
  const [showFilters, setShowFilters] = useState(true)

  // Pagination
  const [page, setPage] = useState(0)
  const [limit] = useState(20)

  // Sorting
  const [orderBy, setOrderBy] = useState<'freshness_score' | 'intent_score' | 'price'>('freshness_score')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const fetchLeads = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()

      if (filters.industries.length) params.set('industries', filters.industries.join(','))
      if (filters.states.length) params.set('states', filters.states.join(','))
      if (filters.companySizes.length) params.set('companySizes', filters.companySizes.join(','))
      if (filters.seniorityLevels.length) params.set('seniorityLevels', filters.seniorityLevels.join(','))
      if (filters.intentScoreMin !== undefined) params.set('intentScoreMin', String(filters.intentScoreMin))
      if (filters.freshnessMin !== undefined) params.set('freshnessMin', String(filters.freshnessMin))
      if (filters.hasPhone) params.set('hasPhone', 'true')
      if (filters.hasVerifiedEmail) params.set('hasVerifiedEmail', 'true')

      params.set('limit', String(limit))
      params.set('offset', String(page * limit))
      params.set('orderBy', orderBy)
      params.set('orderDirection', orderDirection)

      const response = await fetch(`/api/marketplace/leads?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
        setTotalLeads(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filters, page, limit, orderBy, orderDirection])

  const fetchCredits = useCallback(async () => {
    try {
      const response = await fetch('/api/marketplace/credits')
      if (response.ok) {
        const data = await response.json()
        setCredits(data.balance || 0)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
    fetchCredits()
  }, [fetchLeads, fetchCredits])

  // Handle Stripe redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      setShowSuccessMessage(true)
      window.history.replaceState({}, '', '/marketplace')
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }
  }, [])

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev)
      if (next.has(leadId)) {
        next.delete(leadId)
      } else {
        next.add(leadId)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(leads.map((l) => l.id)))
    }
  }

  const getSelectedTotal = () => {
    return leads
      .filter((l) => selectedLeads.has(l.id))
      .reduce((sum, l) => sum + l.price, 0)
  }

  const purchaseSelected = async () => {
    if (selectedLeads.size === 0) return

    setIsPurchasing(true)
    try {
      const response = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
          paymentMethod: 'credits',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPurchasedLeadCount(data.leads?.length || selectedLeads.size)
        setShowSuccessMessage(true)
        setSelectedLeads(new Set())
        setCredits(data.creditsRemaining || 0)
        fetchLeads() // Refresh to remove purchased leads
        setTimeout(() => setShowSuccessMessage(false), 5000)
      } else {
        const error = await response.json()
        alert(error.error || 'Purchase failed')
      }
    } catch (error) {
      console.error('Purchase failed:', error)
      alert('Purchase failed. Please try again.')
    } finally {
      setIsPurchasing(false)
    }
  }

  const toggleFilter = (category: keyof Filters, value: string) => {
    setFilters((prev) => {
      const current = prev[category] as string[]
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter((v) => v !== value) }
      } else {
        return { ...prev, [category]: [...current, value] }
      }
    })
    setPage(0) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({
      industries: [],
      states: [],
      companySizes: [],
      seniorityLevels: [],
    })
    setPage(0)
  }

  const totalPages = Math.ceil(totalLeads / limit)

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-[13px] font-medium text-emerald-900">Purchase Successful!</h3>
                <p className="text-[13px] text-emerald-700 mt-1">
                  {purchasedLeadCount} lead{purchasedLeadCount !== 1 ? 's' : ''} purchased. View them in your purchase history.
                </p>
              </div>
              <button onClick={() => setShowSuccessMessage(false)} className="ml-auto text-emerald-600 hover:text-emerald-800">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Lead Marketplace</h1>
              <p className="text-[13px] text-zinc-500 mt-1">{totalLeads.toLocaleString()} leads available</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[13px] font-medium text-zinc-900">${credits.toFixed(2)} credits</span>
              </div>
              <Link
                href="/marketplace/credits"
                className="h-9 px-4 text-[13px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-all duration-150 inline-flex items-center"
              >
                Buy Credits
              </Link>
              <Link
                href="/marketplace/history"
                className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 inline-flex items-center"
              >
                Purchase History
              </Link>
              <Link
                href="/marketplace/referrals"
                className="h-9 px-4 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150 inline-flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Refer &amp; Earn
              </Link>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Filters Sidebar */}
            <div className={`${showFilters ? 'w-64 flex-shrink-0' : 'w-0'} transition-all duration-200`}>
              {showFilters && (
                <div className="bg-white border border-zinc-200 rounded-lg p-4 sticky top-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[14px] font-semibold text-zinc-900">Filters</h2>
                    <button onClick={clearFilters} className="text-[12px] text-zinc-500 hover:text-zinc-700">
                      Clear all
                    </button>
                  </div>

                  {/* Industry Filter */}
                  <div className="mb-4">
                    <h3 className="text-[12px] font-medium text-zinc-700 mb-2">Industry</h3>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {INDUSTRIES.map((industry) => (
                        <label key={industry} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.industries.includes(industry)}
                            onChange={() => toggleFilter('industries', industry)}
                            className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                          />
                          <span className="text-[12px] text-zinc-600">{industry}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* State Filter */}
                  <div className="mb-4">
                    <h3 className="text-[12px] font-medium text-zinc-700 mb-2">State</h3>
                    <div className="flex flex-wrap gap-1">
                      {STATES.slice(0, 10).map((state) => (
                        <button
                          key={state}
                          onClick={() => toggleFilter('states', state)}
                          className={`px-2 py-1 text-[11px] rounded ${
                            filters.states.includes(state)
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Company Size Filter */}
                  <div className="mb-4">
                    <h3 className="text-[12px] font-medium text-zinc-700 mb-2">Company Size</h3>
                    <div className="space-y-1">
                      {COMPANY_SIZES.map((size) => (
                        <label key={size} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.companySizes.includes(size)}
                            onChange={() => toggleFilter('companySizes', size)}
                            className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                          />
                          <span className="text-[12px] text-zinc-600">{size} employees</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Seniority Filter */}
                  <div className="mb-4">
                    <h3 className="text-[12px] font-medium text-zinc-700 mb-2">Seniority</h3>
                    <div className="space-y-1">
                      {SENIORITY_LEVELS.map((level) => (
                        <label key={level.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.seniorityLevels.includes(level.value)}
                            onChange={() => toggleFilter('seniorityLevels', level.value)}
                            className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                          />
                          <span className="text-[12px] text-zinc-600">{level.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Contact Quality Filters */}
                  <div className="mb-4">
                    <h3 className="text-[12px] font-medium text-zinc-700 mb-2">Contact Quality</h3>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.hasVerifiedEmail}
                          onChange={() => setFilters((prev) => ({ ...prev, hasVerifiedEmail: !prev.hasVerifiedEmail }))}
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                        />
                        <span className="text-[12px] text-zinc-600">Verified email only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.hasPhone}
                          onChange={() => setFilters((prev) => ({ ...prev, hasPhone: !prev.hasPhone }))}
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                        />
                        <span className="text-[12px] text-zinc-600">Has phone number</span>
                      </label>
                    </div>
                  </div>

                  {/* Intent Score Filter */}
                  <div className="mb-4">
                    <h3 className="text-[12px] font-medium text-zinc-700 mb-2">Minimum Intent Score</h3>
                    <div className="flex gap-2">
                      {[0, 40, 70].map((score) => (
                        <button
                          key={score}
                          onClick={() => setFilters((prev) => ({ ...prev, intentScoreMin: prev.intentScoreMin === score ? undefined : score }))}
                          className={`flex-1 px-2 py-1.5 text-[11px] rounded ${
                            filters.intentScoreMin === score
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          {score === 0 ? 'All' : score === 40 ? 'Warm+' : 'Hot'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Freshness Filter */}
                  <div>
                    <h3 className="text-[12px] font-medium text-zinc-700 mb-2">Minimum Freshness</h3>
                    <div className="flex gap-2">
                      {[0, 40, 70].map((score) => (
                        <button
                          key={score}
                          onClick={() => setFilters((prev) => ({ ...prev, freshnessMin: prev.freshnessMin === score ? undefined : score }))}
                          className={`flex-1 px-2 py-1.5 text-[11px] rounded ${
                            filters.freshnessMin === score
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          {score === 0 ? 'All' : score === 40 ? 'Recent+' : 'Fresh'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-9 px-3 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                  </button>

                  <select
                    value={`${orderBy}-${orderDirection}`}
                    onChange={(e) => {
                      const [newOrderBy, newDirection] = e.target.value.split('-') as [typeof orderBy, typeof orderDirection]
                      setOrderBy(newOrderBy)
                      setOrderDirection(newDirection)
                    }}
                    className="h-9 px-3 text-[13px] border border-zinc-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  >
                    <option value="freshness_score-desc">Freshest first</option>
                    <option value="intent_score-desc">Highest intent first</option>
                    <option value="price-asc">Lowest price first</option>
                    <option value="price-desc">Highest price first</option>
                  </select>
                </div>

                {selectedLeads.size > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-zinc-600">
                      {selectedLeads.size} selected (${getSelectedTotal().toFixed(2)})
                    </span>
                    <button
                      onClick={purchaseSelected}
                      disabled={isPurchasing || getSelectedTotal() > credits}
                      className="h-9 px-4 text-[13px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      {isPurchasing ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Purchasing...
                        </>
                      ) : (
                        <>Purchase Selected</>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Lead Cards */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white border border-zinc-200 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-zinc-200 rounded w-1/2 mb-3" />
                      <div className="h-3 bg-zinc-100 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-zinc-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : leads.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center">
                  <svg className="w-12 h-12 text-zinc-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="text-[14px] font-medium text-zinc-900 mb-1">No leads found</h3>
                  <p className="text-[13px] text-zinc-500">Try adjusting your filters to see more results.</p>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === leads.length && leads.length > 0}
                      onChange={selectAll}
                      className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                    />
                    <span className="text-[12px] text-zinc-500">Select all on page</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {leads.map((lead) => {
                      const intent = getIntentBadge(lead.intent_score)
                      const freshness = getFreshnessBadge(lead.freshness_score)

                      return (
                        <div
                          key={lead.id}
                          className={`bg-white border rounded-lg p-4 transition-all duration-150 ${
                            selectedLeads.has(lead.id) ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedLeads.has(lead.id)}
                              onChange={() => toggleLeadSelection(lead.id)}
                              className="w-4 h-4 mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-[14px] font-semibold text-zinc-900 truncate">
                                    {lead.first_name} {lead.last_name}
                                  </h3>
                                  <p className="text-[12px] text-zinc-600 truncate">{lead.job_title || 'Unknown title'}</p>
                                </div>
                                <span className="text-[14px] font-semibold text-zinc-900">${lead.price.toFixed(2)}</span>
                              </div>

                              <div className="mt-2">
                                <p className="text-[13px] font-medium text-zinc-800">{lead.company_name}</p>
                                <p className="text-[12px] text-zinc-500">
                                  {lead.company_industry || 'Unknown industry'} {lead.company_size && `· ${lead.company_size} employees`}
                                </p>
                                <p className="text-[12px] text-zinc-500">
                                  {lead.city && `${lead.city}, `}{lead.state || 'Unknown location'}
                                </p>
                              </div>

                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 text-[11px] font-medium rounded ${intent.color}`}>
                                  {intent.label}
                                </span>
                                <span className={`px-2 py-0.5 text-[11px] font-medium rounded ${freshness.color}`}>
                                  {freshness.label}
                                </span>
                                {lead.verification_status === 'valid' && (
                                  <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-100 text-emerald-700">
                                    Verified
                                  </span>
                                )}
                                {lead.has_phone && (
                                  <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-zinc-100 text-zinc-600">
                                    Phone
                                  </span>
                                )}
                              </div>

                              <div className="mt-3 pt-3 border-t border-zinc-100">
                                <div className="flex items-center gap-4 text-[12px] text-zinc-500">
                                  {lead.email_preview && (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      {lead.email_preview}
                                    </span>
                                  )}
                                  {lead.phone_preview && (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                      {lead.phone_preview}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-[13px] text-zinc-500">
                        Showing {page * limit + 1} - {Math.min((page + 1) * limit, totalLeads)} of {totalLeads} leads
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                          disabled={page === 0}
                          className="h-9 px-3 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-[13px] text-zinc-600">
                          Page {page + 1} of {totalPages}
                        </span>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={page >= totalPages - 1}
                          className="h-9 px-3 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
