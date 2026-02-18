import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Lead Preferences | Cursive' }

/**
 * Legacy lead preferences page — redirects to the active targeting system.
 * The old lead_preferences table is not connected to the lead routing pipeline.
 * All lead matching uses user_targeting via /my-leads/preferences.
 */
export default function LeadPreferencesPage() {
  redirect('/my-leads/preferences')
}
