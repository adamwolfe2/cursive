import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Lead Preferences | Cursive' }

export default function LeadPreferencesPage() {
  redirect('/my-leads/preferences')
}
