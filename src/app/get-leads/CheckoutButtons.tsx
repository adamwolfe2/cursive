'use client'

import { useState } from 'react'
import type { FunnelOfferConfig } from '@/lib/stripe/funnel-products'

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US')}`
}

interface PlanCardConfig {
  offer: FunnelOfferConfig
  tagline: string
  audience: string
  features: string[]
  highlight?: boolean
}

const PLAN_FEATURES: Record<string, Omit<PlanCardConfig, 'offer'>> = {
  pixel_97: {
    tagline: 'See who lands on your site',
    audience: 'For teams just starting to identify visitors.',
    features: [
      'Identify companies + people visiting your site',
      'Live install in 60 seconds (paste 1 snippet)',
      'Unlimited identified visitor events',
      'Cancel any time',
    ],
  },
  bundle_247: {
    tagline: 'Everything top-of-funnel',
    audience: 'For teams ready to combine traffic + intent in one feed.',
    features: [
      'Everything in Visitor Pixel',
      'Weekly Custom Audience delivered as Google Sheet',
      'Audience refreshed every week with new in-market buyers',
      'Priority audience updates within 24 hours',
    ],
    highlight: true,
  },
  audience_197: {
    tagline: 'In-market buyers, weekly',
    audience: 'For teams who want a fresh list of prospects without a pixel.',
    features: [
      'Fresh weekly list of people searching for your product',
      'Delivered to Google Sheets (same link, new rows)',
      'Built around your ICP, titles, industries, and geo',
      'First audience delivered within 24 hours',
    ],
  },
}

export function CheckoutButtons({ offers }: { offers: FunnelOfferConfig[] }) {
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout(slug: string) {
    setLoadingSlug(slug)
    setError(null)

    // CRITICAL: open the new tab IMMEDIATELY in the click handler so popup
    // blockers allow it. If we wait until after the fetch resolves, the
    // browser treats it as a non-user-gesture popup and blocks it. We
    // point the empty tab at the Stripe URL once we have it.
    const newTab = window.open('', '_blank', 'noopener,noreferrer')
    if (!newTab) {
      setError('Please allow popups for this site to start checkout.')
      setLoadingSlug(null)
      return
    }

    try {
      const res = await fetch('/api/funnel/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer: slug }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        url?: string
        error?: string
      }
      if (!res.ok || !json.url) {
        newTab.close()
        throw new Error(json.error || `Checkout failed (HTTP ${res.status})`)
      }
      newTab.location.href = json.url
      // Buyer is now on Stripe in a new tab — re-enable the buttons here
      // so the video keeps playing and they can pick a different plan if
      // they cancel out.
      setLoadingSlug(null)
    } catch (err) {
      newTab.close()
      setError(err instanceof Error ? err.message : 'Could not start checkout.')
      setLoadingSlug(null)
    }
  }

  const cards: PlanCardConfig[] = offers.map((offer) => ({
    offer,
    ...PLAN_FEATURES[offer.slug],
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <PlanCard
            key={card.offer.slug}
            card={card}
            loading={loadingSlug === card.offer.slug}
            anyLoading={loadingSlug !== null}
            onClick={() => handleCheckout(card.offer.slug)}
          />
        ))}
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <p className="text-center text-xs text-gray-400">
        Have a discount code? Apply it on the Stripe checkout page.
      </p>
    </div>
  )
}

function PlanCard({
  card,
  loading,
  anyLoading,
  onClick,
}: {
  card: PlanCardConfig
  loading: boolean
  anyLoading: boolean
  onClick: () => void
}) {
  const { offer, tagline, audience, features, highlight } = card

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-6 transition-shadow ${
        highlight
          ? 'relative border-blue-600 ring-1 ring-blue-600/30 shadow-[0_0_50px_-12px_rgba(37,99,235,0.45),0_0_25px_-8px_rgba(37,99,235,0.25)] md:-translate-y-4'
          : 'border-gray-200 hover:shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">{offer.label}</h3>
        {highlight && (
          <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Best value
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-5xl font-bold tracking-tight text-gray-900">
          {formatPrice(offer.monthlyPriceCents)}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-500">Per month, billed monthly</p>

      {/* Tagline + audience */}
      <p className="mt-6 text-sm font-semibold text-gray-900">{tagline}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
        {audience}
      </p>

      {/* Features */}
      <ul className="mt-5 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
            <CheckIcon />
            <span className="leading-snug">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA pinned to bottom */}
      <div className="mt-8 flex-1" />
      <button
        type="button"
        onClick={onClick}
        disabled={anyLoading}
        className={`inline-flex w-full items-center justify-center gap-2 truncate whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
          highlight
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
        }`}
      >
        {loading ? 'Loading…' : 'Get started'}
      </button>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}
