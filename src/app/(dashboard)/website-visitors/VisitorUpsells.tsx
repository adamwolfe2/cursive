'use client'

import { Zap, Sparkles, Users, Mail, ArrowRight } from 'lucide-react'
import type { VisitorStats } from './visitor-types'

// ─── Enrichment Upsell Strip ───────────────────────────────

interface EnrichmentUpsellProps {
  stats: VisitorStats
}

export function EnrichmentUpsell({ stats }: EnrichmentUpsellProps) {
  if (stats.total <= 0 || stats.enriched >= stats.total) return null

  return (
    <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-primary/5 px-5 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {(stats.total - stats.enriched).toLocaleString()} visitors haven&apos;t been enriched yet
            </p>
            <p className="text-xs text-gray-500">
              Enrich them to unlock email, phone, LinkedIn, and company data — 1 credit each
            </p>
          </div>
        </div>
        <a
          href="/settings/billing"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Get More Credits
        </a>
      </div>
    </div>
  )
}

// ─── Pro Upsell Section ────────────────────────────────────

export function ProUpsell() {
  const items = [
    {
      icon: Users,
      title: 'Lookalike Audiences',
      desc: 'Build ad audiences that mirror your best visitors. Target people just like them on Facebook, Google, and LinkedIn.',
      href: '/activate?flow=audience',
      cta: 'Build Audience →',
    },
    {
      icon: Mail,
      title: 'Outbound on Autopilot',
      desc: 'We run personalised email campaigns to your identified visitors on your behalf — you just close the deals.',
      href: '/activate?flow=campaign',
      cta: 'Launch Campaign →',
    },
    {
      icon: Zap,
      title: '1,000 Enrichments/Day',
      desc: 'Fill in every missing field on every new visitor automatically — email, phone, company, LinkedIn.',
      href: '/settings/billing',
      cta: 'Upgrade →',
    },
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-gray-900">Unlock more with Pro</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm text-gray-900">{item.title}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.desc}</p>
            <a
              href={item.href}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              {item.cta} <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
