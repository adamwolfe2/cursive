import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Pricing | Cursive',
}

// /pricing redirects to the canonical billing/upgrade page
export default function PricingPage() {
  redirect('/settings/billing')
}
