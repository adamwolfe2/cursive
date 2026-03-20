// CRM Contacts Page - Twenty CRM Inspired
// Professional three-column layout with view switching

import { QueryProvider } from '@/components/providers/query-provider'
import { ContactsPageClient } from './components/ContactsPageClient'
import { createClient } from '@/lib/supabase/server'
import { ContactRepository } from '@/lib/repositories/contact.repository'
import { redirect } from 'next/navigation'
import { safeError } from '@/lib/utils/log-sanitizer'

export const metadata = {
  title: 'Contacts - CRM',
  description: 'Manage your contacts and people',
}

export default async function CRMContactsPage() {
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

  // Fetch initial contacts data — gracefully degrade on error so the page still renders
  const contactRepo = new ContactRepository()
  let initialContacts: Awaited<ReturnType<typeof contactRepo.findByWorkspace>>['data'] = []
  try {
    const result = await contactRepo.findByWorkspace(userData.workspace_id, undefined, undefined, 1, 100)
    initialContacts = result.data
  } catch (err) {
    safeError('[CRMContacts] Failed to prefetch initial contacts:', err)
  }

  return (
    <QueryProvider>
      <ContactsPageClient initialData={initialContacts} />
    </QueryProvider>
  )
}
