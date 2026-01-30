// CRM Contacts Page - Twenty CRM Inspired
// Professional three-column layout with view switching

import { QueryProvider } from '@/components/providers/query-provider'
import { ContactsPageClient } from './components/ContactsPageClient'
import { getCurrentUser } from '@/lib/auth/helpers'
import { ContactRepository } from '@/lib/repositories/contact.repository'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Contacts - CRM',
  description: 'Manage your contacts and people',
}

export default async function CRMContactsPage() {
  // Fetch current user
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch initial contacts data
  const contactRepo = new ContactRepository()
  const initialData = await contactRepo.findByWorkspace(user.workspace_id, undefined, undefined, 1, 100)

  return (
    <QueryProvider>
      <ContactsPageClient initialData={initialData.data} />
    </QueryProvider>
  )
}
