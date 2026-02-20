// React Query hooks for marketplace leads
// Handles data fetching, caching, pagination prefetching, and purchase mutations

'use client'

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useToast } from '@/lib/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils/error-messages'
import { safeError } from '@/lib/utils/log-sanitizer'

// ── Types ────────────────────────────────────────────────────────────────────

export interface MarketplaceLeadPreview {
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

export interface MarketplaceFilters {
  industries: string[]
  states: string[]
  companySizes: string[]
  seniorityLevels: string[]
  intentScoreMin?: number
  freshnessMin?: number
  hasPhone?: boolean
  hasVerifiedEmail?: boolean
}

interface MarketplaceLeadsResponse {
  leads: MarketplaceLeadPreview[]
  total: number
}

interface MarketplaceCreditsResponse {
  balance: number
}

interface MarketplaceStatsResponse {
  totalSpent: number
}

interface PurchaseResponse {
  leads?: { id: string }[]
  creditsRemaining: number
}

interface MarketplaceLeadsParams {
  filters: MarketplaceFilters
  page: number
  limit: number
  orderBy: 'freshness_score' | 'intent_score' | 'price' | 'created_at'
  orderDirection: 'asc' | 'desc'
}

// ── Query Key Factories ──────────────────────────────────────────────────────

export const marketplaceKeys = {
  all: ['marketplace'] as const,
  leads: (params: MarketplaceLeadsParams) => ['marketplace-leads', params] as const,
  credits: () => ['marketplace-credits'] as const,
  stats: () => ['marketplace-stats'] as const,
}

// ── Fetch Functions ──────────────────────────────────────────────────────────

function buildLeadsQueryString(params: MarketplaceLeadsParams): string {
  const searchParams = new URLSearchParams()
  const { filters, page, limit, orderBy, orderDirection } = params

  if (filters.industries.length) searchParams.set('industries', filters.industries.join(','))
  if (filters.states.length) searchParams.set('states', filters.states.join(','))
  if (filters.companySizes.length) searchParams.set('companySizes', filters.companySizes.join(','))
  if (filters.seniorityLevels.length) searchParams.set('seniorityLevels', filters.seniorityLevels.join(','))
  if (filters.intentScoreMin !== undefined) searchParams.set('intentScoreMin', String(filters.intentScoreMin))
  if (filters.freshnessMin !== undefined) searchParams.set('freshnessMin', String(filters.freshnessMin))
  if (filters.hasPhone) searchParams.set('hasPhone', 'true')
  if (filters.hasVerifiedEmail) searchParams.set('hasVerifiedEmail', 'true')

  searchParams.set('limit', String(limit))
  searchParams.set('offset', String(page * limit))
  searchParams.set('orderBy', orderBy)
  searchParams.set('orderDirection', orderDirection)

  return searchParams.toString()
}

async function fetchMarketplaceLeads(params: MarketplaceLeadsParams): Promise<MarketplaceLeadsResponse> {
  const queryString = buildLeadsQueryString(params)
  const response = await fetch(`/api/marketplace/leads?${queryString}`)

  if (!response.ok) {
    throw new Error('Failed to fetch marketplace leads')
  }

  const data = await response.json()
  return {
    leads: data.leads || [],
    total: data.total || 0,
  }
}

async function fetchMarketplaceCredits(): Promise<MarketplaceCreditsResponse> {
  const response = await fetch('/api/marketplace/credits')

  if (!response.ok) {
    throw new Error('Failed to fetch credits')
  }

  const data = await response.json()
  return { balance: data.balance || 0 }
}

async function fetchMarketplaceStats(): Promise<MarketplaceStatsResponse> {
  const response = await fetch('/api/marketplace/stats')

  if (!response.ok) {
    throw new Error('Failed to fetch stats')
  }

  const data = await response.json()
  return { totalSpent: data.totalSpent || 0 }
}

async function purchaseLeads(leadIds: string[]): Promise<PurchaseResponse> {
  const response = await fetch('/api/marketplace/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadIds,
      paymentMethod: 'credits',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Purchase failed')
  }

  return response.json()
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Hook to fetch marketplace leads with caching, stale time, and
 * keepPreviousData to avoid flash of empty state when filters change.
 */
export function useMarketplaceLeads(params: MarketplaceLeadsParams) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: marketplaceKeys.leads(params),
    queryFn: () => fetchMarketplaceLeads(params),
    staleTime: 30_000, // 30 seconds — marketplace leads don't change every second
    gcTime: 5 * 60_000, // 5 minutes garbage collection
    placeholderData: keepPreviousData, // show previous data while loading new filter results
  })

  // Prefetch next page when current page loads successfully
  const { page, limit } = params
  const totalPages = query.data ? Math.ceil(query.data.total / limit) : 0
  const hasNextPage = page < totalPages - 1

  if (hasNextPage && query.isSuccess) {
    const nextPageParams = { ...params, page: page + 1 }
    queryClient.prefetchQuery({
      queryKey: marketplaceKeys.leads(nextPageParams),
      queryFn: () => fetchMarketplaceLeads(nextPageParams),
      staleTime: 30_000,
    })
  }

  return query
}

/**
 * Hook to fetch marketplace credit balance.
 */
export function useMarketplaceCredits() {
  return useQuery({
    queryKey: marketplaceKeys.credits(),
    queryFn: fetchMarketplaceCredits,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

/**
 * Hook to fetch marketplace stats (total spend).
 */
export function useMarketplaceStats() {
  return useQuery({
    queryKey: marketplaceKeys.stats(),
    queryFn: fetchMarketplaceStats,
    staleTime: 60_000, // 1 minute — stats change even less frequently
    gcTime: 5 * 60_000,
  })
}

/**
 * Mutation hook for purchasing leads.
 * On success: invalidates leads cache (purchased leads disappear),
 * updates credits cache optimistically, shows success toast.
 */
export function usePurchaseLeads() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (leadIds: string[]) => purchaseLeads(leadIds),
    onSuccess: (data, leadIds) => {
      // Invalidate marketplace leads so purchased ones disappear
      queryClient.invalidateQueries({ queryKey: ['marketplace-leads'] })

      // Update credits cache with the new balance from the response
      if (data.creditsRemaining !== undefined) {
        queryClient.setQueryData(marketplaceKeys.credits(), {
          balance: data.creditsRemaining,
        })
      }

      // Also invalidate stats since total spend changed
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.stats() })

      const count = data.leads?.length || leadIds.length
      toast({
        title: 'Purchase successful',
        message: `${count} lead${count !== 1 ? 's' : ''} purchased successfully`,
        type: 'success',
      })
    },
    onError: (error: Error) => {
      safeError('[usePurchaseLeads]', 'Purchase failed:', error)
      toast({
        title: 'Purchase failed',
        message: getErrorMessage(error.message || error),
        type: 'error',
      })
    },
  })
}
