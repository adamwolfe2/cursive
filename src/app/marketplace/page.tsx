'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { useToast } from '@/lib/hooks/use-toast'
import { useDebounce } from '@/hooks/use-debounce'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MobileFilters } from './components/MobileFilters'
import { BuyLeadButton } from '@/components/marketplace/BuyLeadButton'
import { UpsellBanner } from '@/components/marketplace/UpsellBanner'
import { getServiceLink } from '@/lib/stripe/payment-links'

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
  if (score >= 70) return { label: 'Fresh', color: 'bg-blue-100 text-blue-700' }
  if (score >= 40) return { label: 'Recent', color: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Aged', color: 'bg-zinc-100 text-zinc-600' }
}

export default function MarketplacePage() {
  const { toast } = useToast()
  const [leads, setLeads] = useState<MarketplaceLeadPreview[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [credits, setCredits] = useState(0)
  const [totalSpend, setTotalSpend] = useState(0)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [purchasedLeadCount, setPurchasedLeadCount] = useState(0)

  // Filters (with debouncing for better performance)
  const [filters, setFilters] = useState<Filters>({
    industries: [],
    states: [],
    companySizes: [],
    seniorityLevels: [],
  })
  const debouncedFilters = useDebounce(filters, 300) // 300ms debounce
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

      if (debouncedFilters.industries.length) params.set('industries', debouncedFilters.industries.join(','))
      if (debouncedFilters.states.length) params.set('states', debouncedFilters.states.join(','))
      if (debouncedFilters.companySizes.length) params.set('companySizes', debouncedFilters.companySizes.join(','))
      if (debouncedFilters.seniorityLevels.length) params.set('seniorityLevels', debouncedFilters.seniorityLevels.join(','))
      if (debouncedFilters.intentScoreMin !== undefined) params.set('intentScoreMin', String(debouncedFilters.intentScoreMin))
      if (debouncedFilters.freshnessMin !== undefined) params.set('freshnessMin', String(debouncedFilters.freshnessMin))
      if (debouncedFilters.hasPhone) params.set('hasPhone', 'true')
      if (debouncedFilters.hasVerifiedEmail) params.set('hasVerifiedEmail', 'true')

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
  }, [debouncedFilters, page, limit, orderBy, orderDirection])

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
    try {
      const statsRes = await fetch('/api/marketplace/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setTotalSpend(statsData.totalSpent || 0)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
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

  // Memoize expensive calculations
  const selectedTotal = useMemo(() => {
    return leads
      .filter((l) => selectedLeads.has(l.id))
      .reduce((sum, l) => sum + l.price, 0)
  }, [leads, selectedLeads])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.industries.length > 0) count++
    if (filters.states.length > 0) count++
    if (filters.companySizes.length > 0) count++
    if (filters.seniorityLevels.length > 0) count++
    if (filters.hasVerifiedEmail) count++
    if (filters.hasPhone) count++
    if (filters.intentScoreMin !== undefined && filters.intentScoreMin > 0) count++
    if (filters.freshnessMin !== undefined && filters.freshnessMin > 0) count++
    return count
  }, [filters])

  // Memoize callbacks to prevent unnecessary re-renders
  const purchaseSelected = useCallback(async () => {
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
        toast({
          title: 'Purchase successful',
          message: `${data.leads?.length || selectedLeads.size} lead(s) purchased successfully`,
          type: 'success',
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Purchase failed',
          message: error.error || 'Failed to purchase leads. Please try again.',
          type: 'error',
        })
      }
    } catch (error) {
      console.error('Purchase failed:', error)
      toast({
        title: 'Purchase failed',
        message: 'An error occurred while purchasing leads. Please try again.',
        type: 'error',
      })
    } finally {
      setIsPurchasing(false)
    }
  }, [selectedLeads, fetchLeads, toast])

  const toggleFilter = useCallback((category: keyof Filters, value: string) => {
    setFilters((prev) => {
      const current = prev[category] as string[]
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter((v) => v !== value) }
      } else {
        return { ...prev, [category]: [...current, value] }
      }
    })
    setPage(0) // Reset to first page when filters change
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      industries: [],
      states: [],
      companySizes: [],
      seniorityLevels: [],
    })
    setPage(0)
  }, [])

  const totalPages = useMemo(() => Math.ceil(totalLeads / limit), [totalLeads, limit])

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-[13px] font-medium text-primary">Purchase Successful!</h3>
                <p className="text-[13px] text-primary/90 mt-1">
                  {purchasedLeadCount} lead{purchasedLeadCount !== 1 ? 's' : ''} purchased. View them in your purchase history.
                </p>
              </div>
              <button onClick={() => setShowSuccessMessage(false)} className="ml-auto text-primary hover:text-primary/80">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Upsell Banner */}
          <UpsellBanner creditsBalance={credits} totalSpend={totalSpend} />

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-zinc-900">Lead Marketplace</h1>
              <p className="text-[13px] text-zinc-500 mt-1">{totalLeads.toLocaleString()} leads available</p>
            </div>

            {/* Mobile: Show only essential buttons + filters */}
            <div className="flex lg:hidden items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 rounded-lg flex-1 sm:flex-initial min-w-[100px]">
                <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[13px] font-medium text-zinc-900">${credits.toFixed(2)}</span>
              </div>
              <Link
                href="/marketplace/my-leads"
                className="h-11 sm:h-9 px-4 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150 inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden sm:inline">My Leads</span>
              </Link>
              <Link
                href="/marketplace/credits"
                className="h-11 sm:h-9 px-4 text-[13px] font-medium bg-primary text-white hover:bg-primary/90 rounded-lg transition-all duration-150 inline-flex items-center"
              >
                <span className="hidden sm:inline">Buy Credits</span>
                <span className="sm:hidden">Buy</span>
              </Link>
            </div>

            {/* Desktop: Show all buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[13px] font-medium text-zinc-900">${credits.toFixed(2)} credits</span>
              </div>
              <Link
                href="/marketplace/my-leads"
                className="h-9 px-4 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150 inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                My Leads
              </Link>
              <Link
                href="/marketplace/credits"
                className="h-9 px-4 text-[13px] font-medium bg-primary text-white hover:bg-primary/90 rounded-lg transition-all duration-150 inline-flex items-center"
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
            {/* Filters Sidebar - Desktop Only */}
            <div className={`hidden lg:block ${showFilters ? 'w-64 flex-shrink-0' : 'w-0'} transition-all duration-200`}>
              {showFilters && (
                <div className="bg-white border border-zinc-200 rounded-lg p-4 sticky top-4" role="region" aria-label="Lead filters">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[14px] font-semibold text-zinc-900">Filters</h2>
                    <button
                      onClick={clearFilters}
                      className="text-[12px] text-zinc-500 hover:text-zinc-700"
                      aria-label="Clear all filters"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Industry Filter */}
                  <fieldset className="mb-4">
                    <legend className="text-[12px] font-medium text-zinc-700 mb-2">Industry</legend>
                    <div className="space-y-1 max-h-40 overflow-y-auto" role="group" aria-label="Industry filters">
                      {INDUSTRIES.map((industry) => (
                        <label key={industry} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.industries.includes(industry)}
                            onChange={() => toggleFilter('industries', industry)}
                            className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                            aria-label={`Filter by ${industry} industry`}
                          />
                          <span className="text-[12px] text-zinc-600">{industry}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* State Filter */}
                  <fieldset className="mb-4">
                    <legend className="text-[12px] font-medium text-zinc-700 mb-2">State</legend>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2" role="group" aria-label="State filters">
                      {STATES.slice(0, 10).map((state) => (
                        <button
                          key={state}
                          onClick={() => toggleFilter('states', state)}
                          className={`h-11 min-w-[44px] lg:h-auto lg:px-2 lg:py-1 px-3 text-[11px] rounded flex items-center justify-center ${
                            filters.states.includes(state)
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                          aria-label={`Filter by ${state} state`}
                          aria-pressed={filters.states.includes(state)}
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Company Size Filter */}
                  <fieldset className="mb-4">
                    <legend className="text-[12px] font-medium text-zinc-700 mb-2">Company Size</legend>
                    <div className="space-y-1" role="group" aria-label="Company size filters">
                      {COMPANY_SIZES.map((size) => (
                        <label key={size} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.companySizes.includes(size)}
                            onChange={() => toggleFilter('companySizes', size)}
                            className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                            aria-label={`Filter by company size ${size} employees`}
                          />
                          <span className="text-[12px] text-zinc-600">{size} employees</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* Seniority Filter */}
                  <fieldset className="mb-4">
                    <legend className="text-[12px] font-medium text-zinc-700 mb-2">Seniority</legend>
                    <div className="space-y-1" role="group" aria-label="Seniority level filters">
                      {SENIORITY_LEVELS.map((level) => (
                        <label key={level.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.seniorityLevels.includes(level.value)}
                            onChange={() => toggleFilter('seniorityLevels', level.value)}
                            className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                            aria-label={`Filter by ${level.label} seniority level`}
                          />
                          <span className="text-[12px] text-zinc-600">{level.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* Contact Quality Filters */}
                  <fieldset className="mb-4">
                    <legend className="text-[12px] font-medium text-zinc-700 mb-2">Contact Quality</legend>
                    <div className="space-y-1" role="group" aria-label="Contact quality filters">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.hasVerifiedEmail}
                          onChange={() => setFilters((prev) => ({ ...prev, hasVerifiedEmail: !prev.hasVerifiedEmail }))}
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                          aria-label="Filter by verified email only"
                        />
                        <span className="text-[12px] text-zinc-600">Verified email only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.hasPhone}
                          onChange={() => setFilters((prev) => ({ ...prev, hasPhone: !prev.hasPhone }))}
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                          aria-label="Filter by has phone number"
                        />
                        <span className="text-[12px] text-zinc-600">Has phone number</span>
                      </label>
                    </div>
                  </fieldset>

                  {/* Intent Score Filter */}
                  <fieldset className="mb-4">
                    <legend className="text-[12px] font-medium text-zinc-700 mb-2">Minimum Intent Score</legend>
                    <div className="flex gap-2" role="group" aria-label="Intent score filters">
                      {[0, 40, 70].map((score) => (
                        <button
                          key={score}
                          onClick={() => setFilters((prev) => ({ ...prev, intentScoreMin: prev.intentScoreMin === score ? undefined : score }))}
                          className={`flex-1 px-2 py-1.5 text-[11px] rounded ${
                            filters.intentScoreMin === score
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                          aria-label={`Filter by intent score ${score === 0 ? 'all levels' : score === 40 ? 'warm and above' : 'hot only'}`}
                          aria-pressed={filters.intentScoreMin === score}
                        >
                          {score === 0 ? 'All' : score === 40 ? 'Warm+' : 'Hot'}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Freshness Filter */}
                  <fieldset>
                    <legend className="text-[12px] font-medium text-zinc-700 mb-2">Minimum Freshness</legend>
                    <div className="flex gap-2" role="group" aria-label="Freshness filters">
                      {[0, 40, 70].map((score) => (
                        <button
                          key={score}
                          onClick={() => setFilters((prev) => ({ ...prev, freshnessMin: prev.freshnessMin === score ? undefined : score }))}
                          className={`flex-1 px-2 py-1.5 text-[11px] rounded ${
                            filters.freshnessMin === score
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                          aria-label={`Filter by freshness ${score === 0 ? 'all levels' : score === 40 ? 'recent and above' : 'fresh only'}`}
                          aria-pressed={filters.freshnessMin === score}
                        >
                          {score === 0 ? 'All' : score === 40 ? 'Recent+' : 'Fresh'}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Desktop: Toggle Filters Sidebar */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="hidden lg:inline-flex h-9 px-3 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                  </button>

                  {/* Mobile: Filter Sheet */}
                  <MobileFilters filterCount={activeFilterCount}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={clearFilters}
                          className="text-[13px] text-zinc-500 hover:text-zinc-700"
                          aria-label="Clear all filters"
                        >
                          Clear all
                        </button>
                      </div>

                      {/* Industry Filter */}
                      <fieldset>
                        <legend className="text-[13px] font-medium text-zinc-900 mb-3">Industry</legend>
                        <div className="space-y-2 max-h-60 overflow-y-auto" role="group" aria-label="Industry filters">
                          {INDUSTRIES.map((industry) => (
                            <label key={industry} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.industries.includes(industry)}
                                onChange={() => toggleFilter('industries', industry)}
                                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                                aria-label={`Filter by ${industry} industry`}
                              />
                              <span className="text-[14px] text-zinc-700">{industry}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      {/* State Filter */}
                      <fieldset>
                        <legend className="text-[13px] font-medium text-zinc-900 mb-3">State</legend>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="State filters">
                          {STATES.slice(0, 10).map((state) => (
                            <button
                              key={state}
                              onClick={() => toggleFilter('states', state)}
                              className={`h-11 min-w-[44px] px-3 text-[12px] rounded flex items-center justify-center font-medium ${
                                filters.states.includes(state)
                                  ? 'bg-zinc-900 text-white'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                              aria-label={`Filter by ${state} state`}
                              aria-pressed={filters.states.includes(state)}
                            >
                              {state}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      {/* Company Size Filter */}
                      <fieldset>
                        <legend className="text-[13px] font-medium text-zinc-900 mb-3">Company Size</legend>
                        <div className="space-y-2" role="group" aria-label="Company size filters">
                          {COMPANY_SIZES.map((size) => (
                            <label key={size} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.companySizes.includes(size)}
                                onChange={() => toggleFilter('companySizes', size)}
                                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                                aria-label={`Filter by company size ${size} employees`}
                              />
                              <span className="text-[14px] text-zinc-700">{size} employees</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      {/* Seniority Filter */}
                      <fieldset>
                        <legend className="text-[13px] font-medium text-zinc-900 mb-3">Seniority</legend>
                        <div className="space-y-2" role="group" aria-label="Seniority level filters">
                          {SENIORITY_LEVELS.map((level) => (
                            <label key={level.value} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.seniorityLevels.includes(level.value)}
                                onChange={() => toggleFilter('seniorityLevels', level.value)}
                                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                                aria-label={`Filter by ${level.label} seniority level`}
                              />
                              <span className="text-[14px] text-zinc-700">{level.label}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      {/* Contact Quality Filters */}
                      <fieldset>
                        <legend className="text-[13px] font-medium text-zinc-900 mb-3">Contact Quality</legend>
                        <div className="space-y-2" role="group" aria-label="Contact quality filters">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.hasVerifiedEmail}
                              onChange={() => setFilters((prev) => ({ ...prev, hasVerifiedEmail: !prev.hasVerifiedEmail }))}
                              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                              aria-label="Filter by verified email only"
                            />
                            <span className="text-[14px] text-zinc-700">Verified email only</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.hasPhone}
                              onChange={() => setFilters((prev) => ({ ...prev, hasPhone: !prev.hasPhone }))}
                              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                              aria-label="Filter by has phone number"
                            />
                            <span className="text-[14px] text-zinc-700">Has phone number</span>
                          </label>
                        </div>
                      </fieldset>

                      {/* Intent Score Filter */}
                      <fieldset>
                        <legend className="text-[13px] font-medium text-zinc-900 mb-3">Minimum Intent Score</legend>
                        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Intent score filters">
                          {[0, 40, 70].map((score) => (
                            <button
                              key={score}
                              onClick={() => setFilters((prev) => ({ ...prev, intentScoreMin: prev.intentScoreMin === score ? undefined : score }))}
                              className={`h-11 px-3 text-[13px] font-medium rounded ${
                                filters.intentScoreMin === score
                                  ? 'bg-zinc-900 text-white'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                              aria-label={`Filter by intent score ${score === 0 ? 'all levels' : score === 40 ? 'warm and above' : 'hot only'}`}
                              aria-pressed={filters.intentScoreMin === score}
                            >
                              {score === 0 ? 'All' : score === 40 ? 'Warm+' : 'Hot'}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      {/* Freshness Filter */}
                      <fieldset>
                        <legend className="text-[13px] font-medium text-zinc-900 mb-3">Minimum Freshness</legend>
                        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Freshness filters">
                          {[0, 40, 70].map((score) => (
                            <button
                              key={score}
                              onClick={() => setFilters((prev) => ({ ...prev, freshnessMin: prev.freshnessMin === score ? undefined : score }))}
                              className={`h-11 px-3 text-[13px] font-medium rounded ${
                                filters.freshnessMin === score
                                  ? 'bg-zinc-900 text-white'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                              aria-label={`Filter by freshness ${score === 0 ? 'all levels' : score === 40 ? 'recent and above' : 'fresh only'}`}
                              aria-pressed={filters.freshnessMin === score}
                            >
                              {score === 0 ? 'All' : score === 40 ? 'Recent+' : 'Fresh'}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </MobileFilters>

                  <select
                    value={`${orderBy}-${orderDirection}`}
                    onChange={(e) => {
                      const [newOrderBy, newDirection] = e.target.value.split('-') as [typeof orderBy, typeof orderDirection]
                      setOrderBy(newOrderBy)
                      setOrderDirection(newDirection)
                    }}
                    className="h-11 px-3 text-[13px] border border-zinc-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
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
                      {selectedLeads.size} selected (${selectedTotal.toFixed(2)})
                    </span>
                    <Button
                      onClick={purchaseSelected}
                      disabled={isPurchasing || selectedTotal > credits}
                      loading={isPurchasing}
                      size="sm"
                    >
                      Purchase Selected
                    </Button>
                  </div>
                )}
              </div>

              {/* Service Tier Upsell Banner */}
              {credits < 50 && (
                <div className="bg-gradient-to-r from-primary to-primary/90 rounded-lg p-6 mb-6 text-white">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">
                        Running low on credits?
                      </h3>
                      <p className="text-white/90 text-sm mb-4">
                        Save 40% with Cursive Data—get custom lead lists delivered automatically every month instead of buying one by one.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <a
                          href={getServiceLink('data')}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-zinc-50 text-primary font-medium rounded-lg transition-colors text-sm"
                        >
                          See Data Plans
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                        <Link
                          href="/marketplace/credits"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-white hover:bg-white/10 text-white font-medium rounded-lg transition-colors text-sm"
                        >
                          Buy More Credits
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  <p className="text-[13px] text-zinc-500 mb-4">Try adjusting your filters to see more results.</p>
                  {credits === 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-200">
                      <p className="text-[13px] text-zinc-600 mb-3">Need leads?</p>
                      <div className="flex items-center justify-center gap-3">
                        <a
                          href={getServiceLink('data')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                        >
                          Explore Data Plans
                        </a>
                        <Link
                          href="/marketplace/credits"
                          className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-300 hover:border-zinc-400 text-zinc-700 font-medium rounded-lg transition-colors text-sm"
                        >
                          Buy Credits
                        </Link>
                      </div>
                    </div>
                  )}
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
                                  <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-primary/10 text-primary">
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

                              {/* Buy Lead Button */}
                              <div className="mt-3">
                                <BuyLeadButton
                                  lead={lead}
                                  onPurchaseComplete={() => {
                                    // Refresh leads list
                                    fetchLeads()
                                  }}
                                />
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
                        <Button
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                          disabled={page === 0}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                        <span className="text-[13px] text-zinc-600">
                          Page {page + 1} of {totalPages}
                        </span>
                        <Button
                          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={page >= totalPages - 1}
                          variant="outline"
                          size="sm"
                        >
                          Next
                        </Button>
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
