// Campaign Composed Emails Review Page

import type { Metadata } from 'next'
import { ComposedEmailsReview } from '@/components/campaigns/composed-emails-review'

export const metadata: Metadata = { title: 'Campaign Emails | Cursive' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignEmailsPage({ params }: PageProps) {
  // Layout already verified auth
  const { id } = await params
  return <ComposedEmailsReview campaignId={id} />
}
