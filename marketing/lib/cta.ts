/**
 * Central conversion CTA target for the entire marketing site.
 *
 * Every "get started / start / buy / pricing" button routes here. This is the
 * self-serve funnel at leads.meetcursive.com/get-leads — it presents the three
 * live offers (Visitor Pixel $97, Custom Audience $197, Pixel + Audience Bundle
 * $247), runs Stripe Checkout, and drops the buyer into the correct portal
 * (pixel onboarding vs audience intake) based on what they bought.
 *
 * Single source of truth — never hardcode the funnel URL in a page again.
 */
export const GET_LEADS_URL = 'https://leads.meetcursive.com/get-leads'

/** Booking link for prospects who want to talk before buying (secondary CTA). */
export const BOOKING_URL = 'https://cal.com/cursiveteam/30min'
