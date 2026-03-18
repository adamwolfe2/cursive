'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { useDebounce } from '@/hooks/use-debounce'
import { Button } from '@/components/ui/button'
import { MobileFilters } from './components/MobileFilters'
import { FilterContent } from './components/FilterContent'
import { BuyLeadButton } from '@/components/marketplace/BuyLeadButton'
import { UpsellBanner } from '@/components/marketplace/UpsellBanner'
import { UpgradeModal } from '@/components/marketplace/UpgradeModal'
import { SaveSearchButton } from '@/components/marketplace/SaveSearchButton'
import { SavedSearchesList } from '@/components/marketplace/SavedSearchesList'
import { useUpgradeModal } from '@/lib/hooks/use-upgrade-modal'
import { getServiceLink } from '@/lib/stripe/payment-links'
import {
  useMarketplaceLeads,
  useMarketplaceCredits,
  useMarketplaceStats,
  usePurchaseLeads,
  type MarketplaceFilters,
} from '@/lib/hooks/use-marketplace-leads'
import { useQueryClient } from '@tanstack/react-query'
import { SUCCESS_MESSAGE_MS } from '@/lib/constants/timeouts'

// Re-use Filters type from the hook
type Filters = MarketplaceFilters


function getIntentBadge(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Hot', color: 'bg-emerald-100 text-emerald-700' }
  if (score >= 40) return { label: 'Warm', color: 'bg-amber-100 text-amber-700' }
  return { label: 'Cold', color: 'bg-slate-100 text-slate-600' }
}

