'use client'

import { ReactNode, useEffect } from 'react'
import Link from 'next/link'
import { Lock, ArrowRight, Sparkles } from 'lucide-react'
import { useFeature } from '@/lib/hooks/use-tier'
import type { ProductTierFeatures } from '@/types'
import { trackFeatureLock } from '@/lib/analytics/service-tier-events'
import { getSubscriptionLink, getServiceLink } from '@/lib/stripe/payment-links'

/**
 * Maps tier slugs to the correct payment URL.
 * Service tiers (cursive-data, cursive-outbound, cursive-pipeline) use service payment links.
 * Subscription tiers (starter, pro, enterprise) use subscription payment links.
 * Falls back to the pricing page if no match found.
 */
function getUpgradeUrl(tierSlug: string): string {
  const serviceMap: Record<string, 'data' | 'outbound' | 'pipeline'> = {
    'cursive-data': 'data',
    'cursive-outbound': 'outbound',
    'cursive-pipeline': 'pipeline',
  }

  const subscriptionMap: Record<string, 'starter' | 'pro' | 'enterprise'> = {
    'starter': 'starter',
    'pro': 'pro',
    'enterprise': 'enterprise',
  }

  if (serviceMap[tierSlug]) {
    return getServiceLink(serviceMap[tierSlug])
  }

  if (subscriptionMap[tierSlug]) {
    return getSubscriptionLink(subscriptionMap[tierSlug], 'monthly')
  }

  // Default fallback: Pro subscription
  return getSubscriptionLink('pro', 'monthly')
}

interface FeatureLockProps {
  feature: keyof ProductTierFeatures
  requiredTier?: string
  requiredTierSlug?: string
  children: ReactNode
  fallback?: ReactNode
  showBlur?: boolean
}

/**
 * FeatureLock Component
 *
 * Blocks access to features based on tier, showing an upgrade prompt.
 *
 * @example
 * <FeatureLock feature="campaigns" requiredTier="Cursive Outbound" requiredTierSlug="cursive-outbound">
 *   <CampaignBuilder />
 * </FeatureLock>
 */
export function FeatureLock({
  feature,
  requiredTier = 'Pro',
  requiredTierSlug = 'pro',
  children,
  fallback,
  showBlur = true
}: FeatureLockProps) {
  const { hasAccess, isLoading } = useFeature(feature)

  // Track when feature lock is displayed
  useEffect(() => {
    if (!isLoading && !hasAccess) {
      trackFeatureLock('displayed', feature, requiredTier)
    }
  }, [hasAccess, isLoading, feature, requiredTier])

  // Show loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-zinc-100 rounded-lg" />
      </div>
    )
  }

  // User has access - show the feature
  if (hasAccess) {
    return <>{children}</>
  }

  // User doesn't have access - show lock screen
  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      {showBlur && (
        <div className="blur-sm pointer-events-none opacity-50 select-none">
          {children}
        </div>
      )}

      {/* Lock overlay */}
      <div className={`${showBlur ? 'absolute inset-0' : ''} flex items-center justify-center p-8`}>
        <div className="max-w-md w-full bg-white rounded-xl border-2 border-zinc-200 shadow-lg p-8 text-center">
          {/* Lock icon */}
          <div className="inline-flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          {/* Heading */}
          <h3 className="text-xl font-bold text-zinc-900 mb-2">
            Upgrade to {requiredTier}
          </h3>

          {/* Description */}
          <p className="text-zinc-600 mb-6">
            This feature requires an active {requiredTier} subscription. Unlock this and more with an upgrade.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={getUpgradeUrl(requiredTierSlug)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
              onClick={() => trackFeatureLock('upgrade_clicked', feature, requiredTier)}
            >
              Upgrade Now
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-zinc-300 hover:border-zinc-400 text-zinc-700 font-medium rounded-lg transition-colors"
              onClick={() => trackFeatureLock('upgrade_clicked', feature, requiredTier)}
            >
              Compare Plans
            </Link>
          </div>

          {/* Feature list */}
          <div className="mt-6 pt-6 border-t border-zinc-200 text-left">
            <p className="text-sm font-medium text-zinc-900 mb-3">
              {requiredTier} includes:
            </p>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Full feature access</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Dedicated support</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <span>30-day money-back guarantee</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline feature lock (no blur, just a banner)
 */
export function InlineFeatureLock({
  feature,
  requiredTier = 'Pro',
  requiredTierSlug = 'pro',
}: {
  feature: keyof ProductTierFeatures
  requiredTier?: string
  requiredTierSlug?: string
}) {
  const { hasAccess } = useFeature(feature)

  if (hasAccess) return null

  return (
    <div className="bg-gradient-to-r from-primary/5 to-indigo-50 border border-primary/20 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-900 mb-1">
            Upgrade Required
          </h3>
          <p className="text-sm text-zinc-600 mb-4">
            This feature requires {requiredTier}. Unlock it now to get started.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={getUpgradeUrl(requiredTierSlug)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Upgrade Now
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-300 hover:border-zinc-400 text-zinc-700 font-medium rounded-lg transition-colors text-sm"
            >
              Compare All Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
