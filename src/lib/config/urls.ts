/**
 * Centralized URL Configuration
 * Cursive Platform
 *
 * All external URLs and app URLs should reference this file
 * to avoid hardcoded strings scattered across the codebase.
 */

// ---------------------------------------------------------------------------
// App URLs
// ---------------------------------------------------------------------------

/** Primary application URL (leads dashboard) */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://leads.meetcursive.com'

/** Marketing / public website */
export const MARKETING_URL = 'https://www.meetcursive.com'

// ---------------------------------------------------------------------------
// External Service URLs
// ---------------------------------------------------------------------------

/** Cal.com booking link for demos and onboarding calls */
export const CAL_BOOKING_URL =
  process.env.CAL_BOOKING_URL || 'https://cal.com/cursiveteam/30min'

/** Stripe dashboard base URL */
export const STRIPE_DASHBOARD_URL = 'https://dashboard.stripe.com'

/** EmailBison campaign dashboard */
export const EMAILBISON_URL =
  process.env.NEXT_PUBLIC_EMAILBISON_URL || 'https://send.meetcursive.com'

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

/** Primary support / contact email */
export const SUPPORT_EMAIL = 'hello@meetcursive.com'
