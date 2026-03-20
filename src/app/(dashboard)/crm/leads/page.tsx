// CRM Leads Page

import { Suspense } from 'react'
import { QueryProvider } from '@/components/providers/query-provider'
import { LeadsPageClient } from './components/LeadsPageClient'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Leads - CRM',
  description: 'Manage your sales leads and contacts',
}

export default async function CRMLeadsPage() {
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

  return (
    <QueryProvider>
      <Suspense fallback={<div className="h-64 animate-pulse rounded bg-muted" />}>
        <LeadsPageClient />
      </Suspense>
    </QueryProvider>
  )
}
