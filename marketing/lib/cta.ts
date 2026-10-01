/**
 * Conversion targets for the marketing site. Never hardcode these URLs in a page.
 *
 * Front door: leads.meetcursive.com/start. Paste a website, get 25 free leads
 * (names, titles, work emails, why each fits). No card, no call.
 *
 * Attribution uses utm_* (the /start funnel records utm_source/medium/content).
 * Do NOT use ?ref= for this: ref is the affiliate code param and the app stores
 * it first-touch in the cursive_ref cookie, which would block real partner credit.
 */
export const START_URL = 'https://leads.meetcursive.com/start'

/** /start link tagged with where on the site the click came from (e.g. "nav", "home-hero"). */
export const startUrl = (placement: string) =>
  `${START_URL}?utm_source=meetcursive&utm_medium=website&utm_content=${encodeURIComponent(placement)}`

/** Primary offer line, used in CTAs and hero copy. */
export const START_CTA_LABEL = 'Get 25 free leads'

/**
 * Self-serve checkout for the paid Visitor Pixel ($97), Custom Audience ($197),
 * and Pixel + Audience Bundle ($247). Only for plan-specific buy buttons.
 */
export const GET_LEADS_URL = 'https://leads.meetcursive.com/get-leads'

/** Booking link for prospects who want to talk (secondary CTA). */
export const BOOKING_URL = 'https://cal.com/cursiveteam/30min'

/** Examples of custom AI dashboards we build. */
export const DASHBOARD_EXAMPLES_URL = 'https://leads.amcollectivecapital.com'
