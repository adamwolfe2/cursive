import { redirect } from 'next/navigation'

// Redirect /integrations to /settings/integrations
export default function IntegrationsRedirect() {
  redirect('/settings/integrations')
}
