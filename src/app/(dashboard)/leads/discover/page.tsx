'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTier } from '@/lib/hooks/use-tier'
import { TierGate, UsageIndicator } from '@/components/tier'
import Link from 'next/link'

// Industry options for search
const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Professional Services',
  'Education',
  'Media & Entertainment',
  'Transportation',
  'Energy',
  'Construction',
  'Agriculture',
  'Hospitality',
  'Telecommunications',
]

// Company size options
const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001-5000', label: '1001-5000 employees' },
  { value: '5001+', label: '5000+ employees' },
]

// Seniority levels
const SENIORITY_LEVELS = [
  'C-Level',
  'VP',
  'Director',
  'Manager',
  'Senior',
  'Entry Level',
]

// Common job titles
const JOB_TITLES = [
  'CEO',
  'CTO',
  'CFO',
  'CMO',
  'VP of Sales',
  'VP of Marketing',
  'VP of Engineering',
  'Director of Sales',
  'Director of Marketing',
  'Sales Manager',
  'Marketing Manager',
  'Product Manager',
  'Account Executive',
]

interface SearchFilters {
  topic: string
  keywords: string[]
  industries: string[]
  companySizes: string[]
  seniorityLevels: string[]
  jobTitles: string[]
  countries: string[]
  states: string[]
  limit: number
}

interface LeadResult {
  provider: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  jobTitle?: string
  companyName: string
  companyDomain?: string
  companyIndustry?: string
  companySize?: string
  city?: string
  state?: string
  country?: string
  intentScore?: number
}

interface SearchResponse {
  success: boolean
  leads: LeadResult[]
  total: number
  provider: string
  savedCount: number
  limits: {
    daily: { limit: number; used: number; remaining: number }
    monthly: { limit: number | null; used: number; remaining: number | null }
  }
}

const initialFilters: SearchFilters = {
  topic: '',
  keywords: [],
  industries: [],
  companySizes: [],
  seniorityLevels: [],
  jobTitles: [],
  countries: ['United States'],
  states: [],
  limit: 25,
}

