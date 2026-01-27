/**
 * Tier Context & Hooks
 * Cursive Platform
 *
 * Provides tier-based feature access control throughout the app.
 * Use useTier() to check if features are available for the current workspace.
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ProductTierFeatures, TierSlug } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface TierLimits {
  dailyLeads: number
  monthlyLeads: number | null
  teamMembers: number // -1 = unlimited
  campaigns: number // -1 = unlimited
  templates: number // -1 = unlimited
  emailAccounts: number // -1 = unlimited
}

interface TierUsage {
  dailyLeadsUsed: number
  monthlyLeadsUsed: number
  teamMembersUsed: number
  campaignsUsed: number
  templatesUsed: number
  emailAccountsUsed: number
}

interface TierContextValue {
  // Tier info
  tierSlug: TierSlug
  tierName: string
  isLoading: boolean
  error: string | null

  // Features
  features: ProductTierFeatures
  hasFeature: (feature: keyof ProductTierFeatures) => boolean

  // Limits
  limits: TierLimits
  usage: TierUsage
  isWithinLimit: (resource: keyof TierLimits) => boolean
  getRemainingLimit: (resource: keyof TierLimits) => number | 'unlimited'

  // Actions
  refresh: () => Promise<void>
  canUpgrade: boolean
}

// Default free tier features
const DEFAULT_FEATURES: ProductTierFeatures = {
  campaigns: false,
  templates: false,
  ai_agents: false,
  people_search: true,
  integrations: false,
  api_access: false,
  white_label: false,
  dedicated_support: false,
  custom_domains: false,
  team_members: 1,
  max_campaigns: 0,
  max_templates: 0,
  max_email_accounts: 1,
}

const DEFAULT_LIMITS: TierLimits = {
  dailyLeads: 3,
  monthlyLeads: null,
  teamMembers: 1,
  campaigns: 0,
  templates: 0,
  emailAccounts: 1,
}

const DEFAULT_USAGE: TierUsage = {
  dailyLeadsUsed: 0,
  monthlyLeadsUsed: 0,
  teamMembersUsed: 1,
  campaignsUsed: 0,
  templatesUsed: 0,
  emailAccountsUsed: 0,
}

// ============================================================================
// CONTEXT
// ============================================================================

const TierContext = createContext<TierContextValue | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

export function TierProvider({ children }: { children: React.ReactNode }) {
  const [tierSlug, setTierSlug] = useState<TierSlug>('free')
  const [tierName, setTierName] = useState('Free')
  const [features, setFeatures] = useState<ProductTierFeatures>(DEFAULT_FEATURES)
  const [limits, setLimits] = useState<TierLimits>(DEFAULT_LIMITS)
  const [usage, setUsage] = useState<TierUsage>(DEFAULT_USAGE)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTierInfo = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch tier info from API
      const response = await fetch('/api/workspace/tier')
      if (!response.ok) {
        throw new Error('Failed to fetch tier info')
      }

      const data = await response.json()

      if (data.success) {
        setTierSlug(data.tier.slug)
        setTierName(data.tier.name)
        setFeatures(data.tier.features)
        setLimits({
          dailyLeads: data.limits.daily,
          monthlyLeads: data.limits.monthly,
          teamMembers: data.tier.features.team_members,
          campaigns: data.tier.features.max_campaigns,
          templates: data.tier.features.max_templates,
          emailAccounts: data.tier.features.max_email_accounts,
        })
        setUsage(data.usage || DEFAULT_USAGE)
      }
    } catch (err: any) {
      console.error('Failed to fetch tier info:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTierInfo()
  }, [fetchTierInfo])

  const hasFeature = useCallback(
    (feature: keyof ProductTierFeatures): boolean => {
      const value = features[feature]
      if (typeof value === 'boolean') return value
      if (typeof value === 'number') return value !== 0 // 0 = disabled, -1 = unlimited
      return false
    },
    [features]
  )

  const isWithinLimit = useCallback(
    (resource: keyof TierLimits): boolean => {
      const limit = limits[resource]
      if (limit === null || limit === -1) return true // Unlimited

      const usageKey = `${resource}Used` as keyof TierUsage
      const used = usage[usageKey] || 0

      return used < limit
    },
    [limits, usage]
  )

  const getRemainingLimit = useCallback(
    (resource: keyof TierLimits): number | 'unlimited' => {
      const limit = limits[resource]
      if (limit === null || limit === -1) return 'unlimited'

      const usageKey = `${resource}Used` as keyof TierUsage
      const used = usage[usageKey] || 0

      return Math.max(0, limit - used)
    },
    [limits, usage]
  )

  const canUpgrade = tierSlug !== 'enterprise'

  const value: TierContextValue = {
    tierSlug,
    tierName,
    isLoading,
    error,
    features,
    hasFeature,
    limits,
    usage,
    isWithinLimit,
    getRemainingLimit,
    refresh: fetchTierInfo,
    canUpgrade,
  }

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Access tier information and feature checking
 */
export function useTier(): TierContextValue {
  const context = useContext(TierContext)
  if (!context) {
    throw new Error('useTier must be used within a TierProvider')
  }
  return context
}

/**
 * Check if a specific feature is available
 */
export function useFeature(feature: keyof ProductTierFeatures): {
  hasAccess: boolean
  isLoading: boolean
  tierName: string
} {
  const { hasFeature, isLoading, tierName } = useTier()
  return {
    hasAccess: hasFeature(feature),
    isLoading,
    tierName,
  }
}

/**
 * Check if within a specific resource limit
 */
export function useLimit(resource: keyof TierLimits): {
  isWithinLimit: boolean
  remaining: number | 'unlimited'
  limit: number | null
  used: number
  isLoading: boolean
} {
  const { limits, usage, isWithinLimit, getRemainingLimit, isLoading } = useTier()

  const usageKey = `${resource}Used` as keyof TierUsage
  const used = usage[usageKey] || 0
  const limit = limits[resource]

  return {
    isWithinLimit: isWithinLimit(resource),
    remaining: getRemainingLimit(resource),
    limit: limit === -1 ? null : limit,
    used,
    isLoading,
  }
}

// ============================================================================
// FEATURE FLAGS (for convenience)
// ============================================================================

export const TIER_FEATURES = {
  CAMPAIGNS: 'campaigns',
  TEMPLATES: 'templates',
  AI_AGENTS: 'ai_agents',
  PEOPLE_SEARCH: 'people_search',
  INTEGRATIONS: 'integrations',
  API_ACCESS: 'api_access',
  WHITE_LABEL: 'white_label',
  DEDICATED_SUPPORT: 'dedicated_support',
  CUSTOM_DOMAINS: 'custom_domains',
} as const

export type TierFeature = (typeof TIER_FEATURES)[keyof typeof TIER_FEATURES]
