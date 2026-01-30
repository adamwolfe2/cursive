// CRM Deals Page - Twenty CRM Inspired
// Professional three-column layout with view switching

import { QueryProvider } from '@/components/providers/query-provider'
import { DealsPageClient } from './components/DealsPageClient'

export const metadata = {
  title: 'Deals - CRM',
  description: 'Manage your deals and sales pipeline',
}

export default async function CRMDealsPage() {
  return (
    <QueryProvider>
      <DealsPageClient />
    </QueryProvider>
  )
}
