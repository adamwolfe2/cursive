import { redirect } from 'next/navigation'

// /pricing redirects to the canonical billing/upgrade page
export default function PricingPage() {
  redirect('/settings/billing')
}
