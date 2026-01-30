// CRM Companies Page - Twenty CRM Inspired
// Professional three-column layout with view switching

import { QueryProvider } from '@/components/providers/query-provider'
import { CompaniesPageClient } from './components/CompaniesPageClient'
import { getCurrentUser } from '@/lib/auth/helpers'
import { CompanyRepository } from '@/lib/repositories/company.repository'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Companies - CRM',
  description: 'Manage your companies and accounts',
}

export default async function CRMCompaniesPage() {
  // Fetch current user
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch initial companies data
  const companyRepo = new CompanyRepository()
  const initialData = await companyRepo.findByWorkspace(user.workspace_id, undefined, undefined, 1, 100)

  return (
    <QueryProvider>
      <CompaniesPageClient initialData={initialData.data} />
    </QueryProvider>
  )
}
