import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, Users, CalendarCheck } from 'lucide-react'
import { LiveLeadsFeed } from '@/components/leads/live-leads-feed'
import { AudienceProgress } from './AudienceProgress'

/**
 * Funnel-buyer dashboard.
 *
 * A deliberately minimal home for a buyer who purchased the visitor pixel +
 * (optionally) a managed audience. It shows only what they bought: who visited
 * their site, the leads that produced, and the audience status. None of the
 * generic lead-marketplace chrome (enrichment credits, daily-lead quotas,
 * targeting prompts, CRM upsells, stacked onboarding checklists) appears here.
 *
 * Layout order is deliberate: metrics first (the buyer's value at a glance),
 * then a single calm status line, then the live feed. Restrained palette,
 * no alarm colors.
 */

interface Props {
  firstName: string
  workspaceName?: string | null
  workspaceId: string
  hasPixel: boolean
  hasVerifiedPixel: boolean
  isPixelExpired: boolean
  isActiveTrial: boolean
  visitorCount: number
  totalLeads: number
  meetingsThisMonth: number
  meetingsAllTime: number
  audienceBuilding: boolean
  includesAudience: boolean
  audienceSubmittedAt?: string | null
  audienceReceivedAt?: string | null
}

function statusLine(p: Props): string {
  if (p.isPixelExpired)
    return 'Your pixel trial has ended. Reactivate to resume identifying visitors.'
  if (!p.hasPixel)
    return 'Install your pixel to start identifying the people landing on your site.'
  if (p.hasVerifiedPixel)
    return `Your pixel is live${p.isActiveTrial ? ' (trial)' : ''}. Here is who has been visiting.`
  return 'Your pixel is installed. The moment a visitor is identified, they appear below.'
}

function Metric({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: ReactNode
  label: string
  value: number
  sub: string
  href?: string
}) {
  const inner = (
    <div className="p-6">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-2 text-4xl font-semibold tracking-tight text-foreground tabular-nums">
        {value.toLocaleString()}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  )
  return href ? (
    <Link href={href} className="block transition-colors hover:bg-muted/40">
      {inner}
    </Link>
  ) : (
    inner
  )
}

export function FunnelBuyerDashboard(props: Props) {
  const {
    firstName,
    workspaceName,
    workspaceId,
    hasPixel,
    hasVerifiedPixel,
    visitorCount,
    totalLeads,
    meetingsThisMonth,
    meetingsAllTime,
    audienceBuilding,
    includesAudience,
    audienceSubmittedAt,
    audienceReceivedAt,
  } = props

  const pixelWaiting = hasPixel && !hasVerifiedPixel

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Hero */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {workspaceName && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {workspaceName}
            </p>
          )}
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {statusLine(props)}
          </p>
        </div>
        <Link
          href={hasPixel ? '/leads' : '/settings/pixel'}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          {hasPixel ? 'View leads' : 'Install pixel'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {/* Metrics — first, the value at a glance */}
      <div className="mt-8 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Metric
          icon={<Eye className="h-4 w-4" />}
          label="Visitors identified"
          value={visitorCount}
          sub={hasVerifiedPixel ? 'From your website pixel' : 'Waiting for the first visitor'}
          href="/website-visitors"
        />
        <Metric
          icon={<Users className="h-4 w-4" />}
          label="Total leads"
          value={totalLeads}
          sub="In your workspace"
          href="/leads"
        />
        <Metric
          icon={<CalendarCheck className="h-4 w-4" />}
          label="Meetings booked"
          value={meetingsThisMonth}
          sub={`${meetingsAllTime.toLocaleString()} all time`}
        />
      </div>

      {/* Audience build progress — milestone bar so the buyer sees momentum
          instead of an indeterminate spinner. */}
      {includesAudience && audienceBuilding && (
        <AudienceProgress
          submittedAt={audienceSubmittedAt}
          receivedAt={audienceReceivedAt}
          delivered={false}
        />
      )}

      {pixelWaiting && !audienceBuilding && (
        <div className="mt-6 rounded-2xl border border-border bg-card px-5 py-4">
          <p className="text-sm font-medium text-foreground">Waiting for your first visitor</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            Your pixel is installed. Identification needs real traffic. Once someone lands on your
            site, their name appears below within minutes.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <Link href="/settings/pixel" className="font-medium text-primary hover:underline">
              View snippet &amp; install help
            </Link>
            <a
              href="mailto:hello@meetcursive.com?subject=Pixel%20not%20firing"
              className="text-muted-foreground hover:text-foreground"
            >
              Email us
            </a>
          </div>
        </div>
      )}

      {/* The proof: live identified visitors streaming in */}
      {hasPixel && (
        <div className="mt-8">
          <LiveLeadsFeed workspaceId={workspaceId} />
        </div>
      )}
    </div>
  )
}