export default function LeadDiscoveryPage() {
  const { limits, usage, isLoading: tierLoading, tierName, canUpgrade } = useTier()
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [keywordInput, setKeywordInput] = useState('')
  const [searchResults, setSearchResults] = useState<LeadResult[]>([])
  const [showFilters, setShowFilters] = useState(true)

  // Fetch current lead limits
  const { data: limitsData, refetch: refetchLimits } = useQuery({
    queryKey: ['lead-limits'],
    queryFn: async () => {
      const res = await fetch('/api/leads/limits')
      if (!res.ok) throw new Error('Failed to fetch limits')
      return res.json()
    },
  })

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (searchFilters: SearchFilters) => {
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            topic: searchFilters.topic || undefined,
            keywords: searchFilters.keywords.length > 0 ? searchFilters.keywords : undefined,
            industries: searchFilters.industries.length > 0 ? searchFilters.industries : undefined,
            companySizes: searchFilters.companySizes.length > 0 ? searchFilters.companySizes : undefined,
            seniorityLevels: searchFilters.seniorityLevels.length > 0 ? searchFilters.seniorityLevels : undefined,
            jobTitles: searchFilters.jobTitles.length > 0 ? searchFilters.jobTitles : undefined,
            countries: searchFilters.countries.length > 0 ? searchFilters.countries : undefined,
            states: searchFilters.states.length > 0 ? searchFilters.states : undefined,
            limit: searchFilters.limit,
          },
          saveLeads: true,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Search failed')
      }

      return res.json() as Promise<SearchResponse>
    },
    onSuccess: (data) => {
      setSearchResults(data.leads)
      refetchLimits()
    },
  })

  const handleSearch = useCallback(() => {
    if (!filters.topic && filters.keywords.length === 0 && filters.industries.length === 0) {
      return
    }
    searchMutation.mutate(filters)
  }, [filters, searchMutation])

  const addKeyword = useCallback(() => {
    if (keywordInput.trim() && !filters.keywords.includes(keywordInput.trim())) {
      setFilters(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()],
      }))
      setKeywordInput('')
    }
  }, [keywordInput, filters.keywords])

  const removeKeyword = useCallback((keyword: string) => {
    setFilters(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword),
    }))
  }, [])

  const toggleArrayFilter = useCallback((key: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const arr = prev[key] as string[]
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter(v => v !== value) }
      }
      return { ...prev, [key]: [...arr, value] }
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
    setSearchResults([])
  }, [])

  // Calculate remaining leads
  const dailyRemaining = limitsData?.dailyLimit != null
    ? Math.max(0, limitsData.dailyLimit - (limitsData.dailyUsed || 0))
    : limits.dailyLeads != null
      ? Math.max(0, limits.dailyLeads - (usage.dailyLeadsUsed || 0))
      : null

  const monthlyRemaining = limitsData?.monthlyLimit != null
    ? Math.max(0, limitsData.monthlyLimit - (limitsData.monthlyUsed || 0))
    : limits.monthlyLeads != null
      ? Math.max(0, limits.monthlyLeads - (usage.monthlyLeadsUsed || 0))
      : null

  const canSearch = dailyRemaining === null || dailyRemaining > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Discover Leads</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Search for high-intent leads from multiple data providers
          </p>
        </div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          View All Leads
        </Link>
      </div>

      {/* Usage Stats Card */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 bg-white border border-zinc-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-600">Today's Leads</span>
            {dailyRemaining !== null && dailyRemaining <= 5 && dailyRemaining > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                Low
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">
              {limitsData?.dailyUsed ?? usage.dailyLeadsUsed ?? 0}
            </span>
            <span className="text-sm text-zinc-500">
              / {limitsData?.dailyLimit ?? limits.dailyLeads ?? 3}
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                dailyRemaining === 0 ? 'bg-red-500' :
                dailyRemaining !== null && dailyRemaining <= 5 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{
                width: `${Math.min(100, ((limitsData?.dailyUsed ?? usage.dailyLeadsUsed ?? 0) / (limitsData?.dailyLimit ?? limits.dailyLeads ?? 3)) * 100)}%`
              }}
            />
          </div>
        </div>

        <div className="p-4 bg-white border border-zinc-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-600">This Month</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">
              {limitsData?.monthlyUsed ?? usage.monthlyLeadsUsed ?? 0}
            </span>
            {(limitsData?.monthlyLimit ?? limits.monthlyLeads) ? (
              <span className="text-sm text-zinc-500">
                / {limitsData?.monthlyLimit ?? limits.monthlyLeads}
              </span>
            ) : (
              <span className="text-sm text-zinc-500">leads</span>
            )}
          </div>
          {(limitsData?.monthlyLimit ?? limits.monthlyLeads) ? (
            <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((limitsData?.monthlyUsed ?? usage.monthlyLeadsUsed ?? 0) / (limitsData?.monthlyLimit ?? limits.monthlyLeads ?? 100)) * 100)}%`
                }}
              />
            </div>
          ) : (
            <div className="mt-2 text-xs text-zinc-400">Unlimited</div>
          )}
        </div>

        <div className="p-4 bg-white border border-zinc-200 rounded-lg">
          <span className="text-sm font-medium text-zinc-600">Current Plan</span>
          <div className="mt-2">
            <span className="text-lg font-semibold text-zinc-900">{tierName}</span>
          </div>
          {canUpgrade && (
            <Link
              href="/settings/billing"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/90"
            >
              Upgrade for more leads
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        <div className="p-4 bg-white border border-zinc-200 rounded-lg">
          <span className="text-sm font-medium text-zinc-600">Search Results</span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-zinc-900">{searchResults.length}</span>
            <span className="ml-1 text-sm text-zinc-500">leads found</span>
          </div>
          {searchMutation.isSuccess && (
            <div className="mt-2 text-xs text-primary">
              {searchMutation.data?.savedCount} saved to your leads
            </div>
          )}
        </div>
      </div>

      {/* Limit Warning */}
      {!canSearch && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-medium text-amber-800">Daily limit reached</h3>
              <p className="mt-1 text-sm text-amber-700">
                You've used all your daily leads. Limits reset at midnight UTC.
                {canUpgrade && ' Upgrade your plan to get more leads.'}
              </p>
              {canUpgrade && (
                <Link
                  href="/settings/billing"
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-100 rounded-lg hover:bg-amber-200"
                >
                  Upgrade Now
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white border border-zinc-200 rounded-lg">
        <div className="p-4 border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Search Filters</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-zinc-500 hover:text-zinc-700"
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              {(filters.topic || filters.keywords.length > 0 || filters.industries.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 space-y-6">
            {/* Topic / Intent Search */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Topic or Intent Signal
              </label>
              <input
                type="text"
                value={filters.topic}
                onChange={(e) => setFilters(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., 'CRM software', 'marketing automation', 'hiring sales reps'"
                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Find companies showing intent signals for this topic
              </p>
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Additional Keywords
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="Add keyword and press Enter"
                  className="flex-1 h-10 px-3 text-sm border border-zinc-300 rounded-lg"
                />
                <button
                  onClick={addKeyword}
                  className="px-4 h-10 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5"
                >
                  Add
                </button>
              </div>
              {filters.keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {filters.keywords.map(keyword => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary rounded-md"
                    >
                      {keyword}
                      <button onClick={() => removeKeyword(keyword)} className="hover:text-primary">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Industries */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Industries
              </label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(industry => (
                  <button
                    key={industry}
                    onClick={() => toggleArrayFilter('industries', industry)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      filters.industries.includes(industry)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-primary/80'
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Company Size
              </label>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map(size => (
                  <button
                    key={size.value}
                    onClick={() => toggleArrayFilter('companySizes', size.value)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      filters.companySizes.includes(size.value)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-emerald-400'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Seniority Levels */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Seniority Level
              </label>
              <div className="flex flex-wrap gap-2">
                {SENIORITY_LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => toggleArrayFilter('seniorityLevels', level)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      filters.seniorityLevels.includes(level)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-primary/80'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Titles */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Job Titles
              </label>
              <div className="flex flex-wrap gap-2">
                {JOB_TITLES.map(title => (
                  <button
                    key={title}
                    onClick={() => toggleArrayFilter('jobTitles', title)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      filters.jobTitles.includes(title)
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-amber-400'
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Limit */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Number of Results
              </label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                className="w-40 h-10 px-3 text-sm border border-zinc-300 rounded-lg"
              >
                <option value={10}>10 leads</option>
                <option value={25}>25 leads</option>
                <option value={50}>50 leads</option>
                <option value={100}>100 leads</option>
              </select>
              {dailyRemaining !== null && filters.limit > dailyRemaining && (
                <p className="mt-1 text-xs text-amber-600">
                  You only have {dailyRemaining} leads remaining today
                </p>
              )}
            </div>
          </div>
        )}

        {/* Search Button */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-500">
              {filters.topic || filters.keywords.length > 0 || filters.industries.length > 0 ? (
                <span>
                  Searching for:{' '}
                  <span className="font-medium text-zinc-700">
                    {[
                      filters.topic,
                      ...filters.keywords,
                      ...filters.industries,
                    ].filter(Boolean).join(', ')}
                  </span>
                </span>
              ) : (
                'Add filters to search for leads'
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={
                searchMutation.isPending ||
                !canSearch ||
                (!filters.topic && filters.keywords.length === 0 && filters.industries.length === 0)
              }
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searchMutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Leads
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {searchMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{searchMutation.error?.message}</span>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900">
              Search Results
              <span className="ml-2 text-sm font-normal text-zinc-500">
                ({searchResults.length} leads found)
              </span>
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {searchResults.map((lead, index) => (
              <div key={index} className="p-4 hover:bg-zinc-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-semibold">
                        {lead.companyName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-medium text-zinc-900">{lead.companyName}</h3>
                        {lead.companyDomain && (
                          <a
                            href={`https://${lead.companyDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:text-primary/90"
                          >
                            {lead.companyDomain}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                      {lead.firstName && lead.lastName && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {lead.firstName} {lead.lastName}
                        </span>
                      )}
                      {lead.jobTitle && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {lead.jobTitle}
                        </span>
                      )}
                      {lead.companyIndustry && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {lead.companyIndustry}
                        </span>
                      )}
                      {lead.companySize && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {lead.companySize} employees
                        </span>
                      )}
                      {(lead.city || lead.state || lead.country) && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {[lead.city, lead.state, lead.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.intentScore && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        lead.intentScore >= 70 ? 'bg-red-100 text-red-700' :
                        lead.intentScore >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {lead.intentScore >= 70 ? 'Hot' : lead.intentScore >= 40 ? 'Warm' : 'Cold'}
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs font-medium bg-zinc-100 text-zinc-600 rounded-full">
                      {lead.provider === 'datashopper' ? 'DataShopper' : 'AudienceLabs'}
                    </span>
                  </div>
                </div>
                {lead.email && (
                  <div className="mt-2 pl-13">
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/90"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {lead.email}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searchMutation.isPending && searchResults.length === 0 && !searchMutation.isError && (
        <div className="p-12 text-center bg-white border border-zinc-200 border-dashed rounded-lg">
          <svg className="mx-auto w-12 h-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-zinc-900">Search for leads</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Use the filters above to find high-intent leads matching your criteria
          </p>
        </div>
      )}
    </div>
  )
}
