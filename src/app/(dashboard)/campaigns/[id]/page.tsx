// Campaign Detail Page

import type { Metadata } from 'next'
import { CampaignDetail } from '@/components/campaigns/campaign-detail'

export const metadata: Metadata = { title: 'Campaign | Cursive' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignDetailPage({ params }: PageProps) {
  // Layout already verified auth
  const { id } = await params
  return <CampaignDetail campaignId={id} />
}
