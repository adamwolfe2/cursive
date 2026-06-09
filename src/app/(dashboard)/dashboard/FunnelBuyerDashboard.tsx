import Link from 'next/link'
import { ArrowRight, Eye, Users, CalendarCheck } from 'lucide-react'
import { LiveLeadsFeed } from '@/components/leads/live-leads-feed'
import { AudienceBuildingBanner } from './AudienceBuildingBanner'
import { PixelTroubleshoot } from './PixelTroubleshoot'

/**
 * Funnel-buyer dashboard.
 *
 * A deliberately minimal home for a buyer who purchased the visitor pixel +
 * (optionally) a managed audience. It shows only what they bought: who visited
 * their site, the leads that produced, and the audience status. None of the
 * generic lead-marketplace chrome (enrichment credits, daily-lead quotas,
 * targeting prompts, CRM upsells, stacked onboarding checklists) appears here.
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
  } = props

  // One honest setup line, derived from real state. Not three checklists.
  const steps = [
    { label: 'Account', done: true },
    { label: 'Pixel installed', done: hasPixel },
    { label: 'First visitor identified', done: hasVerifiedPixel },
    ...(includesAudience ? [{ label: 'Audience delivered', done: !audienceBuilding }] : []),
  ]
  const doneCount = steps.filter((s) => s.done).length
  const allDone = doneCount === steps.length

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

      {/* Setup progress — a single quiet line, not a wall of checklists */}
      {!allDone && (
        <div className="mt-8 rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Getting set up</span>
            <span className="text-xs text-muted-foreground">
              {doneCount} of {steps.length}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                    s.done
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.done ? '✓' : i + 1}
                </span>
                <span
                  className={`text-sm ${s.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <span className="mx-1 h-px w-5 bg-border" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audience build status — calm, only while building */}
      {includesAudience && audienceBuilding && (
        <div className="mt-6">
          <AudienceBuildingBanner />
        </div>
      )}

      {/* Pixel installed but not firing — the actionable troubleshoot card */}
      {hasPixel && !hasVerifiedPixel && (
        <div className="mt-6">
          <PixelTroubleshoot />
        </div>
      )}

      {/* Metrics — one instrument panel, not a grid of identical hero cards */}
      <div className="mt-8 grid grid-cols-1 divide-y divide-border rounded-xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Link href="/website-visitors" className="group p-5 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="text-sm">Visitors identified</span>
          </div>
          <div className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            {visitorCount.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasVerifiedPixel ? 'From your website pixel' : 'Waiting for the first visitor'}
          </p>
        </Link>

        <Link href="/leads" className="group p-5 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">Total leads</span>
          </div>
          <div className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            {totalLeads.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">In your workspace</p>
        </Link>

        <div className="p-5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarCheck className="h-4 w-4" />
            <span className="text-sm">Meetings booked</span>
          </div>
          <div className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            {meetingsThisMonth.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {meetingsAllTime.toLocaleString()} all time
          </p>
        </div>
      </div>

      {/* The proof: live identified visitors streaming in */}
      {hasPixel && (
        <div className="mt-8">
          <LiveLeadsFeed workspaceId={workspaceId} />
        </div>
      )}
    </div>
  )
}
