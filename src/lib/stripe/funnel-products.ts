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
 * VSL source. Three accepted shapes:
 *   - Self-hosted MP4/WebM/MOV — rendered as <video autoplay muted playsinline>
 *     (preferred — zero watermark, no black bars, native HTML5 controls)
 *   - Vimeo player URL — rendered as iframe with branding stripped
 *   - Loom embed URL — rendered as iframe with branding stripped
 *
 * Set FUNNEL_VSL_URL to whichever URL you want — detection happens at render.
 * Defaults to the Vimeo placeholder until Adam uploads a clean MP4.
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
    } else if (u.hostname === 'player.mux.com') {
      // Mux Player iframe params — minimal native-feeling chrome.
      // autoplay=muted satisfies the browser autoplay policy: video starts
      // playing automatically WITH AUDIO MUTED, and the buyer can click
      // the unmute button to hear it. Critically, we do NOT also set
      // muted=true here — that would force the player to stay muted
      // even after the buyer clicks unmute, undoing their action.
      u.searchParams.set('autoplay', 'muted')
      u.searchParams.set('playsinline', 'true')
      u.searchParams.set('accent-color', '#2563eb')
      // Don't loop — VSL pacing matters, let it end naturally so the
      // pricing reveal feels earned.
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

/**
 * Aspect ratio for the VSL container. Match this to your actual source video
 * (Mux displays it next to the embed code, e.g. "437/270"). Default 16/9 is
 * fine for most modern recordings; non-16:9 sources (typical MacBook screen
 * grabs land near 437/270 ≈ 1.62:1) need this set to kill pillarbox bars.
 */
export const FUNNEL_VSL_ASPECT_RATIO = (() => {
  const raw = process.env.FUNNEL_VSL_ASPECT?.trim()
  // Accept "16/9" or "16:9" — normalize to CSS aspect-ratio shape
  if (!raw) return '16 / 9'
  const match = raw.match(/^(\d+)\s*[/:]\s*(\d+)$/)
  if (!match) return '16 / 9'
  return `${match[1]} / ${match[2]}`
})()

/**
 * Seconds a visitor must spend before pricing unlocks (proxy for "watched the
 * VSL"). Env-configurable so it can be A/B-tested without a redeploy. Default
 * 30 (down from a rigid 60 — a full minute of blurred pricing bounces mobile
 * traffic). Clamped to a sane range.
 */
export const FUNNEL_GATE_SECONDS = (() => {
  const raw = Number.parseInt(process.env.FUNNEL_GATE_SECONDS ?? '', 10)
  if (Number.isNaN(raw)) return 60
  return Math.min(180, Math.max(0, raw))
})()

/**
 * Detect if the VSL URL points at a self-hosted video file vs an iframe-style
 * embed. Used by the landing page to choose <video> vs <iframe>. Checks the
 * pathname (not the full URL) so query strings don't trip the check.
 */
export function isSelfHostedVideoUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    return /\.(mp4|webm|mov|m4v)$/.test(pathname)
  } catch {
    return false
  }
}
