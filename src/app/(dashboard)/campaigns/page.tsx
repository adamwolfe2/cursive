// Campaigns List Page

import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/helpers'

export const metadata: Metadata = {
  title: 'Campaigns | Cursive',
}
import { redirect } from 'next/navigation'
import { CampaignsList } from '@/components/campaigns/campaigns-list'

export default async function CampaignsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <CampaignsList />
}
