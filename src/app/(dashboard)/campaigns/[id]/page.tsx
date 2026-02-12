// Campaign Detail Page

import { CampaignDetail } from '@/components/campaigns/campaign-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignDetailPage({ params }: PageProps) {
  // Layout already verified auth
  const { id } = await params
  return <CampaignDetail campaignId={id} />
}
