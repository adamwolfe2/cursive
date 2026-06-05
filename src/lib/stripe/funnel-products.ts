/**
 * JustSearched VSL Funnel — Stripe Product Configuration
 *
 * Three subscription tiers offered post-VSL. All recurring monthly.
 * No setup fee — pure subscription.
 *
 * Price IDs must be created in Stripe dashboard and configured via env.
 * Falling back to obvious placeholder strings if env is missing so build
 * doesn't crash, but the route handler hard-fails before creating a session.
 */

export type FunnelOfferSlug = 'pixel_97' | 'audience_197' | 'bundle_247'

export interface FunnelOfferConfig {
  slug: FunnelOfferSlug
  label: string
  description: string
  monthlyPriceCents: number
  stripePriceId: string
  includesPixel: boolean
  includesAudience: boolean
}

export const FUNNEL_OFFERS: Record<FunnelOfferSlug, FunnelOfferConfig> = {
  pixel_97: {
    slug: 'pixel_97',
    label: 'Visitor Pixel',
    description:
      'Identify the companies and people visiting your site. Pixel installs in 60 seconds.',
    monthlyPriceCents: 9700,
    stripePriceId: process.env.STRIPE_PRICE_FUNNEL_PIXEL_97 ?? '',
    includesPixel: true,
    includesAudience: false,
  },
  audience_197: {
    slug: 'audience_197',
    label: 'Custom Audience',
    description:
      'A fresh weekly list of people actively searching for your product, delivered to Google Sheets.',
    monthlyPriceCents: 19700,
    stripePriceId: process.env.STRIPE_PRICE_FUNNEL_AUDIENCE_197 ?? '',
    includesPixel: false,
    includesAudience: true,
  },
  bundle_247: {
    slug: 'bundle_247',
    label: 'Pixel + Audience Bundle',
    description:
      'Both the visitor pixel and the weekly audience — your full top-of-funnel intel layer.',
    monthlyPriceCents: 24700,
    stripePriceId: process.env.STRIPE_PRICE_FUNNEL_BUNDLE_247 ?? '',
    includesPixel: true,
    includesAudience: true,
  },
}

export function getFunnelOffer(slug: string): FunnelOfferConfig | null {
  if (slug !== 'pixel_97' && slug !== 'audience_197' && slug !== 'bundle_247') {
    return null
  }
  return FUNNEL_OFFERS[slug as FunnelOfferSlug]
}

/**
 * Initial DB status for an order after Stripe confirms payment.
 * Bundle and pixel-only start at awaiting_pixel; audience-only skips ahead.
 */
export function initialPaidStatus(
  slug: FunnelOfferSlug
): 'awaiting_pixel' | 'awaiting_audience' {
  const offer = FUNNEL_OFFERS[slug]
  return offer.includesPixel ? 'awaiting_pixel' : 'awaiting_audience'
}

/**
 * Next status after the pixel step completes. If the order does NOT include
 * audience (pixel_97), the pixel snippet IS the deliverable → order is done.
 */
export function nextStatusAfterPixel(
  slug: FunnelOfferSlug
): 'awaiting_audience' | 'delivered' {
  const offer = FUNNEL_OFFERS[slug]
  return offer.includesAudience ? 'awaiting_audience' : 'delivered'
}

/**
 * Next status after the audience step completes (form submitted).
 * Always awaiting_delivery — admin must mark delivered with sheet URL.
 */
export function nextStatusAfterAudience(): 'awaiting_delivery' {
  return 'awaiting_delivery'
}

export const FUNNEL_PORTAL_BASE_URL =
  process.env.FUNNEL_PORTAL_BASE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://leads.meetcursive.com'

/**
 * VSL embed URL. Defaults to a Loom placeholder Adam shared 2026-06-04
 * (https://www.loom.com/share/83bf2650385a441f8ea46a5e911b5fb1) — converted
 * to the /embed/ form so it renders inside an iframe. Override with
 * FUNNEL_VSL_URL env (must already be a valid embed URL).
 */
export const FUNNEL_VSL_URL =
  process.env.FUNNEL_VSL_URL ??
  'https://www.loom.com/embed/83bf2650385a441f8ea46a5e911b5fb1'
