// Campaign Composed Emails Review Page

import { ComposedEmailsReview } from '@/components/campaigns/composed-emails-review'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignEmailsPage({ params }: PageProps) {
  // Layout already verified auth
  const { id } = await params
  return <ComposedEmailsReview campaignId={id} />
}
