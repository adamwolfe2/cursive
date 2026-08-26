'use client'

import { useEffect, useState } from 'react'
import {
  FUNNEL_TRIAL_DAYS,
  type FunnelOfferConfig,
} from '@/lib/stripe/funnel-products'
import { FUNNEL_EVENTS, trackFunnel } from '@/lib/funnel/tracking'

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
      `Full access free for ${FUNNEL_TRIAL_DAYS} days`,
      'Identify companies + people visiting your site',
      'Live install in 60 seconds (paste 1 snippet)',
      'Unlimited identified visitor events',
    ],
  },
  bundle_247: {
    tagline: 'Everything top-of-funnel',
    audience: 'For teams ready to combine traffic + intent in one feed.',
    features: [
      `Full access free for ${FUNNEL_TRIAL_DAYS} days`,
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
      `Full access free for ${FUNNEL_TRIAL_DAYS} days`,
      'Fresh weekly list of people searching for your product',
      'Delivered to Google Sheets (same link, new rows)',
      'Built around your ICP, titles, industries, and geo',
      'First audience delivered within 24 hours',
    ],
  },
}

export function CheckoutButtons({ offers }: { offers: FunnelOfferConfig[] }) {
  const cards: PlanCardConfig[] = offers.map((offer) => ({
    offer,
    ...PLAN_FEATURES[offer.slug],
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <PlanCard key={card.offer.slug} card={card} />
        ))}
      </div>

      <p className="text-center text-xs text-gray-400">
        {FUNNEL_TRIAL_DAYS > 0
          ? `Card required to start — you are not charged until day ${FUNNEL_TRIAL_DAYS + 1}. Cancel any time in one click. Have a discount code? Apply it on the Stripe checkout page.`
          : 'Have a discount code? Apply it on the Stripe checkout page.'}
      </p>
    </div>
  )
}

function PlanCard({ card }: { card: PlanCardConfig }) {
  const { offer, tagline, audience, features, highlight } = card
  const [submitting, setSubmitting] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  // If the buyer clicked but stays on the page longer than ~2s, assume the
  // new tab got blocked by a hardened browser/extension/corporate policy.
  // Show a fallback link that opens Stripe in THIS tab — a regular <a>
  // click is the one navigation no popup blocker can interfere with.
  useEffect(() => {
    if (!submitting) {
      setShowFallback(false)
      return
    }
    const t = setTimeout(() => {
      setShowFallback(true)
      // Track the fallback path separately so the funnel dashboard can
      // surface popup-block rate as a distinct metric.
      trackFunnel(FUNNEL_EVENTS.CHECKOUT_FALLBACK_SHOWN, {
        offer_slug: offer.slug,
        offer_price_cents: offer.monthlyPriceCents,
      })
    }, 2000)
    return () => clearTimeout(t)
  }, [submitting, offer.slug, offer.monthlyPriceCents])

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-5 transition-shadow sm:p-6 ${
        highlight
          ? 'relative border-blue-600 ring-1 ring-blue-600/30 shadow-[0_0_50px_-12px_rgba(37,99,235,0.45),0_0_25px_-8px_rgba(37,99,235,0.25)] md:-translate-y-4'
          : 'border-gray-200 hover:shadow-sm'
      }`}
    >
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">{offer.label}</h3>
        {highlight && (
          <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Best value
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1 sm:mt-4">
        {FUNNEL_TRIAL_DAYS > 0 ? (
          <>
            <span className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Free
            </span>
            <span className="text-sm font-medium text-gray-500">
              for {FUNNEL_TRIAL_DAYS} days
            </span>
          </>
        ) : (
          <span className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {formatPrice(offer.monthlyPriceCents)}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {FUNNEL_TRIAL_DAYS > 0
          ? `Then ${formatPrice(offer.monthlyPriceCents)}/month. Cancel any time before day ${FUNNEL_TRIAL_DAYS + 1} and pay nothing.`
          : 'Per month, billed monthly'}
      </p>

      <p className="mt-5 text-sm font-semibold text-gray-900 sm:mt-6">{tagline}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{audience}</p>

      <ul className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-sm text-gray-700"
          >
            <CheckIcon />
            <span className="leading-snug">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex-1 sm:mt-8" />

      {/*
        Form submission with target="_blank" is the only bulletproof way to
        open a new tab without triggering popup blockers — the browser
        treats the form submit as a primary user gesture by definition.
        POSTs to /api/funnel/checkout-redirect, which creates the Stripe
        session and returns a 303 redirect straight to the Stripe URL.
        The original /get-leads tab stays put so the VSL keeps playing.
      */}
      <form
        action="/api/funnel/checkout-redirect"
        method="POST"
        target="_blank"
        rel="noopener"
        onSubmit={() => {
          setSubmitting(true)
          trackFunnel(FUNNEL_EVENTS.PLAN_SELECTED, {
            offer_slug: offer.slug,
            offer_price_cents: offer.monthlyPriceCents,
            offer_highlight: !!highlight,
          })
          trackFunnel(FUNNEL_EVENTS.CHECKOUT_INITIATED, {
            offer_slug: offer.slug,
            offer_price_cents: offer.monthlyPriceCents,
          })
        }}
        className="w-full"
      >
        <input type="hidden" name="offer" value={offer.slug} />
        <button
          type="submit"
          disabled={submitting}
          className={`inline-flex w-full items-center justify-center gap-2 truncate whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-70 ${
            highlight
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
          }`}
        >
          {submitting
            ? 'Opening checkout…'
            : FUNNEL_TRIAL_DAYS > 0
              ? `Start ${FUNNEL_TRIAL_DAYS}-day free trial`
              : 'Get started'}
        </button>
      </form>

      {/* Same-tab fallback — appears 2s after the click if the buyer is
          still on the page (meaning the new tab probably got blocked by a
          hardened browser or extension). Regular <a> clicks bypass every
          popup blocker. The VSL stops because we leave the page, but
          checkout actually completing > preserving the video. */}
      {showFallback && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Didn&apos;t open?{' '}
          <a
            href={`/api/funnel/checkout-redirect?offer=${offer.slug}`}
            className="font-medium text-blue-600 underline hover:text-blue-700"
          >
            Continue in this tab
          </a>
        </p>
      )}
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  )
}
