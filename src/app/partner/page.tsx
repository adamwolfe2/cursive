/**
 * Partner Landing Page
 * Redirects to partner dashboard
 */

import { redirect } from 'next/navigation'

export default function PartnerPage() {
  redirect('/partner/dashboard')
}
