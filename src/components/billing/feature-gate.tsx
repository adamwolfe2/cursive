'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { UpgradeModal } from './upgrade-modal'
import { ServiceRequestBanner } from '@/components/ui/service-request-banner'

type Tier = 'free' | 'starter' | 'pro' | 'outbound'

const TIER_ORDER: Record<Tier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  outbound: 3,
}

interface FeatureGateProps {
  children: React.ReactNode
  requiredTier?: Tier
  comingSoon?: boolean
  featureName: string
  featureDescription?: string
}

/**
 * Wraps page content with tier-based access control.
 *
 * - If the user's plan meets the required tier → renders children normally
 * - If not → shows an upgrade modal over the page
 * - If `comingSoon` → shows a "Coming Soon" message
 */
export function FeatureGate({
  children,
  requiredTier = 'free',
  comingSoon = false,
  featureName,
  featureDescription,
}: FeatureGateProps) {
  const [modalDismissed, setModalDismissed] = useState(false)

  const { data: userData } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/users/me')
      if (!response.ok) throw new Error('Failed to fetch user data')
      return response.json()
    },
  })

  const userPlan = (userData?.data?.plan as Tier) || 'free'
  const hasAccess = TIER_ORDER[userPlan] >= TIER_ORDER[requiredTier]

  // Coming soon: show a friendly placeholder
  if (comingSoon) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="rounded-full bg-primary/10 p-4 mb-6">
          <svg
            className="h-10 w-10 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{featureName}</h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {featureDescription ||
            `We're building something great. ${featureName} will be available soon.`}
        </p>
        <ServiceRequestBanner
          title={`Request Early Access to ${featureName}`}
          description={`Be the first to know when ${featureName} launches. We'll notify you and help you get set up.`}
          requestType={`early_access_${featureName.toLowerCase().replace(/\s+/g, '_')}`}
          variant="inline"
          ctaLabel="Request Early Access"
          showBookCall={false}
        />
      </div>
    )
  }

  // User has access: render normally
  if (hasAccess || !userData) {
    return <>{children}</>
  }

  // User does NOT have access: show page content with upgrade modal overlay
  return (
    <>
      {children}
      <UpgradeModal
        open={!modalDismissed}
        onOpenChange={(open) => {
          if (!open) setModalDismissed(true)
        }}
        featureName={featureName}
        description={featureDescription}
      />
    </>
  )
}
