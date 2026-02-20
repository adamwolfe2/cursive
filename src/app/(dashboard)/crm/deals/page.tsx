// CRM Deals Page - Twenty CRM Inspired
// Professional three-column layout with view switching

import { QueryProvider } from '@/components/providers/query-provider'
import { DealsPageClient } from './components/DealsPageClient'
import { createClient } from '@/lib/supabase/server'
import { DealRepository } from '@/lib/repositories/deal.repository'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Deals - CRM',
  description: 'Manage your deals and sales pipeline',
}

export default async function CRMDealsPage() {
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

  // Fetch initial deals data
  const dealRepo = new DealRepository()
  const initialData = await dealRepo.findByWorkspace(userData.workspace_id, undefined, undefined, 1, 100)

  return (
    <QueryProvider>
      <DealsPageClient initialData={initialData.data} />
    </QueryProvider>
  )
}