function getFreshnessBadge(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Fresh', color: 'bg-blue-100 text-blue-700' }
  if (score >= 40) return { label: 'Recent', color: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Aged', color: 'bg-zinc-100 text-zinc-600' }
}

export default function MarketplacePage() {
  const queryClient = useQueryClient()
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [purchasedLeadCount, setPurchasedLeadCount] = useState(0)

  // Ref-based lock: prevents double-submits in the gap before isPurchasing becomes true
  const purchaseInFlight = useRef(false)

  // Upgrade modal state — shown on 402 / insufficient_credits errors
  const { isOpen: upgradeModalOpen, trigger: upgradeTrigger, context: upgradeContext, showUpgradeModal, closeModal: closeUpgradeModal } = useUpgradeModal()

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

  // Sorting — 'relevant' maps to default ordering (freshness_score desc), 'newest' to created_at desc, 'intent' to intent_score desc
  type SortOption = 'relevant' | 'newest' | 'intent'
  const [sortOption, setSortOption] = useState<SortOption>('relevant')

  // Derive orderBy/orderDirection from sortOption
  const orderBy = sortOption === 'intent' ? 'intent_score' : sortOption === 'newest' ? 'created_at' : 'freshness_score'
  const orderDirection: 'asc' | 'desc' = 'desc'

  // ── React Query hooks ──────────────────────────────────────────────────────
  const leadsQuery = useMarketplaceLeads({
    filters: debouncedFilters,
    page,
    limit,
    orderBy,
    orderDirection,
  })
  const creditsQuery = useMarketplaceCredits()
  const statsQuery = useMarketplaceStats()
  const purchaseMutation = usePurchaseLeads()

  // Derived values from query results
  // Memoize leads to prevent new array reference on every render (which would
  // invalidate downstream useMemo hooks unnecessarily)
  const leads = useMemo(() => leadsQuery.data?.leads ?? [], [leadsQuery.data?.leads])
  const totalLeads = leadsQuery.data?.total ?? 0
  const isLoading = leadsQuery.isLoading
  const credits = creditsQuery.data?.balance ?? 0
  const totalSpend = statsQuery.data?.totalSpent ?? 0
  const leadCount = statsQuery.data?.leadCount ?? 0
  const isPurchasing = purchaseMutation.isPending

  // Handle Stripe redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      setShowSuccessMessage(true)
      window.history.replaceState({}, '', '/marketplace')
      const timer = setTimeout(() => setShowSuccessMessage(false), SUCCESS_MESSAGE_MS)
      return () => clearTimeout(timer)
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

  // Purchase selected leads via mutation
  // Uses a ref-based lock (purchaseInFlight) to block duplicate calls that
  // arrive before React re-renders and isPurchasing becomes true.
  const purchaseSelected = useCallback(async () => {
    if (selectedLeads.size === 0) return
    if (purchaseInFlight.current) return

    purchaseInFlight.current = true
    const leadIds = Array.from(selectedLeads)
    purchaseMutation.mutate(leadIds, {
      onSuccess: (data) => {
        const count = data.leads?.length || leadIds.length
        setPurchasedLeadCount(count)
        setShowSuccessMessage(true)
        setSelectedLeads(new Set())
        setTimeout(() => setShowSuccessMessage(false), SUCCESS_MESSAGE_MS)
      },
      onError: (error: Error) => {
        // Show the upgrade modal instead of a toast when credits are exhausted
        const msg = error.message.toLowerCase()
        if (msg.includes('insufficient') || msg.includes('credits')) {
          showUpgradeModal(
            'credits_empty',
            `You don't have enough credits to purchase ${leadIds.length} lead${leadIds.length !== 1 ? 's' : ''}. Top up to continue.`
          )
        }
        // The usePurchaseLeads onError still shows a generic toast for other errors
      },
      onSettled: () => {
        purchaseInFlight.current = false
      },
    })
  }, [selectedLeads, purchaseMutation, showUpgradeModal])

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
    setSortOption('relevant')
    setPage(0)
  }, [])

  // Apply a saved search's filters to the current state
  const applyFilters = useCallback((savedFilters: MarketplaceFilters) => {
    setFilters({
      industries: savedFilters.industries ?? [],
      states: savedFilters.states ?? [],
      companySizes: savedFilters.companySizes ?? [],
      seniorityLevels: savedFilters.seniorityLevels ?? [],
      hasVerifiedEmail: savedFilters.hasVerifiedEmail,
      hasPhone: savedFilters.hasPhone,
      intentScoreMin: savedFilters.intentScoreMin,
      freshnessMin: savedFilters.freshnessMin,
    })
    setPage(0)
  }, [])

  const totalPages = useMemo(() => Math.ceil(totalLeads / limit), [totalLeads, limit])

  return (
    <>
      {/* Upgrade modal — rendered once at the top level, triggered from anywhere in this page */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={closeUpgradeModal}
        trigger={upgradeTrigger}
        context={upgradeContext}
      />
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
          <UpsellBanner creditsBalance={credits} totalSpend={totalSpend} leadCount={leadCount} />

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
              <Button asChild variant="outline" size="sm">
                <Link href="/marketplace/my-leads" className="gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="hidden sm:inline">My Leads</span>
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/marketplace/credits">
                  <span className="hidden sm:inline">Buy Credits</span>
                  <span className="sm:hidden">Buy</span>
                </Link>
              </Button>
            </div>

            {/* Desktop: Show all buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[13px] font-medium text-zinc-900">${credits.toFixed(2)} credits</span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/marketplace/custom-audience" className="gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Request Custom Audience
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/marketplace/my-leads" className="gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  My Leads
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/marketplace/credits">
                  Buy Credits
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/marketplace/history">
                  Purchase History
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/marketplace/referrals" className="gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Refer &amp; Earn
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Filters Sidebar - Desktop Only */}
            <div className={`hidden lg:block ${showFilters ? 'w-64 flex-shrink-0' : 'w-0'} transition-all duration-200`}>
              {showFilters && (
                <div className="bg-white border border-zinc-200 rounded-lg p-4 sticky top-4" role="region" aria-label="Lead filters">
                  <FilterContent
                    filters={filters}
                    toggleFilter={toggleFilter}
                    setFilters={setFilters}
                    clearFilters={clearFilters}
                    variant="desktop"
                  />
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Desktop: Toggle Filters Sidebar */}
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    size="sm"
                    className="hidden lg:inline-flex gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                  </Button>

                  {/* Save Search Button — desktop only, shown next to Filters toggle */}
                  <div className="hidden lg:block">
                    <SaveSearchButton
                      filters={filters}
                      activeFilterCount={activeFilterCount}
                    />
                  </div>

                  {/* Mobile: Filter Sheet */}
                  <MobileFilters filterCount={activeFilterCount}>
                    <FilterContent
                      filters={filters}
                      toggleFilter={toggleFilter}
                      setFilters={setFilters}
                      clearFilters={clearFilters}
                      variant="mobile"
                    />
                  </MobileFilters>

                  {/* Sort dropdown — desktop and mobile */}
                  <select
                    value={sortOption}
                    onChange={(e) => {
                      const val = e.target.value as SortOption | 'verified_email'
                      if (val === 'verified_email') {
                        // Shortcut: set hasVerifiedEmail filter + reset sort to relevant
                        setFilters((prev) => ({ ...prev, hasVerifiedEmail: true }))
                        setSortOption('relevant')
                      } else {
                        setSortOption(val)
                      }
                      setPage(0)
                    }}
                    className="h-11 px-3 text-[13px] border border-zinc-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    aria-label="Sort leads"
                  >
                    <option value="relevant">Most Relevant</option>
                    <option value="newest">Newest First</option>
                    <option value="intent">Highest Intent</option>
                    <option value="verified_email">Verified Email Only</option>
                  </select>
                </div>

                {selectedLeads.size > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-zinc-600">
                      {selectedLeads.size} selected (${selectedTotal.toFixed(2)})
                    </span>
                    {selectedTotal > credits ? (
                      <Button
                        onClick={() =>
                          showUpgradeModal(
                            'credits_empty',
                            `You need $${selectedTotal.toFixed(2)} in credits but only have $${credits.toFixed(2)}. Top up to purchase these leads.`
                          )
                        }
                        variant="outline"
                        size="sm"
                      >
                        Top Up to Purchase
                      </Button>
                    ) : (
                      <Button
                        onClick={purchaseSelected}
                        disabled={isPurchasing}
                        loading={isPurchasing}
                        size="sm"
                      >
                        Purchase Selected
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Saved Searches — quick-access chips above the leads grid */}
              <SavedSearchesList onApply={applyFilters} />

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
                        <button
                          type="button"
                          onClick={() => showUpgradeModal('credits_low', `You have $${credits.toFixed(2)} in credits remaining.`)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-white hover:bg-white/10 text-white font-medium rounded-lg transition-colors text-sm"
                        >
                          Buy More Credits
                        </button>
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
                  <h3 className="text-[14px] font-medium text-zinc-900 mb-1">No leads match your criteria</h3>
                  <p className="text-[13px] text-zinc-500 mb-4">Try adjusting your filters or request a custom audience tailored to your needs.</p>

                  {/* Custom Audience CTA - Always Show */}
                  <div className="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <h4 className="text-[14px] font-semibold text-emerald-900">Can&apos;t find what you need?</h4>
                    </div>
                    <p className="text-[13px] text-emerald-700 mb-4">
                      Get a <span className="font-semibold">free 25-lead sample</span> tailored to your exact criteria within 48 hours.
                    </p>
                    <Button asChild>
                      <Link
                        href="/marketplace/custom-audience"
                        className="gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Request Custom Audience
                      </Link>
                    </Button>
                  </div>

                  {credits === 0 && (
                    <div className="mt-6 pt-6 border-t border-zinc-200">
                      <p className="text-[13px] text-zinc-600 mb-3">Or browse our data plans</p>
                      <div className="flex items-center justify-center gap-3">
                        <Button asChild>
                          <a href={getServiceLink('data')} className="gap-2">
                            Explore Data Plans
                          </a>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href="/marketplace/credits" className="gap-2">
                            Buy Credits
                          </Link>
                        </Button>
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
                                    // Invalidate leads cache so purchased lead disappears
                                    queryClient.invalidateQueries({ queryKey: ['marketplace-leads'] })
                                    queryClient.invalidateQueries({ queryKey: ['marketplace-credits'] })
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
