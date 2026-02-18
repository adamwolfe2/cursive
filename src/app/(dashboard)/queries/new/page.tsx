// New Query Page

import type { Metadata } from 'next'
import { QueryWizard } from '@/components/queries/query-wizard'

export const metadata: Metadata = { title: 'New Query | Cursive' }

export default async function NewQueryPage() {
  // Layout already verified auth
  return <QueryWizard />
}
