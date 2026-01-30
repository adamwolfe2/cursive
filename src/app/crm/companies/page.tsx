// CRM Companies Page - Twenty CRM Inspired
// Professional three-column layout with view switching

import { QueryProvider } from '@/components/providers/query-provider'
import { CompaniesPageClient } from './components/CompaniesPageClient'

export const metadata = {
  title: 'Companies - CRM',
  description: 'Manage your companies and accounts',
}

export default async function CRMCompaniesPage() {
  return (
    <QueryProvider>
      <CompaniesPageClient />
    </QueryProvider>
  )
}
