'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Sparkles, TrendingUp, Zap } from 'lucide-react'

interface UpsellBannerProps {
  creditsBalance: number
  totalSpend: number
  leadCount?: number
}

export function UpsellBanner({ creditsBalance, totalSpend, leadCount = 0 }: UpsellBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)

  // Determine which banner to show based on thresholds
  const getBannerConfig = () => {
    if (totalSpend > 2000) {
      return {
        key: 'outbound-upsell',
        icon: TrendingUp,
        title: 'Let us handle your outbound',
        message: 'You\'ve spent over $2,000 on credits. Cursive Outbound gives you done-for-you campaigns with unlimited leads for $2,500/mo.',
        cta: 'Learn About Outbound',
        href: '/services#outbound',
        color: 'from-blue-500/10 to-blue-500/10 border-blue-200',
        iconColor: 'text-blue-600',
      }
    }
    if (totalSpend > 500) {
      return {
        key: 'data-upsell',
        icon: Sparkles,
        title: 'Save with Cursive Data',
        message: 'You\'ve spent over $500 on credits. Cursive Data delivers 500+ verified leads monthly for just $1,000/mo -- better value than credits.',
        cta: 'Learn About Data',
        href: '/services#data',
        color: 'from-blue-500/10 to-cyan-500/10 border-blue-200',
        iconColor: 'text-blue-600',
      }
    }
    if (leadCount >= 50 && totalSpend < 500) {
      return {
        key: 'dfy-lead-upsell',
        icon: TrendingUp,
        title: `You have ${leadCount.toLocaleString()} leads — let us turn them into pipeline`,
        message: 'Our team builds your outbound sequence, writes the copy, and works your leads for you — starting at $2,500/mo.',
        cta: 'See Done-For-You Outbound',
        href: '/services#outbound',
        color: 'from-violet-500/10 to-purple-500/10 border-violet-200',
        iconColor: 'text-violet-600',
      }
    }
    if (creditsBalance < 20) {
      return {
        key: 'low-credits',
        icon: Zap,
        title: 'Running low on credits',
        message: `You have ${creditsBalance} credits remaining. Top up to keep discovering leads.`,
        cta: 'Buy More Credits',
        href: '/marketplace/credits',
        color: 'from-amber-500/10 to-orange-500/10 border-amber-200',
        iconColor: 'text-amber-600',
      }
    }
    return null
  }

  const config = getBannerConfig()

  useEffect(() => {
    if (config) {
      const stored = localStorage.getItem(`upsell-dismissed-${config.key}`)
      if (stored) {
        const dismissedAt = new Date(stored)
        const hoursSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60)
        if (hoursSince < 24) {
          setDismissed(true)
          setDismissedKey(config.key)
        }
      }
    }
  }, [config])

  if (!config || (dismissed && dismissedKey === config.key)) return null

  const Icon = config.icon

  return (
    <div className={`relative rounded-lg border bg-gradient-to-r ${config.color} p-4 mb-6`}>
      <button
        onClick={() => {
          setDismissed(true)
          setDismissedKey(config.key)
          localStorage.setItem(`upsell-dismissed-${config.key}`, new Date().toISOString())
        }}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon className="h-5 w-5 mt-0.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{config.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{config.message}</p>
          <Link
            href={config.href}
            className="inline-flex items-center text-sm font-medium text-primary hover:underline mt-2"
          >
            {config.cta} →
          </Link>
        </div>
      </div>
    </div>
  )
}
