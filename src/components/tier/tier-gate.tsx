/**
 * TierGate Component
 * Cursive Platform
 *
 * Conditionally renders content based on tier features.
 * Shows upgrade prompt for features not available on current tier.
 */

'use client'

import React from 'react'
import { useTier, type TierFeature } from '@/lib/hooks/use-tier'
import type { ProductTierFeatures } from '@/types'
import Link from 'next/link'
import { getSubscriptionLink, getCreditLink } from '@/lib/stripe/payment-links'

// ============================================================================
// TIER GATE - For feature-based gating
// ============================================================================

interface TierGateProps {
  feature: keyof ProductTierFeatures
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
}

export function TierGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: TierGateProps) {
  const { hasFeature, isLoading, tierName, canUpgrade } = useTier()

  if (isLoading) {
    return null // Or a loading skeleton
  }

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showUpgradePrompt) {
    return <FeatureLockedPrompt feature={feature} currentTier={tierName} canUpgrade={canUpgrade} />
  }

  return null
}

// ============================================================================
// LIMIT GATE - For limit-based gating
// ============================================================================

interface LimitGateProps {
  resource: 'dailyLeads' | 'monthlyLeads' | 'teamMembers' | 'campaigns' | 'templates' | 'emailAccounts'
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
}

export function LimitGate({
  resource,
  children,
  fallback,
  showUpgradePrompt = true,
}: LimitGateProps) {
  const { isWithinLimit, getRemainingLimit, limits, tierName, canUpgrade, isLoading } = useTier()

  if (isLoading) {
    return null
  }

  if (isWithinLimit(resource)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showUpgradePrompt) {
    return (
      <LimitReachedPrompt
        resource={resource}
        limit={limits[resource] || 0}
        currentTier={tierName}
        canUpgrade={canUpgrade}
      />
    )
  }

  return null
}

// ============================================================================
// PROMPTS
// ============================================================================

/**
 * Maps a tier display name to its payment URL
 */
function getUpgradeUrlForTier(tierName: string): string {
  const tierMap: Record<string, 'starter' | 'pro' | 'enterprise'> = {
    'Starter': 'starter',
    'starter': 'starter',
    'Pro': 'pro',
    'pro': 'pro',
    'Growth': 'pro',
    'growth': 'pro',
    'Enterprise': 'enterprise',
    'enterprise': 'enterprise',
  }

  const plan = tierMap[tierName] || 'pro'
  return getSubscriptionLink(plan, 'monthly')
}

const FEATURE_NAMES: Record<keyof ProductTierFeatures, string> = {
  campaigns: 'Email Campaigns',
  templates: 'Email Templates',
  ai_agents: 'AI Agents',
  people_search: 'People Search',
  integrations: 'Integrations',
  api_access: 'API Access',
  white_label: 'White Label',
  dedicated_support: 'Dedicated Support',
  custom_domains: 'Custom Domains',
  team_members: 'Team Members',
  max_campaigns: 'Campaigns',
  max_templates: 'Templates',
  max_email_accounts: 'Email Accounts',
}

const FEATURE_TIERS: Record<keyof ProductTierFeatures, string> = {
  campaigns: 'Starter',
  templates: 'Starter',
  ai_agents: 'Growth',
  people_search: 'Free',
  integrations: 'Starter',
  api_access: 'Growth',
  white_label: 'Enterprise',
  dedicated_support: 'Enterprise',
  custom_domains: 'Enterprise',
  team_members: 'Free',
  max_campaigns: 'Starter',
  max_templates: 'Starter',
  max_email_accounts: 'Starter',
}

function FeatureLockedPrompt({
  feature,
  currentTier,
  canUpgrade,
}: {
  feature: keyof ProductTierFeatures
  currentTier: string
  canUpgrade: boolean
}) {
  const featureName = FEATURE_NAMES[feature] || feature
  const requiredTier = FEATURE_TIERS[feature] || 'Starter'

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
        <svg
          className="h-6 w-6 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-medium text-zinc-900">{featureName}</h3>
      <p className="mt-1 text-xs text-zinc-500">
        This feature requires the {requiredTier} plan or higher.
      </p>
      {canUpgrade && (
        <a
          href={getUpgradeUrlForTier(requiredTier)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          Upgrade to {requiredTier}
        </a>
      )}
    </div>
  )
}

function LimitReachedPrompt({
  resource,
  limit,
  currentTier,
  canUpgrade,
}: {
  resource: string
  limit: number
  currentTier: string
  canUpgrade: boolean
}) {
  const resourceName = resource
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            {resourceName} Limit Reached
          </h3>
          <p className="mt-1 text-xs text-amber-700">
            You've reached your {currentTier} plan limit of {limit} {resourceName.toLowerCase()}.
          </p>
          {canUpgrade && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a
                href={getSubscriptionLink('pro', 'monthly')}
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:text-amber-900"
              >
                Upgrade for more
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <button
                onClick={() => window.open(getCreditLink('starter'), '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
              >
                Buy Credits
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// UPGRADE BANNER
// ============================================================================

interface UpgradeBannerProps {
  title?: string
  description?: string
  targetTier?: string
}

export function UpgradeBanner({
  title = 'Upgrade your plan',
  description = 'Get access to more features and higher limits',
  targetTier = 'Growth',
}: UpgradeBannerProps) {
  const { canUpgrade, tierName } = useTier()

  if (!canUpgrade) return null

  return (
    <div className="rounded-lg bg-gradient-to-r from-primary to-indigo-600 p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-white/80">{description}</p>
        </div>
        <a
          href={getUpgradeUrlForTier(targetTier)}
          className="flex-shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-white/90 transition-colors"
        >
          Upgrade to {targetTier}
        </a>
      </div>
    </div>
  )
}

// ============================================================================
// USAGE INDICATOR
// ============================================================================

interface UsageIndicatorProps {
  resource: 'dailyLeads' | 'monthlyLeads' | 'teamMembers' | 'campaigns' | 'templates' | 'emailAccounts'
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function UsageIndicator({ resource, showLabel = true, size = 'md' }: UsageIndicatorProps) {
  const { limits, usage, isLoading } = useTier()

  if (isLoading) {
    return <div className="h-2 w-20 animate-pulse rounded bg-zinc-200" />
  }

  const limit = limits[resource]
  const usageKey = `${resource}Used` as keyof typeof usage
  const used = usage[usageKey] || 0

  if (limit === null || limit === -1) {
    return showLabel ? (
      <span className={`text-${size === 'sm' ? 'xs' : 'sm'} text-zinc-500`}>Unlimited</span>
    ) : null
  }

  const percentage = Math.min(100, (used / limit) * 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${size === 'sm' ? 'h-1.5' : 'h-2'} w-20 rounded-full bg-zinc-200`}>
        <div
          className={`h-full rounded-full transition-all ${
            isAtLimit
              ? 'bg-red-500'
              : isNearLimit
              ? 'bg-amber-500'
              : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={`text-${size === 'sm' ? 'xs' : 'sm'} ${
            isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-zinc-500'
          }`}
        >
          {used}/{limit}
        </span>
      )}
    </div>
  )
}
