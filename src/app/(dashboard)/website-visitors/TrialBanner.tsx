'use client'

import { AlertTriangle, Clock, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/design-system'
import type { PixelInfo, VisitorLead } from './visitor-types'
import { VisitorCard } from './VisitorCard'

// ─── Trial Banner ──────────────────────────────────────────

interface TrialBannerProps {
  pixel: PixelInfo
}

export function TrialBanner({ pixel }: TrialBannerProps) {
  const isExpired = pixel.trial_status === 'expired'
  const isActive = pixel.trial_status === 'trial'
  const trialEndsAt = pixel.trial_ends_at ? new Date(pixel.trial_ends_at) : null
  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86_400_000)) : null

  if (pixel.trial_status === 'active') return null

  if (isExpired) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-900 text-sm">Your pixel trial has ended</p>
              <p className="text-xs text-red-700 mt-0.5">
                Your pixel on <strong>{pixel.domain}</strong> has stopped firing — no new visitors are being identified. Upgrade to reactivate it.
              </p>
            </div>
          </div>
          <a
            href="/settings/billing"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Reactivate Pixel <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    )
  }

  if (isActive && daysLeft !== null) {
    const isUrgent = daysLeft <= 4
    return (
      <div className={cn(
        'rounded-xl border px-5 py-4',
        isUrgent ? 'border-amber-200 bg-amber-50' : 'border-blue-100 bg-blue-50'
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className={cn('h-5 w-5 shrink-0', isUrgent ? 'text-amber-500' : 'text-blue-500')} />
            <div>
              <p className={cn('font-semibold text-sm', isUrgent ? 'text-amber-900' : 'text-blue-900')}>
                {daysLeft === 0 ? 'Trial ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your free pixel trial`}
              </p>
              <p className={cn('text-xs mt-0.5', isUrgent ? 'text-amber-700' : 'text-blue-700')}>
                When your trial ends, your pixel will stop firing and no new visitors will be identified. Upgrade to keep it running.
              </p>
            </div>
          </div>
          <a
            href="/settings/billing"
            className={cn(
              'shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
              isUrgent ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            Upgrade to Pro <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    )
  }

  return null
}

// ─── No Pixel Promo ────────────────────────────────────────

export function NoPixelPromo() {
  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-primary/5 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="font-semibold text-blue-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Start your free 14-day pixel trial
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Install the SuperPixel to identify who&apos;s visiting your website and turn anonymous traffic into named leads.
          </p>
        </div>
        <a
          href="/settings/pixel"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Get Started Free <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}

// ─── Trial Expired Overlay ─────────────────────────────────

interface TrialExpiredOverlayProps {
  visitors: VisitorLead[]
}

export function TrialExpiredOverlay({ visitors }: TrialExpiredOverlayProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
        <div className="text-center max-w-md px-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Your pixel has stopped firing</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your 14-day trial ended. No new visitors are being identified. Upgrade to Pro to reactivate your pixel and resume tracking.
          </p>
          <a
            href="/settings/billing"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Upgrade to continue →
          </a>
          <p className="text-xs text-zinc-500 mt-2">Unlimited visitor identification · All 50+ data fields · Cancel anytime</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-30 pointer-events-none select-none" aria-hidden="true">
        {visitors.slice(0, 3).map((v) => (
          <VisitorCard key={v.id} lead={v} onEnrich={() => {}} onView={() => {}} />
        ))}
      </div>
    </div>
  )
}
