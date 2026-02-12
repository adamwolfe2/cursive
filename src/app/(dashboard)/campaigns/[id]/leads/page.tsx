// Campaign Leads Management Page

import { CampaignLeadsManager } from '@/components/campaigns/campaign-leads-manager'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignLeadsPage({ params }: PageProps) {
  // Layout already verified auth
  const { id } = await params
  return <CampaignLeadsManager campaignId={id} />
}
