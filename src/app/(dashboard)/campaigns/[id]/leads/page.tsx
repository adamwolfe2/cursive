// Campaign Leads Management Page

import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { CampaignLeadsManager } from '@/components/campaigns/campaign-leads-manager'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignLeadsPage({ params }: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  return <CampaignLeadsManager campaignId={id} />
}
