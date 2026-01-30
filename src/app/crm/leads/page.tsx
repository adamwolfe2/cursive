// CRM Leads Page - Twenty CRM Inspired
// Updated with professional three-column layout and view switching

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QueryProvider } from '@/components/providers/query-provider'
import { LeadsPageClient } from './components/LeadsPageClient'

export const metadata = {
  title: 'Leads - CRM',
  description: 'Manage your sales leads and contacts',
}

export default async function CRMLeadsPage() {
  // Middleware already validated auth
  return (
    <QueryProvider>
      <LeadsPageClient />
    </QueryProvider>
  )
}
