// CRM Companies Page - Twenty CRM Inspired
// Professional three-column layout with view switching

import { QueryProvider } from '@/components/providers/query-provider'
import { CompaniesPageClient } from './components/CompaniesPageClient'
import { createClient } from '@/lib/supabase/server'
import { CompanyRepository } from '@/lib/repositories/company.repository'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Companies - CRM',
  description: 'Manage your companies and accounts',
}

export default async function CRMCompaniesPage() {
  // Server-verified auth — prevents expired JWT issues
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!userData?.workspace_id) redirect('/welcome')

  // Fetch initial companies data
  const companyRepo = new CompanyRepository()
  const initialData = await companyRepo.findByWorkspace(userData.workspace_id, undefined, undefined, 1, 100)

  return (
    <QueryProvider>
      <CompaniesPageClient initialData={initialData.data} />
    </QueryProvider>
  )
}
