// Campaigns List Page

import type { Metadata } from 'next'
import { CampaignsList } from '@/components/campaigns/campaigns-list'

export const metadata: Metadata = {
  title: 'Campaigns | Cursive',
}

export default async function CampaignsPage() {
  // Layout already verified auth
  return <CampaignsList />
}
