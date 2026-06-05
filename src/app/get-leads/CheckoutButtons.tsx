'use client'

import { useState } from 'react'
import type { FunnelOfferConfig } from '@/lib/stripe/funnel-products'

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US')}`
}

export function CheckoutButtons({ offers }: { offers: FunnelOfferConfig[] }) {
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout(slug: string) {
    setLoadingSlug(slug)
    setError(null)
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
        throw new Error(json.error || `Checkout failed (HTTP ${res.status})`)
      }
      window.location.assign(json.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.')
      setLoadingSlug(null)
    }
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => {
        const isBundle = offer.slug === 'bundle_247'
        return (
          <div
            key={offer.slug}
            className={`flex flex-col items-start gap-4 rounded-xl border p-5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
              isBundle
                ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600/30'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900">
                  {offer.label}
                </h3>
                {isBundle && (
                  <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Best value
                  </span>
                )}
              </div>
              <p className="text-sm leading-snug text-gray-500">
                {offer.description}
              </p>
            </div>
            <div className="flex w-full shrink-0 items-center justify-between gap-4 sm:w-auto sm:justify-end">
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {formatPrice(offer.monthlyPriceCents)}
                </p>
                <p className="text-[11px] text-gray-400">/month</p>
              </div>
              <button
                type="button"
                onClick={() => handleCheckout(offer.slug)}
                disabled={loadingSlug !== null}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                  isBundle
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                }`}
              >
                {loadingSlug === offer.slug ? 'Loading…' : 'Get started'}
              </button>
            </div>
          </div>
        )
      })}
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
