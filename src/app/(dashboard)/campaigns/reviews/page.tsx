// Campaign Reviews Queue Page

import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { ReviewQueue } from '@/components/campaigns/review-queue'

export default async function ReviewsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <ReviewQueue />
}
