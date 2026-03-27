'use client'

import Link from 'next/link'
import { useDismissible } from '@/lib/hooks/use-dismissible'
import { AnimatedSection } from '@/components/dashboard/dashboard-animation-wrapper'

interface FreePlanBannerProps {
  dailyLimit: number
  creditLimit: number
}

export function FreePlanBanner({ dailyLimit, creditLimit }: FreePlanBannerProps) {
  const { dismissed, dismiss } = useDismissible('cursive_free_plan_banner_dismissed', 24)

  if (dismissed) return null

  return (
    <AnimatedSection delay={0.25}>
      <div className="rounded-xl border border-gray-200 bg-card p-5 relative">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-current opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Dismiss free plan banner"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-foreground">Free Plan</span>
        <div className="text-xs text-muted-foreground mt-2 mb-3 space-y-1">
          <p className="flex justify-between"><span>Daily leads</span><span className="font-medium text-foreground">{dailyLimit}/day</span></p>
          <p className="flex justify-between"><span>Enrichment credits</span><span className="font-medium text-foreground">{creditLimit}/day</span></p>
          <p className="flex justify-between"><span>Credits reset</span><span className="font-medium text-foreground">8am CT</span></p>
        </div>
        <Link href="/settings/billing" className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          Upgrade to Pro
        </Link>
      </div>
    </AnimatedSection>
  )
}
