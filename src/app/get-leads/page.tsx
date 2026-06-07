import {
  FUNNEL_OFFERS,
  FUNNEL_GATE_SECONDS,
  FUNNEL_VSL_ASPECT_RATIO,
  FUNNEL_VSL_URL,
  isSelfHostedVideoUrl,
} from '@/lib/stripe/funnel-products'
import { CheckoutButtons } from './CheckoutButtons'
import { FunnelTelemetry } from './FunnelTelemetry'
import { PricingGate } from './PricingGate'
import { Testimonials } from './Testimonials'

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
      <FunnelTelemetry
        offerSlugs={offers.map((o) => o.slug)}
        vslUrl={FUNNEL_VSL_URL}
      />

      {/* Hero — two-tone headline matches the meetcursive.com brand
          treatment ("The Data Identity Layer / for Outbound, Intent, and
          Enrichment"). Concrete numbers in the body build credibility
          before the buyer hits the VSL. */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          <span className="block">
            See the people searching for your product.
          </span>
          <span className="block font-normal text-gray-400">
            And every visitor landing on your site.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
          280M verified consumers, a 15M-domain organic network, refreshed
          every 30 days. Pixel installs in 60 seconds. Audience delivered
          within 24 hours.
        </p>
      </div>

      {/* VSL — container aspect matches the source video (set via
          FUNNEL_VSL_ASPECT env, defaults to 16/9). Matching the aspect
          eliminates pillarbox/letterbox bars regardless of player.
          Sized to fill the page container (max-w-5xl) so the VSL gets
          maximum real estate without breaking the responsive layout. */}
      <div className="mx-auto mb-16 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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

      {/* Social proof wall — warms cold traffic before the pricing reveal. */}
      <Testimonials />

      {/* Pricing header — Attio-style */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          <span className="text-gray-400">Start today</span>{' '}
          <span className="text-gray-900">for real buyers.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
          Pixel is live in 60 seconds. Audience delivered within 24 hours.
        </p>
        {/* Risk reversal — lowers the cost of saying yes. */}
        <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <GuaranteeIcon /> First audience in 24h or it&apos;s free
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GuaranteeIcon /> Live in 60 seconds
          </span>
        </div>
      </div>

      {/* Cards — gated until 20s of video has played. Extra top padding
          so the bundle card's negative translate doesn't get clipped. */}
      <div className="pt-6">
        <PricingGate unlockAfterSeconds={FUNNEL_GATE_SECONDS}>
          <CheckoutButtons offers={offers} />
        </PricingGate>
      </div>

      {/* Trust strip */}
      <p className="mt-12 text-center text-xs text-gray-400">
        Secure checkout by Stripe · No long-term contract
      </p>
    </div>
  )
}

function GuaranteeIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-emerald-500"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}
