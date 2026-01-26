// Campaigns List Page

import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { CampaignsList } from '@/components/campaigns/campaigns-list'

export default async function CampaignsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <CampaignsList />
}
