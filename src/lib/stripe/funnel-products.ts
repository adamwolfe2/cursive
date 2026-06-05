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
 * VSL embed URL. Defaults to the Vimeo embed Adam recorded 2026-06-05
 * (https://vimeo.com/1198842133). Override with FUNNEL_VSL_URL env (must
 * already be a player.vimeo.com OR loom.com/embed URL).
 *
 * autoplay=1 + muted=1 are required together — browsers block unmuted
 * autoplay without a prior user gesture. Per-host params (badge, autopause,
 * hide_owner, etc) strip the source-platform chrome so the embed feels like
 * our own player.
 */
function withVslAutoplay(rawUrl: string): string {
  try {
    const u = new URL(rawUrl)
    if (u.hostname.endsWith('loom.com')) {
      u.searchParams.set('autoplay', '1')
      u.searchParams.set('muted', '1')
      u.searchParams.set('hide_owner', 'true')
      u.searchParams.set('hide_share', 'true')
      u.searchParams.set('hide_title', 'true')
    } else if (u.hostname.endsWith('vimeo.com')) {
      // player.vimeo.com supports these query params directly
      u.searchParams.set('autoplay', '1')
      u.searchParams.set('muted', '1')
      u.searchParams.set('autopause', '0')
      u.searchParams.set('badge', '0')
      u.searchParams.set('byline', '0')
      u.searchParams.set('title', '0')
    }
    return u.toString()
  } catch {
    return rawUrl
  }
}

export const FUNNEL_VSL_URL = withVslAutoplay(
  process.env.FUNNEL_VSL_URL ??
    'https://player.vimeo.com/video/1198842133?badge=0&autopause=0&player_id=0&app_id=58479'
)
