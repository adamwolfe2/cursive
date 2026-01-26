// Campaign Composed Emails Review Page

import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { ComposedEmailsReview } from '@/components/campaigns/composed-emails-review'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignEmailsPage({ params }: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  return <ComposedEmailsReview campaignId={id} />
}
