// Campaign Leads Management Page

import type { Metadata } from 'next'
import { CampaignLeadsManager } from '@/components/campaigns/campaign-leads-manager'

export const metadata: Metadata = { title: 'Campaign Leads | Cursive' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignLeadsPage({ params }: PageProps) {
  // Layout already verified auth
  const { id } = await params
  return <CampaignLeadsManager campaignId={id} />
}
