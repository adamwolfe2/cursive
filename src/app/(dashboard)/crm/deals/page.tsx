// CRM Deals Page - Twenty CRM Inspired
// Professional three-column layout with view switching

import { QueryProvider } from '@/components/providers/query-provider'
import { DealsPageClient } from './components/DealsPageClient'
import { createClient } from '@/lib/supabase/server'
import { DealRepository } from '@/lib/repositories/deal.repository'
import { redirect } from 'next/navigation'
import { safeError } from '@/lib/utils/log-sanitizer'

export const metadata = {
  title: 'Deals - CRM',
  description: 'Manage your deals and sales pipeline',
}

export default async function CRMDealsPage() {
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

  // Fetch initial deals data — gracefully degrade on error so the page still renders
  const dealRepo = new DealRepository()
  let initialDeals: Awaited<ReturnType<DealRepository['findByWorkspace']>>['data'] = []
  try {
    const result = await dealRepo.findByWorkspace(userData.workspace_id, undefined, undefined, 1, 100)
    initialDeals = result.data
  } catch (err) {
    safeError('[CRMDeals] Failed to prefetch initial deals:', err)
  }

  return (
    <QueryProvider>
      <DealsPageClient initialData={initialDeals} />
    </QueryProvider>
  )
}
