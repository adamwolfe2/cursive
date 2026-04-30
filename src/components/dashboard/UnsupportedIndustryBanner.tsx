'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'

interface UnsupportedIndustryBannerProps {
  industry: string
}

/**
 * Banner shown when a user's industry_segment does not map to any
 * audience_lab_segments row. These users will receive 0 leads from
 * the daily cron and from populate-initial until they change industry.
 *
 * We show this when:
 *   - user_targeting.target_industries contains only unsupported values (e.g. ['Other'])
 *   - AND there are 0 leads in the workspace
 */
export function UnsupportedIndustryBanner({ industry }: UnsupportedIndustryBannerProps) {
  const displayIndustry = industry === 'other' ? 'Other' : industry.replace(/_/g, ' ')

  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-900">
          Demo data shown — your real leads will arrive when we launch &ldquo;{displayIndustry}&rdquo;
        </p>
        <p className="text-sm text-amber-700 mt-1">
          Our lead network currently covers home services, real estate, roofing, HVAC, plumbing,
          security, contractor, and logistics verticals. We&apos;re expanding rapidly.
          Switch to a supported industry to start receiving real leads immediately.
        </p>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <Link
            href="/my-leads/preferences"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Change industry <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <a
            href="mailto:hello@meetcursive.com?subject=Industry+waitlist"
            className="text-sm font-medium text-amber-700 hover:underline"
          >
            Get notified when we&apos;re live for you
          </a>
        </div>
      </div>
    </div>
  )
}
