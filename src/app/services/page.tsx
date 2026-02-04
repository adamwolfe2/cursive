import { redirect } from 'next/navigation'

/**
 * Services Hub - Redirects to main website pricing
 *
 * Direct checkout links for website integration:
 * - /services/checkout?tier=cursive-data
 * - /services/checkout?tier=cursive-outbound
 * - /services/checkout?tier=cursive-pipeline
 * - /services/checkout?tier=cursive-venture-studio (calendar booking)
 */
export default function ServicesPage() {
  // TODO: Update with actual pricing page URL when available
  const pricingUrl = process.env.NEXT_PUBLIC_PRICING_URL || 'https://meetcursive.com/#pricing'

  redirect(pricingUrl)
}
