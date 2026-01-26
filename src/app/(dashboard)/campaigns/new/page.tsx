// New Campaign Page

import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { CampaignWizard } from '@/components/campaigns/campaign-wizard'

export default async function NewCampaignPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <CampaignWizard />
}
