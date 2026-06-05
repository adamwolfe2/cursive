import {
  FUNNEL_OFFERS,
  FUNNEL_VSL_ASPECT_RATIO,
  FUNNEL_VSL_URL,
  isSelfHostedVideoUrl,
} from '@/lib/stripe/funnel-products'
import { CheckoutButtons } from './CheckoutButtons'
import { PricingGate } from './PricingGate'

export const dynamic = 'force-dynamic'

/**
 * VSL Funnel Landing Page — entry point shared from EmailBison cold-email replies.
 *
 * Public, unauthenticated. Single CTA per pricing tier → POSTs to
 * /api/funnel/checkout → Stripe Checkout → webhook creates the order +
 * portal token + emails the buyer the post-pay link.
 */
export default function GetLeadsPage() {
  // Order: cheaper → highlighted bundle → companion
  const offers = [
    FUNNEL_OFFERS.pixel_97,
    FUNNEL_OFFERS.bundle_247,
    FUNNEL_OFFERS.audience_197,
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          See the people searching for your product right now.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
          Watch the 60-second video to see exactly how it works. Then pick the
          option that fits.
        </p>
      </div>

      {/* VSL — container aspect matches the source video (set via
          FUNNEL_VSL_ASPECT env, defaults to 16/9). Matching the aspect
          eliminates pillarbox/letterbox bars regardless of player. */}
      <div className="mx-auto mb-16 max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div
          className="w-full"
          style={{ aspectRatio: FUNNEL_VSL_ASPECT_RATIO }}
        >
          {FUNNEL_VSL_URL === 'about:blank' ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-sm text-gray-400">
              Video coming soon — set FUNNEL_VSL_URL env var
            </div>
          ) : isSelfHostedVideoUrl(FUNNEL_VSL_URL) ? (
            // Self-hosted MP4/WebM — zero watermark, no black bars, no
            // third-party player JS. object-cover fills the container by
            // cropping rather than letterboxing.
            <video
              src={FUNNEL_VSL_URL}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
              controlsList="nodownload"
            />
          ) : (
            <iframe
              src={FUNNEL_VSL_URL}
              title="How Cursive finds your buyers"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          )}
        </div>
      </div>

      {/* Pricing header — Attio-style */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          <span className="text-gray-400">Start today</span>{' '}
          <span className="text-gray-900">for real buyers.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
          Pixel is live in 60 seconds. Audience delivered within 24 hours.
          Cancel any time.
        </p>
      </div>

      {/* Cards — gated until 20s of video has played. Extra top padding
          so the bundle card's negative translate doesn't get clipped. */}
      <div className="pt-6">
        <PricingGate>
          <CheckoutButtons offers={offers} />
        </PricingGate>
      </div>

      {/* Trust strip */}
      <p className="mt-12 text-center text-xs text-gray-400">
        Secure checkout by Stripe · No long-term contract · Cancel any time
      </p>
    </div>
  )
}
