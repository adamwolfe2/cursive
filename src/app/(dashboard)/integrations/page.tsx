import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Integrations | Cursive',
}

// Redirect /integrations to /settings/integrations
export default function IntegrationsRedirect() {
  redirect('/settings/integrations')
}
