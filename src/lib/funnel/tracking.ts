/**
 * Funnel Tracking — PostHog event names + capture helper.
 *
 * Single source of truth for the events the /get-leads funnel emits.
 * Used by client components and surfaced verbatim on the admin
 * analytics page so the dashboard always matches what's being captured.
 *
 * Property convention: snake_case keys, primitive values only (so
 * PostHog can index + filter on every property cleanly).
 */

import posthog from 'posthog-js'

export const FUNNEL_EVENTS = {
  /** /get-leads first viewed (sent after Suspense hydration). */
  LANDING_VIEWED: 'funnel.landing_viewed',
  /** VSL <iframe> mounted on the page. */
  VSL_LOADED: 'funnel.vsl_loaded',
  /** 60s pricing gate elapsed and the cards are now visible. */
  PRICING_UNLOCKED: 'funnel.pricing_unlocked',
  /** Buyer clicked "Get started" on a plan card. */
  PLAN_SELECTED: 'funnel.plan_selected',
  /** Form submitted to /api/funnel/checkout-redirect (new tab opened). */
  CHECKOUT_INITIATED: 'funnel.checkout_initiated',
  /** Fallback "Continue in this tab" link appeared (popup blocked path). */
  CHECKOUT_FALLBACK_SHOWN: 'funnel.checkout_fallback_shown',

  /** Portal first viewed by token holder. */
  PORTAL_VIEWED: 'funnel.portal_viewed',
  /** Buyer entered a website URL and submitted pixel form. */
  PIXEL_REQUESTED: 'funnel.pixel_requested',
  /** Pixel successfully provisioned (AL returned snippet). */
  PIXEL_PROVISIONED: 'funnel.pixel_provisioned',
  /** Buyer copied the snippet via the copy button. */
  PIXEL_SNIPPET_COPIED: 'funnel.pixel_snippet_copied',
  /** "Test my install" button clicked (any result). */
  PIXEL_TEST_CLICKED: 'funnel.pixel_test_clicked',
  /** "Test my install" result. */
  PIXEL_TEST_RESULT: 'funnel.pixel_test_result',

  /** Buyer started filling the ICP form (first keystroke). */
  AUDIENCE_STARTED: 'funnel.audience_started',
  /** Buyer submitted the ICP form. */
  AUDIENCE_SUBMITTED: 'funnel.audience_submitted',

  /** "Manage billing" button clicked. */
  BILLING_PORTAL_OPENED: 'funnel.billing_portal_opened',
  /** Save-flow interstitial shown before the buyer reaches Stripe billing. */
  BILLING_SAVE_FLOW_VIEWED: 'funnel.billing_save_flow_viewed',
  /** Buyer chose to proceed to Stripe billing despite the save-flow. */
  BILLING_SAVE_FLOW_PROCEEDED: 'funnel.billing_save_flow_proceeded',
  /** Buyer backed out of the save-flow (stayed). */
  BILLING_SAVE_FLOW_DISMISSED: 'funnel.billing_save_flow_dismissed',
  /** Cancelled-screen rendered (subscription is over). */
  CANCELLED_SCREEN_VIEWED: 'funnel.cancelled_screen_viewed',
  /** Past-due banner rendered. */
  PAST_DUE_BANNER_VIEWED: 'funnel.past_due_banner_viewed',
} as const

export type FunnelEventName = (typeof FUNNEL_EVENTS)[keyof typeof FUNNEL_EVENTS]

/**
 * Canonical conversion funnel — the ordered steps from cold landing to
 * activation, as a single source of truth for the admin analytics view and
 * any PostHog funnel definition. `serverSide: true` steps (e.g. payment) are
 * recorded by the Stripe webhook, not a client event, so they're noted but
 * have no client event name.
 */
export const FUNNEL_STEPS: ReadonlyArray<{
  label: string
  event?: FunnelEventName
  serverSide?: boolean
}> = [
  { label: 'Landing viewed', event: FUNNEL_EVENTS.LANDING_VIEWED },
  { label: 'VSL loaded', event: FUNNEL_EVENTS.VSL_LOADED },
  { label: 'Pricing unlocked', event: FUNNEL_EVENTS.PRICING_UNLOCKED },
  { label: 'Plan selected', event: FUNNEL_EVENTS.PLAN_SELECTED },
  { label: 'Checkout initiated', event: FUNNEL_EVENTS.CHECKOUT_INITIATED },
  { label: 'Paid', serverSide: true },
  { label: 'Portal viewed', event: FUNNEL_EVENTS.PORTAL_VIEWED },
  { label: 'Pixel provisioned', event: FUNNEL_EVENTS.PIXEL_PROVISIONED },
  { label: 'Audience submitted', event: FUNNEL_EVENTS.AUDIENCE_SUBMITTED },
] as const

/**
 * Safe capture wrapper. PostHog may not be loaded yet (SSR or before
 * provider mount); this no-ops in those cases instead of throwing.
 */
export function trackFunnel(
  event: FunnelEventName,
  properties: Record<string, string | number | boolean | null | undefined> = {}
): void {
  if (typeof window === 'undefined') return
  try {
    posthog.capture(event, properties)
  } catch {
    // PostHog not initialized yet or autocapture disabled — silent no-op.
  }
}
