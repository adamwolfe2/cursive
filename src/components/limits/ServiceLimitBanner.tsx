'use client'

import Link from 'next/link'
import { AlertTriangle, TrendingUp, ArrowRight, X } from 'lucide-react'
import { useTier, useLimit } from '@/lib/hooks/use-tier'
import { useState } from 'react'
import { getSubscriptionLink, getCreditLink } from '@/lib/stripe/payment-links'

interface ServiceLimitBannerProps {
  resource?: 'dailyLeads' | 'monthlyLeads' | 'campaigns' | 'teamMembers' | 'templates' | 'emailAccounts'
  threshold?: number // Show warning at this percentage (default 80%)
  dismissible?: boolean
}

/**
 * ServiceLimitBanner Component
 *
 * Shows a warning banner when approaching resource limits
 *
 * @example
 * <ServiceLimitBanner resource="dailyLeads" threshold={80} dismissible />
 */
export function ServiceLimitBanner({
  resource = 'dailyLeads',
  threshold = 80,
  dismissible = true
}: ServiceLimitBannerProps) {
  const { tierName, tierSlug } = useTier()
  const { isWithinLimit, remaining, limit, used } = useLimit(resource)
  const [dismissed, setDismissed] = useState(false)

  // Don't show if dismissed
  if (dismissed) return null

  // Don't show if unlimited
  if (remaining === 'unlimited') return null

  // Don't show if well within limits
  if (limit && typeof remaining === 'number') {
    const percentageUsed = (used / limit) * 100
    if (percentageUsed < threshold) return null
  }

  // Don't show if already exceeded (show different UI for that)
  if (!isWithinLimit && remaining === 0) return null

  // Determine severity
  const percentageUsed = limit ? (used / limit) * 100 : 0
  const isWarning = percentageUsed >= threshold && percentageUsed < 90
  const isCritical = percentageUsed >= 90

  const resourceLabel = {
    dailyLeads: 'daily leads',
    monthlyLeads: 'monthly leads',
    campaigns: 'campaigns',
    teamMembers: 'team members',
    templates: 'templates',
    emailAccounts: 'email accounts'
  }[resource]

  return (
    <div className={`
      rounded-lg p-4 border-2 mb-6
      ${isCritical
        ? 'bg-red-50 border-red-200'
        : 'bg-amber-50 border-amber-200'
      }
    `}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold mb-1 ${
            isCritical ? 'text-red-900' : 'text-amber-900'
          }`}>
            {isCritical ? 'Limit Almost Reached' : 'Approaching Limit'}
          </h3>
          <p className={`text-sm mb-3 ${
            isCritical ? 'text-red-700' : 'text-amber-700'
          }`}>
            You've used {used} of {limit} {resourceLabel} on your {tierName} plan.
            {typeof remaining === 'number' && remaining > 0 && ` ${remaining} remaining.`}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-white rounded-full h-2 mb-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                isCritical ? 'bg-red-600' : 'bg-amber-600'
              }`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-2">
            {tierSlug === 'free' ? (
              <a
                href={getSubscriptionLink('pro', 'monthly')}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/90 transition-colors"
              >
                Upgrade to Pro
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <Link
                href="/settings/billing"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/90 transition-colors"
              >
                Manage Plan
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/90 transition-colors"
            >
              View Pricing
              <TrendingUp className="h-4 w-4" />
            </Link>
            {(resource === 'dailyLeads' || resource === 'monthlyLeads') && (
              <button
                onClick={() => window.open(getCreditLink('starter'), '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Buy Credits
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className={`flex-shrink-0 p-1 rounded hover:bg-white/50 transition-colors ${
              isCritical ? 'text-red-600' : 'text-amber-600'
            }`}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * LimitExceededBanner Component
 *
 * Shows when a limit has been exceeded
 */
export function LimitExceededBanner({
  resource = 'dailyLeads',
  actionUrl,
}: {
  resource?: 'dailyLeads' | 'monthlyLeads' | 'campaigns' | 'teamMembers' | 'templates' | 'emailAccounts'
  actionUrl?: string
}) {
  const { tierName, tierSlug } = useTier()
  const { isWithinLimit, limit } = useLimit(resource)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || isWithinLimit) return null

  const resourceLabel = {
    dailyLeads: 'daily lead',
    monthlyLeads: 'monthly lead',
    campaigns: 'campaign',
    teamMembers: 'team member',
    templates: 'template',
    emailAccounts: 'email account'
  }[resource]

  // Default to payment link for free users, billing page for paid users
  const upgradeUrl = actionUrl
    || (tierSlug === 'free' ? getSubscriptionLink('pro', 'monthly') : '/settings/billing')
  const isExternalLink = upgradeUrl.startsWith('http')

  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900 mb-1">
            Limit Reached
          </h3>
          <p className="text-sm text-red-700 mb-3">
            You've reached your {tierName} plan limit of {limit} {resourceLabel}s.
            Upgrade to continue.
          </p>

          <div className="flex flex-wrap gap-2">
            {isExternalLink ? (
              <a
                href={upgradeUrl}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Upgrade Now
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <Link
                href={upgradeUrl}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Upgrade Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {(resource === 'dailyLeads' || resource === 'monthlyLeads') && (
              <button
                onClick={() => window.open(getCreditLink('starter'), '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 hover:bg-red-50 text-red-700 font-medium rounded-lg transition-colors text-sm"
              >
                Buy Credits
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded hover:bg-white/50 transition-colors text-red-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
