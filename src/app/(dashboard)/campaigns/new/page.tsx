// New Campaign Request Page
// Users apply for a custom EmailBison campaign

import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { CampaignRequestForm } from '@/components/campaigns/campaign-request-form'

export const metadata = {
  title: 'Apply for Email Campaign',
  description: 'Request a custom email campaign from EmailBison',
}

export default async function NewCampaignPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <CampaignRequestForm />
}
