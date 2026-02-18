// Campaign Reviews Queue Page

import type { Metadata } from 'next'
import { ReviewQueue } from '@/components/campaigns/review-queue'

export const metadata: Metadata = { title: 'Review Queue | Cursive' }

export default async function ReviewsPage() {
  // Layout already verified auth
  return <ReviewQueue />
}
