// CRM Leads Page - Twenty CRM Inspired
// Updated with professional three-column layout and view switching

import { QueryProvider } from '@/components/providers/query-provider'
import { LeadsPageClient } from './components/LeadsPageClient'
import { getCurrentUser } from '@/lib/auth/helpers'
import { CRMLeadRepository } from '@/lib/repositories/crm-lead.repository'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Leads - CRM',
  description: 'Manage your sales leads and contacts',
}

export default async function CRMLeadsPage() {
  // Fetch current user
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch initial leads data
  const leadRepo = new CRMLeadRepository()
  const { leads } = await leadRepo.findByWorkspace(user.workspace_id, {
    page: 1,
    pageSize: 100,
  })

  return (
    <QueryProvider>
      <LeadsPageClient initialData={leads} />
    </QueryProvider>
  )
}
