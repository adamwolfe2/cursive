// CRM Contacts Page - Twenty CRM Inspired
// Professional three-column layout with view switching

import { QueryProvider } from '@/components/providers/query-provider'
import { ContactsPageClient } from './components/ContactsPageClient'
import { createClient } from '@/lib/supabase/server'
import { ContactRepository } from '@/lib/repositories/contact.repository'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Contacts - CRM',
  description: 'Manage your contacts and people',
}

export default async function CRMContactsPage() {
  // Layout already verified auth — get session for workspace lookup
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', session.user.id)
    .single()
  if (!userData?.workspace_id) redirect('/welcome')

  // Fetch initial contacts data
  const contactRepo = new ContactRepository()
  const initialData = await contactRepo.findByWorkspace(userData.workspace_id, undefined, undefined, 1, 100)

  return (
    <QueryProvider>
      <ContactsPageClient initialData={initialData.data} />
    </QueryProvider>
  )
}
