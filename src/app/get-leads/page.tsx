import { FUNNEL_OFFERS, FUNNEL_VSL_URL } from '@/lib/stripe/funnel-products'
import { CheckoutButtons } from './CheckoutButtons'

export const dynamic = 'force-dynamic'

/**
 * VSL Funnel Landing Page — entry point shared from EmailBison cold-email replies.
 *
 * Public, unauthenticated. Single CTA per pricing tier → POSTs to
 * /api/funnel/checkout → Stripe Checkout → webhook creates the order +
 * portal token + emails the buyer the post-pay link.
 */
export default function GetLeadsPage() {
  const offers = [
    FUNNEL_OFFERS.pixel_97,
    FUNNEL_OFFERS.bundle_247,
    FUNNEL_OFFERS.audience_197,
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
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

      {/* VSL */}
      <div className="mb-12 overflow-hidden rounded-xl border border-gray-200 bg-black shadow-sm">
        <div className="aspect-video w-full">
          {FUNNEL_VSL_URL === 'about:blank' ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-sm text-gray-400">
              Video coming soon — set FUNNEL_VSL_URL env var
            </div>
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

      {/* Pricing */}
      <div className="mb-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
          Pick your plan
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Cancel any time. Pixel is live in 60 seconds. Audience delivered
          within 24 hours.
        </p>
      </div>

      <CheckoutButtons offers={offers} />

      {/* Footer trust strip */}
      <p className="mt-10 text-center text-xs text-gray-400">
        Secure checkout by Stripe · No long-term contract · Cancel any time
      </p>
    </div>
  )
}
