// CRM Leads Page - Twenty CRM Inspired
// Updated with professional three-column layout and view switching

import { QueryProvider } from '@/components/providers/query-provider'
import { LeadsPageClient } from './components/LeadsPageClient'
import { createClient } from '@/lib/supabase/server'
import { CRMLeadRepository } from '@/lib/repositories/crm-lead.repository'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Leads - CRM',
  description: 'Manage your sales leads and contacts',
}

interface CRMLeadsPageProps {
  searchParams: Promise<{ page?: string; per_page?: string }>
}

export default async function CRMLeadsPage({ searchParams }: CRMLeadsPageProps) {
  // Layout already verified auth — get session for workspace lookup
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()
  if (!userData?.workspace_id) redirect('/welcome')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const perPage = Math.max(1, Math.min(100, parseInt(params.per_page || '50', 10) || 50))

  // Fetch paginated leads data
  const leadRepo = new CRMLeadRepository()
  const { leads, total } = await leadRepo.findByWorkspace(userData.workspace_id, {
    page,
    pageSize: perPage,
  })

  return (
    <QueryProvider>
      <LeadsPageClient
        initialData={leads}
        currentPage={page}
        perPage={perPage}
        totalCount={total}
      />
    </QueryProvider>
  )
}
